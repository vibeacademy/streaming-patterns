/**
 * ErrorFallback Component - Error UI Display
 *
 * User-friendly fallback UI displayed when an error is caught by ErrorBoundary.
 * Shows a clear error message, optional error details, and recovery actions.
 *
 * Features:
 * - Non-technical, user-friendly error message
 * - Optional error details expansion for developers
 * - Reset button to recover from error
 * - Link to report issues on GitHub
 * - Accessible keyboard navigation and screen reader support
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={new Error('Something went wrong')}
 *   onReset={() => window.location.reload()}
 * />
 * ```
 */

import { type ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

/**
 * Props for ErrorFallback component
 */
export interface ErrorFallbackProps {
  /**
   * The error that was caught
   */
  error: Error | null;

  /**
   * React error information (component stack trace)
   */
  errorInfo?: ErrorInfo | null;

  /**
   * Callback to reset the error boundary and try again
   */
  onReset: () => void;
}

/**
 * Error icon SVG component
 */
function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/**
 * Refresh icon SVG component
 */
function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

/**
 * ErrorFallback UI component displayed when an error occurs
 */
export function ErrorFallback({
  error,
  errorInfo,
  onReset
}: ErrorFallbackProps): JSX.Element {
  // Determine if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // GitHub repository URL for issue reporting
  const githubIssueUrl = 'https://github.com/vibeacademy/streaming-patterns/issues/new';

  /**
   * Handle reset button click
   */
  const handleReset = (): void => {
    onReset();
  };

  /**
   * Reload the page as a fallback recovery mechanism
   */
  const handleReload = (): void => {
    window.location.reload();
  };

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.content}>
        {/* Error icon */}
        <div className={styles.iconWrapper}>
          <ErrorIcon className={styles.icon} />
        </div>

        {/* Error heading */}
        <h1 className={styles.heading}>Something went wrong</h1>

        {/* User-friendly error message */}
        <p className={styles.message}>
          We're sorry, but something unexpected happened. This is likely a temporary issue.
        </p>

        {/* Error details (development only) */}
        {isDevelopment && error && (
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>
              View technical details
            </summary>
            <div className={styles.detailsContent}>
              <div className={styles.errorBlock}>
                <strong>Error:</strong>
                <pre className={styles.errorPre}>{error.toString()}</pre>
              </div>
              {error.stack && (
                <div className={styles.errorBlock}>
                  <strong>Stack trace:</strong>
                  <pre className={styles.errorPre}>{error.stack}</pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div className={styles.errorBlock}>
                  <strong>Component stack:</strong>
                  <pre className={styles.errorPre}>{errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleReset}
            className={`${styles.button} ${styles['button--primary']}`}
            aria-label="Try again"
          >
            <RefreshIcon className={styles.buttonIcon} />
            Try Again
          </button>

          <button
            type="button"
            onClick={handleReload}
            className={`${styles.button} ${styles['button--secondary']}`}
            aria-label="Reload page"
          >
            Reload Page
          </button>

          <a
            href={githubIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} ${styles['button--secondary']}`}
            aria-label="Report this issue on GitHub"
          >
            Report Issue
          </a>
        </div>

        {/* Helpful tips */}
        <div className={styles.tips}>
          <p className={styles.tipsHeading}>What you can try:</p>
          <ul className={styles.tipsList}>
            <li>Click "Try Again" to reset the application</li>
            <li>Reload the page to start fresh</li>
            <li>Check your internet connection</li>
            <li>If the problem persists, report an issue on GitHub</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
