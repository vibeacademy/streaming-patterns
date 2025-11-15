/**
 * PatternErrorFallback Component - Pattern Error UI
 *
 * Displays a user-friendly error message when a pattern demo fails.
 * Provides pattern-specific context and recovery options without
 * crashing the entire application.
 *
 * Features:
 * - Pattern-specific error message
 * - Retry button to attempt recovery
 * - Link to pattern catalog to try other patterns
 * - Collapsible error details for debugging
 * - Maintains educational context
 *
 * @module components/ErrorBoundary/PatternErrorFallback
 */

import type { ErrorInfo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import styles from './ErrorBoundary.module.css';

/**
 * Props for PatternErrorFallback component
 */
export interface PatternErrorFallbackProps {
  /**
   * Name of the pattern that encountered an error
   */
  patternName: string;

  /**
   * The error that was caught
   */
  error: Error | null;

  /**
   * React error information (component stack trace)
   */
  errorInfo: ErrorInfo | null;

  /**
   * Callback to reset the error boundary and retry
   */
  onReset: () => void;
}

/**
 * Fallback UI displayed when a pattern demo encounters an error.
 * Provides recovery options without breaking the entire app.
 */
export function PatternErrorFallback({
  patternName,
  error,
  errorInfo,
  onReset
}: PatternErrorFallbackProps): JSX.Element {
  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.content}>
        {/* Icon */}
        <div className={styles.icon} aria-hidden="true">
          ⚠️
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>Pattern Demo Error</h1>

        {/* Pattern-specific message */}
        <p className={styles.message}>
          The <strong>{patternName}</strong> pattern demo encountered an error and couldn't complete.
          This is isolated to this pattern only - other patterns should still work.
        </p>

        {/* Error message (if available) */}
        {error && (
          <div className={styles.errorBox}>
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          <Button
            onClick={onReset}
            variant="primary"
            size="lg"
            aria-label={`Retry ${patternName} pattern demo`}
          >
            Retry Pattern
          </Button>
          <Link to="/patterns">
            <Button
              variant="secondary"
              size="lg"
              aria-label="Browse all patterns"
            >
              Browse All Patterns
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="ghost"
              size="lg"
              aria-label="Return to home page"
            >
              Go Home
            </Button>
          </Link>
        </div>

        {/* Collapsible error details (for developers) */}
        {(error || errorInfo) && (
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>
              Technical Details (for developers)
            </summary>
            <div className={styles.detailsContent}>
              {error && (
                <div className={styles.detailsSection}>
                  <h3>Error Message</h3>
                  <pre className={styles.code}>{error.message}</pre>
                  {error.stack && (
                    <>
                      <h3>Stack Trace</h3>
                      <pre className={styles.code}>{error.stack}</pre>
                    </>
                  )}
                </div>
              )}
              {errorInfo && errorInfo.componentStack && (
                <div className={styles.detailsSection}>
                  <h3>Component Stack</h3>
                  <pre className={styles.code}>{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Help text */}
        <p className={styles.helpText}>
          If this error persists, please{' '}
          <a
            href="https://github.com/vibeacademy/streaming-patterns/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            report it on GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
