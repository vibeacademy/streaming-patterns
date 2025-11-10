/**
 * Tests for StreamSession
 *
 * @module lib/streaming/streamSession.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StreamSession, type SessionConfig, type EnrichedStreamEvent } from './streamSession';
import type { StreamEvent } from '@/types/events';

describe('StreamSession', () => {
  let sampleEvents: StreamEvent[];
  let sessionConfig: SessionConfig;

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

    sessionConfig = {
      sessionId: 'test-session-123',
      events: sampleEvents,
      delayProfile: 'fast',
      enrichEvents: true,
    };
  });

  describe('Construction and initialization', () => {
    it('should create session with config', () => {
      const session = new StreamSession(sessionConfig);

      expect(session).toBeDefined();
      expect(session.getSessionId()).toBe('test-session-123');
      expect(session.getState()).toBe('idle');
    });

    it('should use default delay profile if not specified', () => {
      const config = { ...sessionConfig, delayProfile: undefined };
      const session = new StreamSession(config);

      expect(session).toBeDefined();
    });

    it('should start at cursor position 0', () => {
      const session = new StreamSession(sessionConfig);

      expect(session.getCursorPosition()).toBe(0);
    });
  });

  describe('State management', () => {
    it('should transition from idle to active when streaming starts', async () => {
      const session = new StreamSession(sessionConfig);

      expect(session.getState()).toBe('idle');

      const generator = session.stream();
      const firstEvent = await generator.next();

      expect(firstEvent.done).toBe(false);
      expect(session.getState()).toBe('active');

      // Clean up
      session.close();
    });

    it('should close when all events are consumed', async () => {
      const session = new StreamSession(sessionConfig);

      // Consume all events
      for await (const _event of session.stream()) {
        // Just consume
      }

      expect(session.getState()).toBe('closed');
    });

    it('should allow manual close', () => {
      const session = new StreamSession(sessionConfig);

      session.close();

      expect(session.getState()).toBe('closed');
      expect(session.isClosed()).toBe(true);
    });

    it('should be idempotent when closing multiple times', () => {
      const session = new StreamSession(sessionConfig);

      session.close();
      session.close();
      session.close();

      expect(session.getState()).toBe('closed');
    });
  });

  describe('Pause and resume', () => {
    it('should pause and resume stream', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      // Consume first event
      await generator.next();
      expect(session.getCursorPosition()).toBe(1);

      // Pause
      session.pause();
      expect(session.getState()).toBe('paused');

      // Resume
      session.resume();
      expect(session.getState()).toBe('active');

      // Continue consuming
      await generator.next();
      expect(session.getCursorPosition()).toBe(2);

      // Clean up
      session.close();
    });

    it('should throw when pausing non-active session', () => {
      const session = new StreamSession(sessionConfig);

      expect(() => session.pause()).toThrow(/Cannot pause session in idle state/);
    });

    it('should throw when resuming non-paused session', () => {
      const session = new StreamSession(sessionConfig);

      expect(() => session.resume()).toThrow(/Cannot resume session in idle state/);
    });

    it('should preserve cursor position when paused', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      // Consume 2 events
      await generator.next();
      await generator.next();

      const positionBeforePause = session.getCursorPosition();

      session.pause();
      const positionWhilePaused = session.getCursorPosition();

      expect(positionWhilePaused).toBe(positionBeforePause);

      session.resume();
      const positionAfterResume = session.getCursorPosition();

      expect(positionAfterResume).toBe(positionBeforePause);

      session.close();
    });
  });

  describe('Event emission', () => {
    it('should emit events in fixture order (INV-4)', async () => {
      const session = new StreamSession(sessionConfig);
      const emittedEvents: StreamEvent[] = [];

      for await (const event of session.stream()) {
        emittedEvents.push(event);
      }

      expect(emittedEvents).toHaveLength(3);
      expect(emittedEvents[0].id).toBe('1');
      expect(emittedEvents[1].id).toBe('2');
      expect(emittedEvents[2].id).toBe('3');
    });

    it('should not emit from closed session (INV-8)', async () => {
      const session = new StreamSession(sessionConfig);
      session.close();

      const emittedEvents: StreamEvent[] = [];

      for await (const event of session.stream()) {
        emittedEvents.push(event);
      }

      expect(emittedEvents).toHaveLength(0);
    });

    it('should ensure monotonically increasing timestamps (INV-5)', async () => {
      const session = new StreamSession(sessionConfig);
      let lastTimestamp = 0;

      for await (const event of session.stream()) {
        expect(event.timestamp).toBeGreaterThanOrEqual(lastTimestamp);
        lastTimestamp = event.timestamp;
      }
    });

    it('should enrich events with session metadata', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      const { value: firstEvent } = await generator.next();

      expect(firstEvent.sessionId).toBe('test-session-123');
      expect(firstEvent.metadata).toBeDefined();
      expect(firstEvent.metadata?.source).toBe('mock');
      expect(firstEvent.metadata?.sessionId).toBe('test-session-123');
      expect(firstEvent.metadata?.sequenceNumber).toBe(1);

      session.close();
    });

    it('should not enrich events when enrichEvents is false', async () => {
      const config = { ...sessionConfig, enrichEvents: false };
      const session = new StreamSession(config);
      const generator = session.stream();

      const { value: firstEvent } = await generator.next();

      expect(firstEvent.metadata).toBeUndefined();

      session.close();
    });

    it('should increment sequence numbers', async () => {
      const session = new StreamSession(sessionConfig);
      const events: EnrichedStreamEvent[] = [];

      for await (const event of session.stream()) {
        events.push(event);
      }

      expect(events[0].metadata?.sequenceNumber).toBe(1);
      expect(events[1].metadata?.sequenceNumber).toBe(2);
      expect(events[2].metadata?.sequenceNumber).toBe(3);
    });
  });

  describe('Delay profiles', () => {
    it('should respect fast delay profile', async () => {
      const config = { ...sessionConfig, delayProfile: 'fast' as const };
      const session = new StreamSession(config);

      const startTime = Date.now();

      for await (const _event of session.stream()) {
        // Just consume
      }

      const elapsed = Date.now() - startTime;

      // 3 events × 50ms = 150ms (with some tolerance)
      expect(elapsed).toBeGreaterThan(100);
      expect(elapsed).toBeLessThan(300);
    });

    it('should respect normal delay profile', async () => {
      const config = { ...sessionConfig, delayProfile: 'normal' as const };
      const session = new StreamSession(config);

      const startTime = Date.now();
      let count = 0;

      // Only consume first 2 events to keep test fast
      for await (const _event of session.stream()) {
        count++;
        if (count === 2) {
          session.close();
          break;
        }
      }

      const elapsed = Date.now() - startTime;

      // 2 events × 300ms = 600ms (with tolerance)
      expect(elapsed).toBeGreaterThan(500);
      expect(elapsed).toBeLessThan(800);
    });
  });

  describe('Session statistics', () => {
    it('should provide accurate statistics', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      const initialStats = session.getStatistics();
      expect(initialStats.sessionId).toBe('test-session-123');
      expect(initialStats.totalEvents).toBe(3);
      expect(initialStats.eventsConsumed).toBe(0);
      expect(initialStats.eventsRemaining).toBe(3);

      // Consume one event
      await generator.next();

      const midStats = session.getStatistics();
      expect(midStats.eventsConsumed).toBe(1);
      expect(midStats.eventsRemaining).toBe(2);

      session.close();
    });

    it('should report correct state in statistics', () => {
      const session = new StreamSession(sessionConfig);

      expect(session.getStatistics().state).toBe('idle');

      session.close();
      expect(session.getStatistics().state).toBe('closed');
    });
  });

  describe('Early termination', () => {
    it('should handle early stream close', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      await generator.next();
      await generator.next();

      session.close();

      const { done } = await generator.next();

      expect(done).toBe(true);
      expect(session.getState()).toBe('closed');
    });

    it('should stop emitting when closed mid-stream', async () => {
      const session = new StreamSession(sessionConfig);
      let eventCount = 0;

      for await (const _event of session.stream()) {
        eventCount++;
        if (eventCount === 2) {
          session.close();
        }
      }

      // Should have stopped after closing
      expect(eventCount).toBe(2);
    });
  });

  describe('Empty fixtures', () => {
    it('should handle empty event array', async () => {
      const config: SessionConfig = {
        sessionId: 'empty-session',
        events: [],
        delayProfile: 'fast',
      };

      const session = new StreamSession(config);
      const events: StreamEvent[] = [];

      for await (const event of session.stream()) {
        events.push(event);
      }

      expect(events).toHaveLength(0);
      expect(session.getState()).toBe('closed');
    });
  });

  describe('isActive and isClosed helpers', () => {
    it('should correctly report active state', async () => {
      const session = new StreamSession(sessionConfig);

      expect(session.isActive()).toBe(false);

      const generator = session.stream();
      await generator.next();

      expect(session.isActive()).toBe(true);

      session.close();
      expect(session.isActive()).toBe(false);
    });

    it('should correctly report closed state', () => {
      const session = new StreamSession(sessionConfig);

      expect(session.isClosed()).toBe(false);

      session.close();

      expect(session.isClosed()).toBe(true);
    });

    it('should consider paused as active', async () => {
      const session = new StreamSession(sessionConfig);
      const generator = session.stream();

      await generator.next();
      session.pause();

      expect(session.isActive()).toBe(true);
      expect(session.isClosed()).toBe(false);

      session.close();
    });
  });
});
