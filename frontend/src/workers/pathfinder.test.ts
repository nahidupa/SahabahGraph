import { describe, it, expect } from 'vitest';
import { findShortestPathsDijkstra } from './pathfinder';
import type { GraphData } from '../types';

describe('pathfinder logic', () => {
  const mockData: GraphData = {
    nodes: [
      { id: 1, name_en: 'A', gender: 'male', is_prophet: 'False' },
      { id: 2, name_en: 'B', gender: 'male', is_prophet: 'False' },
      { id: 3, name_en: 'C', gender: 'male', is_prophet: 'False' },
      { id: 4, name_en: 'D', gender: 'male', is_prophet: 'False' },
    ],
    links: [
      { source: 1, target: 2, type: 'SON_OF', category: 'family' },
      { source: 2, target: 3, type: 'SON_OF', category: 'family' },
      { source: 1, target: 3, type: 'COMPANION_OF', category: 'others' },
      { source: 3, target: 4, type: 'PARENT_OF', category: 'family' },
    ],
  };

  it('finds the shortest path between two nodes', () => {
    const paths = findShortestPathsDijkstra(mockData, '1', '3');
    // Path 1 -> 3 (weight 4) vs 1 -> 2 -> 3 (weight 1+1=2)
    // 1 -> 2 -> 3 should be shorter
    expect(paths).toContainEqual(['1', '2', '3']);
    expect(paths.length).toBe(1);
  });

  it('returns multiple paths if they have the same weight', () => {
     const data: GraphData = {
        nodes: [
            { id: 1, name_en: 'A', gender: 'male', is_prophet: 'False' },
            { id: 2, name_en: 'B', gender: 'male', is_prophet: 'False' },
            { id: 3, name_en: 'C', gender: 'male', is_prophet: 'False' },
            { id: 4, name_en: 'D', gender: 'male', is_prophet: 'False' },
        ],
        links: [
          { source: 1, target: 2, type: 'SON_OF', category: 'family' }, // 1
          { source: 2, target: 4, type: 'SON_OF', category: 'family' }, // 1 -> total 2
          { source: 1, target: 3, type: 'SON_OF', category: 'family' }, // 1
          { source: 3, target: 4, type: 'SON_OF', category: 'family' }, // 1 -> total 2
        ]
     };
     const paths = findShortestPathsDijkstra(data, '1', '4');
     expect(paths.length).toBe(2);
     expect(paths).toContainEqual(['1', '2', '4']);
     expect(paths).toContainEqual(['1', '3', '4']);
  });

  it('returns empty array if no path exists', () => {
    const paths = findShortestPathsDijkstra(mockData, '1', '10');
    expect(paths).toEqual([]);
  });

  it('handles empty data', () => {
    // @ts-ignore
    const paths = findShortestPathsDijkstra(null, '1', '2');
    expect(paths).toEqual([]);
  });
});
