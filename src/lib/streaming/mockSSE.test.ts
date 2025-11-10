/**
 * Tests for Mock SSE Generator
 *
 * @module lib/streaming/mockSSE.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockStream,
  createMockStreamWithHandle,
  validateFixtureEvents,
  createConcurrentStreams,
  collectStreamEvents,
  measureStreamTiming,
} from './mockSSE';
import type { StreamEvent } from '@/types/events';

describe('Mock SSE Generator', () => {
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

  describe('createMockStream', () => {
    it('should create a stream from fixture events', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const events: StreamEvent[] = [];

      for await (const event of stream) {
        events.push(event);
      }

      expect(events).toHaveLength(3);
      expect(events[0].id).toBe('1');
      expect(events[1].id).toBe('2');
      expect(events[2].id).toBe('3');
    });

    it('should generate unique session IDs', async () => {
      const stream1 = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const stream2 = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const gen1 = stream1[Symbol.asyncIterator]();
      const gen2 = stream2[Symbol.asyncIterator]();

      const { value: event1 } = await gen1.next();
      const { value: event2 } = await gen2.next();

      expect(event1.sessionId).toBeDefined();
      expect(event2.sessionId).toBeDefined();
      expect(event1.sessionId).not.toBe(event2.sessionId);
    });

    it('should use custom session ID if provided', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
        sessionId: 'custom-session-id',
      });

      const generator = stream[Symbol.asyncIterator]();
      const { value: firstEvent } = await generator.next();

      expect(firstEvent.sessionId).toBe('custom-session-id');
    });

    it('should default to normal delay profile', async () => {
      const stream = createMockStream({
        events: sampleEvents,
      });

      const generator = stream[Symbol.asyncIterator]();
      await generator.next();

      // Stream should exist and work
      expect(generator).toBeDefined();
    });

    it('should handle empty fixtures', async () => {
      const stream = createMockStream({
        events: [],
        delayProfile: 'fast',
      });

      const events: StreamEvent[] = [];

      for await (const event of stream) {
        events.push(event);
      }

      expect(events).toHaveLength(0);
    });

    it('should emit events in deterministic order (INV-13)', async () => {
      const stream1 = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
        sessionId: 'deterministic-test',
      });

      const stream2 = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
        sessionId: 'deterministic-test-2',
      });

      const events1 = await collectStreamEvents(stream1);
      const events2 = await collectStreamEvents(stream2);

      expect(events1.map((e) => e.id)).toEqual(events2.map((e) => e.id));
    });
  });

  describe('createMockStreamWithHandle', () => {
    it('should return both stream and handle', () => {
      const { stream, handle } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      expect(stream).toBeDefined();
      expect(handle).toBeDefined();
      expect(handle.sessionId).toBeDefined();
      expect(typeof handle.pause).toBe('function');
      expect(typeof handle.resume).toBe('function');
      expect(typeof handle.close).toBe('function');
      expect(typeof handle.getState).toBe('function');
    });

    it('should allow pausing and resuming via handle', async () => {
      const { stream, handle } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const generator = stream[Symbol.asyncIterator]();

      // Consume first event
      await generator.next();

      // Pause via handle
      handle.pause();
      expect(handle.getState()).toBe('paused');

      // Resume via handle
      handle.resume();
      expect(handle.getState()).toBe('active');

      // Clean up
      handle.close();
    });

    it('should allow closing via handle', async () => {
      const { stream, handle } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const generator = stream[Symbol.asyncIterator]();

      await generator.next();

      handle.close();
      expect(handle.getState()).toBe('closed');

      const { done } = await generator.next();
      expect(done).toBe(true);
    });

    it('should provide statistics via handle', async () => {
      const { stream, handle } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const generator = stream[Symbol.asyncIterator]();

      const initialStats = handle.getStatistics();
      expect(initialStats.totalEvents).toBe(3);
      expect(initialStats.eventsConsumed).toBe(0);

      await generator.next();

      const afterOneStats = handle.getStatistics();
      expect(afterOneStats.eventsConsumed).toBe(1);
      expect(afterOneStats.eventsRemaining).toBe(2);

      handle.close();
    });
  });

  describe('validateFixtureEvents', () => {
    it('should validate correct events', () => {
      expect(() => validateFixtureEvents(sampleEvents)).not.toThrow();
    });

    it('should throw on non-array input', () => {
      expect(() => validateFixtureEvents('not an array' as unknown as StreamEvent[])).toThrow(
        /must be an array/
      );
    });

    it('should throw on missing id', () => {
      const invalidEvents = [
        {
          type: 'reasoning',
          timestamp: 1000,
          data: {},
        } as unknown as StreamEvent,
      ];

      expect(() => validateFixtureEvents(invalidEvents)).toThrow(/missing valid 'id' field/);
    });

    it('should throw on missing type', () => {
      const invalidEvents = [
        {
          id: '1',
          timestamp: 1000,
          data: {},
        } as unknown as StreamEvent,
      ];

      expect(() => validateFixtureEvents(invalidEvents)).toThrow(/missing valid 'type' field/);
    });

    it('should throw on invalid timestamp', () => {
      const invalidEvents: StreamEvent[] = [
        {
          id: '1',
          type: 'reasoning',
          timestamp: -1,
          data: { id: '1', summary: 'test', confidence: 0.9, timestamp: -1 },
        },
      ];

      expect(() => validateFixtureEvents(invalidEvents)).toThrow(/invalid 'timestamp'/);
    });

    it('should throw on missing data', () => {
      const invalidEvents = [
        {
          id: '1',
          type: 'reasoning',
          timestamp: 1000,
        } as unknown as StreamEvent,
      ];

      expect(() => validateFixtureEvents(invalidEvents)).toThrow(/missing 'data' field/);
    });
  });

  describe('createConcurrentStreams', () => {
    it('should create multiple independent streams', async () => {
      const streams = createConcurrentStreams([
        { events: sampleEvents, delayProfile: 'fast', sessionId: 'stream-A' },
        { events: sampleEvents, delayProfile: 'fast', sessionId: 'stream-B' },
      ]);

      expect(streams).toHaveLength(2);

      const events1 = await collectStreamEvents(streams[0]);
      const events2 = await collectStreamEvents(streams[1]);

      expect(events1).toHaveLength(3);
      expect(events2).toHaveLength(3);
      expect(events1[0].sessionId).toBe('stream-A');
      expect(events2[0].sessionId).toBe('stream-B');
    });

    it('should create streams with different session IDs', async () => {
      const streams = createConcurrentStreams([
        { events: sampleEvents, delayProfile: 'fast' },
        { events: sampleEvents, delayProfile: 'fast' },
      ]);

      const gen1 = streams[0][Symbol.asyncIterator]();
      const gen2 = streams[1][Symbol.asyncIterator]();

      const { value: event1 } = await gen1.next();
      const { value: event2 } = await gen2.next();

      expect(event1.sessionId).not.toBe(event2.sessionId);
    });
  });

  describe('collectStreamEvents', () => {
    it('should collect all events from stream', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const events = await collectStreamEvents(stream);

      expect(events).toHaveLength(3);
      expect(events[0].id).toBe('1');
      expect(events[1].id).toBe('2');
      expect(events[2].id).toBe('3');
    });

    it('should handle empty streams', async () => {
      const stream = createMockStream({
        events: [],
        delayProfile: 'fast',
      });

      const events = await collectStreamEvents(stream);

      expect(events).toHaveLength(0);
    });

    it('should work with large streams', async () => {
      const manyEvents: StreamEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        type: 'reasoning',
        timestamp: i * 1000,
        data: { id: String(i), summary: `Step ${i}`, confidence: 0.9, timestamp: i * 1000 },
      }));

      const stream = createMockStream({
        events: manyEvents,
        delayProfile: 'fast',
      });

      const events = await collectStreamEvents(stream);

      expect(events).toHaveLength(100);
    }, 10000); // 10 second timeout for large stream
  });

  describe('measureStreamTiming', () => {
    it('should measure fast delay profile timing', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const elapsed = await measureStreamTiming(stream);

      // 3 events × 50ms = 150ms (with tolerance)
      expect(elapsed).toBeGreaterThan(100);
      expect(elapsed).toBeLessThan(300);
    });

    it('should measure different delay profiles', async () => {
      const twoEvents = sampleEvents.slice(0, 2);

      const fastStream = createMockStream({
        events: twoEvents,
        delayProfile: 'fast',
      });

      const normalStream = createMockStream({
        events: twoEvents,
        delayProfile: 'normal',
      });

      const fastTime = await measureStreamTiming(fastStream);
      const normalTime = await measureStreamTiming(normalStream);

      // Normal should be significantly slower than fast
      expect(normalTime).toBeGreaterThan(fastTime);

      // Fast: ~100ms (2 × 50ms)
      expect(fastTime).toBeGreaterThan(50);
      expect(fastTime).toBeLessThan(200);

      // Normal: ~600ms (2 × 300ms)
      expect(normalTime).toBeGreaterThan(500);
      expect(normalTime).toBeLessThan(800);
    });

    it('should handle empty streams', async () => {
      const stream = createMockStream({
        events: [],
        delayProfile: 'fast',
      });

      const elapsed = await measureStreamTiming(stream);

      // Should be very fast (no events to emit)
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Event enrichment', () => {
    it('should enrich events when enabled', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
        enrichEvents: true,
      });

      const generator = stream[Symbol.asyncIterator]();
      const { value: event } = await generator.next();

      expect(event.metadata).toBeDefined();
      expect(event.metadata?.source).toBe('mock');
      expect(event.metadata?.sessionId).toBeDefined();
      expect(event.metadata?.sequenceNumber).toBe(1);
    });

    it('should not enrich events when disabled', async () => {
      const stream = createMockStream({
        events: sampleEvents,
        delayProfile: 'fast',
        enrichEvents: false,
      });

      const generator = stream[Symbol.asyncIterator]();
      const { value: event } = await generator.next();

      expect(event.metadata).toBeUndefined();
    });
  });

  describe('BDD scenario coverage', () => {
    it('should support delay profile timing control', async () => {
      const fiveEvents: StreamEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        type: 'reasoning',
        timestamp: i * 1000,
        data: { id: String(i), summary: `Step ${i}`, confidence: 0.9, timestamp: i * 1000 },
      }));

      const fastStream = createMockStream({
        events: fiveEvents,
        delayProfile: 'fast',
      });

      const elapsed = await measureStreamTiming(fastStream);

      // 5 events × 50ms = 250ms (with tolerance)
      expect(elapsed).toBeGreaterThan(200);
      expect(elapsed).toBeLessThan(400);
    });

    it('should handle concurrent independent sessions', async () => {
      const { stream: streamA, handle: handleA } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      const { stream: streamB, handle: handleB } = createMockStreamWithHandle({
        events: sampleEvents,
        delayProfile: 'fast',
      });

      // Different session IDs
      expect(handleA.sessionId).not.toBe(handleB.sessionId);

      // Pause stream A
      const genA = streamA[Symbol.asyncIterator]();
      const genB = streamB[Symbol.asyncIterator]();

      await genA.next();
      handleA.pause();

      expect(handleA.getState()).toBe('paused');

      // Stream B should continue
      await genB.next();
      expect(handleB.getState()).toBe('active');

      // Close stream B
      handleB.close();
      expect(handleB.getState()).toBe('closed');

      // Stream A should still be paused
      expect(handleA.getState()).toBe('paused');

      handleA.close();
    });

    it('should preserve event types from fixture', async () => {
      const mixedEvents: StreamEvent[] = [
        {
          id: '1',
          type: 'reasoning',
          timestamp: 1000,
          data: { id: '1', summary: 'Step 1', confidence: 0.9, timestamp: 1000 },
        },
        {
          id: '2',
          type: 'answer',
          timestamp: 2000,
          data: { text: 'Answer', isFinal: false },
        },
        {
          id: '3',
          type: 'memory',
          timestamp: 3000,
          data: {
            id: '3',
            operation: 'create',
            content: 'Memory',
            importance: 0.8,
            turn: 1,
            timestamp: 3000,
          },
        },
      ];

      const stream = createMockStream({
        events: mixedEvents,
        delayProfile: 'fast',
      });

      const events = await collectStreamEvents(stream);

      expect(events[0].type).toBe('reasoning');
      expect(events[1].type).toBe('answer');
      expect(events[2].type).toBe('memory');
    });
  });
});
