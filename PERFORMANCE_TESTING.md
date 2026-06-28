# Performance Testing Guide

## Quick Performance Check

### 1. Chrome DevTools Performance Panel

```bash
# Start your development server
npm run dev

# Then:
# 1. Open Chrome DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record (●)
# 4. Reload the page (Cmd+R / Ctrl+R)
# 5. Wait for page to fully load
# 6. Stop recording
```

**What to look for:**
- ✅ **Long Tasks:** Should be < 50ms after optimizations
- ✅ **Main Thread:** Should show gaps during data loading (Web Worker is working)
- ✅ **Layout Shifts:** Should be minimal with skeleton loader
- ❌ **Purple bars (Rendering):** Watch for excessive forced reflows

### 2. Chrome Lighthouse

```bash
# Run in production mode
npm run build
npm run preview

# Then:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Performance" category
# 4. Click "Analyze page load"
```

**Target Scores:**
- Performance: > 90
- LCP: < 2.5s
- TBT (Total Blocking Time): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

### 3. Web Vitals Extension

Install: [Web Vitals Chrome Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)

**Monitor:**
- LCP (Largest Contentful Paint) - Should be fast with skeleton
- FID (First Input Delay) - Should be low with Web Worker
- CLS (Cumulative Layout Shift) - Should be minimal

## Performance Comparison

### Before Optimizations

```
Timeline Analysis:
├─ 0ms - Page load starts
├─ 50ms - HTML parsed
├─ 350ms - LCP (visible paint)
├─ 400-800ms - Main thread blocked (JSON parsing)
│   └─ 346ms - Long task (third-party scripts)
│   └─ 211ms - Long task (layout thrashing)
├─ 900ms - UI becomes interactive
└─ Time to Interactive: ~900ms
```

### After Optimizations (Expected)

```
Timeline Analysis:
├─ 0ms - Page load starts
├─ 50ms - HTML parsed
├─ 100ms - Skeleton UI rendered (immediate feedback)
├─ 150ms - Web Worker spawned
├─ 200-400ms - Data loading (off main thread)
│   └─ Main thread idle (no blocking)
├─ 450ms - Data ready, UI hydrates
└─ Time to Interactive: ~450ms (50% improvement)
```

## Testing Different Scenarios

### 1. Fast Network (Default)

```bash
npm run dev
# Open http://localhost:5173
# Check: Skeleton appears instantly, data loads quickly
```

### 2. Slow Network (3G Simulation)

```bash
# In Chrome DevTools:
# Network tab → Throttling → Slow 3G

npm run dev
# Check: Skeleton still appears instantly
# User gets immediate feedback even on slow networks
```

### 3. Offline (Service Worker Test)

```bash
# Build production version
npm run build
npm run preview

# In Chrome DevTools:
# Application tab → Service Workers → Check "Offline"
# Reload page
# Check: Cached data loads from service worker
```

### 4. CPU Throttling

```bash
# In Chrome DevTools:
# Performance tab → CPU throttling → 4x slowdown

npm run dev
# Check: Main thread still responsive
# Web Worker handles heavy processing
```

## Automated Performance Testing

