import { LEVELS, LINE_COLORS } from '../data/levels';
import type { GameStats, Level, Line, Passenger, RuntimeStationState, Station, ToastMessage, Train } from '../types';
import { SimulationController } from '../sim/simController';

const FIXED_DT = 1 / 60;

interface GameCallbacks {
  onToast?: (message: ToastMessage) => void;
  onStats?: (stats: GameStats) => void;
  onFrame?: () => void;
}

export class Game {
  mode: 'build' | 'simulate' = 'build';
  runState: 'stopped' | 'running' | 'paused' | 'won' | 'lost' = 'stopped';
  currentLevelIndex = 0;

  level: Level;
  lines: Line[] = [];
  trains: Train[] = [];
  stationState: Record<string, RuntimeStationState> = {};
  currentLineId: string | null = null;

  elapsed = 0;
  delivered = 0;
  avgWait = 0;
  avgWaitExceededSeconds = 0;
  mostCrowdedStationId = '';

  private callbacks: GameCallbacks = {};
  private simulation = new SimulationController();
  private lastTimestamp = 0;
  private accumulator = 0;
  private passengerCounter = 0;

  constructor() {
    this.level = LEVELS[0];
    this.resetLevel(0);
  }

  setCallbacks(callbacks: GameCallbacks): void {
    this.callbacks = callbacks;
  }

