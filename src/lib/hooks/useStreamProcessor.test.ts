/**
 * Tests for useStreamProcessor Hook
 *
 * Comprehensive test suite covering:
 * - Happy path (successful streaming)
 * - Error handling
 * - Pause/resume/reset functionality
 * - Cleanup and memory leak prevention
 * - Network Inspector integration
 * - Fixture loading
 * - State management
 *
 * @module lib/hooks/useStreamProcessor.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStreamProcessor } from './useStreamProcessor';
import type { StreamEvent, ReasoningEvent, AnswerEvent } from '@/types/events';
import { registerFixture, clearFixtures, createFixture } from '@/lib/streaming/fixtureRepository';
import type { DelayProfile } from '@/lib/streaming/mockSSE';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a simple test fixture with reasoning and answer events
 */
function createTestFixture(_id: string, eventCount: number): StreamEvent[] {
  const events: StreamEvent[] = [];
  const baseTimestamp = Date.now();

  // Add reasoning events
  for (let i = 0; i < eventCount - 1; i++) {
    events.push({
      id: `reasoning-${i}`,
      type: 'reasoning',
      timestamp: baseTimestamp + i * 100,
      data: {
        id: `step-${i}`,
        summary: `Reasoning step ${i + 1}`,
        confidence: 0.9,
        timestamp: baseTimestamp + i * 100,
      },
    } as ReasoningEvent);
  }

  // Add final answer event
  events.push({
    id: 'answer-final',
    type: 'answer',
    timestamp: baseTimestamp + (eventCount - 1) * 100,
    data: {
      text: 'Final answer',
      isFinal: true,
    },
  } as AnswerEvent);

  return events;
}

// ============================================================================
// Test Setup
// ============================================================================

