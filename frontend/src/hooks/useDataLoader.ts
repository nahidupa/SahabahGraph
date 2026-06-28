/**
 * Hook for loading graph data using Web Workers
 * Offloads JSON parsing from the main thread to prevent UI blocking
 */

import { useState, useEffect, useCallback } from 'react';
import type { GraphData, PoliticalData } from '../types';

interface UseDataLoaderResult {
  graphData: GraphData | null;
  politicalData: PoliticalData | null;
  isLoading: boolean;
  error: string | null;
}

const DATA_FILE = 'data/sahabah_data.json';
const POLITICAL_DATA_FILE = 'data/political_terms.json';

// Generate candidate URLs for data files
const getCandidateUrls = (fileName: string): string[] => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return Array.from(new Set([
    `./${fileName}`,
    `/${fileName}`,
    `${normalizedBase}${fileName}`,
  ]));
};

export const useDataLoader = (): UseDataLoaderResult => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [politicalData, setPoliticalData] = useState<PoliticalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    let worker: Worker | null = null;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check if Web Workers are supported
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported in this browser');
      }

      // Create worker instance
      worker = new Worker(
        new URL('../workers/dataLoader.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Track loaded data
      let loadedGraphData: GraphData | null = null;
      let loadedPoliticalData: PoliticalData | null = null;
      let graphLoaded = false;
      let politicalLoaded = false;

      // Listen for worker messages
      worker.addEventListener('message', (event) => {
        const { type, data, error: workerError } = event.data;

        if (type === 'READY') {
          // Worker is ready, start loading data
          worker?.postMessage({
            type: 'LOAD_GRAPH',
            urls: getCandidateUrls(DATA_FILE),
          });
          worker?.postMessage({
            type: 'LOAD_POLITICAL',
            urls: getCandidateUrls(POLITICAL_DATA_FILE),
          });
        } else if (type === 'GRAPH_DATA') {
          loadedGraphData = data as GraphData;
          graphLoaded = true;
          
          // Update state immediately to show graph as soon as possible
          setGraphData(loadedGraphData);
          
          // Check if all data is loaded
          if (politicalLoaded) {
            setIsLoading(false);
          }
        } else if (type === 'POLITICAL_DATA') {
          loadedPoliticalData = data as PoliticalData;
          politicalLoaded = true;
          
          // Update state
          setPoliticalData(loadedPoliticalData);
          
          // Check if all data is loaded
          if (graphLoaded) {
            setIsLoading(false);
          }
        } else if (type === 'ERROR') {
          setError(workerError || 'Failed to load data');
          setIsLoading(false);
        }
      });

      // Handle worker errors
      worker.addEventListener('error', (event) => {
        console.error('Worker error:', event);
        setError('Failed to load data using Web Worker');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Failed to initialize data loader:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [loadData]);

  return {
    graphData,
    politicalData,
    isLoading,
    error,
  };
};
