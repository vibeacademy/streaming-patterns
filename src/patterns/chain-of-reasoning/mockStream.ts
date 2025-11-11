/**
 * Mock stream generator for the Chain-of-Reasoning pattern.
 *
 * This module provides an AsyncGenerator that simulates streaming reasoning
 * events from an AI/LLM backend. The streams are:
 * - Deterministic (same prompt = same output)
 * - Replayable (for demos and testing)
 * - Configurable (speed control for educational purposes)
 *
 * The mock stream does NOT make real API calls - it uses fixture data to
 * demonstrate the streaming UX pattern without backend dependencies.
 *
 * @module patterns/chain-of-reasoning/mockStream
 */

import type { StreamEvent, ReasoningStreamConfig } from './types';
import { getFixtureForPrompt } from './fixtures';

/**
 * Delay configuration for different stream speeds.
 *
 * These delays simulate network latency and give users time to observe
 * the streaming behavior in educational demos.
 */
const SPEED_DELAYS = {
  /** Fast mode for quick demos and testing (50ms between events) */
  fast: 50,
  /** Normal mode for realistic streaming timing (300ms between events) */
  normal: 300,
  /** Slow mode for detailed observation and screenshots (1000ms between events) */
  slow: 1000,
} as const;

/**
 * Creates an async generator that streams mock reasoning events.
 *
 * This generator simulates the behavior of a real LLM streaming API by:
 * 1. Selecting appropriate fixture data based on the prompt
 * 2. Yielding events one at a time with realistic delays
 * 3. Allowing graceful cancellation via generator.return()
 *
 * Educational Note:
 * AsyncGenerators are ideal for streaming because they:
 * - Produce values lazily (one at a time)
 * - Support backpressure (consumer controls pace)
 * - Can be cancelled (cleanup resources properly)
 * - Work with for-await-of loops
 *
 * @param config - Configuration for the reasoning stream
 * @returns AsyncGenerator that yields StreamEvent objects
 *
 * @example
 * ```typescript
 * // Basic usage
 * const stream = createMockReasoningStream({
 *   prompt: 'Plan a 2-week sprint',
 * });
 *
 * for await (const event of stream) {
 *   if (event.type === 'reasoning') {
 *     console.log('Reasoning:', event.data.summary);
 *   } else {
 *     console.log('Answer:', event.data.text);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With speed control and event capture
 * const stream = createMockReasoningStream({
 *   prompt: 'Plan a sprint',
 *   speed: 'fast',
 *   onEvent: (event) => {
 *     networkInspector.capture(event);
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With cancellation
 * const stream = createMockReasoningStream({
 *   prompt: 'Plan a sprint',
 * });
 *
 * // Start streaming
 * const iterator = stream[Symbol.asyncIterator]();
 *
 * // Cancel after 2 events
 * let count = 0;
 * for await (const event of stream) {
 *   count++;
 *   if (count >= 2) {
 *     await iterator.return?.(); // Cleanup and stop
 *     break;
 *   }
 * }
 * ```
 */
export async function* createMockReasoningStream(
  config: ReasoningStreamConfig
): AsyncGenerator<StreamEvent, void, undefined> {
  const { prompt, speed = 'normal', onEvent } = config;

  // Get the appropriate fixture data for this prompt
  const fixture = getFixtureForPrompt(prompt);

  // Get the delay duration based on speed setting
  const delayMs = SPEED_DELAYS[speed];

  // Track if stream was cancelled for cleanup
  let cancelled = false;

  try {
    // Stream each event from the fixture with delays
    for (const event of fixture) {
      // Check for cancellation before each event
      if (cancelled) {
        break;
      }

      // Simulate network latency with configurable delay
      await delay(delayMs);

      // Invoke the event callback if provided (for network capture, logging)
      if (onEvent) {
        try {
          onEvent(event);
        } catch (error) {
          // Don't let callback errors break the stream
          console.error('Error in stream event callback:', error);
        }
      }

      // Yield the event to the consumer
      yield event;
    }
  } finally {
    // Cleanup code runs when generator is closed (via return() or completion)
    cancelled = true;
  }
}

/**
 * Utility function to delay execution for a specified duration.
 *
 * This is used to simulate network latency between stream events.
 * Using a Promise-based delay allows the generator to be async/await compatible.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```typescript
 * await delay(300); // Wait 300ms
 * ```
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock reasoning stream with default 'normal' speed.
 *
 * Convenience function for the most common use case.
 *
 * @param prompt - The prompt to generate reasoning for
 * @returns AsyncGenerator that yields StreamEvent objects
 *
 * @example
 * ```typescript
 * const stream = createDefaultReasoningStream('Plan a sprint');
 * for await (const event of stream) {
 *   console.log(event);
 * }
 * ```
 */
export function createDefaultReasoningStream(
  prompt: string
): AsyncGenerator<StreamEvent, void, undefined> {
  return createMockReasoningStream({ prompt, speed: 'normal' });
}
