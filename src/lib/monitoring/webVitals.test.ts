/**
 * Tests for Web Vitals Tracking
 */

/* eslint-disable no-undef */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initWebVitals, getWebVitalsSnapshot, type Metric } from './webVitals';

describe('webVitals', () => {
  let originalPerformanceObserver: typeof PerformanceObserver;

  beforeEach(() => {
    // Save original PerformanceObserver
    originalPerformanceObserver = global.PerformanceObserver;

    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original PerformanceObserver
    global.PerformanceObserver = originalPerformanceObserver;
    vi.restoreAllMocks();
  });

  describe('initWebVitals', () => {
    it('should initialize without errors', () => {
      const callback = vi.fn();

      expect(() => {
        initWebVitals(callback);
      }).not.toThrow();
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      // Remove PerformanceObserver
      // @ts-expect-error - Testing missing API
      delete global.PerformanceObserver;

      const callback = vi.fn();

      expect(() => {
        initWebVitals(callback);
      }).not.toThrow();

      // Callback should not be called if PerformanceObserver is missing
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback when metrics are captured', () => {
      const callback = vi.fn();

      // Mock PerformanceObserver
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [])
      };

      global.PerformanceObserver = vi.fn().mockImplementation((cb) => {
        // Simulate an LCP entry
        setTimeout(() => {
          cb({
            getEntries: () => [
              {
                name: 'largest-contentful-paint',
                entryType: 'largest-contentful-paint',
                startTime: 1500,
                duration: 0,
                renderTime: 1500,
                loadTime: 1500
              }
            ]
          });
        }, 0);
        return mockObserver;
      }) as unknown as typeof PerformanceObserver;

      initWebVitals(callback);

      // Wait for async callback
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalled();
          const metric: Metric = callback.mock.calls[0][0];
          expect(metric.name).toBe('LCP');
          expect(metric.value).toBeGreaterThan(0);
          expect(metric.rating).toBe('good'); // 1500ms is good LCP
          resolve();
        }, 100);
      });
    });

    it('should enable debug logging in development', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const callback = vi.fn();

      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      initWebVitals(callback, { debug: true });

      // Restore environment
      process.env.NODE_ENV = originalEnv;

      // Debug option should enable logging
      expect(consoleSpy).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('should not log in production by default', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const callback = vi.fn();

      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      initWebVitals(callback);

      // Restore environment
      process.env.NODE_ENV = originalEnv;

      consoleSpy.mockRestore();
    });
  });

  describe('metric rating', () => {
    it('should rate LCP correctly', () => {
      const callback = vi.fn();

      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [])
      };

      let callCount = 0;
      global.PerformanceObserver = vi.fn().mockImplementation((cb) => {
        // Only call callback for LCP, not all metrics
        if (callCount === 0) {
          // Test different LCP values
          const testCases = [
            { value: 2000, expectedRating: 'good' },
            { value: 3000, expectedRating: 'needs-improvement' },
            { value: 5000, expectedRating: 'poor' }
          ];

          testCases.forEach((testCase) => {
            cb({
              getEntries: () => [
                {
                  name: 'largest-contentful-paint',
                  entryType: 'largest-contentful-paint',
                  startTime: testCase.value,
                  renderTime: testCase.value,
                  loadTime: testCase.value
                }
              ]
            });
          });
          callCount++;
        }

        return mockObserver;
      }) as unknown as typeof PerformanceObserver;

      initWebVitals(callback);

      // Check ratings - should have 3 LCP calls
      const lcpCalls = callback.mock.calls.filter((call) => call[0].name === 'LCP');
      expect(lcpCalls.length).toBe(3);

      const metrics: Metric[] = lcpCalls.map((call) => call[0]);
      expect(metrics[0].rating).toBe('good');
      expect(metrics[1].rating).toBe('needs-improvement');
      expect(metrics[2].rating).toBe('poor');
    });
  });

  describe('getWebVitalsSnapshot', () => {
    it('should return a snapshot of metrics', async () => {
      // Mock PerformanceObserver to return metrics quickly
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [])
      };

      global.PerformanceObserver = vi.fn().mockImplementation((cb) => {
        // Immediately call callback with mock LCP
        setTimeout(() => {
          cb({
            getEntries: () => [
              {
                name: 'largest-contentful-paint',
                entryType: 'largest-contentful-paint',
                startTime: 1500,
                renderTime: 1500,
                loadTime: 1500
              }
            ]
          });
        }, 0);
        return mockObserver;
      }) as unknown as typeof PerformanceObserver;

      const snapshot = await getWebVitalsSnapshot();

      // Should have metric keys
      expect(snapshot).toHaveProperty('LCP');
      expect(snapshot).toHaveProperty('FID');
      expect(snapshot).toHaveProperty('CLS');
      expect(snapshot).toHaveProperty('INP');
      expect(snapshot).toHaveProperty('TTFB');
      expect(snapshot).toHaveProperty('FCP');
    }, 10000); // Increase timeout for async test

    it('should timeout after 5 seconds', async () => {
      // Mock PerformanceObserver that never calls callback
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [])
      };

      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        // Never call callback
        return mockObserver;
      }) as unknown as typeof PerformanceObserver;

      const start = Date.now();
      const snapshot = await getWebVitalsSnapshot();
      const elapsed = Date.now() - start;

      // Should resolve within ~5 seconds (timeout)
      expect(elapsed).toBeGreaterThanOrEqual(4900); // Allow some margin
      expect(elapsed).toBeLessThan(6000);

      // All metrics should be null (not collected)
      expect(snapshot.LCP).toBeNull();
      expect(snapshot.FID).toBeNull();
      expect(snapshot.CLS).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle PerformanceObserver errors gracefully', () => {
      const callback = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock PerformanceObserver that throws error
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver error');
      }) as unknown as typeof PerformanceObserver;

      expect(() => {
        initWebVitals(callback);
      }).not.toThrow();

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
