/**
 * AppShell Component - StreamFlow PM Design System
 *
 * Top-level application layout providing consistent navigation and structure.
 *
 * @example
 * ```tsx
 * <AppShell>
 *   <Routes>
 *     <Route path="/" element={<Home />} />
 *     <Route path="/patterns/:id" element={<PatternPage />} />
 *   </Routes>
 * </AppShell>
 * ```
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';
import styles from './AppShell.module.css';

export interface AppShellProps {
  /**
   * Main content to render
   */
  children: ReactNode;

  /**
   * Optional custom header content
   */
  header?: ReactNode;

  /**
   * Optional custom footer content
   */
  footer?: ReactNode;

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * AppShell layout component providing consistent app structure
 */
export function AppShell({
  children,
  header,
  footer,
  className = ''
}: AppShellProps): JSX.Element {
  const classNames = [styles.appShell, className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Header */}
      {header || (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.logo}>
              <img
                src="/streamflow-logo.svg"
                alt="StreamFlow PM"
                width="32"
                height="32"
                className={styles.logoImage}
              />
              <h1 className={styles.logoText}>
                <span className={styles.logoHighlight}>StreamFlow</span> PM
              </h1>
            </Link>

            <nav className={styles.nav} aria-label="Main navigation">
              <Link to="/" className={styles.navLink}>
                Home
              </Link>
              <Link to="/patterns" className={styles.navLink}>
                Patterns
              </Link>
              <a
                href="https://github.com/vibeacademy/streaming-patterns"
                className={styles.navLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main id="main-content" className={styles.main}>
        {children}
      </main>

      {/* Footer */}
      {footer || (
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.footerText}>
              Streaming Patterns Library - Educational resource for streaming
              AI/LLM UX patterns
            </p>
            <p className={styles.footerCopy}>
              &copy; {new Date().getFullYear()} StreamFlow PM. MIT License.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
