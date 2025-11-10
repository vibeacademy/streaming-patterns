/**
 * Mock SSE (Server-Sent Events) Generator
 *
 * This module provides the main entry point for creating mock streaming sessions.
 * It simulates Server-Sent Events without requiring real servers or LLM APIs,
 * enabling deterministic, repeatable demonstrations of streaming patterns.
 *
 * Key features:
 * - Deterministic event generation from fixtures
 * - Configurable timing profiles (fast/normal/slow)
 * - Pause/resume support
 * - Session lifecycle management
 * - Event enrichment with metadata
 *
 * @module lib/streaming/mockSSE
 */

import type { StreamEvent } from '@/types/events';
import {
  StreamSession,
  type DelayProfile,
  type SessionConfig,
  type EnrichedStreamEvent,
} from './streamSession';

/**
 * Options for creating a mock stream
 */
export interface CreateStreamOptions {
  /** Array of events to stream (fixture data) */
  events: StreamEvent[];

  /** Delay profile for timing control (default: 'normal') */
  delayProfile?: DelayProfile;

  /** Custom session ID (auto-generated if not provided) */
  sessionId?: string;

  /** Whether to enrich events with metadata (default: true) */
  enrichEvents?: boolean;
}

/**
 * Active stream handle for controlling stream lifecycle
 */
export interface StreamHandle {
  /** Unique session identifier */
  sessionId: string;

  /** Pause event emission */
  pause: () => void;

  /** Resume event emission */
  resume: () => void;

  /** Close the stream and clean up resources */
  close: () => void;

  /** Get current session state */
  getState: () => string;

  /** Get session statistics */
  getStatistics: () => {
    sessionId: string;
    state: string;
    totalEvents: number;
    eventsConsumed: number;
    eventsRemaining: number;
  };
}

/**
 * Generate a unique session ID
 *
 * @returns Unique session identifier
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session-${timestamp}-${random}`;
}

/**
 * Create a mock SSE stream from fixture events
 *
 * This is the main entry point for creating mock streams in the streaming-patterns library.
 * It creates a StreamSession and returns an async generator that yields events with
 * appropriate timing delays.
 *
 * The stream supports pause/resume mechanics and ensures all streaming invariants:
 * - INV-4: Events emitted in fixture order
 * - INV-5: Timestamps monotonically increasing
 * - INV-7: Session closes cleanly
 * - INV-8: Cannot emit from closed session
 * - INV-13: Deterministic replay (same fixture → same events)
 *
 * @param options - Stream creation options
 * @returns Async generator yielding enriched stream events
 *
 * @example
 * ```typescript
 * import { createMockStream } from '@/lib/streaming/mockSSE';
 *
 * const stream = createMockStream({
 *   events: fixtureEvents,
 *   delayProfile: 'normal'
 * });
 *
 * for await (const event of stream) {
 *   console.log(event.type, event.data);
 * }
 * ```
 *
 * @example With pause/resume control
 * ```typescript
 * const { stream, handle } = createMockStreamWithHandle({
 *   events: fixtureEvents,
 *   delayProfile: 'fast'
 * });
 *
 * // Consume events
 * (async () => {
 *   for await (const event of stream) {
 *     console.log(event);
 *   }
 * })();
 *
 * // Control stream from elsewhere
 * setTimeout(() => handle.pause(), 1000);
 * setTimeout(() => handle.resume(), 2000);
 * setTimeout(() => handle.close(), 5000);
 * ```
 */
export async function* createMockStream(
  options: CreateStreamOptions
): AsyncGenerator<EnrichedStreamEvent> {
  const sessionId = options.sessionId ?? generateSessionId();

  const sessionConfig: SessionConfig = {
    sessionId,
    events: options.events,
    delayProfile: options.delayProfile ?? 'normal',
    enrichEvents: options.enrichEvents ?? true,
  };

  const session = new StreamSession(sessionConfig);

  yield* session.stream();
}

/**
 * Create a mock stream with external control handle
 *
 * This variant returns both the async generator and a handle for controlling
 * the stream externally (pause, resume, close). Useful when you need to
 * control stream playback from UI buttons or other async contexts.
 *
 * @param options - Stream creation options
 * @returns Object containing the stream generator and control handle
 *
 * @example
 * ```typescript
 * const { stream, handle } = createMockStreamWithHandle({
 *   events: fixtureEvents,
 *   delayProfile: 'normal'
 * });
 *
 * // Start consuming stream
 * (async () => {
 *   for await (const event of stream) {
 *     console.log(event);
 *   }
 * })();
 *
 * // Control from UI
 * pauseButton.onclick = () => handle.pause();
 * resumeButton.onclick = () => handle.resume();
 * stopButton.onclick = () => handle.close();
 * ```
 */
