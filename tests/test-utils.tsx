/**
 * Test utilities for React Testing Library
 *
 * Provides custom render functions and wrappers with necessary providers
 * for testing components that use context providers like HelmetProvider.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';

/**
 * All Providers wrapper component
 *
 * Wraps children with all necessary providers for testing:
 * - HelmetProvider for meta tag management
 * - Add more providers as needed (Router, Theme, etc.)
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <HelmetProvider>{children}</HelmetProvider>;
}

/**
 * Custom render function that wraps components with providers
 *
 * Use this instead of Testing Library's render() when testing components
 * that use PatternHelmet or other provider-dependent features.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from 'tests/test-utils';
 *
 * test('renders pattern with meta tags', () => {
 *   renderWithProviders(<ChainOfReasoningDemo />);
 *   expect(screen.getByText(/chain-of-reasoning/i)).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from Testing Library
export * from '@testing-library/react';

// Override render with our custom version
export { renderWithProviders as render };
