/**
 * Tests for StreamCursor
 *
 * @module lib/streaming/streamCursor.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StreamCursor } from './streamCursor';
import type { StreamEvent } from '@/types/events';

describe('StreamCursor', () => {
  let sampleEvents: StreamEvent[];

  beforeEach(() => {
    sampleEvents = [
      {
        id: '1',
        type: 'reasoning',
        timestamp: 1000,
        data: { id: '1', summary: 'Step 1', confidence: 0.9, timestamp: 1000 },
      },
      {
        id: '2',
        type: 'reasoning',
        timestamp: 2000,
        data: { id: '2', summary: 'Step 2', confidence: 0.8, timestamp: 2000 },
      },
      {
        id: '3',
        type: 'answer',
        timestamp: 3000,
        data: { text: 'Final answer', isFinal: true },
      },
    ];
  });

  describe('Construction', () => {
    it('should create cursor with events', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor).toBeDefined();
      expect(cursor.getPosition()).toBe(0);
      expect(cursor.getTotalEvents()).toBe(3);
    });

    it('should handle empty event array', () => {
      const cursor = new StreamCursor([]);

      expect(cursor.getTotalEvents()).toBe(0);
      expect(cursor.isAtEnd()).toBe(true);
    });

    it('should create defensive copy of events', () => {
      const cursor = new StreamCursor(sampleEvents);

      // Mutate original array
      sampleEvents.push({
        id: '4',
        type: 'reasoning',
        timestamp: 4000,
        data: { id: '4', summary: 'Step 4', confidence: 0.7, timestamp: 4000 },
      });

      // Cursor should not be affected
      expect(cursor.getTotalEvents()).toBe(3);
    });
  });

  describe('Position tracking', () => {
    it('should start at position 0', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor.getPosition()).toBe(0);
      expect(cursor.isAtStart()).toBe(true);
    });

    it('should advance position with next()', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      expect(cursor.getPosition()).toBe(1);

      cursor.next();
      expect(cursor.getPosition()).toBe(2);

      cursor.next();
      expect(cursor.getPosition()).toBe(3);
    });

    it('should track cursor state correctly', () => {
      const cursor = new StreamCursor(sampleEvents);

      const initialState = cursor.getState();
      expect(initialState.position).toBe(0);
      expect(initialState.totalEvents).toBe(3);
      expect(initialState.isAtStart).toBe(true);
      expect(initialState.isAtEnd).toBe(false);

      cursor.next();
      cursor.next();
      cursor.next();

      const endState = cursor.getState();
      expect(endState.position).toBe(3);
      expect(endState.isAtStart).toBe(false);
      expect(endState.isAtEnd).toBe(true);
    });
  });

  describe('Event iteration', () => {
    it('should return events in order', () => {
      const cursor = new StreamCursor(sampleEvents);

      const event1 = cursor.next();
      expect(event1?.id).toBe('1');

      const event2 = cursor.next();
      expect(event2?.id).toBe('2');

      const event3 = cursor.next();
      expect(event3?.id).toBe('3');
    });

    it('should return undefined when at end', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      cursor.next();
      cursor.next();

      const beyondEnd = cursor.next();
      expect(beyondEnd).toBeUndefined();
    });

    it('should allow peeking without advancing', () => {
      const cursor = new StreamCursor(sampleEvents);

      const peeked = cursor.peek();
      expect(peeked?.id).toBe('1');
      expect(cursor.getPosition()).toBe(0); // Position unchanged

      const next = cursor.next();
      expect(next?.id).toBe('1');
      expect(cursor.getPosition()).toBe(1);
    });

    it('should peek undefined at end', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      cursor.next();
      cursor.next();

      const peeked = cursor.peek();
      expect(peeked).toBeUndefined();
    });
  });

  describe('Boundary checks', () => {
    it('should correctly report hasNext()', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor.hasNext()).toBe(true);

      cursor.next();
      expect(cursor.hasNext()).toBe(true);

      cursor.next();
      expect(cursor.hasNext()).toBe(true);

      cursor.next();
      expect(cursor.hasNext()).toBe(false);
    });

    it('should correctly report isAtEnd()', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor.isAtEnd()).toBe(false);

      cursor.next();
      cursor.next();
      cursor.next();

      expect(cursor.isAtEnd()).toBe(true);
    });

    it('should correctly report isAtStart()', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor.isAtStart()).toBe(true);

      cursor.next();
      expect(cursor.isAtStart()).toBe(false);
    });
  });

  describe('Reset and seek', () => {
    it('should reset to beginning', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      cursor.next();
      expect(cursor.getPosition()).toBe(2);

      cursor.reset();
      expect(cursor.getPosition()).toBe(0);
      expect(cursor.isAtStart()).toBe(true);
    });

    it('should seek to specific position', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.seek(2);
      expect(cursor.getPosition()).toBe(2);

      const event = cursor.next();
      expect(event?.id).toBe('3');
    });

    it('should allow seeking to end', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.seek(3);
      expect(cursor.getPosition()).toBe(3);
      expect(cursor.isAtEnd()).toBe(true);
    });

    it('should throw on invalid seek position', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(() => cursor.seek(-1)).toThrow(/Invalid seek position/);
      expect(() => cursor.seek(4)).toThrow(/Invalid seek position/);
    });
  });

  describe('Remaining events', () => {
    it('should track remaining count', () => {
      const cursor = new StreamCursor(sampleEvents);

      expect(cursor.getRemainingCount()).toBe(3);

      cursor.next();
      expect(cursor.getRemainingCount()).toBe(2);

      cursor.next();
      expect(cursor.getRemainingCount()).toBe(1);

      cursor.next();
      expect(cursor.getRemainingCount()).toBe(0);
    });

    it('should get remaining events', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();

      const remaining = cursor.getRemainingEvents();
      expect(remaining).toHaveLength(2);
      expect(remaining[0].id).toBe('2');
      expect(remaining[1].id).toBe('3');
    });

    it('should get consumed events', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      cursor.next();

      const consumed = cursor.getConsumedEvents();
      expect(consumed).toHaveLength(2);
      expect(consumed[0].id).toBe('1');
      expect(consumed[1].id).toBe('2');
    });

    it('should not advance cursor when getting remaining events', () => {
      const cursor = new StreamCursor(sampleEvents);

      cursor.next();
      const position = cursor.getPosition();

      cursor.getRemainingEvents();

      expect(cursor.getPosition()).toBe(position);
    });
  });

  describe('Edge cases', () => {
    it('should handle single event', () => {
      const cursor = new StreamCursor([sampleEvents[0]]);

      expect(cursor.getTotalEvents()).toBe(1);
      expect(cursor.hasNext()).toBe(true);

      const event = cursor.next();
      expect(event?.id).toBe('1');
      expect(cursor.isAtEnd()).toBe(true);
    });

    it('should handle large number of events', () => {
      const manyEvents: StreamEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        type: 'reasoning',
        timestamp: i * 1000,
        data: { id: String(i), summary: `Step ${i}`, confidence: 0.9, timestamp: i * 1000 },
      }));

      const cursor = new StreamCursor(manyEvents);

      expect(cursor.getTotalEvents()).toBe(1000);

      // Consume all events
      let count = 0;
      while (cursor.hasNext()) {
        cursor.next();
        count++;
      }

      expect(count).toBe(1000);
      expect(cursor.isAtEnd()).toBe(true);
    });
  });
});
