/**
 * Stream Session - Manages lifecycle of mock streaming events
 *
 * This module implements the StreamSession aggregate from the Streaming Infrastructure
 * bounded context. A session manages the lifecycle of a single event stream, including
 * state transitions, pause/resume mechanics, and clean closure.
 *
 * @module lib/streaming/streamSession
 */

import type { StreamEvent } from '@/types/events';
import { StreamCursor } from './streamCursor';

/**
 * Session state values
 */
export type SessionState = 'idle' | 'active' | 'paused' | 'closed';

/**
 * Delay profile for timing control
 * - fast: 50ms between events (for quick testing)
 * - normal: 300ms between events (realistic UX)
 * - slow: 1000ms between events (for detailed observation)
 */
export type DelayProfile = 'fast' | 'normal' | 'slow';

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Unique session identifier */
  sessionId: string;

  /** Array of events to stream */
  events: StreamEvent[];

  /** Delay profile controlling timing */
  delayProfile?: DelayProfile;

  /** Whether to add metadata to events */
  enrichEvents?: boolean;
}

/**
 * Session metadata added to events
 */
export interface SessionMetadata {
  /** Source of the stream */
  source: 'mock';

  /** Session ID */
  sessionId: string;

  /** Event sequence number within session */
  sequenceNumber: number;
}

/**
 * Enriched stream event with session metadata
 */
export type EnrichedStreamEvent = StreamEvent & {
  /** Session ID (also in metadata, but provided at top level for convenience) */
  sessionId?: string;

  /** Session metadata */
  metadata?: SessionMetadata;
};

/**
 * StreamSession - Manages the lifecycle of a mock event stream
 *
 * The StreamSession is an aggregate root in the Streaming Infrastructure context.
 * It orchestrates event generation from fixtures, manages timing, and ensures
 * proper state transitions and cleanup.
 *
 * Key responsibilities:
 * - State management (idle → active → closed)
 * - Pause/resume mechanics
 * - Event enrichment with metadata
 * - Clean closure and resource cleanup
 *
 * Invariants enforced:
 * - INV-4: Events emitted in fixture order
 * - INV-5: Timestamps monotonically increasing
 * - INV-7: Session closes cleanly
 * - INV-8: Cannot emit from closed session
 *
 * @example
 * ```typescript
 * const session = new StreamSession({
 *   sessionId: 'session-123',
 *   events: fixtureEvents,
 *   delayProfile: 'normal'
 * });
 *
 * for await (const event of session.stream()) {
 *   console.log(event);
 * }
 * ```
 */
export class StreamSession {
  private readonly sessionId: string;
  private readonly cursor: StreamCursor;
  private readonly delayProfile: DelayProfile;
  private readonly enrichEvents: boolean;
  private state: SessionState = 'idle';
  private pauseResolve: (() => void) | null = null;
  private isPaused: boolean = false;
  private lastTimestamp: number = 0;
  private sequenceNumber: number = 0;

