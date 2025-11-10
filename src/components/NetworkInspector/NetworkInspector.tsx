/**
 * Network Inspector Component
 *
 * Main component for visualizing and debugging stream events in real-time.
 * Provides filtering, search, event inspection, and export capabilities.
 *
 * @module components/NetworkInspector/NetworkInspector
 */

import React, { useState, useCallback } from 'react';
import type { CapturedEvent, EventFilter } from '@/lib/hooks/useNetworkCapture';
import type { EventType } from '@/types/events';
import { EventList } from './EventList';
import { JsonViewer } from './JsonViewer';

/**
 * Props for NetworkInspector component
 */
export interface NetworkInspectorProps {
  /** Array of captured events to display */
  events: CapturedEvent[];

  /** Current filter settings */
  filter?: EventFilter;

  /** Callback when filter changes */
  onFilterChange?: (filter: EventFilter) => void;

  /** Callback to clear all events */
  onClearEvents?: () => void;

  /** Callback to export events */
  onExportEvents?: () => void;

  /** Optional CSS class name */
  className?: string;

  /** Whether to show in compact mode */
  compact?: boolean;

  /** Title for the inspector panel */
  title?: string;
}

/**
 * Network Inspector - Developer tool for visualizing stream events
 *
 * This component provides a comprehensive view of all streaming events with:
 * - Real-time event capture and display
 * - Filtering by event type
 * - Search functionality
 * - Detailed JSON inspection
 * - Export to JSON file
 * - Event statistics
 *
 * Performance Characteristics:
 * - Updates within 50ms of event capture (requirement: INV-15)
 * - Minimal performance impact <5% (requirement: INV-17)
 * - Efficient rendering with memoization
 *
 * @example
 * ```tsx
 * function MyPatternDemo() {
 *   const { events, filter, setFilter, clearEvents, exportEvents } = useNetworkCapture();
 *
 *   return (
 *     <div>
 *       <MyPattern onEvent={(e) => captureEvent(e)} />
 *       <NetworkInspector
 *         events={events}
 *         filter={filter}
 *         onFilterChange={setFilter}
 *         onClearEvents={clearEvents}
 *         onExportEvents={exportEvents}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function NetworkInspector({
  events,
  filter = {},
  onFilterChange,
  onClearEvents,
  onExportEvents,
  className = '',
  compact = false,
  title = 'Network Inspector',
}: NetworkInspectorProps): React.ReactElement {
  const [selectedEvent, setSelectedEvent] = useState<CapturedEvent | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState(filter.search || '');
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>(
    filter.types || []
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback(
    (query: string): void => {
      setSearchQuery(query);
      onFilterChange?.({
        ...filter,
        search: query,
      });
    },
    [filter, onFilterChange]
  );

  /**
   * Handle event type filter toggle
   */
  const handleTypeToggle = useCallback(
    (type: EventType): void => {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];

      setSelectedTypes(newTypes);
      onFilterChange?.({
        ...filter,
        types: newTypes.length > 0 ? newTypes : undefined,
      });
    },
    [selectedTypes, filter, onFilterChange]
  );

  /**
   * Handle export to JSON file
   */
  const handleExport = useCallback((): void => {
    if (onExportEvents) {
      onExportEvents();
      return;
    }

    // Default export implementation
    const jsonStr = JSON.stringify(events, null, 2);
    // eslint-disable-next-line no-undef
    const blob = new Blob([jsonStr], { type: 'application/json' });
    // eslint-disable-next-line no-undef
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-events-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // eslint-disable-next-line no-undef
    URL.revokeObjectURL(url);
  }, [events, onExportEvents]);

  /**
   * Get unique event types from captured events
   */
  const uniqueEventTypes = Array.from(
    new Set(events.map((e) => e.event.type))
  ).sort();

  /**
   * Get event count by type for statistics
   */
  const eventCountByType = events.reduce(
    (acc, captured) => {
      const type = captured.event.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (compact) {
    return (
      <div
        className={`network-inspector-compact ${className}`}
        style={{
          padding: '8px 12px',
          backgroundColor: '#f6f8fa',
          border: '1px solid #d0d7de',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#57606a',
        }}
      >
        <strong>Events:</strong> {events.length}
        {uniqueEventTypes.length > 0 && (
          <span style={{ marginLeft: '12px' }}>
            {uniqueEventTypes.map((type) => (
              <span key={type} style={{ marginLeft: '8px' }}>
                {type}: {eventCountByType[type]}
              </span>
            ))}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`network-inspector ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #d0d7de',
          backgroundColor: '#f6f8fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
            {title}
          </h3>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: '#0969da',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 500,
            }}
          >
            {events.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExport}
            disabled={events.length === 0}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: events.length === 0 ? '#8c959f' : '#24292f',
              backgroundColor: '#ffffff',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              cursor: events.length === 0 ? 'not-allowed' : 'pointer',
            }}
            title="Export events to JSON file"
          >
            Export
          </button>
          <button
            onClick={onClearEvents}
            disabled={events.length === 0}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: events.length === 0 ? '#8c959f' : '#24292f',
              backgroundColor: '#ffffff',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              cursor: events.length === 0 ? 'not-allowed' : 'pointer',
            }}
            title="Clear all events"
          >
            Clear
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: '#57606a',
              backgroundColor: '#ffffff',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            aria-label={isCollapsed ? 'Expand inspector' : 'Collapse inspector'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Toolbar */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #d0d7de',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Search input */}
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                marginBottom: '8px',
              }}
              aria-label="Search events"
            />

            {/* Event type filters */}
            {uniqueEventTypes.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {uniqueEventTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: isSelected ? '#ffffff' : '#57606a',
                        backgroundColor: isSelected ? '#0969da' : '#f6f8fa',
                        border: '1px solid #d0d7de',
                        borderRadius: '12px',
                        cursor: 'pointer',
                      }}
                      aria-pressed={isSelected}
                    >
                      {type} ({eventCountByType[type]})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* Event list */}
            <div
              style={{
                flex: selectedEvent ? '0 0 40%' : '1',
                borderRight: selectedEvent ? '1px solid #d0d7de' : 'none',
                overflow: 'hidden',
              }}
            >
              <EventList
                events={events}
                onEventSelect={setSelectedEvent}
                selectedEvent={selectedEvent}
                showCount={false}
              />
            </div>

            {/* Event details panel */}
            {selectedEvent && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Details header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #d0d7de',
                    backgroundColor: '#f6f8fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#24292f',
                    }}
                  >
                    Event Details
                  </span>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      color: '#57606a',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label="Close details"
                  >
                    ✕
                  </button>
                </div>

                {/* Event metadata */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #d0d7de',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Sequence:</strong> #{selectedEvent.sequence}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Type:</strong> {selectedEvent.event.type}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Timestamp:</strong>{' '}
                    {new Date(selectedEvent.event.timestamp).toISOString()}
                  </div>
                  {selectedEvent.event.id && (
                    <div>
                      <strong>ID:</strong> {selectedEvent.event.id}
                    </div>
                  )}
                </div>

                {/* Event data */}
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    overflow: 'auto',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                    Event Data:
                  </div>
                  <JsonViewer data={selectedEvent.event.data} expanded={true} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
