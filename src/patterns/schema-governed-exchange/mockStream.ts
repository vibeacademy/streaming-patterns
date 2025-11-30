/**
 * Mock stream generator for Schema-Governed Exchange pattern
 *
 * Simulates streaming JSON payloads with schema validation events.
 * All streams are deterministic for reliable testing and demos.
 */

import type { SchemaStreamEvent } from './types';
import {
  successfulValidationStream,
  errorValidationStream,
  correctedValidationStream,
  minimalValidStream,
} from './fixtures';

/**
 * Stream speed presets (milliseconds between events)
 */
export const STREAM_SPEEDS = {
  fast: 100,      // For testing
  normal: 400,    // Default demo speed
  slow: 800,      // For detailed observation
} as const;

export type StreamSpeed = keyof typeof STREAM_SPEEDS;

/**
 * Stream scenario types
 */
export type StreamScenario =
  | 'successful'  // Valid payload, no errors
  | 'with-errors' // Multiple validation errors
  | 'corrected'   // Errors that get fixed
  | 'minimal';    // Minimal valid payload

/**
 * Mock stream generator options
 */
export interface MockStreamOptions {
  scenario?: StreamScenario;
  speed?: StreamSpeed;
  onEvent?: (event: SchemaStreamEvent) => void;
}

/**
 * Create a mock schema validation stream
 *
 * @param options Stream configuration
 * @returns Async generator yielding schema stream events
 *
 * @example
 * ```typescript
 * const stream = createMockSchemaStream({ scenario: 'with-errors', speed: 'normal' });
 *
 * for await (const event of stream) {
 *   console.log('Received event:', event.type);
 * }
 * ```
 */
export async function* createMockSchemaStream(
  options: MockStreamOptions = {}
): AsyncGenerator<SchemaStreamEvent, void, undefined> {
  const {
    scenario = 'successful',
    speed = 'normal',
    onEvent,
  } = options;

  // Select fixture based on scenario
  const fixture = getFixtureForScenario(scenario);
  const delayMs = STREAM_SPEEDS[speed];

  // Stream events with delays
  for (const event of fixture) {
    // Wait before sending event (simulate network latency)
    await delay(delayMs);

    // Notify callback if provided
    if (onEvent) {
      onEvent(event);
    }

    // Yield event to consumer
    yield event;
  }
}

/**
 * Get fixture events for a given scenario
 */
function getFixtureForScenario(scenario: StreamScenario): SchemaStreamEvent[] {
  switch (scenario) {
    case 'successful':
      return successfulValidationStream;
    case 'with-errors':
      return errorValidationStream;
    case 'corrected':
      return correctedValidationStream;
    case 'minimal':
      return minimalValidStream;
    default:
      return successfulValidationStream;
  }
}

/**
 * Promise-based delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a synchronous stream for testing (no delays)
 *
 * Useful for tests where you don't want to wait for delays.
 */
export function createSyncSchemaStream(
  scenario: StreamScenario = 'successful'
): SchemaStreamEvent[] {
  return getFixtureForScenario(scenario);
}

/**
 * Stream controller for manual control (play/pause/resume)
 *
 * Useful for interactive demos where users control stream playback.
 */
export class SchemaStreamController {
  private events: SchemaStreamEvent[];
  private currentIndex = 0;
  private paused = false;
  private speed: StreamSpeed = 'normal';
  private onEventCallback?: (event: SchemaStreamEvent) => void;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(scenario: StreamScenario = 'successful') {
    this.events = getFixtureForScenario(scenario);
  }

  /**
   * Start the stream
   */
  start(options: { speed?: StreamSpeed; onEvent?: (event: SchemaStreamEvent) => void } = {}): void {
    this.speed = options.speed || 'normal';
    this.onEventCallback = options.onEvent;
    this.currentIndex = 0;
    this.paused = false;
    this.scheduleNext();
  }

  /**
   * Pause the stream
   */
  pause(): void {
    this.paused = true;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Resume the stream
   */
  resume(): void {
    if (this.paused && this.currentIndex < this.events.length) {
      this.paused = false;
      this.scheduleNext();
    }
  }

  /**
   * Stop the stream and reset
   */
  stop(): void {
    this.pause();
    this.currentIndex = 0;
  }

  /**
   * Skip to next event immediately
   */
  skipToNext(): void {
    if (this.currentIndex < this.events.length) {
      this.emitEvent(this.events[this.currentIndex]);
      this.currentIndex++;

      if (!this.paused && this.currentIndex < this.events.length) {
        this.scheduleNext();
      }
    }
  }

  /**
   * Check if stream is complete
   */
  isComplete(): boolean {
    return this.currentIndex >= this.events.length;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    return this.events.length === 0 ? 1 : this.currentIndex / this.events.length;
  }

  /**
   * Change stream speed
   */
  setSpeed(speed: StreamSpeed): void {
    this.speed = speed;
  }

  /**
   * Schedule next event emission
   */
  private scheduleNext(): void {
    if (this.paused || this.currentIndex >= this.events.length) {
      return;
    }

    const delayMs = STREAM_SPEEDS[this.speed];
    this.intervalId = setTimeout(() => {
      const event = this.events[this.currentIndex];
      this.emitEvent(event);
      this.currentIndex++;

      if (this.currentIndex < this.events.length && !this.paused) {
        this.scheduleNext();
      }
    }, delayMs);
  }

  /**
   * Emit an event to callback
   */
  private emitEvent(event: SchemaStreamEvent): void {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}