  /**
   * Create a new stream session
   *
   * @param config - Session configuration
   */
  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId;
    this.cursor = new StreamCursor(config.events);
    this.delayProfile = config.delayProfile ?? 'normal';
    this.enrichEvents = config.enrichEvents ?? true;
  }

  /**
   * Get current session state
   *
   * @returns Current state
   */
  getState(): SessionState {
    return this.state;
  }

  /**
   * Get session ID
   *
   * @returns Unique session identifier
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current cursor position
   *
   * @returns Current position in event sequence
   */
  getCursorPosition(): number {
    return this.cursor.getPosition();
  }

  /**
   * Check if session is active
   *
   * @returns True if session is active or paused
   */
  isActive(): boolean {
    return this.state === 'active' || this.state === 'paused';
  }

  /**
   * Check if session is closed
   *
   * @returns True if session is closed
   */
  isClosed(): boolean {
    return this.state === 'closed';
  }

  /**
   * Pause the stream
   *
   * Pausing suspends event emission without closing the session.
   * The cursor position is preserved, allowing resumption from the same point.
   */
  pause(): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot pause session in ${this.state} state`);
    }

    this.state = 'paused';
    this.isPaused = true;
  }

  /**
   * Resume the stream
   *
   * Resumes event emission from the current cursor position.
   */
  resume(): void {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume session in ${this.state} state`);
    }

    this.state = 'active';
    this.isPaused = false;

    // Resolve any waiting pause promise
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }
  }

  /**
   * Close the session
   *
   * Closing terminates event emission and releases resources.
   * A closed session cannot be reopened.
   *
   * Invariant INV-7: Session must close cleanly
   */
  close(): void {
    if (this.state === 'closed') {
      return; // Already closed, idempotent
    }

    this.state = 'closed';
    this.isPaused = false;

    // Resolve any waiting pause promise to prevent deadlock
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }
  }

  /**
   * Get delay in milliseconds based on profile
   *
   * @returns Delay in milliseconds
   */
  private getDelay(): number {
    const delays: Record<DelayProfile, number> = {
      fast: 50,
      normal: 300,
      slow: 1000,
    };

    return delays[this.delayProfile];
  }

  /**
   * Enrich event with session metadata
   *
   * @param event - Original event
   * @returns Enriched event with metadata
   */
  private enrichEvent(event: StreamEvent): EnrichedStreamEvent {
    if (!this.enrichEvents) {
      return event;
    }

    this.sequenceNumber++;

    return {
      ...event,
      sessionId: this.sessionId,
      metadata: {
        source: 'mock',
        sessionId: this.sessionId,
        sequenceNumber: this.sequenceNumber,
      },
    };
  }

  /**
   * Ensure timestamp is monotonically increasing
   *
   * Invariant INV-5: Timestamps must be monotonically increasing
   *
   * @param event - Event to validate
   * @returns Event with adjusted timestamp if needed
   */
  private ensureMonotonicTimestamp(event: StreamEvent): StreamEvent {
    const now = Date.now();
    let timestamp = event.timestamp;

    // Ensure timestamp is at least as large as last timestamp
    if (timestamp <= this.lastTimestamp) {
      timestamp = this.lastTimestamp + 1;
    }

    // Ensure timestamp is not in the future (beyond current time)
    if (timestamp > now) {
      timestamp = now;
    }

    this.lastTimestamp = timestamp;

    return {
      ...event,
      timestamp,
    };
  }

  /**
   * Wait for pause state to be lifted
   *
   * @returns Promise that resolves when stream is resumed or closed
   */
  private async waitForResume(): Promise<void> {
    if (!this.isPaused) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.pauseResolve = resolve;
    });
  }

  /**
   * Stream events from this session
   *
   * This async generator yields events from the fixture with appropriate
   * timing delays. It handles pause/resume and ensures all invariants.
   *
   * Invariants enforced:
   * - INV-4: Events emitted in fixture order (via cursor)
   * - INV-5: Timestamps monotonically increasing
   * - INV-7: Session closes cleanly when all events consumed
   * - INV-8: Cannot emit from closed session
   *
   * @yields Enriched stream events
   */
  async *stream(): AsyncGenerator<EnrichedStreamEvent> {
    // Invariant INV-8: Cannot emit from closed session
    if (this.state === 'closed') {
      return;
    }

    // Transition to active state
    if (this.state === 'idle') {
      this.state = 'active';
    }

    const delayMs = this.getDelay();

    // Invariant INV-4: Events emitted in fixture order
    while (this.cursor.hasNext() && !this.isClosed()) {
      // Check for pause
      if (this.isPaused) {
        await this.waitForResume();
      }

      // Check if closed during pause
      if (this.isClosed()) {
        break;
      }

      // Apply delay before emitting event
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Get next event from cursor
      const event = this.cursor.next();
      if (!event) {
        break;
      }

      // Invariant INV-5: Timestamps monotonically increasing
      const timestampedEvent = this.ensureMonotonicTimestamp(event);

      // Enrich event with session metadata
      const enrichedEvent = this.enrichEvent(timestampedEvent);

      yield enrichedEvent;
    }

    // Invariant INV-7: Session closes cleanly after all events
    if (!this.isClosed()) {
      this.close();
    }
  }

  /**
   * Get session statistics
   *
   * @returns Session statistics object
   */
  getStatistics(): {
    sessionId: string;
    state: SessionState;
    totalEvents: number;
    eventsConsumed: number;
    eventsRemaining: number;
    cursorPosition: number;
    delayProfile: DelayProfile;
  } {
    return {
      sessionId: this.sessionId,
      state: this.state,
      totalEvents: this.cursor.getTotalEvents(),
      eventsConsumed: this.cursor.getPosition(),
      eventsRemaining: this.cursor.getRemainingCount(),
      cursorPosition: this.cursor.getPosition(),
      delayProfile: this.delayProfile,
    };
  }
}
