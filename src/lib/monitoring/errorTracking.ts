/**
 * Error Tracking Service
 *
 * Centralized error tracking and reporting for the Streaming Patterns application.
 * Captures client-side errors, React errors, and unhandled promise rejections.
 *
 * Features:
 * - React error boundary integration
 * - Global error handler
 * - Unhandled promise rejection handler
 * - Source map support preparation
 * - Error context enrichment (user agent, URL, timestamp)
 * - Console logging in development
 * - Future: Integration with error tracking services (Sentry, Cloudflare, etc.)
 *
 * @example
 * ```typescript
 * // Initialize in main.tsx
 * initErrorTracking();
 *
 * // Manual error reporting
 * reportError(new Error('Something went wrong'), {
 *   context: 'user-action',
 *   action: 'submit-form'
 * });
 * ```
 */

/* eslint-disable no-undef, no-console */

import type { ErrorInfo } from 'react';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Error context metadata
 */
export interface ErrorContext {
  /**
   * Component name where error occurred
   */
  component?: string;

  /**
   * User action that triggered the error
   */
  action?: string;

  /**
   * Additional context data
   */
  [key: string]: unknown;
}

/**
 * Tracked error data structure
 */
export interface TrackedError {
  /**
   * Error message
   */
  message: string;

  /**
   * Error stack trace
   */
  stack?: string;

  /**
   * Error name/type
   */
  name: string;

  /**
   * Severity level
   */
  severity: ErrorSeverity;

  /**
   * Timestamp when error occurred
   */
  timestamp: number;

  /**
   * Current page URL
   */
  url: string;

  /**
   * User agent string
   */
  userAgent: string;

  /**
   * React component stack (if from error boundary)
   */
  componentStack?: string;

  /**
   * Additional context
   */
  context?: ErrorContext;
}

/**
 * Error tracking configuration
 */
interface ErrorTrackingConfig {
  /**
   * Enable console logging (default: development mode)
   */
  debug?: boolean;

  /**
   * Enable error tracking (default: true)
   */
  enabled?: boolean;

  /**
   * Sample rate (0.0 to 1.0, default: 1.0 = 100%)
   */
  sampleRate?: number;

  /**
   * Custom error callback
   */
  onError?: (error: TrackedError) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ErrorTrackingConfig> = {
  debug: process.env.NODE_ENV === 'development',
  enabled: true,
  sampleRate: 1.0,
  onError: () => {}
};

/**
 * Current configuration
 */
let config: Required<ErrorTrackingConfig> = DEFAULT_CONFIG;

/**
 * Convert Error object to TrackedError
 */
function serializeError(
  error: Error,
  severity: ErrorSeverity = 'error',
  context?: ErrorContext
): TrackedError {
  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
    severity,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };
}

/**
 * Check if error should be sampled
 */
function shouldSampleError(): boolean {
  return Math.random() < config.sampleRate;
}

/**
 * Report error to tracking service
 * This is where integration with external services (Sentry, etc.) would go
 */
function reportToService(error: TrackedError): void {
  // Log to console in development
  if (config.debug) {
    console.error('[Error Tracking]', error);
  }

  // Call custom error callback
  config.onError(error);

  // Future: Send to external error tracking service
  // Example with Sentry:
  // if (typeof Sentry !== 'undefined') {
  //   Sentry.captureException(error, {
  //     level: error.severity,
  //     contexts: {
  //       custom: error.context
  //     },
  //     tags: {
  //       errorName: error.name
  //     }
  //   });
  // }

  // Example with custom endpoint:
  // if (process.env.NODE_ENV === 'production') {
  //   fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(error)
  //   }).catch(() => {
  //     // Silently fail - don't throw errors in error handler
  //   });
  // }
}

/**
 * Report an error manually
 *
 * @param error - Error object to report
 * @param severity - Error severity level
 * @param context - Additional context metadata
 *
 * @example
 * ```typescript
 * try {
 *   // Risky operation
 * } catch (error) {
 *   reportError(error as Error, 'error', {
 *     component: 'UserForm',
 *     action: 'submit'
 *   });
 * }
 * ```
 */
export function reportError(
  error: Error,
  severity: ErrorSeverity = 'error',
  context?: ErrorContext
): void {
  if (!config.enabled) return;
  if (!shouldSampleError()) return;

  const trackedError = serializeError(error, severity, context);
  reportToService(trackedError);
}

/**
 * Report a React error boundary error
 *
 * @param error - Error thrown by React component
 * @param errorInfo - React error info with component stack
 * @param context - Additional context metadata
 */
export function reportReactError(
  error: Error,
  errorInfo: ErrorInfo,
  context?: ErrorContext
): void {
  if (!config.enabled) return;
  if (!shouldSampleError()) return;

  const trackedError = serializeError(error, 'error', context);
  trackedError.componentStack = errorInfo.componentStack || undefined;

  reportToService(trackedError);
}

/**
 * Global error handler for uncaught errors
 */
function handleGlobalError(event: ErrorEvent): void {
  if (!config.enabled) return;
  if (!shouldSampleError()) return;

  const error = event.error || new Error(event.message);
  const trackedError = serializeError(error, 'error', {
    type: 'uncaught-error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });

  reportToService(trackedError);
}

/**
 * Global handler for unhandled promise rejections
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  if (!config.enabled) return;
  if (!shouldSampleError()) return;

  // Convert rejection reason to Error if it's not already
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  const trackedError = serializeError(error, 'error', {
    type: 'unhandled-rejection'
  });

  reportToService(trackedError);
}

/**
 * Initialize error tracking
 * Sets up global error handlers and configures error tracking
 *
 * @param userConfig - Optional configuration overrides
 *
 * @example
 * ```typescript
 * // In main.tsx
 * initErrorTracking({
 *   enabled: true,
 *   sampleRate: 1.0,
 *   onError: (error) => {
 *     // Custom error handling
 *     console.log('Error occurred:', error.message);
 *   }
 * });
 * ```
 */
export function initErrorTracking(userConfig?: ErrorTrackingConfig): void {
  // Merge user config with defaults
  config = {
    ...DEFAULT_CONFIG,
    ...userConfig
  };

  if (!config.enabled) {
    console.info('[Error Tracking] Disabled');
    return;
  }

  // Register global error handler
  window.addEventListener('error', handleGlobalError);

  // Register unhandled promise rejection handler
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  if (config.debug) {
    console.info('[Error Tracking] Initialized', {
      enabled: config.enabled,
      sampleRate: config.sampleRate,
      debug: config.debug
    });
  }
}

/**
 * Clean up error tracking
 * Removes global error handlers
 */
export function cleanupErrorTracking(): void {
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  if (config.debug) {
    console.info('[Error Tracking] Cleaned up');
  }
}

/**
 * Get current error tracking configuration
 */
export function getErrorTrackingConfig(): Required<ErrorTrackingConfig> {
  return { ...config };
}

/**
 * Update error tracking configuration
 */
export function updateErrorTrackingConfig(updates: Partial<ErrorTrackingConfig>): void {
  config = {
    ...config,
    ...updates
  };

  if (config.debug) {
    console.info('[Error Tracking] Configuration updated', config);
  }
}
