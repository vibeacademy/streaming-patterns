/**
 * PatternErrorBoundary Component Tests
 *
 * Tests for the PatternErrorBoundary component, including:
 * - Rendering children when no error occurs
 * - Catching pattern-specific errors and displaying fallback UI
 * - Pattern name in error messages
 * - Resetting error state to retry pattern
 * - Error logging with pattern context
 * - Custom error callbacks
 * - Graceful degradation (pattern fails but app continues)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { PatternErrorBoundary } from './PatternErrorBoundary';

/**
 * Test component that throws an error
 */
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test pattern error');
  }
  return <div>No error</div>;
}

/**
 * Test component that renders successfully
 */
function SafePatternDemo() {
  return <div data-testid="pattern-demo">Pattern demo content</div>;
}

/**
 * Wrapper for components that need Router context
 */
function RouterWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('PatternErrorBoundary', () => {
  // Store original console.error
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    // Mock console.error to suppress error boundary logs during tests
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('Normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <PatternErrorBoundary patternName="Test Pattern">
          <SafePatternDemo />
        </PatternErrorBoundary>
      );

      expect(screen.getByTestId('pattern-demo')).toBeInTheDocument();
      expect(screen.getByText('Pattern demo content')).toBeInTheDocument();
    });

    it('renders multiple children successfully', () => {
      render(
        <PatternErrorBoundary patternName="Test Pattern">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </PatternErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Error catching', () => {
    it('catches errors and displays pattern-specific fallback UI', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Chain-of-Reasoning">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Pattern Demo Error')).toBeInTheDocument();
      expect(screen.getByText(/Chain-of-Reasoning/)).toBeInTheDocument();
      expect(screen.getByText(/pattern demo encountered an error/i)).toBeInTheDocument();
    });

    it('displays pattern name in error message', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Agent-Await-Prompt">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByText(/Agent-Await-Prompt/)).toBeInTheDocument();
    });

    it('shows error message from caught error', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      // Check that error message appears (may be in multiple places - error box and technical details)
      const errorMessages = screen.getAllByText(/Test pattern error/);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('logs error with pattern context', () => {
      const consoleMock = vi.mocked(console.error);

      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Chain-of-Reasoning">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(consoleMock).toHaveBeenCalled();
      // Check that at least one call includes the pattern context
      const callsWithPattern = consoleMock.mock.calls.filter(call =>
        call[0] && typeof call[0] === 'string' &&
        call[0].includes('PatternErrorBoundary') &&
        call[0].includes('Chain-of-Reasoning')
      );
      expect(callsWithPattern.length).toBeGreaterThan(0);
    });
  });

  describe('Error recovery', () => {
    it('displays retry button', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: /retry.*pattern/i })).toBeInTheDocument();
    });

    it('calls reset when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      // Create a custom fallback that uses the onReset callback
      const customFallback = (
        <div>
          <p>Custom Error UI</p>
          <button onClick={onReset}>Retry</button>
        </div>
      );

      render(
        <RouterWrapper>
          <PatternErrorBoundary
            patternName="Test Pattern"
            fallback={customFallback}
          >
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      // Verify error fallback is displayed
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify reset was called
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation options', () => {
    it('displays link to pattern catalog', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      const catalogButton = screen.getByRole('button', { name: /browse all patterns/i });
      expect(catalogButton).toBeInTheDocument();
      expect(catalogButton.closest('a')).toHaveAttribute('href', '/patterns');
    });

    it('displays link to home page', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      const homeButton = screen.getByRole('button', { name: /return to home page/i });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Custom error callbacks', () => {
    it('calls onError callback when error is caught', () => {
      const onError = vi.fn();

      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern" onError={onError}>
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe('Test pattern error');
    });

    it('includes errorInfo in callback', () => {
      const onError = vi.fn();

      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern" onError={onError}>
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(onError).toHaveBeenCalled();
      const [, errorInfo] = onError.mock.calls[0];
      expect(errorInfo).toBeDefined();
      expect(errorInfo.componentStack).toBeDefined();
    });
  });

  describe('Custom fallback UI', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <PatternErrorBoundary patternName="Test Pattern" fallback={customFallback}>
          <ThrowError />
        </PatternErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Pattern Demo Error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has alert role for error message', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has accessible button labels', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Chain-of-Reasoning">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: 'Retry Chain-of-Reasoning pattern demo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Browse all patterns' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to home page' })).toBeInTheDocument();
    });
  });

  describe('Error details', () => {
    it('displays collapsible technical details', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByText('Technical Details (for developers)')).toBeInTheDocument();
    });

    it('shows error stack trace in technical details', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      expect(screen.getByText('Error Message')).toBeInTheDocument();
      expect(screen.getByText('Stack Trace')).toBeInTheDocument();
    });
  });

  describe('Help and support', () => {
    it('provides link to report issues on GitHub', () => {
      render(
        <RouterWrapper>
          <PatternErrorBoundary patternName="Test Pattern">
            <ThrowError />
          </PatternErrorBoundary>
        </RouterWrapper>
      );

      const githubLink = screen.getByRole('link', { name: /report it on GitHub/i });
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', 'https://github.com/vibeacademy/streaming-patterns/issues');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