export function createMockStreamWithHandle(options: CreateStreamOptions): {
  stream: AsyncGenerator<EnrichedStreamEvent>;
  handle: StreamHandle;
} {
  const sessionId = options.sessionId ?? generateSessionId();

  const sessionConfig: SessionConfig = {
    sessionId,
    events: options.events,
    delayProfile: options.delayProfile ?? 'normal',
    enrichEvents: options.enrichEvents ?? true,
  };

  const session = new StreamSession(sessionConfig);

  const handle: StreamHandle = {
    sessionId: session.getSessionId(),
    pause: () => session.pause(),
    resume: () => session.resume(),
    close: () => session.close(),
    getState: () => session.getState(),
    getStatistics: () => session.getStatistics(),
  };

  return {
    stream: session.stream(),
    handle,
  };
}

/**
 * Validate fixture events before streaming
 *
 * Checks that fixture events conform to basic structural requirements:
 * - All events have required fields (id, type, timestamp)
 * - Event types are valid
 * - Timestamps are reasonable
 *
 * @param events - Events to validate
 * @throws Error if validation fails
 */
export function validateFixtureEvents(events: StreamEvent[]): void {
  if (!Array.isArray(events)) {
    throw new Error('Fixture events must be an array');
  }

  events.forEach((event, index) => {
    // Check required fields
    if (!event.id || typeof event.id !== 'string') {
      throw new Error(`Event at index ${index} missing valid 'id' field`);
    }

    if (!event.type || typeof event.type !== 'string') {
      throw new Error(`Event at index ${index} missing valid 'type' field`);
    }

    if (typeof event.timestamp !== 'number' || event.timestamp < 0) {
      throw new Error(`Event at index ${index} has invalid 'timestamp'`);
    }

    if (!event.data) {
      throw new Error(`Event at index ${index} missing 'data' field`);
    }
  });
}

/**
 * Create multiple concurrent mock streams
 *
 * Creates multiple independent stream sessions from the same or different fixtures.
 * Each stream has its own session ID and state, ensuring they don't interfere
 * with each other (testing scenario from BDD specs).
 *
 * @param streamConfigs - Array of stream configurations
 * @returns Array of stream generators
 *
 * @example
 * ```typescript
 * const [streamA, streamB] = createConcurrentStreams([
 *   { events: fixture1, delayProfile: 'fast' },
 *   { events: fixture2, delayProfile: 'slow' }
 * ]);
 *
 * // Streams are independent
 * Promise.all([
 *   (async () => { for await (const e of streamA) console.log('A:', e); })(),
 *   (async () => { for await (const e of streamB) console.log('B:', e); })()
 * ]);
 * ```
 */
export function createConcurrentStreams(
  streamConfigs: CreateStreamOptions[]
): AsyncGenerator<EnrichedStreamEvent>[] {
  return streamConfigs.map((config) => createMockStream(config));
}

/**
 * Utility: Collect all events from a stream into an array
 *
 * Useful for testing - consumes entire stream and returns all events.
 * Not recommended for production use with large streams.
 *
 * @param stream - Async generator to consume
 * @returns Promise resolving to array of all events
 *
 * @example
 * ```typescript
 * const stream = createMockStream({ events: fixture, delayProfile: 'fast' });
 * const allEvents = await collectStreamEvents(stream);
 * console.log(`Received ${allEvents.length} events`);
 * ```
 */
export async function collectStreamEvents(
  stream: AsyncGenerator<EnrichedStreamEvent>
): Promise<EnrichedStreamEvent[]> {
  const events: EnrichedStreamEvent[] = [];

  for await (const event of stream) {
    events.push(event);
  }

  return events;
}

/**
 * Utility: Measure stream timing
 *
 * Consumes a stream and measures how long it takes to process all events.
 * Useful for verifying delay profiles in tests.
 *
 * @param stream - Async generator to measure
 * @returns Promise resolving to elapsed time in milliseconds
 *
 * @example
 * ```typescript
 * const stream = createMockStream({
 *   events: fiveEventFixture,
 *   delayProfile: 'fast'
 * });
 * const elapsed = await measureStreamTiming(stream);
 * // elapsed should be approximately 250ms (5 events × 50ms)
 * ```
 */
export async function measureStreamTiming(
  stream: AsyncGenerator<EnrichedStreamEvent>
): Promise<number> {
  const startTime = Date.now();

  for await (const _event of stream) {
    // Just consume events
  }

  return Date.now() - startTime;
}

// Re-export types for convenience
export type { DelayProfile, SessionConfig, EnrichedStreamEvent };
