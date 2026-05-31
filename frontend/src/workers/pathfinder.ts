import type { GraphData } from '../types';

const RELATIONSHIP_WEIGHTS: Record<string, number> = {
  'SON_OF': 1,
  'DAUGHTER_OF': 1,
  'SIBLING_OF': 1,
  'SPOUSE_OF': 1,
  'PARENT_OF': 1,
  'UNCLE_OF': 2,
  'COUSIN_OF': 2,
  'TEACHER_OF': 3,
  'COMPANION_OF': 4,
  'PARTICIPATED_IN': 5,
};

self.onmessage = (e: MessageEvent<{ data: GraphData, startId: string, endId: string }>) => {
  const { data, startId, endId } = e.data;
  const paths = findShortestPathsDijkstra(data, startId, endId);
  self.postMessage(paths);
};

export const findShortestPathsDijkstra = (data: GraphData, startId: string, endId: string) => {
  if (!data) return [];

  const distances: Record<string, number> = {};
  const previous: Record<string, string[]> = {};
  const nodes = new Set<string>();

  for (const node of data.nodes) {
    const id = node.id.toString();
    distances[id] = id === startId ? 0 : Infinity;
    previous[id] = [];
    nodes.add(id);
  }

  // Ensure all nodes from links are present
  for (const link of data.links) {
    const s = link.source_id.toString();
    const t = link.target_id.toString();
    if (distances[s] === undefined) { distances[s] = Infinity; previous[s] = []; nodes.add(s); }
    if (distances[t] === undefined) { distances[t] = Infinity; previous[t] = []; nodes.add(t); }
  }

  while (nodes.size > 0) {
    let closestNode: string | null = null;
    for (const node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    }

    if (closestNode === null || distances[closestNode] === Infinity) break;
    // We don't break on endId because we want to find all paths of same weight

    nodes.delete(closestNode);

    const neighbors = data.links
      .filter(l => l.source_id.toString() === closestNode || l.target_id.toString() === closestNode)
      .map(l => ({
        id: l.source_id.toString() === closestNode ? l.target_id.toString() : l.source_id.toString(),
        weight: RELATIONSHIP_WEIGHTS[l.type] || 2
      }));

    for (const neighbor of neighbors) {
      const alt = distances[closestNode] + neighbor.weight;
      if (alt < distances[neighbor.id]) {
        distances[neighbor.id] = alt;
        previous[neighbor.id] = [closestNode];
      } else if (alt === distances[neighbor.id] && alt !== Infinity) {
        previous[neighbor.id].push(closestNode);
      }
    }
  }

  if (distances[endId] === Infinity || distances[endId] === undefined) return [];

  const allPaths: string[][] = [];

  function backtrack(current: string, path: string[]) {
    if (current === startId) {
      allPaths.push([startId, ...path]);
      return;
    }
    if (!previous[current]) return;
    for (const prev of previous[current]) {
      backtrack(prev, [current, ...path]);
    }
  }

  backtrack(endId, []);
  return allPaths;
};
