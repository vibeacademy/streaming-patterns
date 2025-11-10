/**
 * Network Capture Hook
 *
 * Provides event capture and management functionality for the Network Inspector.
 * This hook captures all streaming events, provides filtering, search, and export capabilities.
 *
 * @module lib/hooks/useNetworkCapture
 */

import { useState, useCallback, useMemo } from 'react';
import type { StreamEvent, EventType } from '@/types/events';

/**
 * Captured event with additional metadata for network inspector
 */
export interface CapturedEvent {
  /** Original stream event */
  event: StreamEvent;

  /** Sequence number for ordering */
  sequence: number;

  /** Capture timestamp (may differ from event timestamp) */
  capturedAt: number;
}

/**
 * Filter options for events
 */
export interface EventFilter {
  /** Filter by event types */
  types?: EventType[];

  /** Search query for event content */
  search?: string;

  /** Start time filter (timestamp) */
  startTime?: number;

  /** End time filter (timestamp) */
  endTime?: number;
}

/**
 * Return type for useNetworkCapture hook
 */
export interface NetworkCaptureResult {
  /** All captured events */
  events: CapturedEvent[];

  /** Filtered events based on current filter */
  filteredEvents: CapturedEvent[];

  /** Capture a new event */
  captureEvent: (event: StreamEvent) => void;

  /** Clear all captured events */
  clearEvents: () => void;

  /** Current filter settings */
  filter: EventFilter;

  /** Update filter settings */
  setFilter: (filter: EventFilter) => void;

  /** Export events as JSON */
  exportEvents: () => string;

  /** Get event count by type */
  getEventCountByType: () => Record<EventType, number>;

  /** Total number of events captured */
  totalEvents: number;
}

/**
 * Hook for capturing and managing stream events for network inspection
 *
 * This hook provides:
 * - Real-time event capture with minimal performance impact
 * - Filtering by type, search query, and time range
 * - Export functionality for debugging
 * - Event statistics
 *
 * @example
 * ```tsx
 * function MyPattern() {
 *   const { captureEvent, filteredEvents, setFilter } = useNetworkCapture();
 *
 *   // Capture events from your stream
 *   useEffect(() => {
 *     const stream = createMockStream();
 *     stream.on('event', captureEvent);
 *   }, [captureEvent]);
 *
 *   return <NetworkInspector events={filteredEvents} />;
 * }
 * ```
 */
export function useNetworkCapture(): NetworkCaptureResult {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>({});

  /**
   * Capture a new stream event
   * Uses useCallback to maintain stable reference for pattern implementations
   */
  const captureEvent = useCallback((event: StreamEvent): void => {
    const capturedAt = Date.now();

    setEvents((prev) => [
      ...prev,
      {
        event,
        sequence: prev.length,
        capturedAt,
      },
    ]);
  }, []);

  /**
   * Clear all captured events
   */
  const clearEvents = useCallback((): void => {
    setEvents([]);
  }, []);

  /**
   * Filter events based on current filter settings
   * Memoized to avoid unnecessary recalculation
   */
  const filteredEvents = useMemo((): CapturedEvent[] => {
    let result = events;

    // Filter by event types
    if (filter.types && filter.types.length > 0) {
      result = result.filter((captured) =>
        filter.types?.includes(captured.event.type)
      );
    }

    // Filter by search query
    if (filter.search && filter.search.trim() !== '') {
      const searchLower = filter.search.toLowerCase();
      result = result.filter((captured) => {
        // Search in event type
        if (captured.event.type.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Search in JSON representation of event data
        const dataStr = JSON.stringify(captured.event.data).toLowerCase();
        return dataStr.includes(searchLower);
      });
    }

    // Filter by time range
    if (filter.startTime !== undefined) {
      const startTime = filter.startTime;
      result = result.filter(
        (captured) => captured.event.timestamp >= startTime
      );
    }

    if (filter.endTime !== undefined) {
      const endTime = filter.endTime;
      result = result.filter(
        (captured) => captured.event.timestamp <= endTime
      );
    }

    return result;
  }, [events, filter]);

  /**
   * Export events as formatted JSON string
   */
  const exportEvents = useCallback((): string => {
    return JSON.stringify(events, null, 2);
  }, [events]);

  /**
   * Get count of events by type
   * Useful for displaying statistics
   */
  const getEventCountByType = useCallback((): Record<EventType, number> => {
    const counts: Partial<Record<EventType, number>> = {};

    events.forEach((captured) => {
      const type = captured.event.type;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts as Record<EventType, number>;
  }, [events]);

  return {
    events,
    filteredEvents,
    captureEvent,
    clearEvents,
    filter,
    setFilter,
    exportEvents,
    getEventCountByType,
    totalEvents: events.length,
  };
}
