/**
 * ErrorBoundary Component - Global Error Handler
 *
 * A React error boundary that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire application.
 *
 * Features:
 * - Catches all React rendering errors
 * - Logs errors to console (development) and future error tracking service
 * - Shows user-friendly fallback UI
 * - Provides reset functionality to recover from errors
 * - Prevents white screen of death
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { reportReactError } from '../../lib/monitoring/errorTracking';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /**
   * Child components to render when no error occurs
   */
  children: ReactNode;

  /**
   * Optional callback when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Optional custom fallback component
   */
  fallback?: ReactNode;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /**
   * Whether an error has been caught
   */
  hasError: boolean;

  /**
   * The caught error (if any)
   */
  error: Error | null;

  /**
   * React error information (component stack trace)
   */
  errorInfo: ErrorInfo | null;
}

/**
 * Global error boundary component that catches React errors
 * and displays a fallback UI instead of crashing the app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static lifecycle method called when an error is thrown
   * during rendering. Updates state to trigger fallback UI.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been thrown.
   * Used for error logging and reporting.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });

    // Store error info in state for debugging
    this.setState({
      errorInfo
    });

    // Report error to monitoring service
    reportReactError(error, errorInfo, {
      component: 'ErrorBoundary'
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error boundary state to recover from error.
   * Allows users to try again after an error occurs.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Render children or fallback UI based on error state
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
        />
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}
