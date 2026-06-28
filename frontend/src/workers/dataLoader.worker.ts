/**
 * Web Worker for offloading JSON parsing and data processing from the main thread
 * Prevents UI blocking during initial data load
 */

interface GraphData {
  nodes: any[];
  links: any[];
}

interface PoliticalData {
  cities: any[];
  terms: any[];
}

interface WorkerRequest {
  type: 'LOAD_GRAPH' | 'LOAD_POLITICAL';
  urls: string[];
}

interface WorkerResponse {
  type: 'GRAPH_DATA' | 'POLITICAL_DATA' | 'ERROR';
  data?: GraphData | PoliticalData;
  error?: string;
}

// Process data in chunks to allow for potential cancellation
const processGraphData = (json: any): GraphData => {
  // Normalize data structure
  if (!json || !Array.isArray(json.nodes) || !Array.isArray(json.links)) {
    throw new Error('Invalid graph data structure');
  }
  
  return {
    nodes: json.nodes.map((node: any) => ({
      ...node,
      id: typeof node.id === 'number' ? node.id : parseInt(String(node.id), 10),
    })),
    links: json.links,
  };
};

const processPoliticalData = (json: any): PoliticalData => {
  if (!json || !Array.isArray(json.cities) || !Array.isArray(json.terms)) {
    throw new Error('Invalid political data structure');
  }
  
  return {
    cities: json.cities,
    terms: json.terms,
  };
};

// Fetch with retry logic
const fetchWithRetry = async (urls: string[], maxRetries = 3): Promise<any> => {
  let lastError: Error | null = null;
  
  for (const url of urls) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        lastError = error as Error;
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch data from all URLs');
};

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { type, urls } = event.data;
  
  try {
    if (type === 'LOAD_GRAPH') {
      const json = await fetchWithRetry(urls);
      const processedData = processGraphData(json);
      
      const response: WorkerResponse = {
        type: 'GRAPH_DATA',
        data: processedData,
      };
      self.postMessage(response);
    } else if (type === 'LOAD_POLITICAL') {
      const json = await fetchWithRetry(urls);
      const processedData = processPoliticalData(json);
      
      const response: WorkerResponse = {
        type: 'POLITICAL_DATA',
        data: processedData,
      };
      self.postMessage(response);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    self.postMessage(response);
  }
});

// Notify that worker is ready
self.postMessage({ type: 'READY' });
