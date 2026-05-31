import type { GraphData } from '../types';

self.onmessage = (e: MessageEvent<{ data: GraphData, startId: string, endId: string }>) => {
  const { data, startId, endId } = e.data;
  const path = findShortestPath(data, startId, endId);
  self.postMessage(path);
};

const findShortestPath = (data: GraphData, startId: string, endId: string) => {
  if (!data) return null;

  const queue: [string, string[]][] = [[startId, [startId]]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const [currentId, path] = queue.shift()!;

    if (currentId === endId) return path;

    const neighbors = data.links
      .filter(l => l.source_id.toString() === currentId || l.target_id.toString() === currentId)
      .map(l => l.source_id.toString() === currentId ? l.target_id.toString() : l.source_id.toString());

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return null;
};
