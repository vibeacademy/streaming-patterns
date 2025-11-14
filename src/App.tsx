/**
 * App component - Root component for the Streaming Patterns library
 *
 * This is the main entry point for the educational pattern library
 * demonstrating streaming AI/LLM UX patterns for the StreamFlow PM product.
 *
 * Implements React Router for navigation with lazy loading of pattern demos.
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Spinner } from './components/ui/Spinner';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { PatternErrorBoundary } from './components/ErrorBoundary/PatternErrorBoundary';
import { Home } from './pages/Home';
import { Patterns } from './pages/Patterns';

/**
 * Lazy-loaded pattern demo components
 * This improves initial load time and code splitting
 */
const ChainOfReasoningDemo = lazy(
  () =>
    import('./patterns/chain-of-reasoning/ChainOfReasoningDemo').then(
      (module) => ({
        default: module.ChainOfReasoningDemo
      })
    )
);

/**
 * Loading fallback component
 * Displayed while lazy-loaded components are being fetched
 */
function LoadingFallback(): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}
    >
      <Spinner size="lg" />
    </div>
  );
}

/**
 * Not Found (404) page
 */
function NotFound(): JSX.Element {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        maxWidth: '600px',
        margin: '0 auto'
      }}
    >
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#6b7280' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        The pattern you're looking for doesn't exist or hasn't been implemented
        yet.
      </p>
      <Link
        to="/"
        style={{
          color: '#3b82f6',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}

/**
 * Main App component with routing
 *
 * Wrapped with ErrorBoundary to catch and handle any React errors
 * that occur during rendering, preventing white screen of death.
 */
function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Home page */}
              <Route path="/" element={<Home />} />

              {/* Patterns directory */}
              <Route path="/patterns" element={<Patterns />} />

              {/* Chain-of-Reasoning Pattern Demo */}
              <Route
                path="/patterns/chain-of-reasoning"
                element={
                  <PatternErrorBoundary patternName="Chain-of-Reasoning">
                    <ChainOfReasoningDemo />
                  </PatternErrorBoundary>
                }
              />

              {/* Redirect old routes to new structure */}
              <Route path="/chain-of-reasoning" element={<Navigate to="/patterns/chain-of-reasoning" replace />} />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
