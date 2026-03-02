/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and sends to analytics API
 * 
 * Batches metrics to avoid rate limiting
 */

const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ENABLE_WEB_VITALS = process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS !== 'false'; // Enabled by default

interface WebVitalsMetric {
  metric: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  page: string;
}

// Batch queue for metrics
let metricQueue: WebVitalsMetric[] = [];
let flushTimer: NodeJS.Timeout | null = null;
const BATCH_SIZE = 5; // Send after 5 metrics
const BATCH_INTERVAL = 3000; // Or after 3 seconds

/**
 * Send metrics batch to analytics API
 */
async function sendMetricBatch(metrics: WebVitalsMetric[]): Promise<void> {
  if (metrics.length === 0) return;
  
  try {
    // Send all metrics in batch
    await Promise.all(
      metrics.map(metric =>
        fetch(`${ANALYTICS_API_URL}/analytics/performance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric),
          credentials: 'omit',
        })
      )
    );
  } catch (error) {
    // Silently fail
    console.warn('[Performance] Error sending metrics:', error);
  }
}

/**
 * Flush the metric queue
 */
function flushMetricQueue(): void {
  if (metricQueue.length === 0) return;
  
  const metricsToSend = [...metricQueue];
  metricQueue = [];
  
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  sendMetricBatch(metricsToSend);
}

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush(): void {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushMetricQueue();
  }, BATCH_INTERVAL);
}

/**
 * Send performance metric to analytics API (queued)
 */
async function sendMetric(metric: WebVitalsMetric): Promise<void> {
  if (!ENABLE_WEB_VITALS) return;
  
  metricQueue.push(metric);
  
  // Flush if batch size reached
  if (metricQueue.length >= BATCH_SIZE) {
    flushMetricQueue();
  } else {
    scheduleFlush();
  }
}

/**
 * Get rating for a metric value
 */
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds from Web Vitals spec
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  
  const [good, poor] = thresholds[metric] || [0, 0];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics
 * This uses the browser's native Performance APIs
 */
export function reportWebVitals(): void {
  // Skip in SSR
  if (typeof window === 'undefined') return;
  
  // Skip if disabled
  if (!ENABLE_WEB_VITALS) {
    console.log('[Performance] Web Vitals tracking disabled');
    return;
  }
  
  // Flush queue on page unload
  window.addEventListener('beforeunload', () => {
    flushMetricQueue();
  });
  
  const page = window.location.pathname;
  
  // LCP - Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry;
    const value = lastEntry.startTime;
    
    sendMetric({
      metric: 'LCP',
      value,
      rating: getRating('LCP', value),
      delta: value,
      id: `${Date.now()}-${Math.random()}`,
      navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
      page,
    });
  });
  
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }
  
  // FID - First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      const value = entry.processingStart - entry.startTime;
      
      sendMetric({
        metric: 'FID',
        value,
        rating: getRating('FID', value),
        delta: value,
        id: `${Date.now()}-${Math.random()}`,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
        page,
      });
    });
  });
  
  try {
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }
  
  // CLS - Cumulative Layout Shift
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];
  
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      // Only count layout shifts without recent user input
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        clsEntries.push(entry);
      }
    });
  });
  
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // CLS not supported
  }
  
  // Send CLS on page hide
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && clsValue > 0) {
      sendMetric({
        metric: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `${Date.now()}-${Math.random()}`,
        navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
        page,
      });
    }
  });
  
  // FCP - First Contentful Paint
  const paintObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        const value = entry.startTime;
        
        sendMetric({
          metric: 'FCP',
          value,
          rating: getRating('FCP', value),
          delta: value,
          id: `${Date.now()}-${Math.random()}`,
          navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
          page,
        });
      }
    });
  });
  
  try {
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // Paint timing not supported
  }
  
  // TTFB - Time to First Byte
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigationEntry) {
    const value = navigationEntry.responseStart - navigationEntry.requestStart;
    
    sendMetric({
      metric: 'TTFB',
      value,
      rating: getRating('TTFB', value),
      delta: value,
      id: `${Date.now()}-${Math.random()}`,
      navigationType: navigationEntry.type || 'navigate',
      page,
    });
  }
  
  // INP - Interaction to Next Paint (newer metric, may not be available in all browsers)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const value = entry.duration;
        
        sendMetric({
          metric: 'INP',
          value,
          rating: getRating('INP', value),
          delta: value,
          id: `${Date.now()}-${Math.random()}`,
          navigationType: (performance.getEntriesByType('navigation')[0] as any)?.type || 'navigate',
          page,
        });
      });
    });
    
    // Note: INP observing is experimental - this may not work in all browsers
    inpObserver.observe({ type: 'event', buffered: true } as any);
  } catch (e) {
    // INP not supported yet
  }
}
