import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ragEngine } from './ragEngine';

describe('RAGEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock if needed
    global.fetch = vi.fn();
  });

  it('should load data from JSON files', async () => {
    const mockGraphData = { nodes: [], links: [] };
    const mockPoliticalData = { cities: [], terms: [] };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGraphData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPoliticalData) });

    await (ragEngine as any).loadData();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should return context for relevant query', async () => {
    const mockGraphData = {
      nodes: [
        { id: '1', name_en: 'Abu Bakr', biography_short: 'First Caliph' }
      ],
      links: []
    };
    const mockPoliticalData = { cities: [], terms: [] };

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGraphData) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPoliticalData) });

    // Reset internal state for test
    (ragEngine as any).isLoaded = false;

    const context = await ragEngine.getContext('Abu Bakr');
    expect(context).toContain('Abu Bakr');
    expect(context).toContain('First Caliph');
  });
});
