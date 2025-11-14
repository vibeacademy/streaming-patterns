/**
 * PatternErrorFallback Component Tests
 *
 * Tests for the PatternErrorFallback UI component, including:
 * - Pattern name display
 * - Error message rendering
 * - Recovery actions (retry, browse patterns, go home)
 * - Technical details display
 * - Accessibility features
 * - Help and support links
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { PatternErrorFallback } from './PatternErrorFallback';
import type { ErrorInfo } from 'react';

/**
 * Wrapper for components that need Router context
 */
function RouterWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('PatternErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockErrorInfo: ErrorInfo = {
    componentStack: 'at ComponentName\nat AnotherComponent'
  };
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  describe('Basic rendering', () => {
    it('renders with pattern name', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Chain-of-Reasoning"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/Chain-of-Reasoning/)).toBeInTheDocument();
    });

    it('displays pattern demo error heading', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Pattern Demo Error')).toBeInTheDocument();
    });

    it('explains error is isolated to pattern only', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/isolated to this pattern only/i)).toBeInTheDocument();
      expect(screen.getByText(/other patterns should still work/i)).toBeInTheDocument();
    });
  });

  describe('Error information', () => {
    it('displays error message when provided', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      // Check for error message in the error box (not technical details)
      const errorBox = screen.getByText((content, element) => {
        return !!(element?.className.includes('errorBox') && content.includes('Test error message'));
      });
      expect(errorBox).toBeInTheDocument();
    });

    it('handles null error gracefully', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={null}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      expect(screen.getByText('Pattern Demo Error')).toBeInTheDocument();
    });

    it('handles null errorInfo gracefully', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={null}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Pattern Demo Error')).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('renders retry button with pattern name', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Chain-of-Reasoning"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const retryButton = screen.getByRole('button', {
        name: 'Retry Chain-of-Reasoning pattern demo'
      });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveTextContent('Retry Pattern');
    });

    it('calls onReset when retry button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry.*pattern/i });
      await user.click(retryButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('renders browse patterns button with link', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const browseButton = screen.getByRole('button', { name: 'Browse all patterns' });
      expect(browseButton).toBeInTheDocument();
      expect(browseButton.closest('a')).toHaveAttribute('href', '/patterns');
    });

    it('renders go home button with link', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const homeButton = screen.getByRole('button', { name: 'Return to home page' });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Technical details', () => {
    it('displays collapsible technical details section', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Technical Details (for developers)')).toBeInTheDocument();
    });

    it('shows error message in technical details', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Error Message')).toBeInTheDocument();
      // Get all instances and check that at least one is in the technical details
      const errorMessages = screen.getAllByText('Test error message');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('shows stack trace when available', () => {
      const errorWithStack = new Error('Error with stack');
      errorWithStack.stack = 'Error: Error with stack\nat SpecificComponent\nat App';

      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={errorWithStack}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Stack Trace')).toBeInTheDocument();
      expect(screen.getByText(/at SpecificComponent/)).toBeInTheDocument();
    });

    it('shows component stack from errorInfo', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText('Component Stack')).toBeInTheDocument();
      expect(screen.getByText(/at ComponentName/)).toBeInTheDocument();
    });

    it('hides technical details section when no error or errorInfo', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={null}
            errorInfo={null}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.queryByText('Technical Details (for developers)')).not.toBeInTheDocument();
    });
  });

  describe('Help and support', () => {
    it('provides help text with GitHub link', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByText(/if this error persists/i)).toBeInTheDocument();
      const githubLink = screen.getByRole('link', { name: /report it on GitHub/i });
      expect(githubLink).toBeInTheDocument();
    });

    it('GitHub link opens in new tab with security attributes', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const githubLink = screen.getByRole('link', { name: /report it on GitHub/i });
      expect(githubLink).toHaveAttribute('href', 'https://github.com/vibeacademy/streaming-patterns/issues');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Accessibility', () => {
    it('has alert role', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has accessible button labels', () => {
      render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Chain-of-Reasoning"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      expect(screen.getByRole('button', { name: 'Retry Chain-of-Reasoning pattern demo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Browse all patterns' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Return to home page' })).toBeInTheDocument();
    });

    it('icon is hidden from screen readers', () => {
      const { container } = render(
        <RouterWrapper>
          <PatternErrorFallback
            patternName="Test Pattern"
            error={mockError}
            errorInfo={mockErrorInfo}
            onReset={mockOnReset}
          />
        </RouterWrapper>
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveTextContent('⚠️');
    });
  });
});
