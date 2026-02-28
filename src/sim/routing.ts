import type { Line, Station } from '../types';

export type NextHopTable = Record<string, Record<string, string | null>>;

const addEdge = (graph: Record<string, Set<string>>, a: string, b: string): void => {
  if (!graph[a]) graph[a] = new Set<string>();
  if (!graph[b]) graph[b] = new Set<string>();
  graph[a].add(b);
  graph[b].add(a);
};

export const buildGraph = (stations: Station[], lines: Line[]): Record<string, Set<string>> => {
  const graph: Record<string, Set<string>> = {};
  for (const station of stations) {
    graph[station.id] = new Set<string>();
  }

  for (const line of lines) {
    for (let i = 0; i < line.stations.length - 1; i += 1) {
      const a = line.stations[i];
      const b = line.stations[i + 1];
      addEdge(graph, a, b);
    }
  }

  return graph;
};

const bfsDistances = (graph: Record<string, Set<string>>, destination: string): Record<string, number> => {
  const distance: Record<string, number> = {};
  Object.keys(graph).forEach((id) => {
    distance[id] = Number.POSITIVE_INFINITY;
  });
  distance[destination] = 0;

  const queue: string[] = [destination];
  let cursor = 0;
  while (cursor < queue.length) {
    const node = queue[cursor++];
    for (const next of graph[node]) {
      if (distance[next] !== Number.POSITIVE_INFINITY) continue;
      distance[next] = distance[node] + 1;
      queue.push(next);
    }
  }

  return distance;
};

export const buildNextHopTable = (stations: Station[], lines: Line[]): NextHopTable => {
  const graph = buildGraph(stations, lines);
  const table: NextHopTable = {};

  for (const destination of stations) {
    const distances = bfsDistances(graph, destination.id);
    table[destination.id] = {};

    for (const source of stations) {
      if (source.id === destination.id) {
        table[destination.id][source.id] = source.id;
        continue;
      }

      let bestNeighbor: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const neighbor of graph[source.id]) {
        const neighborDistance = distances[neighbor];
        if (neighborDistance < bestDistance) {
          bestDistance = neighborDistance;
          bestNeighbor = neighbor;
        }
      }

      table[destination.id][source.id] = Number.isFinite(bestDistance) ? bestNeighbor : null;
    }
  }

  return table;
};
