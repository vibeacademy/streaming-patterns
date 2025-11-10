/**
 * Tests for useNetworkCapture hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkCapture } from './useNetworkCapture';
import type { StreamEvent } from '@/types/events';

describe('useNetworkCapture', () => {
  // Helper to create mock events
  const createMockEvent = (
    type: StreamEvent['type'],
    overrides: Partial<StreamEvent> = {}
  ): StreamEvent => {
    const baseEvent = {
      id: `event-${Math.random()}`,
      timestamp: Date.now(),
      type,
      data: { test: 'data' },
      ...overrides,
    };
    return baseEvent as StreamEvent;
  };

  describe('event capture', () => {
    it('should capture events', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const event = createMockEvent('reasoning');

      act(() => {
        result.current.captureEvent(event);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].event).toEqual(event);
      expect(result.current.events[0].sequence).toBe(0);
      expect(result.current.totalEvents).toBe(1);
    });

    it('should maintain sequence numbers', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.captureEvent(createMockEvent('memory'));
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].sequence).toBe(0);
      expect(result.current.events[1].sequence).toBe(1);
      expect(result.current.events[2].sequence).toBe(2);
    });

    it('should set capturedAt timestamp', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const beforeCapture = Date.now();

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
      });

      const afterCapture = Date.now();

      expect(result.current.events[0].capturedAt).toBeGreaterThanOrEqual(
        beforeCapture
      );
      expect(result.current.events[0].capturedAt).toBeLessThanOrEqual(
        afterCapture
      );
    });
  });

  describe('clearEvents', () => {
    it('should clear all events', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
      });

      expect(result.current.events).toHaveLength(2);

      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toHaveLength(0);
      expect(result.current.totalEvents).toBe(0);
    });

    it('should reset sequence numbers after clear', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.clearEvents();
        result.current.captureEvent(createMockEvent('memory'));
      });

      expect(result.current.events[0].sequence).toBe(0);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      // We'll set up events in each test
    });

    it('should filter by event type', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('memory'));
      });

      act(() => {
        result.current.setFilter({ types: ['reasoning'] });
      });

      expect(result.current.filteredEvents).toHaveLength(2);
      expect(result.current.filteredEvents[0].event.type).toBe('reasoning');
      expect(result.current.filteredEvents[1].event.type).toBe('reasoning');
    });

    it('should filter by multiple event types', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.captureEvent(createMockEvent('memory'));
      });

      act(() => {
        result.current.setFilter({ types: ['reasoning', 'answer'] });
      });

      expect(result.current.filteredEvents).toHaveLength(2);
    });

    it('should filter by search query in event type', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.captureEvent(createMockEvent('memory'));
      });

      act(() => {
        result.current.setFilter({ search: 'reason' });
      });

      expect(result.current.filteredEvents).toHaveLength(1);
      expect(result.current.filteredEvents[0].event.type).toBe('reasoning');
    });

    it('should filter by search query in event data', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(
          createMockEvent('reasoning', {
            data: {
              id: 'step-1',
              summary: 'Analyzing backlog',
              confidence: 0.9,
              timestamp: Date.now(),
            },
          })
        );
        result.current.captureEvent(
          createMockEvent('reasoning', {
            data: {
              id: 'step-2',
              summary: 'Estimating capacity',
              confidence: 0.85,
              timestamp: Date.now(),
            },
          })
        );
      });

      act(() => {
        result.current.setFilter({ search: 'backlog' });
      });

      expect(result.current.filteredEvents).toHaveLength(1);
    });

    it('should filter by start time', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const baseTime = Date.now();

      act(() => {
        result.current.captureEvent(
          createMockEvent('reasoning', { timestamp: baseTime })
        );
        result.current.captureEvent(
          createMockEvent('answer', { timestamp: baseTime + 1000 })
        );
        result.current.captureEvent(
          createMockEvent('memory', { timestamp: baseTime + 2000 })
        );
      });

      act(() => {
        result.current.setFilter({ startTime: baseTime + 500 });
      });

      expect(result.current.filteredEvents).toHaveLength(2);
    });

    it('should filter by end time', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const baseTime = Date.now();

      act(() => {
        result.current.captureEvent(
          createMockEvent('reasoning', { timestamp: baseTime })
        );
        result.current.captureEvent(
          createMockEvent('answer', { timestamp: baseTime + 1000 })
        );
        result.current.captureEvent(
          createMockEvent('memory', { timestamp: baseTime + 2000 })
        );
      });

      act(() => {
        result.current.setFilter({ endTime: baseTime + 1500 });
      });

      expect(result.current.filteredEvents).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const baseTime = Date.now();

      act(() => {
        result.current.captureEvent(
          createMockEvent('reasoning', {
            timestamp: baseTime,
            data: {
              id: 'step-1',
              summary: 'test1',
              confidence: 0.9,
              timestamp: baseTime,
            },
          })
        );
        result.current.captureEvent(
          createMockEvent('reasoning', {
            timestamp: baseTime + 1000,
            data: {
              id: 'step-2',
              summary: 'test2',
              confidence: 0.85,
              timestamp: baseTime + 1000,
            },
          })
        );
        result.current.captureEvent(
          createMockEvent('answer', {
            timestamp: baseTime + 2000,
            data: {
              text: 'test3',
              isFinal: true,
            },
          })
        );
      });

      act(() => {
        result.current.setFilter({
          types: ['reasoning'],
          startTime: baseTime + 500,
        });
      });

      expect(result.current.filteredEvents).toHaveLength(1);
      expect(result.current.filteredEvents[0].event.type).toBe('reasoning');
    });
  });

  describe('exportEvents', () => {
    it('should export events as JSON string', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
      });

      const exported = result.current.exportEvents();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].event.type).toBe('reasoning');
    });

    it('should export empty array when no events', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const exported = result.current.exportEvents();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([]);
    });
  });

  describe('getEventCountByType', () => {
    it('should return count of events by type', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('reasoning'));
        result.current.captureEvent(createMockEvent('answer'));
        result.current.captureEvent(createMockEvent('memory'));
        result.current.captureEvent(createMockEvent('memory'));
        result.current.captureEvent(createMockEvent('memory'));
      });

      const counts = result.current.getEventCountByType();

      expect(counts.reasoning).toBe(2);
      expect(counts.answer).toBe(1);
      expect(counts.memory).toBe(3);
    });

    it('should return empty object when no events', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const counts = result.current.getEventCountByType();

      expect(counts).toEqual({});
    });
  });

  describe('performance', () => {
    it('should handle large number of events efficiently', () => {
      const { result } = renderHook(() => useNetworkCapture());

      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.captureEvent(createMockEvent('reasoning'));
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Capturing 1000 events should take less than 500ms
      expect(duration).toBeLessThan(500);
      expect(result.current.events).toHaveLength(1000);
    });

    it('should filter large event sets efficiently', () => {
      const { result } = renderHook(() => useNetworkCapture());

      act(() => {
        for (let i = 0; i < 500; i++) {
          result.current.captureEvent(createMockEvent('reasoning'));
          result.current.captureEvent(createMockEvent('answer'));
        }
      });

      const startTime = Date.now();

      act(() => {
        result.current.setFilter({ types: ['reasoning'] });
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Filtering should be fast (less than 100ms)
      expect(duration).toBeLessThan(100);
      expect(result.current.filteredEvents).toHaveLength(500);
    });
  });
});
