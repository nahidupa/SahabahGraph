# Performance Optimizations - SahabahGraph

## Overview
This document describes the performance optimizations implemented to address slow initial component rendering and main thread congestion during page load.

## Issues Addressed

### 1. Third-Party Extension Interference
**Problem:** Browser extensions (e.g., LastPass) executing heavy operations on the main thread during initialization, blocking UI rendering.

**Solution:** 
- Implemented skeleton loading states to show UI shell immediately
- Decouple UI rendering from heavy data processing

### 2. Layout Thrashing
**Problem:** Repeated forced synchronous layouts (reflows) caused by read-write-read patterns in DOM operations.

**Solution:**
- Created `domOperations.ts` utility to batch DOM reads and writes
- Separate read operations from write operations using `requestAnimationFrame`
- Utilities provided:
  - `batchRead()` - Queue DOM read operations
  - `batchWrite()` - Queue DOM write operations
  - `readThenWrite()` - Safely read then write to the same element
  - `debounceDOMOperation()` - Debounce DOM operations during rapid events
  - `throttleDOMOperation()` - Throttle DOM operations to prevent excessive execution
  - `whenIdle()` - Execute callbacks when browser is idle

### 3. JSON Processing Overhead
**Problem:** Synchronous processing of large graph datasets (~400ms) on the main thread prevented UI from remaining responsive.

**Solution:**
- Created Web Worker (`dataLoader.worker.ts`) to offload JSON parsing and processing
- Data loading now happens off the main thread
- Implemented retry logic with exponential backoff for failed fetches
- Progress can be tracked with loading states

## Implementation Details

### Web Worker Data Loading

**File:** `frontend/src/workers/dataLoader.worker.ts`
- Handles JSON fetching and parsing off the main thread
- Supports multiple candidate URLs with fallback
- Implements retry logic for network failures
- Returns processed data to main thread via postMessage

**File:** `frontend/src/hooks/useDataLoader.ts`
- React hook that manages Web Worker lifecycle
- Provides loading states and error handling
- Automatically cleans up worker on unmount
- Returns: `{ graphData, politicalData, isLoading, error }`

### Skeleton Loading States

**File:** `frontend/src/components/Loading/SkeletonLoader.tsx`
- Displays skeleton UI while data is loading
- Prevents layout shift and improves perceived performance
- Variants: `sidebar`, `graph`, `detail`, `full`
- Uses Material-UI Skeleton components for smooth animations

### DOM Operation Batching

**File:** `frontend/src/utils/domOperations.ts`
- Prevents layout thrashing by batching DOM operations
- All reads execute before writes to minimize reflows
- Uses `requestAnimationFrame` for optimal timing

## Performance Metrics

### Before Optimization
- **LCP:** 350ms (fast, but post-load degradation)
- **Long Task 1:** 346ms (third-party extensions)
- **Long Task 2:** 211ms (layout thrashing)
- **JSON Processing:** ~400ms (main thread blocking)

### Expected Improvements
- **Main Thread:** Freed up during data loading (400ms+ saved)
- **Layout Thrashing:** Eliminated forced reflows
- **Perceived Performance:** Immediate skeleton UI feedback
- **Time to Interactive:** Significant improvement due to offloaded processing

## Usage Guidelines

### Using the Data Loader Hook

```typescript
import { useDataLoader } from './hooks/useDataLoader';

function MyComponent() {
  const { graphData, politicalData, isLoading, error } = useDataLoader();
  
  if (isLoading) {
    return <SkeletonLoader variant="full" />;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  // Use graphData and politicalData
}
```

### Using DOM Batching Utilities

```typescript
import { batchRead, batchWrite, readThenWrite } from './utils/domOperations';

// ❌ Bad: Causes layout thrashing
const height = element.offsetHeight;  // Read
element.style.margin = '10px';       // Write (invalidates layout)
const newHeight = element.offsetHeight; // Forced reflow

// ✅ Good: Batch operations
batchRead(() => {
  const height = element.offsetHeight;
  console.log(height);
});

batchWrite(() => {
  element.style.margin = '10px';
});

// ✅ Good: Read then write safely
readThenWrite(
  () => {
    // All reads here
    const height = element.offsetHeight;
    return height;
  },
  () => {
    // All writes here
    element.style.height = `${height + 10}px`;
  }
);
```

### Avoiding Common Pitfalls

```typescript
// ❌ Don't interleave reads and writes
function badExample() {
  const width = div1.offsetWidth;      // Read
  div1.style.width = '100px';          // Write
  const height = div2.offsetHeight;    // Forced reflow!
  div2.style.height = '50px';          // Write
}

// ✅ Batch reads, then writes
function goodExample() {
  let width, height;
  
  batchRead(() => {
    width = div1.offsetWidth;
    height = div2.offsetHeight;
  });
  
  batchWrite(() => {
    div1.style.width = '100px';
    div2.style.height = '50px';
  });
}
```

## Browser Compatibility

### Web Workers
- **Supported:** All modern browsers (Chrome, Firefox, Safari, Edge)
- **Fallback:** Error message if not supported (rare in 2026)

### requestAnimationFrame
- **Supported:** All modern browsers
- **Fallback:** Built into domOperations utilities

### requestIdleCallback
- **Supported:** Chrome, Edge
- **Fallback:** Uses `setTimeout` in other browsers

## Testing

### Performance Testing
1. Open DevTools Performance panel
2. Start recording
3. Reload the application
4. Stop recording after page is fully interactive
5. Check for:
   - Long tasks < 50ms
   - No forced reflows in long tasks
   - Main thread freed during data loading

### Functional Testing
1. Verify skeleton loader appears immediately
2. Verify data loads correctly
3. Verify error states display properly
4. Test on slow network conditions (DevTools throttling)

## Future Improvements

1. **Progressive Loading:** Load critical data first, then progressively load additional data
2. **Virtual Scrolling:** For large lists in the sidebar
3. **Code Splitting:** Split routes and components for faster initial load
4. **Service Worker:** Cache data files for offline support and faster subsequent loads
5. **IndexedDB:** Store processed data locally to skip processing on return visits

## Resources

- [Avoid Large Layout Shifts](https://web.dev/cls/)
- [Optimize Long Tasks](https://web.dev/optimize-long-tasks/)
- [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Minimize browser reflow](https://developers.google.com/speed/docs/insights/browser-reflow)

## Maintenance Notes

- Web Worker files must be in TypeScript and imported with `new URL()` syntax for Vite
- Skeleton components should match the visual structure of actual components
- DOM batching utilities are global singletons - no need to instantiate
- Always test performance changes in production builds, not development mode
