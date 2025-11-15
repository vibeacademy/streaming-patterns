/**
 * PatternErrorBoundary Component - Pattern-Level Error Handler
 *
 * An error boundary specifically designed for pattern demo components.
 * Unlike the global ErrorBoundary, this provides pattern-specific error
 * handling with graceful degradation and recovery options.
 *
 * Features:
 * - Catches errors within individual pattern demos
 * - Provides pattern-specific context in error messages
 * - Offers retry functionality to recover from transient errors
 * - Allows continuing to explore other patterns when one fails
 * - Logs errors with pattern identification for debugging
 *
 * @example
 * ```tsx
 * <PatternErrorBoundary patternName="Chain-of-Reasoning">
 *   <ChainOfReasoningDemo />
 * </PatternErrorBoundary>
 * ```
 *
 * @see ErrorBoundary - For global application-level error handling
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { PatternErrorFallback } from './PatternErrorFallback';

/**
 * Props for PatternErrorBoundary component
 */
export interface PatternErrorBoundaryProps {
  /**
   * Child components to render when no error occurs
   */
  children: ReactNode;

  /**
   * Name of the pattern being demonstrated (e.g., "Chain-of-Reasoning")
   * Used in error messages and logging
   */
  patternName: string;

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
 * State for PatternErrorBoundary component
 */
interface PatternErrorBoundaryState {
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
 * Pattern-level error boundary component that catches errors in
 * individual pattern demos and provides graceful degradation.
 */
export class PatternErrorBoundary extends Component<
  PatternErrorBoundaryProps,
  PatternErrorBoundaryState
> {
  constructor(props: PatternErrorBoundaryProps) {
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
  static getDerivedStateFromError(error: Error): Partial<PatternErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been thrown.
   * Used for error logging and reporting with pattern context.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with pattern context
    console.error(`PatternErrorBoundary [${this.props.patternName}] caught error:`, {
      pattern: this.props.patternName,
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });

    // Store error info in state
    this.setState({
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Future: Send error to monitoring service with pattern tag
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, {
    //     ...errorInfo,
    //     pattern: this.props.patternName
    //   });
    // }
  }

  /**
   * Reset error boundary state to recover from error.
   * This allows users to retry the pattern demo.
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

      // Show pattern-specific fallback UI
      return (
        <PatternErrorFallback
          patternName={this.props.patternName}
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
