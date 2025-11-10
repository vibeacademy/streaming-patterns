/**
 * Stream Cursor - Tracks position in event sequence
 *
 * This module implements cursor-based tracking for stream event iteration.
 * The cursor maintains the current position in a fixture's event sequence
 * and provides methods for advancing, seeking, and checking bounds.
 *
 * @module lib/streaming/streamCursor
 */

import type { StreamEvent } from '@/types/events';

/**
 * Cursor state for tracking position in stream
 */
export interface CursorState {
  /** Current position in event sequence (0-indexed) */
  position: number;

  /** Total number of events available */
  totalEvents: number;

  /** Whether cursor has reached the end */
  isAtEnd: boolean;

  /** Whether cursor is at the beginning */
  isAtStart: boolean;
}

/**
 * StreamCursor - Manages iteration through a sequence of stream events
 *
 * The cursor provides a stateful iterator over stream events, supporting
 * forward iteration, position tracking, and end-of-stream detection.
 * It ensures events are accessed in order and provides boundary checks.
 *
 * @example
 * ```typescript
 * const cursor = new StreamCursor(events);
 * while (cursor.hasNext()) {
 *   const event = cursor.next();
 *   console.log(event);
 * }
 * ```
 */
export class StreamCursor {
  private position: number = 0;
  private readonly events: StreamEvent[];

  /**
   * Create a new stream cursor
   *
   * @param events - Array of stream events to iterate over
   */
  constructor(events: StreamEvent[]) {
    this.events = [...events]; // Defensive copy to prevent external mutation
  }

  /**
   * Get the current cursor position
   *
   * @returns Zero-indexed position in event sequence
   */
  getPosition(): number {
    return this.position;
  }

  /**
   * Get total number of events
   *
   * @returns Total event count
   */
  getTotalEvents(): number {
    return this.events.length;
  }

  /**
   * Check if cursor is at the end of the sequence
   *
   * @returns True if no more events are available
   */
  isAtEnd(): boolean {
    return this.position >= this.events.length;
  }

  /**
   * Check if cursor is at the start of the sequence
   *
   * @returns True if cursor is at position 0
   */
  isAtStart(): boolean {
    return this.position === 0;
  }

  /**
   * Check if there are more events to consume
   *
   * @returns True if next() can be called
   */
  hasNext(): boolean {
    return !this.isAtEnd();
  }

  /**
   * Get the next event and advance cursor
   *
   * @returns Next event in sequence, or undefined if at end
   * @throws Error if attempting to advance beyond end of stream
   */
  next(): StreamEvent | undefined {
    if (this.isAtEnd()) {
      return undefined;
    }

    const event = this.events[this.position];
    this.position++;
    return event;
  }

  /**
   * Peek at the next event without advancing cursor
   *
   * @returns Next event, or undefined if at end
   */
  peek(): StreamEvent | undefined {
    if (this.isAtEnd()) {
      return undefined;
    }

    return this.events[this.position];
  }

  /**
   * Reset cursor to beginning
   */
  reset(): void {
    this.position = 0;
  }

  /**
   * Seek to specific position
   *
   * @param position - Target position (0-indexed)
   * @throws Error if position is out of bounds
   */
  seek(position: number): void {
    if (position < 0 || position > this.events.length) {
      throw new Error(
        `Invalid seek position: ${position}. Must be between 0 and ${this.events.length}`
      );
    }

    this.position = position;
  }

  /**
   * Get current cursor state snapshot
   *
   * @returns Current cursor state
   */
  getState(): CursorState {
    return {
      position: this.position,
      totalEvents: this.events.length,
      isAtEnd: this.isAtEnd(),
      isAtStart: this.isAtStart(),
    };
  }

  /**
   * Get remaining events count
   *
   * @returns Number of events left to consume
   */
  getRemainingCount(): number {
    return Math.max(0, this.events.length - this.position);
  }

  /**
   * Get all events from current position to end
   * Note: This does NOT advance the cursor
   *
   * @returns Array of remaining events
   */
  getRemainingEvents(): StreamEvent[] {
    return this.events.slice(this.position);
  }

  /**
   * Get all events that have been consumed
   *
   * @returns Array of events before current position
   */
  getConsumedEvents(): StreamEvent[] {
    return this.events.slice(0, this.position);
  }
}
