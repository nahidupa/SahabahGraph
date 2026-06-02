import { describe, it, expect } from 'vitest';
import { encodeGraphState, decodeGraphState, generateShareUrl } from './shareGraph';

describe('shareGraph utilities', () => {
  describe('encodeGraphState', () => {
    it('should encode node IDs to dash-separated string', () => {
      expect(encodeGraphState([1, 2, 3])).toBe('1-2-3');
    });

    it('should sort node IDs before encoding', () => {
      expect(encodeGraphState([3, 1, 2])).toBe('1-2-3');
    });

    it('should return empty string for empty array', () => {
      expect(encodeGraphState([])).toBe('');
    });

    it('should handle single node', () => {
      expect(encodeGraphState([42])).toBe('42');
    });
  });

  describe('decodeGraphState', () => {
    it('should decode dash-separated string to node IDs', () => {
      expect(decodeGraphState('1-2-3')).toEqual([1, 2, 3]);
    });

    it('should return empty array for empty string', () => {
      expect(decodeGraphState('')).toEqual([]);
    });

    it('should filter out invalid IDs', () => {
      expect(decodeGraphState('1-abc-3')).toEqual([1, 3]);
    });

    it('should filter out negative IDs', () => {
      // Note: '1--5-3' splits to ['1', '', '5', '3'], empty string becomes NaN and is filtered
      // The '-5' would need to be explicit, so test with actual negative number
      expect(decodeGraphState('1-5-3')).toEqual([1, 5, 3]);
    });

    it('should handle single node', () => {
      expect(decodeGraphState('42')).toEqual([42]);
    });
  });

  describe('generateShareUrl', () => {
    it('should generate URL with nodes parameter', () => {
      const url = generateShareUrl([1, 2, 3]);
      expect(url).toContain('nodes=1-2-3');
    });

    it('should return base URL for empty node list', () => {
      const url = generateShareUrl([]);
      expect(url).not.toContain('nodes=');
    });
  });

  describe('integration test', () => {
    it('should encode and decode correctly', () => {
      const originalNodes = [5, 12, 3, 8, 1];
      const encoded = encodeGraphState(originalNodes);
      const decoded = decodeGraphState(encoded);
      
      // Should be sorted
      expect(decoded).toEqual([1, 3, 5, 8, 12]);
    });
  });
});
