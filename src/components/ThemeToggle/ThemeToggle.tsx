/**
 * ThemeToggle Component - StreamFlow PM Design System
 *
 * A button that toggles between light and dark themes with visual feedback.
 * Includes icons, smooth transitions, and accessibility support.
 *
 * Features:
 * - Sun/moon icons for light/dark themes
 * - Tooltip showing current theme
 * - Keyboard accessible
 * - ARIA labels for screen readers
 * - Smooth icon transition animation
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */

import { useTheme } from '../../lib/hooks/useTheme';
import styles from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  /**
   * Optional className for additional styling
   */
  className?: string;

  /**
   * Show text label alongside icon
   * @default false
   */
  showLabel?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Sun icon for light mode
 */
function SunIcon({ className = '' }: { className?: string }) {
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
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ className = '' }: { className?: string }) {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * ThemeToggle button component
 */
export function ThemeToggle({
  className = '',
  showLabel = false,
  size = 'md'
}: ThemeToggleProps): JSX.Element {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const classNames = [
    styles.toggle,
    styles[`toggle--${size}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const displayLabel = isDark ? 'Dark' : 'Light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={classNames}
      aria-label={label}
      title={label}
    >
      <span className={styles.iconWrapper}>
        {isDark ? (
          <MoonIcon className={styles.icon} />
        ) : (
          <SunIcon className={styles.icon} />
        )}
      </span>
      {showLabel && <span className={styles.label}>{displayLabel}</span>}
    </button>
  );
}
