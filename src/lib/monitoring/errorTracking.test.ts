/**
 * Tests for Error Tracking Service
 */

/* eslint-disable no-undef */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initErrorTracking,
  cleanupErrorTracking,
  reportError,
  reportReactError,
  getErrorTrackingConfig,
  updateErrorTrackingConfig
} from './errorTracking';

describe('errorTracking', () => {
  beforeEach(() => {
    // Clean up any existing listeners
    cleanupErrorTracking();
  });

  afterEach(() => {
    cleanupErrorTracking();
  });

  describe('initErrorTracking', () => {
    it('should initialize error tracking with default config', () => {
      initErrorTracking();

      const config = getErrorTrackingConfig();
      expect(config.enabled).toBe(true);
      expect(config.sampleRate).toBe(1.0);
    });

    it('should initialize with custom config', () => {
      initErrorTracking({
        enabled: true,
        sampleRate: 0.5,
        debug: true
      });

      const config = getErrorTrackingConfig();
      expect(config.enabled).toBe(true);
      expect(config.sampleRate).toBe(0.5);
      expect(config.debug).toBe(true);
    });

    it('should not enable tracking when disabled', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      initErrorTracking({ enabled: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error Tracking] Disabled'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('reportError', () => {
    it('should report error with correct structure', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        debug: false,
        onError: onErrorMock
      });

      const testError = new Error('Test error');
      reportError(testError, 'error', {
        component: 'TestComponent',
        action: 'test-action'
      });

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = onErrorMock.mock.calls[0][0];

      expect(reportedError.message).toBe('Test error');
      expect(reportedError.severity).toBe('error');
      expect(reportedError.context?.component).toBe('TestComponent');
      expect(reportedError.context?.action).toBe('test-action');
      expect(reportedError.timestamp).toBeGreaterThan(0);
      expect(reportedError.url).toContain('localhost');
    });

    it('should not report when tracking is disabled', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: false,
        onError: onErrorMock
      });

      reportError(new Error('Test error'));

      expect(onErrorMock).not.toHaveBeenCalled();
    });

    it('should respect sample rate', () => {
      const onErrorMock = vi.fn();
      const mathRandomSpy = vi.spyOn(Math, 'random');

      initErrorTracking({
        enabled: true,
        sampleRate: 0.5,
        onError: onErrorMock
      });

      // Simulate random value that should NOT sample
      mathRandomSpy.mockReturnValue(0.6);
      reportError(new Error('Not sampled'));
      expect(onErrorMock).not.toHaveBeenCalled();

      // Simulate random value that SHOULD sample
      mathRandomSpy.mockReturnValue(0.3);
      reportError(new Error('Sampled'));
      expect(onErrorMock).toHaveBeenCalledTimes(1);

      mathRandomSpy.mockRestore();
    });
  });

  describe('reportReactError', () => {
    it('should report React error with component stack', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        onError: onErrorMock
      });

      const testError = new Error('React error');
      const errorInfo = {
        componentStack: '\n    at TestComponent\n    at App'
      };

      reportReactError(testError, errorInfo, {
        component: 'ErrorBoundary'
      });

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = onErrorMock.mock.calls[0][0];

      expect(reportedError.message).toBe('React error');
      expect(reportedError.componentStack).toContain('at TestComponent');
      expect(reportedError.context?.component).toBe('ErrorBoundary');
    });
  });

  describe('global error handler', () => {
    it('should capture global errors', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        onError: onErrorMock
      });

      // Simulate global error event
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        message: 'Global error',
        filename: 'test.js',
        lineno: 10,
        colno: 5
      });

      window.dispatchEvent(errorEvent);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = onErrorMock.mock.calls[0][0];

      expect(reportedError.message).toBe('Global error');
      expect(reportedError.context?.filename).toBe('test.js');
      expect(reportedError.context?.lineno).toBe(10);
    });
  });

  describe('unhandled rejection handler', () => {
    it('should capture unhandled promise rejections', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        onError: onErrorMock
      });

      // Create rejection event manually (PromiseRejectionEvent not available in test environment)
      const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
      const testPromise = Promise.reject(new Error('Promise rejection'));
      testPromise.catch(() => {}); // Prevent unhandled rejection warning

      Object.defineProperty(rejectionEvent, 'reason', {
        value: new Error('Promise rejection'),
        writable: false
      });
      Object.defineProperty(rejectionEvent, 'promise', {
        value: testPromise,
        writable: false
      });

      window.dispatchEvent(rejectionEvent);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = onErrorMock.mock.calls[0][0];

      expect(reportedError.message).toBe('Promise rejection');
      expect(reportedError.context?.type).toBe('unhandled-rejection');
    });

    it('should handle non-Error rejection reasons', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        onError: onErrorMock
      });

      // Create rejection event with string reason
      const rejectionEvent = new Event('unhandledrejection') as PromiseRejectionEvent;
      const testPromise = Promise.reject('String rejection');
      testPromise.catch(() => {}); // Prevent unhandled rejection warning

      Object.defineProperty(rejectionEvent, 'reason', {
        value: 'String rejection',
        writable: false
      });
      Object.defineProperty(rejectionEvent, 'promise', {
        value: testPromise,
        writable: false
      });

      window.dispatchEvent(rejectionEvent);

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      const reportedError = onErrorMock.mock.calls[0][0];

      expect(reportedError.message).toBe('String rejection');
    });
  });

  describe('updateErrorTrackingConfig', () => {
    it('should update configuration', () => {
      initErrorTracking({
        enabled: true,
        sampleRate: 1.0
      });

      updateErrorTrackingConfig({
        sampleRate: 0.5,
        debug: true
      });

      const config = getErrorTrackingConfig();
      expect(config.sampleRate).toBe(0.5);
      expect(config.debug).toBe(true);
      expect(config.enabled).toBe(true); // Should preserve existing values
    });
  });

  describe('cleanupErrorTracking', () => {
    it('should remove event listeners', () => {
      const onErrorMock = vi.fn();

      initErrorTracking({
        enabled: true,
        onError: onErrorMock
      });

      // Cleanup should remove listeners
      cleanupErrorTracking();

      // Dispatch error event after cleanup
      const errorEvent = new ErrorEvent('error', {
        error: new Error('After cleanup'),
        message: 'After cleanup'
      });

      window.dispatchEvent(errorEvent);

      // Should NOT be called because listeners were removed
      expect(onErrorMock).not.toHaveBeenCalled();
    });
  });
});
