/**
 * Event List Component
 *
 * Displays a list of captured stream events with filtering and selection capabilities.
 *
 * @module components/NetworkInspector/EventList
 */

import React, { useState, useMemo } from 'react';
import type { CapturedEvent } from '@/lib/hooks/useNetworkCapture';
import type { EventType } from '@/types/events';
import { CompactJsonViewer } from './JsonViewer';

/**
 * Props for EventList component
 */
export interface EventListProps {
  /** Array of captured events to display */
  events: CapturedEvent[];

  /** Callback when an event is selected */
  onEventSelect?: (event: CapturedEvent) => void;

  /** Currently selected event */
  selectedEvent?: CapturedEvent | null;

  /** Optional CSS class name */
  className?: string;

  /** Show event count in header */
  showCount?: boolean;
}

/**
 * Event List component
 *
 * Displays a scrollable list of stream events with:
 * - Event type badges
 * - Timestamps
 * - Compact preview of event data
 * - Selection highlighting
 * - Event count display
 *
 * @example
 * ```tsx
 * <EventList
 *   events={capturedEvents}
 *   onEventSelect={(event) => console.log(event)}
 *   showCount={true}
 * />
 * ```
 */
export function EventList({
  events,
  onEventSelect,
  selectedEvent,
  className = '',
  showCount = true,
}: EventListProps): React.ReactElement {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  /**
   * Get color for event type badge
   */
  const getEventTypeColor = (type: EventType): string => {
    const colorMap: Record<string, string> = {
      reasoning: '#0969da',
      answer: '#1a7f37',
      memory: '#8250df',
      await_input: '#bf8700',
      input_submission: '#9a6700',
      checkpoint: '#0969da',
      validation: '#cf222e',
      schema: '#6639ba',
      table_row: '#0969da',
      table_meta: '#57606a',
      agent_patch: '#8250df',
      user_patch: '#1f883d',
      schema_definition: '#6639ba',
      payload: '#0969da',
      schema_error: '#d1242f',
    };

    return colorMap[type] || '#57606a';
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  /**
   * Get elapsed time since first event
   */
  const getElapsedTime = useMemo(() => {
    if (events.length === 0) return () => '';

    const firstTimestamp = events[0].event.timestamp;

    return (timestamp: number): string => {
      const elapsed = timestamp - firstTimestamp;
      if (elapsed < 1000) {
        return `+${elapsed}ms`;
      }
      return `+${(elapsed / 1000).toFixed(2)}s`;
    };
  }, [events]);

  return (
    <div
      className={`event-list ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {showCount && (
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #d0d7de',
            backgroundColor: '#f6f8fa',
            fontSize: '12px',
            fontWeight: 500,
            color: '#57606a',
          }}
        >
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </div>
      )}

      {/* Event list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {events.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#57606a',
              fontSize: '14px',
            }}
          >
            No events captured yet
          </div>
        ) : (
          <div>
            {events.map((captured) => {
              const isSelected =
                selectedEvent?.sequence === captured.sequence;
              const isHovered = hoveredEventId === captured.event.id;

              return (
                <button
                  key={captured.sequence}
                  onClick={() => onEventSelect?.(captured)}
                  onMouseEnter={() => setHoveredEventId(captured.event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 12px',
                    borderBottom: '1px solid #d0d7de',
                    cursor: onEventSelect ? 'pointer' : 'default',
                    backgroundColor: isSelected
                      ? '#ddf4ff'
                      : isHovered
                        ? '#f6f8fa'
                        : '#ffffff',
                    transition: 'background-color 0.1s ease',
                  }}
                  role={onEventSelect ? 'button' : undefined}
                  tabIndex={onEventSelect ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (
                      onEventSelect &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      e.preventDefault();
                      onEventSelect(captured);
                    }
                  }}
                >
                  {/* Event header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    {/* Sequence number */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#57606a',
                        fontFamily: 'monospace',
                        minWidth: '30px',
                      }}
                    >
                      #{captured.sequence}
                    </span>

                    {/* Event type badge */}
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#ffffff',
                        backgroundColor: getEventTypeColor(
                          captured.event.type
                        ),
                      }}
                    >
                      {captured.event.type}
                    </span>

                    {/* Timestamp */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#57606a',
                        fontFamily: 'monospace',
                        marginLeft: 'auto',
                      }}
                    >
                      {formatTimestamp(captured.event.timestamp)}
                    </span>

                    {/* Elapsed time */}
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#57606a',
                        fontFamily: 'monospace',
                      }}
                    >
                      {getElapsedTime(captured.event.timestamp)}
                    </span>
                  </div>

                  {/* Event data preview */}
                  <div
                    style={{
                      marginLeft: '38px',
                      fontSize: '12px',
                    }}
                  >
                    <CompactJsonViewer
                      data={captured.event.data}
                      maxLength={80}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
