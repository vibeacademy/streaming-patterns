/**
 * Vitest + Cucumber Setup
 *
 * Global setup for BDD specs. Runs before all tests.
 */

import { expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Global test configuration
 */

// Extend expect matchers from Testing Library
expect.extend({});

/**
 * Global lifecycle hooks
 */

beforeAll(() => {
  // Set up fake timers if needed
  // vi.useFakeTimers();

  // Configure console output
  if (process.env.VITEST_QUIET) {
    global.console = {
      ...console,
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };
  }
});

afterEach(() => {
  // Clean up React components after each test
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset modules
  vi.resetModules();
});

/**
 * Global mocks
 */

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading, scroll animations)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (for responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

/**
 * Custom test utilities
 */

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(checkCondition, interval);
      }
    };

    checkCondition();
  });
}

/**
 * Create a mock stream event
 */
export function createMockStreamEvent<T = any>(
  type: string,
  data: T,
  overrides?: Record<string, any>
) {
  return {
    type,
    data,
    timestamp: Date.now(),
    sessionId: `session-${Math.random()}`,
    ...overrides,
  };
}

/**
 * Simulate event stream
 */
export async function* simulateEventStream<T = any>(
  events: Array<{ type: string; data: T }>,
  delayMs = 100
): AsyncGenerator<{ type: string; data: T }> {
  for (const event of events) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield event;
  }
}

/**
 * Assert invariant holds
 */
export function assertInvariant(
  condition: boolean,
  invariantId: string,
  message?: string
): void {
  if (!condition) {
    throw new Error(
      `Invariant ${invariantId} violated${message ? `: ${message}` : ''}`
    );
  }
}

/**
 * Load fixture from file
 */
export async function loadFixture(fixturePath: string): Promise<any> {
  try {
    const fixture = await import(`./fixtures/${fixturePath}.json`);
    return fixture.default || fixture;
  } catch (error) {
    throw new Error(`Failed to load fixture: ${fixturePath}`);
  }
}

/**
 * Type guard utilities
 */

export function isReasoningEvent(event: any): event is { type: 'reasoning'; data: any } {
  return event.type === 'reasoning';
}

export function isAnswerEvent(event: any): event is { type: 'answer'; data: any } {
  return event.type === 'answer';
}

export function isMemoryEvent(event: any): event is { type: 'memory'; data: any } {
  return event.type === 'memory';
}

/**
 * Console utilities for debugging
 */

export function logScenarioStart(scenarioName: string): void {
  if (!process.env.VITEST_QUIET) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Scenario: ${scenarioName}`);
    console.log('='.repeat(60));
  }
}

export function logStep(stepType: 'Given' | 'When' | 'Then', stepText: string): void {
  if (!process.env.VITEST_QUIET && process.env.VITEST_VERBOSE) {
    console.log(`  ${stepType} ${stepText}`);
  }
}

/**
 * Performance utilities
 */

export function measurePerformance<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const duration = performance.now() - startTime;

  if (label && !process.env.VITEST_QUIET) {
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  if (label && !process.env.VITEST_QUIET) {
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Export global test utilities for use in step definitions
 */
export const testUtils = {
  waitForCondition,
  createMockStreamEvent,
  simulateEventStream,
  assertInvariant,
  loadFixture,
  isReasoningEvent,
  isAnswerEvent,
  isMemoryEvent,
  logScenarioStart,
  logStep,
  measurePerformance,
  measureAsyncPerformance,
};

// Make utilities available globally
(global as any).testUtils = testUtils;
