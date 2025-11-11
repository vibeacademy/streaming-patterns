/**
 * Spinner Component - StreamFlow PM Design System
 *
 * A loading indicator component with multiple sizes and variants.
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 * <Spinner size="lg" label="Loading sprint data..." />
 * ```
 */

import { HTMLAttributes } from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Color variant
   */
  variant?: 'primary' | 'secondary' | 'neutral';

  /**
   * Optional label for accessibility and display
   */
  label?: string;

  /**
   * Whether to show the label text
   */
  showLabel?: boolean;

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Spinner component for loading states
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  showLabel = false,
  className = '',
  ...props
}: SpinnerProps): JSX.Element {
  const containerClassNames = [
    styles.spinnerContainer,
    showLabel ? styles['spinnerContainer--with-label'] : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerClassNames = [
    styles.spinner,
    styles[`spinner--${size}`],
    styles[`spinner--${variant}`]
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClassNames}
      role="status"
      aria-label={label}
      {...props}
    >
      <svg
        className={spinnerClassNames}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.spinnerCircle}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && <span className={styles.label}>{label}</span>}
      {!showLabel && <span className="sr-only">{label}</span>}
    </div>
  );
}
