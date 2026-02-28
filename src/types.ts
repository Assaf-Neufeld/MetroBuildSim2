export type StationShape = 'circle' | 'square' | 'triangle';

export interface Station {
  id: string;
  x: number;
  y: number;
  shape: StationShape;
  capacity: number;
  spawnRate: number;
}

export interface Passenger {
  id: string;
  originId: string;
  destinationId: string;
  currentStationId?: string;
  state: 'waiting' | 'on_train' | 'arrived';
  waitTime: number;
  totalTime: number;
}

export interface Line {
  id: string;
  color: string;
  stations: string[];
}

export interface Train {
  id: string;
  lineId: string;
  segmentIndex: number;
  t: number;
  direction: 1 | -1;
  speed: number;
  capacity: number;
  passengers: Passenger[];
}

export interface LevelConstraints {
  maxLines: number;
  maxSegments: number;
  maxStationsPerLine: number;
  requiredConnections: Array<[string, string]>;
  forbiddenConnections: Array<[string, string]>;
}

export interface LevelGoals {
  surviveSeconds: number;
  deliveredTarget: number;
  maxAvgWait: number;
  maxOvercrowdSecondsPerStation: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  stations: Station[];
  constraints: LevelConstraints;
  goals: LevelGoals;
}

export interface RuntimeStationState {
  waiting: Passenger[];
  spawnAccumulator: number;
  overcrowdSeconds: number;
}

export interface ToastMessage {
  text: string;
  type: 'info' | 'error' | 'success';
}

export interface GameStats {
  levelName: string;
  mode: 'build' | 'simulate';
  runState: 'stopped' | 'running' | 'paused' | 'won' | 'lost';
  elapsed: number;
  delivered: number;
  avgWait: number;
  mostCrowdedStationId: string;
  linesUsed: number;
  maxLines: number;
  segmentsUsed: number;
  maxSegments: number;
  levelIndex: number;
  levelCount: number;
}
