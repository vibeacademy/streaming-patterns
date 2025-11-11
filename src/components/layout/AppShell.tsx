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
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header */}
      {header || (
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="8" fill="#3B82F6" />
                <path
                  d="M16 8L8 12V20L16 24L24 20V12L16 8Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <path
                  d="M16 12L12 14V18L16 20L20 18V14L16 12Z"
                  fill="#3B82F6"
                />
              </svg>
              <h1 className={styles.logoText}>
                <span className={styles.logoHighlight}>StreamFlow</span> PM
              </h1>
            </div>

            <nav className={styles.nav} aria-label="Main navigation">
              <a href="/" className={styles.navLink}>
                Home
              </a>
              <a href="/patterns" className={styles.navLink}>
                Patterns
              </a>
              <a
                href="https://github.com/vibeacademy/streaming-patterns"
                className={styles.navLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
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
