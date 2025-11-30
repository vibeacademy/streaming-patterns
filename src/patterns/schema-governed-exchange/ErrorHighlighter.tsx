/**
 * ErrorHighlighter Component
 *
 * Displays validation errors with field highlights and auto-fix suggestions.
 */

import type { ValidationError } from './types';
import { useAutoFixSuggestions } from './hooks';
import styles from './ErrorHighlighter.module.css';

export interface ErrorHighlighterProps {
  errors: ValidationError[];
  onHighlightField?: (field?: string) => void;
}

export function ErrorHighlighter({ errors, onHighlightField }: ErrorHighlighterProps) {
  useAutoFixSuggestions(errors); // Suggestions are displayed from error.suggestion directly

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="alert" aria-live="polite">
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          ⚠
        </span>
        <h3 className={styles.title}>
          Validation Errors ({errors.length})
        </h3>
      </div>

      <div className={styles.errorList}>
        {errors.map((error, index) => (
          <button
            key={`${error.field}-${index}`}
            className={`${styles.error} ${styles[`error--${error.severity}`]}`}
            onMouseEnter={() => onHighlightField?.(error.field)}
            onMouseLeave={() => onHighlightField?.(undefined)}
            onFocus={() => onHighlightField?.(error.field)}
            onBlur={() => onHighlightField?.(undefined)}
            type="button"
          >
            <div className={styles.errorHeader}>
              <code className={styles.field}>{error.field}</code>
              <span className={styles.severity}>{error.severity}</span>
            </div>

            <p className={styles.message}>{error.message}</p>

            {error.suggestion && (
              <div className={styles.suggestion}>
                <span className={styles.suggestionText}>
                  <strong>Suggestion:</strong> {error.suggestion}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
