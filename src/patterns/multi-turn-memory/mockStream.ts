/**
 * Multi-Turn Memory Timeline Pattern - Mock Stream Generator
 *
 * This file implements a deterministic, replayable mock stream that simulates
 * a multi-turn conversation with memory lifecycle events.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Demonstrates how to generate realistic streaming with memory events
 */

import type { StreamEvent } from './types';
import { q4PlanningConversation, shortConversation } from './fixtures';

/**
 * Stream speed controls for testing different scenarios.
 *
 * Educational Note: Different speeds help test loading states, race conditions,
 * and user experience at various network speeds.
 */
export type StreamSpeed = 'instant' | 'fast' | 'normal' | 'slow';

const SPEED_DELAYS: Record<StreamSpeed, number> = {
  instant: 0, // For testing
  fast: 50, // 50ms between events
  normal: 300, // 300ms between events (realistic)
  slow: 1000, // 1s between events (for demos)
};

/**
 * Configuration for the mock stream generator.
 */
export interface MockStreamConfig {
  /** Fixture data to stream */
  fixture?: StreamEvent[];

  /** Speed of event emission */
  speed?: StreamSpeed;

  /** Optional: Simulate network errors */
  simulateError?: boolean;

  /** Optional: Error rate (0-1) */
  errorRate?: number;
}

/**
 * Creates a mock multi-turn conversation stream with memory events.
 *
 * Educational Note: This generator demonstrates how to:
 * 1. Emit events at controlled intervals (simulating network delays)
 * 2. Maintain deterministic ordering (same input → same output)
 * 3. Support cancellation (via AbortSignal pattern)
 * 4. Provide realistic timing for UX testing
 *
 * @param config - Stream configuration
 * @returns AsyncGenerator that yields StreamEvents
 *
 * @example
 * ```typescript
 * const stream = createMockMemoryStream({ speed: 'normal' });
 * for await (const event of stream) {
 *   console.log(event.type, event.data);
 * }
 * ```
 */
export async function* createMockMemoryStream(
  config: MockStreamConfig = {}
): AsyncGenerator<StreamEvent, void, unknown> {
  const {
    fixture = q4PlanningConversation,
    speed = 'normal',
    simulateError = false,
    errorRate = 0,
  } = config;

  const delayMs = SPEED_DELAYS[speed];

  for (let i = 0; i < fixture.length; i++) {
    const event = fixture[i];

    // Simulate random errors if configured
    if (simulateError && Math.random() < errorRate) {
      throw new Error(`Simulated network error at event ${i}`);
    }

    // Wait before emitting next event (except first event)
    if (i > 0 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    yield event;
  }
}

/**
 * Creates a short test stream for fast testing.
 *
 * Educational Note: Use this for unit tests where you need deterministic
 * events but don't want to wait for realistic delays.
 */
export async function* createShortTestStream(): AsyncGenerator<
  StreamEvent,
  void,
  unknown
> {
  yield* createMockMemoryStream({
    fixture: shortConversation,
    speed: 'instant',
  });
}

/**
 * Helper to collect all events from a stream into an array.
 *
 * Educational Note: Useful for testing - converts async stream to sync array.
 *
 * @param stream - AsyncGenerator of events
 * @returns Promise resolving to array of all events
 */
export async function collectStreamEvents(
  stream: AsyncGenerator<StreamEvent, void, unknown>
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];

  for await (const event of stream) {
    events.push(event);
  }

  return events;
}

/**
 * Creates a paused stream that can be manually advanced.
 *
 * Educational Note: This is useful for step-by-step debugging or
 * testing specific event sequences in isolation.
 */
export class ManualStreamController {
  private events: StreamEvent[];
  private currentIndex = 0;
  private listeners: Set<(event: StreamEvent) => void> = new Set();

  constructor(fixture: StreamEvent[] = q4PlanningConversation) {
    this.events = [...fixture];
  }

  /**
   * Advance to the next event and notify listeners.
   */
  next(): StreamEvent | null {
    if (this.currentIndex >= this.events.length) {
      return null;
    }

    const event = this.events[this.currentIndex];
    this.currentIndex++;

    // Notify all listeners
    this.listeners.forEach((listener) => listener(event));

    return event;
  }

  /**
   * Subscribe to events.
   */
  subscribe(listener: (event: StreamEvent) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Reset to the beginning.
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Check if there are more events.
   */
  hasNext(): boolean {
    return this.currentIndex < this.events.length;
  }

  /**
   * Get remaining event count.
   */
  remaining(): number {
    return this.events.length - this.currentIndex;
  }
}
