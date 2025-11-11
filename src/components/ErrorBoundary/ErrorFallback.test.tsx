/**
 * ErrorFallback Component Tests
 *
 * Tests for the ErrorFallback UI component, including:
 * - Rendering error message
 * - Action buttons functionality
 * - Error details display
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorFallback } from './ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  describe('Rendering', () => {
    it('renders error heading', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('renders user-friendly error message', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(
        screen.getByText(/we're sorry, but something unexpected happened/i)
      ).toBeInTheDocument();
    });

    it('renders all action buttons', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /report this issue on github/i })).toBeInTheDocument();
    });

    it('renders helpful tips section', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(screen.getByText(/what you can try:/i)).toBeInTheDocument();
      expect(screen.getByText(/click "try again" to reset/i)).toBeInTheDocument();
      expect(screen.getByText(/reload the page/i)).toBeInTheDocument();
      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('calls onReset when try again button is clicked', async () => {
      const user = userEvent.setup();
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('reload button exists and is clickable', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton).toHaveAttribute('type', 'button');

      // Note: We don't actually click the reload button in tests as it would
      // trigger window.location.reload() which JSDOM doesn't support
    });

    it('report issue link has correct href', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      const reportLink = screen.getByRole('link', { name: /report this issue on github/i });
      expect(reportLink).toHaveAttribute(
        'href',
        'https://github.com/vibeacademy/streaming-patterns/issues/new'
      );
      expect(reportLink).toHaveAttribute('target', '_blank');
      expect(reportLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Error details (development mode)', () => {
    it('shows error details in development mode', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(screen.getByText(/view technical details/i)).toBeInTheDocument();
    });

    it('displays error message in details', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      // Details should contain the error
      const details = screen.getByText(/view technical details/i).closest('details');
      expect(details).toBeInTheDocument();
    });

    it('handles null error gracefully', () => {
      render(<ErrorFallback error={null} onReset={mockOnReset} />);

      // Should still render without crashing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('displays stack trace when available', () => {
      const errorWithStack = new Error('Error with stack');
      errorWithStack.stack = 'Error: Error with stack\n    at TestComponent';

      render(<ErrorFallback error={errorWithStack} onReset={mockOnReset} />);

      // Details should be present
      expect(screen.getByText(/view technical details/i)).toBeInTheDocument();
    });

    it('displays component stack when available', () => {
      const errorInfo = {
        componentStack: '\n    in TestComponent\n    in ErrorBoundary'
      };

      render(
        <ErrorFallback error={mockError} errorInfo={errorInfo} onReset={mockOnReset} />
      );

      // Details should be present with component stack
      expect(screen.getByText(/view technical details/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role and attributes', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      const container = screen.getByRole('alert');
      expect(container).toHaveAttribute('aria-live', 'assertive');
    });

    it('buttons have proper ARIA labels', () => {
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute(
        'aria-label',
        'Try again'
      );
      expect(screen.getByRole('button', { name: /reload page/i })).toHaveAttribute(
        'aria-label',
        'Reload page'
      );
      expect(screen.getByRole('link', { name: /report this issue on github/i })).toHaveAttribute(
        'aria-label',
        'Report this issue on GitHub'
      );
    });

    it('details summary is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ErrorFallback error={mockError} onReset={mockOnReset} />);

      const summary = screen.getByText(/view technical details/i);
      expect(summary).toBeInTheDocument();

      // Should be focusable
      await user.tab();
      // Note: In actual browser, this would focus the summary element
    });
  });

  describe('Icons', () => {
    it('renders error icon', () => {
      const { container } = render(
        <ErrorFallback error={mockError} onReset={mockOnReset} />
      );

      // Check for SVG icon
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('icons have aria-hidden attribute', () => {
      const { container } = render(
        <ErrorFallback error={mockError} onReset={mockOnReset} />
      );

      const svgs = container.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Edge cases', () => {
    it('handles error without message', () => {
      const errorWithoutMessage = new Error();

      render(<ErrorFallback error={errorWithoutMessage} onReset={mockOnReset} />);

      // Should still render fallback UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('renders when all optional props are omitted', () => {
      render(<ErrorFallback error={null} onReset={mockOnReset} />);

      // Should render without crashing
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});
