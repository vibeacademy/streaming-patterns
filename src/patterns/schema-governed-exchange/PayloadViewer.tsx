/**
 * PayloadViewer Component
 *
 * Displays streaming JSON payload with syntax highlighting and validation indicators.
 */

import type { ValidationError } from './types';
import styles from './PayloadViewer.module.css';

export interface PayloadViewerProps {
  payload: Record<string, unknown>;
  errors: ValidationError[];
  isComplete: boolean;
}

export function PayloadViewer({ payload, errors, isComplete }: PayloadViewerProps) {
  const errorsByField = new Map(errors.map((e) => [e.field, e]));
  const isEmpty = Object.keys(payload).length === 0;

  if (isEmpty) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          ⋯
        </span>
        <p>Waiting for payload...</p>
      </div>
    );
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Payload</h3>
        <span className={`${styles.status} ${isComplete ? styles.statusComplete : styles.statusStreaming}`}>
          {isComplete ? '✓ Complete' : '⋯ Streaming'}
        </span>
      </div>

      <div className={styles.content}>
        <pre className={styles.json}>
          <code>{renderPayload(payload, errorsByField, 0)}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Render payload with error highlighting
 */
function renderPayload(
  obj: Record<string, unknown>,
  errors: Map<string, ValidationError>,
  depth: number
): JSX.Element[] {
  const indent = '  '.repeat(depth);
  const elements: JSX.Element[] = [];
  const entries = Object.entries(obj);

  elements.push(
    <span key="open-brace" className={styles.punctuation}>
      {'{'}
      {'\n'}
    </span>
  );

  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    const hasError = errors.has(key);
    const error = errors.get(key);

    elements.push(
      <span key={`line-${key}`} className={hasError ? styles.errorLine : ''}>
        <span className={styles.indent}>{indent}  </span>
        <span className={`${styles.key} ${hasError ? styles.keyError : ''}`}>"{key}"</span>
        <span className={styles.punctuation}>: </span>
        {renderValue(value, `${key}.`, errors, depth + 1)}
        {!isLast && <span className={styles.punctuation}>,</span>}
        {hasError && (
          <span className={styles.errorIndicator} title={error?.message}>
            {' '}⚠
          </span>
        )}
        {'\n'}
      </span>
    );
  });

  elements.push(
    <span key="close-brace" className={styles.punctuation}>
      {indent}
      {'}'}
    </span>
  );

  return elements;
}

/**
 * Render individual value with appropriate styling
 */
function renderValue(
  value: unknown,
  parentPath: string,
  errors: Map<string, ValidationError>,
  depth: number
): JSX.Element | string {
  if (value === null) {
    return <span className={styles.valueNull}>null</span>;
  }

  if (value === undefined) {
    return <span className={styles.valueUndefined}>undefined</span>;
  }

  if (typeof value === 'boolean') {
    return <span className={styles.valueBoolean}>{String(value)}</span>;
  }

  if (typeof value === 'number') {
    return <span className={styles.valueNumber}>{value}</span>;
  }

  if (typeof value === 'string') {
    return <span className={styles.valueString}>"{value}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className={styles.punctuation}>[]</span>;
    }

    return (
      <span>
        <span className={styles.punctuation}>[</span>
        {value.map((item, i) => (
          <span key={i}>
            {renderValue(item, `${parentPath}[${i}].`, errors, depth)}
            {i < value.length - 1 && <span className={styles.punctuation}>, </span>}
          </span>
        ))}
        <span className={styles.punctuation}>]</span>
      </span>
    );
  }

  if (typeof value === 'object') {
    return <span>{renderPayload(value as Record<string, unknown>, errors, depth)}</span>;
  }

  return String(value);
}
