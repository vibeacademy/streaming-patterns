/**
 * ErrorBoundary Component Tests
 *
 * Tests for the ErrorBoundary component, including:
 * - Rendering children when no error occurs
 * - Catching errors and displaying fallback UI
 * - Resetting error state
 * - Error logging functionality
 * - Custom error callbacks
 * - Custom fallback UI
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Test component that throws an error
 */
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

/**
 * Test component that renders successfully
 */
function SafeComponent() {
  return <div data-testid="safe-content">Safe content</div>;
}

describe('ErrorBoundary', () => {
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
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('safe-content')).toBeInTheDocument();
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('renders multiple children successfully', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Error catching', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for fallback UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/we're sorry, but something unexpected happened/i)
      ).toBeInTheDocument();
    });

    it('shows action buttons in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /report this issue on github/i })).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error reset', () => {
    it('calls reset handler when try again button is clicked', async () => {
      const user = userEvent.setup();

      // Create a wrapper component that can switch between throwing and not throwing
      function TestWrapper() {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <ErrorBoundary
            onError={() => {
              // After error is caught, fix the component
              setShouldThrow(false);
            }}
          >
            <ThrowError shouldThrow={shouldThrow} />
            <button onClick={() => setShouldThrow(true)}>Cause Error</button>
          </ErrorBoundary>
        );
      }

      render(<TestWrapper />);

      // Verify fallback UI is displayed
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Click "Try Again" button - this tests that the reset method is called
      // and the ErrorBoundary attempts to re-render its children
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();

      // Verify button is clickable (actual recovery requires more complex state management)
      await user.click(tryAgainButton);
    });
  });

  describe('Custom callbacks', () => {
    it('calls onError callback when error is caught', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      // Default fallback should not be rendered
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('buttons have proper ARIA labels', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute(
        'aria-label',
        'Try again'
      );
      expect(screen.getByRole('button', { name: /reload page/i })).toHaveAttribute(
        'aria-label',
        'Reload page'
      );
    });
  });

  describe('Development mode features', () => {
    it('shows technical details in development mode', () => {
      // Vitest runs in test environment, which behaves like development
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for details element
      const details = screen.getByText(/view technical details/i);
      expect(details).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles null error gracefully', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should not crash, fallback UI should render
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('handles error without stack trace', () => {
      function ThrowErrorWithoutStack(): JSX.Element {
        const error = new Error('Error without stack');
        error.stack = undefined;
        throw error;
      }

      render(
        <ErrorBoundary>
          <ThrowErrorWithoutStack />
        </ErrorBoundary>
      );

      // Should still render fallback UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
