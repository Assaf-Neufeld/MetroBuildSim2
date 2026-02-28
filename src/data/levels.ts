import type { Level } from '../types';

export const LINE_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];

export const LEVELS: Level[] = [
  {
    id: 'level-1',
    name: 'Starter Grid',
    description: 'Connect key stations and keep waiting times low.',
    stations: [
      { id: 'A', x: 220, y: 220, shape: 'circle', capacity: 18, spawnRate: 0.8 },
      { id: 'B', x: 430, y: 180, shape: 'square', capacity: 18, spawnRate: 0.7 },
      { id: 'C', x: 660, y: 220, shape: 'triangle', capacity: 18, spawnRate: 0.8 },
      { id: 'D', x: 270, y: 460, shape: 'triangle', capacity: 18, spawnRate: 0.7 },
      { id: 'E', x: 500, y: 420, shape: 'circle', capacity: 18, spawnRate: 0.8 },
      { id: 'F', x: 760, y: 470, shape: 'square', capacity: 18, spawnRate: 0.7 },
    ],
    constraints: {
      maxLines: 3,
      maxSegments: 10,
      maxStationsPerLine: 6,
      requiredConnections: [],
      forbiddenConnections: [],
    },
    goals: {
      surviveSeconds: 120,
      deliveredTarget: 120,
      maxAvgWait: 25,
      maxOvercrowdSecondsPerStation: 8,
    },
  },
  {
    id: 'level-2',
    name: 'Transfer Pressure',
    description: 'Tighter line budget and one required corridor.',
    stations: [
      { id: 'A', x: 160, y: 200, shape: 'circle', capacity: 16, spawnRate: 0.9 },
      { id: 'B', x: 360, y: 140, shape: 'square', capacity: 16, spawnRate: 0.9 },
      { id: 'C', x: 580, y: 150, shape: 'triangle', capacity: 16, spawnRate: 0.9 },
      { id: 'D', x: 800, y: 220, shape: 'circle', capacity: 16, spawnRate: 0.9 },
      { id: 'E', x: 210, y: 440, shape: 'triangle', capacity: 16, spawnRate: 0.85 },
      { id: 'F', x: 430, y: 390, shape: 'circle', capacity: 16, spawnRate: 0.95 },
      { id: 'G', x: 620, y: 420, shape: 'square', capacity: 16, spawnRate: 0.95 },
      { id: 'H', x: 860, y: 460, shape: 'triangle', capacity: 16, spawnRate: 0.85 },
    ],
    constraints: {
      maxLines: 3,
      maxSegments: 9,
      maxStationsPerLine: 5,
      requiredConnections: [['C', 'F']],
      forbiddenConnections: [],
    },
    goals: {
      surviveSeconds: 130,
      deliveredTarget: 150,
      maxAvgWait: 23,
      maxOvercrowdSecondsPerStation: 7,
    },
  },
  {
    id: 'level-3',
    name: 'Dense Metro',
    description: 'Forbidden links and strict crowding tolerance.',
    stations: [
      { id: 'A', x: 120, y: 160, shape: 'circle', capacity: 14, spawnRate: 1.0 },
      { id: 'B', x: 300, y: 120, shape: 'square', capacity: 14, spawnRate: 1.0 },
      { id: 'C', x: 500, y: 100, shape: 'triangle', capacity: 14, spawnRate: 1.0 },
      { id: 'D', x: 710, y: 130, shape: 'circle', capacity: 14, spawnRate: 1.0 },
      { id: 'E', x: 920, y: 210, shape: 'square', capacity: 14, spawnRate: 1.0 },
      { id: 'F', x: 170, y: 420, shape: 'triangle', capacity: 14, spawnRate: 0.95 },
      { id: 'G', x: 360, y: 380, shape: 'circle', capacity: 14, spawnRate: 1.0 },
      { id: 'H', x: 550, y: 430, shape: 'square', capacity: 14, spawnRate: 1.0 },
      { id: 'I', x: 740, y: 400, shape: 'triangle', capacity: 14, spawnRate: 1.0 },
      { id: 'J', x: 940, y: 450, shape: 'circle', capacity: 14, spawnRate: 0.95 },
    ],
    constraints: {
      maxLines: 4,
      maxSegments: 10,
      maxStationsPerLine: 5,
      requiredConnections: [['C', 'H']],
      forbiddenConnections: [['A', 'E'], ['B', 'J']],
    },
    goals: {
      surviveSeconds: 140,
      deliveredTarget: 190,
      maxAvgWait: 20,
      maxOvercrowdSecondsPerStation: 6,
    },
  },
];
