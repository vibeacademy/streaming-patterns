/**
 * Button Component - StreamFlow PM Design System
 *
 * A versatile button component supporting multiple variants and sizes.
 * Fully accessible with keyboard navigation and ARIA attributes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Create Sprint
 * </Button>
 * ```
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   * - primary: Main action button (filled, high emphasis)
   * - secondary: Secondary actions (outlined, medium emphasis)
   * - ghost: Tertiary actions (text only, low emphasis)
   * - danger: Destructive actions (filled, red, high emphasis)
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

  /**
   * Size of the button
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether the button should take full width of its container
   */
  fullWidth?: boolean;

  /**
   * Loading state - shows spinner and disables interaction
   */
  loading?: boolean;

  /**
   * Button content
   */
  children: ReactNode;

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Button component with multiple variants and accessibility support
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth ? styles['button--full-width'] : '',
    loading ? styles['button--loading'] : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className={styles.spinnerIcon}>
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={styles.spinnerCircle}
            />
          </svg>
        </span>
      )}
      <span className={loading ? styles.buttonContentHidden : ''}>
        {children}
      </span>
    </button>
  );
}
