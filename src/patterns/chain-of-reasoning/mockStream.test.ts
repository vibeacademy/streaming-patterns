/**
 * Unit tests for the Chain-of-Reasoning mock stream generator.
 *
 * These tests verify that:
 * - AsyncGenerator properly yields fixture events
 * - Speed control works correctly
 * - Event callbacks are invoked
 * - Cleanup happens on cancellation
 * - Fixtures are selected based on prompt
 *
 * @module patterns/chain-of-reasoning/mockStream.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockReasoningStream,
  createDefaultReasoningStream,
} from './mockStream';
import type { StreamEvent } from './types';

describe('createMockReasoningStream', () => {
  // Mock timers to control delays in tests
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Event Streaming', () => {
    it('should yield all events from fixture in order', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // Fast-forward through all delays
      await vi.runAllTimersAsync();
      await streamPromise;

      // Should have 5 reasoning events + 1 answer event
      expect(events).toHaveLength(6);

      // First 5 should be reasoning events
      const reasoningEvents = events.slice(0, 5);
      reasoningEvents.forEach((event) => {
        expect(event.type).toBe('reasoning');
        expect(event.data).toHaveProperty('id');
        expect(event.data).toHaveProperty('summary');
        expect(event.data).toHaveProperty('confidence');
        expect(event.data).toHaveProperty('timestamp');
      });

      // Last event should be answer
      const answerEvent = events[5];
      expect(answerEvent.type).toBe('answer');
      expect(answerEvent.data).toHaveProperty('text');
      if (answerEvent.type === 'answer') {
        expect(answerEvent.data.text).toContain('Sprint 24 Plan');
      }
    });

    it('should yield events one at a time (not all at once)', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'normal',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // After no time has passed, should have 0 events
      expect(events).toHaveLength(0);

      // After first delay (300ms for normal speed), should have 1 event
      await vi.advanceTimersByTimeAsync(300);
      expect(events).toHaveLength(1);

      // After second delay, should have 2 events
      await vi.advanceTimersByTimeAsync(300);
      expect(events).toHaveLength(2);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;
    });
  });

  describe('Speed Control', () => {
    it('should use 50ms delay for fast speed', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // After 49ms, should still have 0 events
      await vi.advanceTimersByTimeAsync(49);
      expect(events).toHaveLength(0);

      // After 50ms, should have 1 event
      await vi.advanceTimersByTimeAsync(1);
      expect(events).toHaveLength(1);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;
    });

    it('should use 300ms delay for normal speed', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'normal',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // After 299ms, should still have 0 events
      await vi.advanceTimersByTimeAsync(299);
      expect(events).toHaveLength(0);

      // After 300ms, should have 1 event
      await vi.advanceTimersByTimeAsync(1);
      expect(events).toHaveLength(1);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;
    });

    it('should use 1000ms delay for slow speed', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'slow',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // After 999ms, should still have 0 events
      await vi.advanceTimersByTimeAsync(999);
      expect(events).toHaveLength(0);

      // After 1000ms, should have 1 event
      await vi.advanceTimersByTimeAsync(1);
      expect(events).toHaveLength(1);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;
    });

    it('should default to normal speed if not specified', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        // No speed specified
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // Should use normal speed (300ms)
      await vi.advanceTimersByTimeAsync(299);
      expect(events).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(1);
      expect(events).toHaveLength(1);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;
    });
  });

  describe('Event Callbacks', () => {
    it('should invoke onEvent callback for each event', async () => {
      const onEvent = vi.fn();
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
        onEvent,
      });

      const streamPromise = (async () => {
        for await (const _event of stream) {
          // Just consume events
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should have called callback 6 times (5 reasoning + 1 answer)
      expect(onEvent).toHaveBeenCalledTimes(6);

      // Verify callback received correct event objects
      const firstCall = onEvent.mock.calls[0][0];
      expect(firstCall.type).toBe('reasoning');

      const lastCall = onEvent.mock.calls[5][0];
      expect(lastCall.type).toBe('answer');
    });

    it('should not break stream if onEvent callback throws error', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
        onEvent: errorCallback,
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Stream should still yield all events despite callback errors
      expect(events).toHaveLength(6);

      // Console.error should have been called for each error
      expect(consoleErrorSpy).toHaveBeenCalledTimes(6);

      consoleErrorSpy.mockRestore();
    });

    it('should work without onEvent callback', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
        // No onEvent callback
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should still work normally
      expect(events).toHaveLength(6);
    });
  });

  describe('Prompt Matching', () => {
    it('should select sprint fixture for "sprint" prompt', async () => {
      const stream = createMockReasoningStream({
        prompt: 'sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      expect(events).toHaveLength(6);
      const firstReasoning = events[0];
      expect(firstReasoning.type).toBe('reasoning');
      if (firstReasoning.type === 'reasoning') {
        expect(firstReasoning.data.summary).toContain('backlog');
      }
    });

    it('should select sprint fixture for "plan a sprint" prompt', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a 2-week sprint for the dashboard',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      expect(events).toHaveLength(6);
    });

    it('should use default fixture for unrecognized prompt', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Some random prompt',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should still return fixture data (defaults to sprint planning)
      expect(events).toHaveLength(6);
    });
  });

  describe('Cleanup and Cancellation', () => {
    it('should support early termination via break', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
          if (events.length >= 2) {
            break; // Stop after 2 events
          }
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should only have 2 events
      expect(events).toHaveLength(2);
    });

    it('should support early termination via return()', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const iterator = stream[Symbol.asyncIterator]();

      // Start first iteration (this initiates the delay)
      const firstPromise = iterator.next();
      await vi.advanceTimersByTimeAsync(50);
      const firstResult = await firstPromise;
      if (!firstResult.done) {
        events.push(firstResult.value);
      }

      // Start second iteration
      const secondPromise = iterator.next();
      await vi.advanceTimersByTimeAsync(50);
      const secondResult = await secondPromise;
      if (!secondResult.done) {
        events.push(secondResult.value);
      }

      // Cancel the stream
      if (iterator.return) {
        await iterator.return();
      }

      // Should only have 2 events
      expect(events).toHaveLength(2);
    });

    it('should cleanup properly when stream completes naturally', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should have all events
      expect(events).toHaveLength(6);

      // Stream should be done
      const iterator = stream[Symbol.asyncIterator]();
      const result = await iterator.next();
      expect(result.done).toBe(true);
    });
  });

  describe('TypeScript Types', () => {
    it('should properly type reasoning events', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const streamPromise = (async () => {
        for await (const event of stream) {
          // TypeScript should narrow type based on discriminator
          if (event.type === 'reasoning') {
            // Should have access to ReasoningStep properties
            expect(typeof event.data.id).toBe('string');
            expect(typeof event.data.summary).toBe('string');
            expect(typeof event.data.confidence).toBe('number');
            expect(typeof event.data.timestamp).toBe('number');
          }
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;
    });

    it('should properly type answer events', async () => {
      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const streamPromise = (async () => {
        for await (const event of stream) {
          // TypeScript should narrow type based on discriminator
          if (event.type === 'answer') {
            // Should have access to text property
            expect(typeof event.data.text).toBe('string');
          }
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;
    });
  });

  describe('createDefaultReasoningStream', () => {
    it('should create stream with normal speed by default', async () => {
      const stream = createDefaultReasoningStream('Plan a sprint');

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      // Should use normal speed (300ms)
      await vi.advanceTimersByTimeAsync(299);
      expect(events).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(1);
      expect(events).toHaveLength(1);

      // Complete the stream
      await vi.runAllTimersAsync();
      await streamPromise;

      expect(events).toHaveLength(6);
    });

    it('should accept prompt parameter', async () => {
      const stream = createDefaultReasoningStream('sprint planning');

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      expect(events).toHaveLength(6);
      const firstEvent = events[0];
      expect(firstEvent.type).toBe('reasoning');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt string', async () => {
      const stream = createMockReasoningStream({
        prompt: '',
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should use default fixture
      expect(events).toHaveLength(6);
    });

    it('should handle very long prompt string', async () => {
      const longPrompt = 'Plan a sprint '.repeat(100);
      const stream = createMockReasoningStream({
        prompt: longPrompt,
        speed: 'fast',
      });

      const events: StreamEvent[] = [];
      const streamPromise = (async () => {
        for await (const event of stream) {
          events.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;

      // Should still work (matches "sprint")
      expect(events).toHaveLength(6);
    });

    it('should be reusable - can create multiple streams', async () => {
      const stream1 = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const stream2 = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      const events1: StreamEvent[] = [];
      const events2: StreamEvent[] = [];

      const promise1 = (async () => {
        for await (const event of stream1) {
          events1.push(event);
        }
      })();

      const promise2 = (async () => {
        for await (const event of stream2) {
          events2.push(event);
        }
      })();

      await vi.runAllTimersAsync();
      await Promise.all([promise1, promise2]);

      // Both streams should work independently
      expect(events1).toHaveLength(6);
      expect(events2).toHaveLength(6);
    });
  });

  describe('Performance', () => {
    it('should not block on synchronous operations', async () => {
      const startTime = Date.now();

      const stream = createMockReasoningStream({
        prompt: 'Plan a sprint',
        speed: 'fast',
      });

      // Creating the generator should be instant
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(10);

      // Consuming events happens asynchronously
      const streamPromise = (async () => {
        for await (const _event of stream) {
          // Just consume
        }
      })();

      await vi.runAllTimersAsync();
      await streamPromise;
    });
  });
});