  startLoop(): void {
    const frame = (timestamp: number) => {
      if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
      const deltaSeconds = Math.min((timestamp - this.lastTimestamp) / 1000, 0.25);
      this.lastTimestamp = timestamp;

      if (this.runState === 'running' && this.mode === 'simulate') {
        this.accumulator += deltaSeconds;
        while (this.accumulator >= FIXED_DT) {
          this.update(FIXED_DT);
          this.accumulator -= FIXED_DT;
        }
      }

      this.callbacks.onFrame?.();
      this.callbacks.onStats?.(this.getStats());
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  resetLevel(levelIndex = this.currentLevelIndex): void {
    this.currentLevelIndex = Math.max(0, Math.min(levelIndex, LEVELS.length - 1));
    this.level = LEVELS[this.currentLevelIndex];
    this.mode = 'build';
    this.runState = 'stopped';
    this.lines = [];
    this.trains = [];
    this.currentLineId = null;
    this.elapsed = 0;
    this.delivered = 0;
    this.avgWait = 0;
    this.avgWaitExceededSeconds = 0;
    this.passengerCounter = 0;
    this.stationState = {};
    this.mostCrowdedStationId = this.level.stations[0]?.id ?? '';

    for (const station of this.level.stations) {
      this.stationState[station.id] = {
        waiting: [],
        spawnAccumulator: 0,
        overcrowdSeconds: 0,
      };
    }

    this.toast({ text: `Loaded ${this.level.name}`, type: 'info' });
  }

  nextLevel(): void {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.resetLevel(this.currentLevelIndex + 1);
    }
  }

  previousLevel(): void {
    if (this.currentLevelIndex > 0) {
      this.resetLevel(this.currentLevelIndex - 1);
    }
  }

  setMode(mode: 'build' | 'simulate'): void {
    this.mode = mode;
    if (mode === 'build' && this.runState === 'running') {
      this.runState = 'paused';
    }
  }

  createNewLine(): void {
    if (this.mode !== 'build') {
      this.toast({ text: 'Switch to Build mode to edit lines.', type: 'error' });
      return;
    }

    if (this.lines.length >= this.level.constraints.maxLines) {
      this.toast({ text: 'Max lines reached for this level.', type: 'error' });
      return;
    }

    const line: Line = {
      id: `line-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      color: LINE_COLORS[this.lines.length % LINE_COLORS.length],
      stations: [],
    };

    this.lines.push(line);
    this.currentLineId = line.id;
  }

  finishCurrentLine(): void {
    this.currentLineId = null;
  }

  cancelCurrentLine(): void {
    this.currentLineId = null;
  }

  undoCurrentLine(): void {
    const line = this.getCurrentLine();
    if (!line) {
      this.toast({ text: 'No active line to undo.', type: 'error' });
      return;
    }

    line.stations.pop();
    if (line.stations.length === 0) {
      this.lines = this.lines.filter((candidate) => candidate.id !== line.id);
      this.currentLineId = null;
    }
  }

  deleteLine(): void {
    if (this.lines.length === 0) return;

    const targetId = this.currentLineId ?? this.lines[this.lines.length - 1].id;
    this.lines = this.lines.filter((line) => line.id !== targetId);
    this.currentLineId = null;
  }

  addStationToCurrentLine(stationId: string, forceNewLine: boolean): void {
    if (this.mode !== 'build') {
      this.toast({ text: 'Cannot edit lines while simulating.', type: 'error' });
      return;
    }

    if (forceNewLine || !this.currentLineId) {
      this.createNewLine();
      if (!this.currentLineId) return;
    }

    const line = this.getCurrentLine();
    if (!line) return;

    if (line.stations.length >= this.level.constraints.maxStationsPerLine) {
      this.toast({ text: 'Max stations per line reached.', type: 'error' });
      return;
    }

    const lastStationId = line.stations[line.stations.length - 1];
    if (lastStationId === stationId) return;

    if (lastStationId) {
      if (this.totalSegments() + 1 > this.level.constraints.maxSegments) {
        this.toast({ text: 'Max segments reached for this level.', type: 'error' });
        return;
      }

      if (this.isForbiddenConnection(lastStationId, stationId)) {
        this.toast({ text: `Connection ${lastStationId}-${stationId} is forbidden.`, type: 'error' });
        return;
      }
    }

    line.stations.push(stationId);
  }

  startSimulation(): void {
    if (this.lines.every((line) => line.stations.length < 2)) {
      this.toast({ text: 'Build at least one line with two stations.', type: 'error' });
      return;
    }

    if (!this.hasRequiredConnections()) {
      this.toast({ text: 'Required connection missing for this level.', type: 'error' });
      return;
    }

    if (this.runState === 'stopped' || this.runState === 'won' || this.runState === 'lost') {
      this.initializeSimulationState();
    }

    this.mode = 'simulate';
    this.runState = 'running';
  }

  pauseSimulation(): void {
    if (this.runState === 'running') {
      this.runState = 'paused';
    } else if (this.runState === 'paused') {
      this.runState = 'running';
    }
  }

  resetSimulation(): void {
    this.resetLevel(this.currentLevelIndex);
  }

  stationById(id: string): Station | undefined {
    return this.level.stations.find((station) => station.id === id);
  }

  findStationNear(worldX: number, worldY: number, radius = 22): Station | undefined {
    const radiusSq = radius * radius;
    return this.level.stations.find((station) => {
      const dx = station.x - worldX;
      const dy = station.y - worldY;
      return dx * dx + dy * dy <= radiusSq;
    });
  }

  totalSegments(): number {
    return this.lines.reduce((sum, line) => sum + Math.max(0, line.stations.length - 1), 0);
  }

  hasEdge(a: string, b: string): boolean {
    return this.lines.some((line) => {
      for (let i = 0; i < line.stations.length - 1; i += 1) {
        const first = line.stations[i];
        const second = line.stations[i + 1];
        if ((first === a && second === b) || (first === b && second === a)) {
          return true;
        }
      }
      return false;
    });
  }

  getStats(): GameStats {
    return {
      levelName: this.level.name,
      mode: this.mode,
      runState: this.runState,
      elapsed: this.elapsed,
      delivered: this.delivered,
      avgWait: this.avgWait,
      mostCrowdedStationId: this.mostCrowdedStationId,
      linesUsed: this.lines.length,
      maxLines: this.level.constraints.maxLines,
      segmentsUsed: this.totalSegments(),
      maxSegments: this.level.constraints.maxSegments,
      levelIndex: this.currentLevelIndex,
      levelCount: LEVELS.length,
    };
  }

  private update(dt: number): void {
    this.elapsed += dt;
    const result = this.simulation.update(dt, {
      level: this.level,
      stations: this.level.stations,
      lines: this.lines,
      trains: this.trains,
      stationState: this.stationState,
      createPassenger: (originId, destinationId) => this.makePassenger(originId, destinationId),
      onPassengerArrived: () => {
        this.delivered += 1;
      },
    });

    this.avgWait = result.avgWait;
    this.mostCrowdedStationId = result.mostCrowdedStationId;

    if (result.overcrowdedStationId) {
      this.lose(`Station ${result.overcrowdedStationId} overcrowded too long.`);
      return;
    }

    if (this.avgWait > this.level.goals.maxAvgWait) {
      this.avgWaitExceededSeconds += dt;
      if (this.avgWaitExceededSeconds >= 10) {
        this.lose('Average wait stayed too high for too long.');
        return;
      }
    } else {
      this.avgWaitExceededSeconds = 0;
    }

    if (
      this.elapsed >= this.level.goals.surviveSeconds &&
      this.delivered >= this.level.goals.deliveredTarget &&
      this.avgWait <= this.level.goals.maxAvgWait
    ) {
      this.win();
    }
  }

  private win(): void {
    if (this.runState === 'won') return;
    this.runState = 'won';
    this.toast({ text: `Level complete: ${this.level.name}`, type: 'success' });
  }

  private lose(message: string): void {
    if (this.runState === 'lost') return;
    this.runState = 'lost';
    this.toast({ text: message, type: 'error' });
  }

  private initializeSimulationState(): void {
    for (const station of this.level.stations) {
      this.stationState[station.id].waiting = [];
      this.stationState[station.id].spawnAccumulator = 0;
      this.stationState[station.id].overcrowdSeconds = 0;
    }

    this.trains = this.lines
      .filter((line) => line.stations.length >= 2)
      .map((line, index) => ({
        id: `train-${line.id}`,
        lineId: line.id,
        segmentIndex: 0,
        t: 0,
        direction: 1 as const,
        speed: 95 + index * 6,
        capacity: 9,
        passengers: [],
      }));

    this.elapsed = 0;
    this.delivered = 0;
    this.avgWait = 0;
    this.avgWaitExceededSeconds = 0;
  }

  private makePassenger(originId: string, destinationId: string): Passenger {
    this.passengerCounter += 1;
    return {
      id: `p-${this.passengerCounter}`,
      originId,
      destinationId,
      currentStationId: originId,
      state: 'waiting',
      waitTime: 0,
      totalTime: 0,
    };
  }

  private isForbiddenConnection(a: string, b: string): boolean {
    return this.level.constraints.forbiddenConnections.some(
      ([left, right]) => (left === a && right === b) || (left === b && right === a)
    );
  }

  private hasRequiredConnections(): boolean {
    return this.level.constraints.requiredConnections.every(([a, b]) => this.hasEdge(a, b));
  }

  private getCurrentLine(): Line | null {
    if (!this.currentLineId) return null;
    return this.lines.find((line) => line.id === this.currentLineId) ?? null;
  }

  private toast(message: ToastMessage): void {
    this.callbacks.onToast?.(message);
  }
}