Create `frontend/tests/performance.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('performance metrics', async ({ page }) => {
  // Start measuring
  await page.goto('/');
  
  // Wait for skeleton to appear (should be immediate)
  const skeletonStart = Date.now();
  await page.locator('.MuiSkeleton-root').first().waitFor({ state: 'visible' });
  const skeletonTime = Date.now() - skeletonStart;
  
  console.log(`Skeleton appeared in: ${skeletonTime}ms`);
  expect(skeletonTime).toBeLessThan(200); // Should appear almost instantly
  
  // Wait for actual content to load
  const contentStart = Date.now();
  await page.getByText('Muhammad (PBUH)').first().waitFor({ 
    state: 'visible', 
    timeout: 5000 
  });
  const contentTime = Date.now() - contentStart;
  
  console.log(`Content loaded in: ${contentTime}ms`);
  expect(contentTime).toBeLessThan(2000); // Should load within 2 seconds
  
  // Measure performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      fcp: fcp?.startTime || 0,
    };
  });
  
  console.log('Performance metrics:', metrics);
  
  // Assertions
  expect(metrics.domContentLoaded).toBeLessThan(500);
  expect(metrics.fcp).toBeLessThan(1000);
});

test('no layout thrashing during interaction', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Muhammad (PBUH)').first().waitFor();
  
  // Start performance recording
  await page.evaluate(() => {
    (window as any).layoutCount = 0;
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    
    Element.prototype.getBoundingClientRect = function() {
      (window as any).layoutCount++;
      return originalGetBoundingClientRect.call(this);
    };
  });
  
  // Perform interactions
  await page.getByPlaceholder('Search Sahabah...').fill('Abu');
  await page.waitForTimeout(500);
  
  // Check layout count
  const layoutCount = await page.evaluate(() => (window as any).layoutCount);
  console.log(`Layout recalculations: ${layoutCount}`);
  
  // Should have minimal layout recalculations
  expect(layoutCount).toBeLessThan(10);
});
```

Run tests:
```bash
npm run test:e2e
```

## Performance Monitoring in Production

### 1. Add Web Vitals Reporting

```typescript
// frontend/src/main.tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  console.log(metric);
  // Send to your analytics service
  // Example: gtag('event', metric.name, { value: metric.value });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

### 2. Performance Observer

```typescript
// Monitor long tasks in production
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn('Long task detected:', entry.duration, 'ms');
        // Report to monitoring service
      }
    }
  });
  
  observer.observe({ entryTypes: ['longtask'] });
}
```

## Debugging Performance Issues

### 1. Main Thread Blocked?

```javascript
// Add to console in DevTools
performance.measure('data-loading');
// Check if main thread shows activity during data loading
// Should be mostly idle with Web Worker
```

### 2. Worker Not Loading?

```javascript
// Check worker status
if (typeof Worker === 'undefined') {
  console.error('Web Workers not supported!');
} else {
  console.log('Web Workers supported ✓');
}
```

### 3. Layout Thrashing Still Occurring?

```javascript
// Add performance marks
import { batchRead, batchWrite } from './utils/domOperations';

batchRead(() => {
  performance.mark('read-start');
  // ... reads
  performance.mark('read-end');
});

batchWrite(() => {
  performance.mark('write-start');
  // ... writes
  performance.mark('write-end');
});

// Check marks in Performance panel
```

## Continuous Monitoring

Set up performance budgets in `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'graph': ['cytoscape'],
          'ui': ['@mui/material'],
        }
      }
    }
  },
  // Performance budgets
  build: {
    chunkSizeWarningLimit: 500, // KB
  }
});
```

## Expected Results Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main Thread Blocking | 400-800ms | < 100ms | 75-87% |
| Time to Interactive | ~900ms | ~450ms | 50% |
| Skeleton Display | N/A | < 100ms | Immediate feedback |
| Layout Reflows | Multiple forced | Batched | 90%+ reduction |
| User Perception | Slow, unresponsive | Fast, responsive | Significant |

## Troubleshooting

**Issue:** Skeleton not appearing
- Check: `<SkeletonLoader>` component is imported
- Check: Loading state logic in `App.tsx`

**Issue:** Worker not loading data
- Check: Browser console for errors
- Check: Network tab for data file requests
- Check: Worker file path in `useDataLoader.ts`

**Issue:** Still seeing long tasks
- Check: DevTools Performance → Long Tasks tab
- Identify the source (your code vs third-party)
- Use `batchRead/batchWrite` for DOM operations

**Issue:** Data not displaying after load
- Check: `workerGraphData` is not null before rendering
- Check: Browser console for errors
- Verify data structure matches expected format
