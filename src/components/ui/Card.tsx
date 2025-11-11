/**
 * Card Component - StreamFlow PM Design System
 *
 * A container component for grouping related content with optional header and footer.
 * Provides consistent spacing, borders, and shadows.
 *
 * @example
 * ```tsx
 * <Card title="Sprint Planning" footer={<Button>View Details</Button>}>
 *   <p>Sprint content goes here</p>
 * </Card>
 * ```
 */

import { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card title displayed in the header
   */
  title?: string;

  /**
   * Optional subtitle displayed below the title
   */
  subtitle?: string;

  /**
   * Content displayed in the header (overrides title/subtitle if provided)
   */
  header?: ReactNode;

  /**
   * Content displayed in the footer
   */
  footer?: ReactNode;

  /**
   * Main card content
   */
  children: ReactNode;

  /**
   * Visual variant
   * - default: Standard card with border and shadow
   * - outlined: Card with border only (no shadow)
   * - elevated: Card with larger shadow
   */
  variant?: 'default' | 'outlined' | 'elevated';

  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Card component for grouping related content
 */
export function Card({
  title,
  subtitle,
  header,
  footer,
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: CardProps): JSX.Element {
  const classNames = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--padding-${padding}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {(header || title || subtitle) && (
        <div className={styles.cardHeader}>
          {header || (
            <>
              {title && <h3 className={styles.cardTitle}>{title}</h3>}
              {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
            </>
          )}
        </div>
      )}

      <div className={styles.cardBody}>{children}</div>

      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
}
