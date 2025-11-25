/**
 * Web Vitals Tracking - Real User Monitoring (RUM)
 *
 * Tracks Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - INP (Interaction to Next Paint): Responsiveness
 * - TTFB (Time to First Byte): Server response time
 * - FCP (First Contentful Paint): Initial render
 *
 * These metrics are essential for understanding real-world user experience
 * and identifying performance regressions.
 *
 * @see https://web.dev/vitals/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
 */

/* eslint-disable no-undef, no-console */

/**
 * Web Vitals metric types
 */
export type MetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

/**
 * Performance metric data structure
 */
export interface Metric {
  /**
   * Metric name (e.g., 'LCP', 'FID')
   */
  name: MetricName;

  /**
   * Metric value in milliseconds or score
   */
  value: number;

  /**
   * Rating: 'good', 'needs-improvement', or 'poor'
   */
  rating: 'good' | 'needs-improvement' | 'poor';

  /**
   * Timestamp when metric was recorded
   */
  timestamp: number;

  /**
   * Optional: Additional context about the metric
   */
  entries?: PerformanceEntry[];
}

/**
 * Callback function type for metric reporting
 */
export type MetricCallback = (metric: Metric) => void;

/**
 * Thresholds for metric ratings
 * Based on Web Vitals recommendations
 */
const METRIC_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },        // Largest Contentful Paint
  FID: { good: 100, poor: 300 },          // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },         // Cumulative Layout Shift
  INP: { good: 200, poor: 500 },          // Interaction to Next Paint
  TTFB: { good: 800, poor: 1800 },        // Time to First Byte
  FCP: { good: 1800, poor: 3000 }         // First Contentful Paint
};

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[name];
  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.poor) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Track Largest Contentful Paint (LCP)
 * LCP measures loading performance. Good LCP occurs within 2.5s.
 */
function trackLCP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };

      // LCP is the renderTime or loadTime of the largest element
      const value = lastEntry.renderTime || lastEntry.loadTime || 0;

      callback({
        name: 'LCP',
        value,
        rating: getRating('LCP', value),
        timestamp: Date.now(),
        entries
      });
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.warn('Error tracking LCP:', error);
  }
}

/**
 * Track First Input Delay (FID)
 * FID measures interactivity. Good FID occurs within 100ms.
 */
function trackFID(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart?: number };
        const value = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0;

        callback({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          timestamp: Date.now(),
          entries: [entry]
        });
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.warn('Error tracking FID:', error);
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 * CLS measures visual stability. Good CLS is less than 0.1.
 */
function trackCLS(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        const layoutShiftEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };

        // Only count layout shifts that weren't caused by user input
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
          clsEntries.push(entry);
        }
      });

      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        timestamp: Date.now(),
        entries: clsEntries
      });
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.warn('Error tracking CLS:', error);
  }
}

/**
 * Track Interaction to Next Paint (INP)
 * INP measures responsiveness. Good INP occurs within 200ms.
 */
function trackINP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    let maxDuration = 0;
    let inpEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        // Track the longest interaction
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration;
          inpEntries = [entry];

          callback({
            name: 'INP',
            value: maxDuration,
            rating: getRating('INP', maxDuration),
            timestamp: Date.now(),
            entries: inpEntries
          });
        }
      });
    });

    // @ts-expect-error - durationThreshold is not in PerformanceObserverInit type but is valid
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (error) {
    console.warn('Error tracking INP:', error);
  }
}

/**
 * Track Time to First Byte (TTFB)
 * TTFB measures server response time. Good TTFB occurs within 800ms.
 */
function trackTTFB(callback: MetricCallback): void {
  if (!('performance' in window) || !performance.timing) return;

  try {
    // Use Navigation Timing API
    const navTiming = performance.timing;
    const value = navTiming.responseStart - navTiming.requestStart;

    callback({
      name: 'TTFB',
      value,
      rating: getRating('TTFB', value),
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('Error tracking TTFB:', error);
  }
}

/**
 * Track First Contentful Paint (FCP)
 * FCP measures when the first content is rendered. Good FCP occurs within 1.8s.
 */
function trackFCP(callback: MetricCallback): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        callback({
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
          timestamp: Date.now(),
          entries: [fcpEntry]
        });
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.warn('Error tracking FCP:', error);
  }
}

/**
 * Initialize Web Vitals tracking
 * Starts tracking all Core Web Vitals and reports them via callback
 *
 * @param callback - Function to call when a metric is measured
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * initWebVitals((metric) => {
 *   console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`);
 *
 *   // Send to analytics service
 *   analytics.track('web_vital', {
 *     metric: metric.name,
 *     value: metric.value,
 *     rating: metric.rating
 *   });
 * });
 * ```
 */
export function initWebVitals(
  callback: MetricCallback,
  options?: {
    /**
     * Enable console logging of metrics (default: development mode only)
     */
    debug?: boolean;
  }
): void {
  const debug = options?.debug ?? (process.env.NODE_ENV === 'development');

  // Wrap callback to add debug logging
  const wrappedCallback: MetricCallback = (metric) => {
    if (debug) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: `${metric.value.toFixed(2)}ms`,
        rating: metric.rating,
        entries: metric.entries
      });
    }
    callback(metric);
  };

  // Track all Core Web Vitals
  trackLCP(wrappedCallback);
  trackFID(wrappedCallback);
  trackCLS(wrappedCallback);
  trackINP(wrappedCallback);
  trackTTFB(wrappedCallback);
  trackFCP(wrappedCallback);
}

/**
 * Get current Web Vitals snapshot
 * Returns a promise that resolves with current metric values
 * Useful for manual reporting or debugging
 */
export async function getWebVitalsSnapshot(): Promise<Record<MetricName, Metric | null>> {
  return new Promise((resolve) => {
    const metrics: Record<MetricName, Metric | null> = {
      LCP: null,
      FID: null,
      CLS: null,
      INP: null,
      TTFB: null,
      FCP: null
    };

    let metricsCollected = 0;
    const totalMetrics = 6;

    const collectMetric = (metric: Metric) => {
      metrics[metric.name] = metric;
      metricsCollected++;

      // Resolve when all metrics are collected (or timeout after 5 seconds)
      if (metricsCollected === totalMetrics) {
        resolve(metrics);
      }
    };

    // Start collecting metrics
    initWebVitals(collectMetric);

    // Timeout after 5 seconds
    setTimeout(() => {
      resolve(metrics);
    }, 5000);
  });
}
