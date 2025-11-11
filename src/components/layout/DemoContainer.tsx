/**
 * DemoContainer Component - StreamFlow PM Design System
 *
 * Container component for pattern demos with consistent layout and styling.
 *
 * @example
 * ```tsx
 * <DemoContainer
 *   title="Chain-of-Reasoning"
 *   description="Watch the AI plan a sprint with visible reasoning steps"
 * >
 *   <ReasoningBeadline reasoning={reasoning} />
 * </DemoContainer>
 * ```
 */

import { HTMLAttributes, ReactNode } from 'react';
import styles from './DemoContainer.module.css';

export interface DemoContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Demo title
   */
  title?: string;

  /**
   * Demo description
   */
  description?: string;

  /**
   * Main demo content
   */
  children: ReactNode;

  /**
   * Optional actions/controls to display in the header
   */
  actions?: ReactNode;

  /**
   * Optional className for additional styling
   */
  className?: string;

  /**
   * Maximum width of the container
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

/**
 * DemoContainer layout component for pattern demonstrations
 */
export function DemoContainer({
  title,
  description,
  children,
  actions,
  className = '',
  maxWidth = 'xl',
  ...props
}: DemoContainerProps): JSX.Element {
  const classNames = [
    styles.demoContainer,
    styles[`demoContainer--${maxWidth}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {(title || description || actions) && (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}

      <div className={styles.content}>{children}</div>
    </div>
  );
}