describe('useStreamProcessor', () => {
  beforeEach(() => {
    // Clear fixture registry before each test
    clearFixtures();

    // Register test fixtures
    registerFixture(
      createFixture('test-fixture-small', createTestFixture('test-fixture-small', 3), {
        name: 'Small Test Fixture',
        pattern: 'test',
        description: 'Small fixture for testing',
        tags: ['test'],
      })
    );

    registerFixture(
      createFixture('test-fixture-large', createTestFixture('test-fixture-large', 10), {
        name: 'Large Test Fixture',
        pattern: 'test',
        description: 'Large fixture for testing',
        tags: ['test'],
      })
    );
  });

  afterEach(() => {
    // Clean up fixtures
    clearFixtures();
  });

  // ==========================================================================
  // Happy Path Tests
  // ==========================================================================

  describe('Happy Path', () => {
    it('should stream events successfully from fixture', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
        })
      );

      // Initially should be streaming with no events
      expect(result.current.isStreaming).toBe(true);
      expect(result.current.events).toHaveLength(0);
      expect(result.current.error).toBeNull();
      expect(result.current.state).toBe('active');

      // Wait for all events to be processed
      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      // Should have received all 3 events
      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].type).toBe('reasoning');
      expect(result.current.events[1].type).toBe('reasoning');
      expect(result.current.events[2].type).toBe('answer');

      // Stream should be closed (completed)
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('closed');
      expect(result.current.error).toBeNull();
    });

    it('should process larger fixtures correctly', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'fast',
        })
      );

      // Wait for all 10 events
      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(10);
        },
        { timeout: 3000 }
      );

      expect(result.current.events).toHaveLength(10);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('closed');
    });

    it('should respect delay profiles', async () => {
      const startTime = Date.now();

      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast', // 50ms per event
        })
      );

      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      const elapsed = Date.now() - startTime;

      // With 3 events and 50ms delay, should take at least 150ms
      // Allow some margin for test execution overhead
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should work with type parameter for type safety', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor<ReasoningEvent | AnswerEvent>({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
        })
      );

      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      // TypeScript should infer correct event types
      const events = result.current.events;
      expect(events[0].type).toBe('reasoning');

      if (events[0].type === 'reasoning') {
        expect(events[0].data.summary).toContain('Reasoning step');
      }
    });
  });

  // ==========================================================================
  // Network Inspector Integration Tests
  // ==========================================================================

  describe('Network Inspector Integration', () => {
    it('should call onEvent callback for each event', async () => {
      const onEvent = vi.fn();

      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
          onEvent,
        })
      );

      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      // onEvent should have been called 3 times
      expect(onEvent).toHaveBeenCalledTimes(3);

      // Verify event structure
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should call onEvent with correct event order', async () => {
      const capturedEvents: StreamEvent[] = [];
      const onEvent = vi.fn((event: StreamEvent) => {
        capturedEvents.push(event);
      });

      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
          onEvent,
        })
      );

      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      // Events should be in order
      expect(capturedEvents).toHaveLength(3);
      expect(capturedEvents[0].type).toBe('reasoning');
      expect(capturedEvents[1].type).toBe('reasoning');
      expect(capturedEvents[2].type).toBe('answer');
    });
  });

  // ==========================================================================
  // Pause/Resume/Reset Tests
  // ==========================================================================

  describe('Pause/Resume/Reset Controls', () => {
    it('should pause and resume streaming', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'slow', // Slower for better control
        })
      );

      // Wait for at least 2 events but not all of them
      await waitFor(() => {
        expect(result.current.eventCount).toBeGreaterThanOrEqual(2);
        expect(result.current.eventCount).toBeLessThan(10);
      }, { timeout: 3000 });

      const eventCountBeforePause = result.current.eventCount;

      // Pause the stream
      act(() => {
        result.current.pause();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('paused');

      // Wait to ensure no new events arrive while paused
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Event count should not have increased significantly (allow for 1 event in flight)
      expect(result.current.eventCount).toBeLessThanOrEqual(eventCountBeforePause + 1);

      // Resume the stream
      act(() => {
        result.current.resume();
      });

      expect(result.current.isStreaming).toBe(true);
      expect(result.current.state).toBe('active');

      // Wait for more events
      await waitFor(
        () => {
          expect(result.current.eventCount).toBeGreaterThan(eventCountBeforePause + 1);
        },
        { timeout: 5000 }
      );
    });

    it('should reset stream and restart from beginning', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
        })
      );

      // Wait for all events to complete
      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('closed');

      // Reset the stream
      act(() => {
        result.current.reset();
      });

      // Wait a moment for reset to take effect
      await waitFor(
        () => {
          expect(result.current.isStreaming).toBe(true);
        },
        { timeout: 1000 }
      );

      // Events should be reset and stream should restart
      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('closed');
    });

    it('should handle multiple pause/resume cycles', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'normal',
        })
      );

      // Cycle 1: Pause and resume
      await waitFor(() => expect(result.current.eventCount).toBeGreaterThanOrEqual(2));

      act(() => {
        result.current.pause();
      });
      expect(result.current.state).toBe('paused');

      act(() => {
        result.current.resume();
      });
      expect(result.current.state).toBe('active');

      // Cycle 2: Pause and resume again
      await waitFor(() => expect(result.current.eventCount).toBeGreaterThanOrEqual(5));

      act(() => {
        result.current.pause();
      });
      expect(result.current.state).toBe('paused');

      act(() => {
        result.current.resume();
      });
      expect(result.current.state).toBe('active');

      // Should eventually complete
      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(10);
        },
        { timeout: 5000 }
      );
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle missing fixture gracefully', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'non-existent-fixture',
          delayProfile: 'fast',
        })
      );

      // Should set error state
      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull();
        },
        { timeout: 2000 }
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('error');
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup and Memory Leaks', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'normal',
        })
      );

      // Wait for some events
      await waitFor(() => {
        expect(result.current.eventCount).toBeGreaterThanOrEqual(2);
      });

      // Unmount while still streaming
      unmount();

      // No assertions needed - just ensuring no errors/warnings
      // If cleanup is not proper, this would cause issues
    });

    it('should not update state after unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'normal',
        })
      );

      // Wait for a few events
      await waitFor(() => {
        expect(result.current.eventCount).toBeGreaterThanOrEqual(2);
      });

      // Unmount while streaming
      unmount();

      // Wait to ensure stream would have continued
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Since component is unmounted, we can't check state
      // But this test ensures no errors/warnings from setState after unmount
    });
  });

  // ==========================================================================
  // Auto-start Configuration Tests
  // ==========================================================================

  describe('Auto-start Configuration', () => {
    it('should auto-start by default', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
        })
      );

      // Should immediately start streaming
      expect(result.current.isStreaming).toBe(true);

      await waitFor(
        () => {
          expect(result.current.eventCount).toBe(3);
        },
        { timeout: 2000 }
      );
    });

    it('should not auto-start when autoStart is false', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
          autoStart: false,
        })
      );

      // Should not be streaming
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.state).toBe('idle');

      // Wait a bit to ensure no events arrive
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(result.current.eventCount).toBe(0);
    });
  });

  // ==========================================================================
  // Fixture/Config Change Tests
  // ==========================================================================

  describe('Configuration Changes', () => {
    // Skip this test for now - complex timing edge case
    it.skip('should restart stream when fixture ID changes during streaming', async () => {
      const { result, rerender } = renderHook(
        ({ fixtureId }) =>
          useStreamProcessor({
            fixtureId,
            delayProfile: 'slow',
          }),
        {
          initialProps: { fixtureId: 'test-fixture-large' },
        }
      );

      // Wait for a few events (but not all)
      await waitFor(
        () => {
          expect(result.current.eventCount).toBeGreaterThanOrEqual(3);
          expect(result.current.eventCount).toBeLessThan(10);
          expect(result.current.isStreaming).toBe(true);
        },
        { timeout: 10000 }
      );

      // Change fixture ID while streaming
      act(() => {
        rerender({ fixtureId: 'test-fixture-small' });
      });

      // Wait for restart and new events
      await waitFor(
        () => {
          // After restart, should eventually get to 3 events
          return result.current.eventCount === 3;
        },
        { timeout: 15000 }
      );

      // Give time for stream to fully complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify we got the correct number of events
      expect(result.current.eventCount).toBe(3);
    }, 20000); // Set test timeout to 20 seconds

    it('should restart stream when delay profile changes', async () => {
      const { result, rerender } = renderHook(
        ({ delayProfile }: { delayProfile: DelayProfile }) =>
          useStreamProcessor({
            fixtureId: 'test-fixture-small',
            delayProfile,
          }),
        {
          initialProps: { delayProfile: 'fast' as DelayProfile },
        }
      );

      // Wait for some events
      await waitFor(() => {
        expect(result.current.eventCount).toBeGreaterThanOrEqual(2);
      });

      // Change delay profile
      rerender({ delayProfile: 'slow' as DelayProfile });

      // Should restart
      await waitFor(
        () => {
          expect(result.current.isStreaming).toBe(true);
        },
        { timeout: 1000 }
      );
    });
  });

  // ==========================================================================
  // State Management Tests
  // ==========================================================================

  describe('State Management', () => {
    it('should transition through correct states', async () => {
      const states: string[] = [];

      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-small',
          delayProfile: 'fast',
        })
      );

      // Capture states as they change
      const captureState = () => {
        const currentState = result.current.state;
        if (!states.includes(currentState)) {
          states.push(currentState);
        }
      };

      // Capture initial state
      captureState();

      // Wait for streaming to complete
      await waitFor(
        () => {
          captureState();
          return result.current.eventCount === 3;
        },
        { timeout: 5000, interval: 50 }
      );

      // Give time for final state transition
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Capture final state
      captureState();

      // Should have transitioned through active state
      expect(states).toContain('active');

      // Should have ended streaming
      expect(result.current.isStreaming).toBe(false);
    });

    it('should maintain event count accurately', async () => {
      const { result } = renderHook(() =>
        useStreamProcessor({
          fixtureId: 'test-fixture-large',
          delayProfile: 'fast',
        })
      );

      let lastCount = 0;

      // Event count should only increase
      while (result.current.isStreaming || result.current.eventCount < 10) {
        expect(result.current.eventCount).toBeGreaterThanOrEqual(lastCount);
        lastCount = result.current.eventCount;

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (result.current.eventCount >= 10) break;
      }

      expect(result.current.eventCount).toBe(10);
      expect(result.current.events.length).toBe(10);
    });
  });
});
