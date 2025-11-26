/**
 * Mock stream generator for the Tabular Stream View pattern.
 *
 * This module provides deterministic, replayable mock streams that simulate
 * real-world table data streaming. No actual API calls are made - all data
 * comes from fixtures.
 *
 * The mock stream emits events progressively:
 * 1. Schema event (first)
 * 2. Row events (one by one)
 * 3. Metadata event (last)
 *
 * @module patterns/tabular-stream-view/mockStream
 */

import type { StreamEvent, TabularStreamConfig } from './types';
import { StreamError } from './types';
import { getFixture } from './fixtures';

/**
 * Speed presets for demo control.
 * Maps speed names to delay milliseconds between events.
 */
const SPEED_PRESETS = {
  fast: 50, // Quick demo (good for development)
  normal: 300, // Realistic timing (default)
  slow: 1000 // Detailed observation (good for teaching)
} as const;

/**
 * Default timeout for stream completion (30 seconds).
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Helper function to create a delay promise.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock tabular stream generator.
 *
 * This async generator function yields stream events progressively,
 * simulating a real server-sent events (SSE) stream. The stream is
 * deterministic and replayable for educational purposes.
 *
 * Stream order:
 * 1. Schema event (defines table structure)
 * 2. Row events (one per table row)
 * 3. Metadata event (aggregations and totals)
 *
 * @param config - Configuration options for the stream
 * @returns Async generator that yields stream events
 *
 * @example
 * ```typescript
 * const stream = createMockTabularStream({ speed: 'fast' });
 *
 * for await (const event of stream) {
 *   console.log('Event:', event.type);
 *   if (event.type === 'schema') {
 *     console.log('Columns:', event.data.columns.length);
 *   } else if (event.type === 'table_row') {
 *     console.log('Row:', event.data.rowId);
 *   } else if (event.type === 'table_meta') {
 *     console.log('Total rows:', event.data.totalRows);
 *   }
 * }
 * ```
 *
 * @throws {StreamError} If timeout or error simulation is triggered
 */
export async function* createMockTabularStream(
  config: TabularStreamConfig = {}
): AsyncGenerator<StreamEvent, void, unknown> {
  const {
    scenario = 'default',
    speed = 'normal',
    onEvent,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    simulateError = 'none'
  } = config;

  // Get fixture data for the scenario
  const fixture = getFixture(scenario);

  // Validate fixture has required structure
  if (fixture.length === 0) {
    throw new StreamError('Fixture data is empty', 'stream');
  }

  const firstEvent = fixture[0];
  if (firstEvent.type !== 'schema') {
    throw new StreamError('First event must be schema event', 'stream');
  }

  // Get delay based on speed preset
  const delayMs = SPEED_PRESETS[speed];

  // Simulate timeout error before streaming starts
  if (simulateError === 'timeout') {
    throw new StreamError(
      `Stream timeout after ${timeoutMs}ms`,
      'timeout'
    );
  }

  // Simulate network error before streaming starts
  if (simulateError === 'network') {
    throw new StreamError(
      'Network connection failed',
      'network'
    );
  }

  // Set up timeout timer
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new StreamError(
        `Stream timeout after ${timeoutMs}ms`,
        'timeout'
      ));
    }, timeoutMs);
  });

  try {
    // Stream events progressively
    for (let i = 0; i < fixture.length; i++) {
      const event = fixture[i];

      // Simulate mid-stream error halfway through
      if (simulateError === 'mid-stream' && i === Math.floor(fixture.length / 2)) {
        throw new StreamError(
          'Stream error: Connection interrupted',
          'stream'
        );
      }

      // Wait for delay (except for first event - schema comes immediately)
      if (i > 0) {
        await Promise.race([
          delay(delayMs),
          timeoutPromise
        ]);
      }

      // Emit event through onEvent callback if provided
      if (onEvent) {
        onEvent(event);
      }

      // Yield event to the consumer
      yield event;
    }
  } catch (error) {
    // Re-throw StreamError as-is
    if (error instanceof StreamError) {
      throw error;
    }

    // Wrap other errors
    throw new StreamError(
      error instanceof Error ? error.message : 'Unknown stream error',
      'unknown'
    );
  }
}

/**
 * Convenience function to convert async generator to array.
 *
 * Useful for testing and debugging. Consumes the entire stream
 * and returns all events as an array.
 *
 * @param config - Configuration options for the stream
 * @returns Promise that resolves to array of all stream events
 *
 * @example
 * ```typescript
 * const events = await streamToArray({ speed: 'fast' });
 * console.log(events.length); // 14 (schema + rows + metadata)
 * console.log(events[0].type); // 'schema'
 * ```
 */
export async function streamToArray(
  config: TabularStreamConfig = {}
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];

  try {
    const stream = createMockTabularStream(config);

    for await (const event of stream) {
      events.push(event);
    }
  } catch (error) {
    // If stream throws, still return events collected so far
    console.error('Stream error:', error);
    throw error;
  }

  return events;
}

/**
 * Get the total number of events for a scenario without streaming.
 *
 * Useful for progress indicators and preloading checks.
 *
 * @param scenario - Scenario identifier (defaults to 'default')
 * @returns Total number of events in the fixture
 *
 * @example
 * ```typescript
 * const total = getEventCount('team-capacity');
 * console.log(total); // 14
 * ```
 */
export function getEventCount(scenario: string = 'default'): number {
  return getFixture(scenario).length;
}

/**
 * Get schema without starting the stream.
 *
 * Useful for immediate UI rendering before rows start streaming.
 *
 * @param scenario - Scenario identifier (defaults to 'default')
 * @returns Table schema
 * @throws {StreamError} If fixture doesn't start with schema event
 *
 * @example
 * ```typescript
 * const schema = getSchemaSync('team-capacity');
 * console.log(schema.columns.length); // 8
 * ```
 */
export function getSchemaSync(scenario: string = 'default') {
  const fixture = getFixture(scenario);

  if (fixture.length === 0) {
    throw new StreamError('Fixture data is empty', 'stream');
  }

  const firstEvent = fixture[0];

  if (firstEvent.type !== 'schema') {
    throw new StreamError('First event must be schema event', 'schema');
  }

  return firstEvent.data;
}
