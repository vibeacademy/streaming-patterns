/**
 * Badge Component - StreamFlow PM Design System
 *
 * A small label component for displaying status, priority, or labels.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning" size="sm">P1</Badge>
 * ```
 */

import { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual variant
   * - primary: Blue (default, general purpose)
   * - secondary: Purple (secondary information)
   * - success: Green (completed, success states)
   * - warning: Yellow (warnings, medium priority)
   * - error: Red (errors, high priority)
   * - neutral: Gray (inactive, low priority)
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Badge content
   */
  children: ReactNode;

  /**
   * Optional className for additional styling
   */
  className?: string;

  /**
   * Whether the badge should have a dot indicator
   */
  dot?: boolean;
}

/**
 * Badge component for status and labels
 */
export function Badge({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}: BadgeProps): JSX.Element {
  const classNames = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    dot ? styles['badge--with-dot'] : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
