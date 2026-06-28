/**
 * DOM Operations Utilities
 * Prevents layout thrashing by batching reads and writes
 */

type DOMReadCallback = () => void;
type DOMWriteCallback = () => void;

class DOMBatcher {
  private readQueue: DOMReadCallback[] = [];
  private writeQueue: DOMWriteCallback[] = [];
  private scheduled = false;

  /**
   * Schedule a DOM read operation
   * All reads will be batched together before any writes
   */
  read(callback: DOMReadCallback): void {
    this.readQueue.push(callback);
    this.scheduleFlush();
  }

  /**
   * Schedule a DOM write operation
   * All writes will be batched together after all reads
   */
  write(callback: DOMWriteCallback): void {
    this.writeQueue.push(callback);
    this.scheduleFlush();
  }

  /**
   * Schedule the batch processing
   */
  private scheduleFlush(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => this.flush());
  }

  /**
   * Execute all queued operations
   * Reads first, then writes to prevent layout thrashing
   */
  private flush(): void {
    // Execute all reads first
    const reads = this.readQueue.slice();
    this.readQueue.length = 0;
    reads.forEach(callback => callback());

    // Then execute all writes
    const writes = this.writeQueue.slice();
    this.writeQueue.length = 0;
    writes.forEach(callback => callback());

    this.scheduled = false;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.readQueue.length = 0;
    this.writeQueue.length = 0;
    this.scheduled = false;
  }
}

// Singleton instance
const domBatcher = new DOMBatcher();

/**
 * Batch DOM read operations to prevent layout thrashing
 * Example:
 * ```ts
 * batchRead(() => {
 *   const height = element.offsetHeight;
 *   console.log(height);
 * });
 * ```
 */
export const batchRead = (callback: DOMReadCallback): void => {
  domBatcher.read(callback);
};

/**
 * Batch DOM write operations to prevent layout thrashing
 * Example:
 * ```ts
 * batchWrite(() => {
 *   element.style.height = '100px';
 * });
 * ```
 */
export const batchWrite = (callback: DOMWriteCallback): void => {
  domBatcher.write(callback);
};

/**
 * Measure multiple elements efficiently
 * Returns measurements in the callback after all reads are complete
 */
export const measureElements = <T extends Element>(
  elements: T[],
  measure: (element: T) => any
): Promise<any[]> => {
  return new Promise(resolve => {
    const measurements: any[] = [];
    
    batchRead(() => {
      elements.forEach(element => {
        measurements.push(measure(element));
      });
      
      // Resolve after measurements are complete
      requestAnimationFrame(() => {
        resolve(measurements);
      });
    });
  });
};

/**
 * Update multiple elements efficiently
 * Batches all writes together
 */
export const updateElements = <T extends Element>(
  elements: T[],
  update: (element: T) => void
): Promise<void> => {
  return new Promise(resolve => {
    batchWrite(() => {
      elements.forEach(update);
      
      // Resolve after updates are complete
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
};

/**
 * Safe way to read and write to the same element
 * Ensures reads happen before writes
 */
export const readThenWrite = (
  readCallback: DOMReadCallback,
  writeCallback: DOMWriteCallback
): void => {
  batchRead(() => {
    readCallback();
  });
  
  batchWrite(() => {
    writeCallback();
  });
};

/**
 * Debounce DOM operations during rapid events (e.g., resize, scroll)
 */
export const debounceDOMOperation = (
  callback: () => void,
  delay: number = 100
): (() => void) => {
  let timeoutId: number | undefined;
  
  return () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      requestAnimationFrame(() => {
        callback();
      });
    }, delay);
  };
};

/**
 * Throttle DOM operations to prevent excessive execution
 */
export const throttleDOMOperation = (
  callback: () => void,
  limit: number = 16 // ~60fps
): (() => void) => {
  let lastCall = 0;
  let timeoutId: number | undefined;
  
  return () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= limit) {
      lastCall = now;
      requestAnimationFrame(callback);
    } else {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        requestAnimationFrame(callback);
      }, limit - timeSinceLastCall);
    }
  };
};

/**
 * Execute callback when the browser is idle
 * Falls back to setTimeout if requestIdleCallback is not available
 */
export const whenIdle = (callback: () => void, timeout: number = 2000): void => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
};

export default domBatcher;
