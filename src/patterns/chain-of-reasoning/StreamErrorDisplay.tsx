/**
 * StreamErrorDisplay Component
 *
 * Displays user-friendly error messages for stream failures with retry information.
 * This component provides:
 * - Clear error messages based on error type
 * - Retry status and countdown
 * - Manual retry button
 * - Collapsible technical details
 *
 * Educational Note:
 * Good error UX provides:
 * - Clear, non-technical language
 * - Actionable next steps
 * - Progress indication during retries
 * - Technical details for developers (optional)
 *
 * @module patterns/chain-of-reasoning/StreamErrorDisplay
 */

import type { StreamError as StreamErrorType } from './types';
import styles from './StreamErrorDisplay.module.css';

/**
 * Props for the StreamErrorDisplay component.
 */
export interface StreamErrorDisplayProps {
  /**
   * The error to display.
   */
  error: Error | StreamErrorType;

  /**
   * Number of retry attempts made so far.
   * @default 0
   */
  retryCount?: number;

  /**
   * Whether the stream is currently retrying.
   * @default false
   */
  isRetrying?: boolean;

  /**
   * Time in milliseconds until next retry.
   * Used to show countdown to user.
   */
  retryDelayMs?: number;

  /**
   * Maximum number of retry attempts allowed.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Callback when user clicks the retry button.
   * If not provided, retry button is not shown.
   */
  onRetry?: () => void;

  /**
   * Optional CSS class name for styling.
   */
  className?: string;
}

/**
 * Gets a user-friendly error message based on error type.
 *
 * Educational Note:
 * Error messages should be:
 * - Written for users, not developers
 * - Actionable (tell them what to do)
 * - Empathetic (acknowledge frustration)
 * - Honest (don't hide the problem)
 *
 * @param error - The error object
 * @returns User-friendly error message
 */
function getUserFriendlyMessage(error: Error | StreamErrorType): string {
  // Check if it's a typed StreamError
  if ('type' in error && typeof error.type === 'string') {
    switch (error.type) {
      case 'timeout':
        return 'The request took too long to complete. This might be due to a slow connection or server issues.';
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'stream':
        return 'The data stream was interrupted unexpectedly. This might indicate a problem with the data.';
      default:
        return 'Something went wrong while processing your request.';
    }
  }

  // Generic error message for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Gets an icon emoji based on error type.
 *
 * @param error - The error object
 * @returns Emoji representing the error type
 */
function getErrorIcon(error: Error | StreamErrorType): string {
  if ('type' in error && typeof error.type === 'string') {
    switch (error.type) {
      case 'timeout':
        return '⏱️';
      case 'network':
        return '🌐';
      case 'stream':
        return '📡';
      default:
        return '⚠️';
    }
  }
  return '⚠️';
}

/**
 * StreamErrorDisplay component.
 *
 * Shows error information with retry status and manual retry option.
 *
 * @example
 * ```tsx
 * const { error, retryCount, isRetrying, retryDelayMs } = useReasoningStream(prompt);
 *
 * if (error) {
 *   return (
 *     <StreamErrorDisplay
 *       error={error}
 *       retryCount={retryCount}
 *       isRetrying={isRetrying}
 *       retryDelayMs={retryDelayMs}
 *       maxRetries={3}
 *       onRetry={() => {
 *         // Trigger manual retry
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function StreamErrorDisplay({
  error,
  retryCount = 0,
  isRetrying = false,
  retryDelayMs,
  maxRetries = 3,
  onRetry,
  className,
}: StreamErrorDisplayProps): JSX.Element {
  const userMessage = getUserFriendlyMessage(error);
  const icon = getErrorIcon(error);
  const hasRetriesLeft = retryCount < maxRetries;

  // Calculate retry countdown in seconds for display
  const retryDelaySeconds = retryDelayMs
    ? Math.ceil(retryDelayMs / 1000)
    : 0;

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Error header */}
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        <h3 className={styles.title}>Stream Error</h3>
      </div>

      {/* User-friendly message */}
      <p className={styles.message}>{userMessage}</p>

      {/* Retry status */}
      {retryCount > 0 && (
        <div className={styles.retryStatus}>
          {isRetrying ? (
            <p className={styles.retrying}>
              Retrying automatically...
              {retryDelaySeconds > 0 && ` (${retryDelaySeconds}s)`}
            </p>
          ) : (
            <p className={styles.retryInfo}>
              Retry attempt {retryCount} of {maxRetries}
              {!hasRetriesLeft && ' - Maximum retries reached'}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {onRetry && !isRetrying && hasRetriesLeft && (
          <button
            onClick={onRetry}
            className={styles.retryButton}
            aria-label="Retry request"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Technical details (collapsible) */}
      <details className={styles.details}>
        <summary className={styles.detailsSummary}>
          Technical Details
        </summary>
        <div className={styles.detailsContent}>
          <p>
            <strong>Error Type:</strong>{' '}
            {'type' in error && typeof error.type === 'string'
              ? error.type
              : 'unknown'}
          </p>
          <p>
            <strong>Message:</strong> {error.message}
          </p>
          {error.stack && (
            <pre className={styles.stack}>{error.stack}</pre>
          )}
        </div>
      </details>
    </div>
  );
}
