/**
 * Global test setup file for Vitest
 *
 * This file is loaded before all tests and configures the testing environment
 * with necessary polyfills, mocks, and utilities.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Cleanup after each test
 *
 * Automatically unmount React components and clean up the DOM after each test
 * to prevent test pollution and memory leaks.
 */
afterEach(() => {
  cleanup();
});

/**
 * Mock IntersectionObserver
 *
 * IntersectionObserver is not available in jsdom, so we provide a minimal mock
 * for components that use it (e.g., for lazy loading or scroll detection).
 */
if (!global.IntersectionObserver) {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
}

/**
 * Mock ResizeObserver
 *
 * ResizeObserver is not available in jsdom, so we provide a minimal mock
 * for components that use it (e.g., for responsive layouts).
 */
if (!global.ResizeObserver) {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;
}

/**
 * Mock window.matchMedia
 *
 * matchMedia is not fully implemented in jsdom, so we provide a mock
 * for components that use media queries (e.g., for responsive design).
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

/**
 * Suppress console errors in tests
 *
 * This helps keep test output clean. Remove or modify if you need to debug
 * console errors during test development.
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React 18 act() warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
