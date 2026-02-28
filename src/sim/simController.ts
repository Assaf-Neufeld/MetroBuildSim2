import type { Level, Line, Passenger, RuntimeStationState, Station, Train } from '../types';
import { distance } from '../utils/geometry';
import { pickRandomExcluding } from '../utils/random';
import { buildNextHopTable, type NextHopTable } from './routing';

export interface SimulationContext {
  level: Level;
  stations: Station[];
  lines: Line[];
  trains: Train[];
  stationState: Record<string, RuntimeStationState>;
  createPassenger: (originId: string, destinationId: string) => Passenger;
  onPassengerArrived: (passenger: Passenger) => void;
}

export interface SimulationTickResult {
  avgWait: number;
  mostCrowdedStationId: string;
  overcrowdedStationId: string | null;
}

export class SimulationController {
  private nextHop: NextHopTable = {};
  private lineVersion = '';

  rebuildRouting(stations: Station[], lines: Line[]): void {
    const lineVersion = lines.map((line) => `${line.id}:${line.stations.join('-')}`).join('|');
    if (lineVersion === this.lineVersion) {
      return;
    }

    this.nextHop = buildNextHopTable(stations, lines);
    this.lineVersion = lineVersion;
  }

  update(dt: number, context: SimulationContext): SimulationTickResult {
    this.rebuildRouting(context.stations, context.lines);

    const stationMap: Record<string, Station> = {};
    for (const station of context.stations) {
      stationMap[station.id] = station;
      this.spawnPassengers(dt, station, context);
      this.updateStationWaitTimes(dt, station.id, context.stationState);
    }

    for (const train of context.trains) {
      this.advanceTrain(dt, train, context.lines, stationMap, context);
      for (const passenger of train.passengers) {
        passenger.totalTime += dt;
      }
    }

    let totalWait = 0;
    let totalWaiting = 0;
    let mostCrowdedStationId = context.stations[0]?.id ?? '';
    let mostCrowdedCount = -1;
    let overcrowdedStationId: string | null = null;

    for (const station of context.stations) {
      const waiting = context.stationState[station.id].waiting;
      const count = waiting.length;
      if (count > mostCrowdedCount) {
        mostCrowdedCount = count;
        mostCrowdedStationId = station.id;
      }

      if (count > station.capacity) {
        context.stationState[station.id].overcrowdSeconds += dt;
        if (
          context.stationState[station.id].overcrowdSeconds >
          context.level.goals.maxOvercrowdSecondsPerStation
        ) {
          overcrowdedStationId = station.id;
        }
      } else {
        context.stationState[station.id].overcrowdSeconds = 0;
      }

      for (const passenger of waiting) {
        totalWait += passenger.waitTime;
        totalWaiting += 1;
      }
    }

    return {
      avgWait: totalWaiting > 0 ? totalWait / totalWaiting : 0,
      mostCrowdedStationId,
      overcrowdedStationId,
    };
  }

  private spawnPassengers(dt: number, station: Station, context: SimulationContext): void {
    const runtimeState = context.stationState[station.id];
    runtimeState.spawnAccumulator += station.spawnRate * dt;

    while (runtimeState.spawnAccumulator >= 1) {
      runtimeState.spawnAccumulator -= 1;
      const destination = pickRandomExcluding(context.stations, (candidate) => candidate.id === station.id);
      if (!destination) return;

      const passenger = context.createPassenger(station.id, destination.id);
      runtimeState.waiting.push(passenger);
    }
  }

  private updateStationWaitTimes(
    dt: number,
    stationId: string,
    stationState: Record<string, RuntimeStationState>
  ): void {
    for (const passenger of stationState[stationId].waiting) {
      passenger.waitTime += dt;
      passenger.totalTime += dt;
    }
  }

  private advanceTrain(
    dt: number,
    train: Train,
    lines: Line[],
    stationMap: Record<string, Station>,
    context: SimulationContext
  ): void {
    const line = lines.find((candidate) => candidate.id === train.lineId);
    if (!line || line.stations.length < 2) return;

    let remainingDistance = train.speed * dt;
    while (remainingDistance > 0) {
      const fromIndex = train.direction === 1 ? train.segmentIndex : train.segmentIndex + 1;
      const toIndex = train.direction === 1 ? train.segmentIndex + 1 : train.segmentIndex;

      const fromStation = stationMap[line.stations[fromIndex]];
      const toStation = stationMap[line.stations[toIndex]];
      if (!fromStation || !toStation) return;

      const segmentLength = Math.max(distance(fromStation, toStation), 1);
      const distanceToArrival = (1 - train.t) * segmentLength;

      if (remainingDistance < distanceToArrival) {
        train.t += remainingDistance / segmentLength;
        return;
      }

      remainingDistance -= distanceToArrival;
      train.t = 0;
      const arrivedStationId = line.stations[toIndex];
      this.processStationStop(train, line, toIndex, arrivedStationId, context);

      if (train.direction === 1) {
        if (toIndex === line.stations.length - 1) {
          train.direction = -1;
          train.segmentIndex = line.stations.length - 2;
        } else {
          train.segmentIndex = toIndex;
        }
      } else {
        if (toIndex === 0) {
          train.direction = 1;
          train.segmentIndex = 0;
        } else {
          train.segmentIndex = toIndex - 1;
        }
      }

      if (line.stations.length < 2) {
        return;
      }
    }
  }

  private processStationStop(
    train: Train,
    line: Line,
    stationIndex: number,
    stationId: string,
    context: SimulationContext
  ): void {
    const stillOnTrain: Passenger[] = [];
    for (const passenger of train.passengers) {
      if (passenger.destinationId === stationId) {
        passenger.state = 'arrived';
        passenger.currentStationId = stationId;
        context.onPassengerArrived(passenger);
      } else {
        stillOnTrain.push(passenger);
      }
    }
    train.passengers = stillOnTrain;

    const nextStationId = this.nextStationAfterStop(line, stationIndex, train.direction);
    const waiting = context.stationState[stationId].waiting;
    const remainingWaiting: Passenger[] = [];

    for (const passenger of waiting) {
      if (train.passengers.length >= train.capacity) {
        remainingWaiting.push(passenger);
        continue;
      }

      const nextHop = this.nextHop[passenger.destinationId]?.[stationId] ?? null;
      if (nextHop && nextHop === nextStationId) {
        passenger.state = 'on_train';
        passenger.currentStationId = undefined;
        train.passengers.push(passenger);
      } else {
        remainingWaiting.push(passenger);
      }
    }

    context.stationState[stationId].waiting = remainingWaiting;
  }

  private nextStationAfterStop(line: Line, stationIndex: number, direction: 1 | -1): string | null {
    const n = line.stations.length;
    if (n < 2) return null;

    if (direction === 1) {
      if (stationIndex === n - 1) return line.stations[n - 2];
      return line.stations[stationIndex + 1];
    }

    if (stationIndex === 0) return line.stations[1];
    return line.stations[stationIndex - 1];
  }
}
