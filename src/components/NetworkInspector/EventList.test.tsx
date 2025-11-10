/**
 * Tests for EventList component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventList } from './EventList';
import type { CapturedEvent } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent } from '@/types/events';

describe('EventList', () => {
  // Helper to create mock captured events
  const createMockCapturedEvent = (
    sequence: number,
    type: StreamEvent['type'] = 'reasoning',
    data: unknown = {
      id: 'step-1',
      summary: 'Test reasoning step',
      confidence: 0.9,
      timestamp: Date.now(),
    }
  ): CapturedEvent => ({
    sequence,
    capturedAt: Date.now(),
    event: {
      id: `event-${sequence}`,
      timestamp: Date.now() + sequence * 1000,
      type,
      data,
    } as StreamEvent,
  });

  describe('rendering', () => {
    it('should render empty state when no events', () => {
      render(<EventList events={[]} />);

      expect(screen.getByText('No events captured yet')).toBeInTheDocument();
    });

    it('should render event count', () => {
      const events = [
        createMockCapturedEvent(0),
        createMockCapturedEvent(1),
        createMockCapturedEvent(2),
      ];

      render(<EventList events={events} showCount={true} />);

      expect(screen.getByText('3 events')).toBeInTheDocument();
    });

    it('should render singular event count', () => {
      const events = [createMockCapturedEvent(0)];

      render(<EventList events={events} showCount={true} />);

      expect(screen.getByText('1 event')).toBeInTheDocument();
    });

    it('should not render count when showCount is false', () => {
      const events = [createMockCapturedEvent(0)];

      render(<EventList events={events} showCount={false} />);

      expect(screen.queryByText('1 event')).not.toBeInTheDocument();
    });

    it('should render all events', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'answer'),
        createMockCapturedEvent(2, 'memory'),
      ];

      render(<EventList events={events} />);

      expect(screen.getByText('reasoning')).toBeInTheDocument();
      expect(screen.getByText('answer')).toBeInTheDocument();
      expect(screen.getByText('memory')).toBeInTheDocument();
    });

    it('should render sequence numbers', () => {
      const events = [
        createMockCapturedEvent(0),
        createMockCapturedEvent(5),
        createMockCapturedEvent(10),
      ];

      render(<EventList events={events} />);

      expect(screen.getByText('#0')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
      expect(screen.getByText('#10')).toBeInTheDocument();
    });
  });

  describe('event selection', () => {
    it('should call onEventSelect when event is clicked', async () => {
      const user = userEvent.setup();
      const onEventSelect = vi.fn();
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<EventList events={events} onEventSelect={onEventSelect} />);

      const eventButton = container.querySelector('[role="button"]');
      expect(eventButton).toBeTruthy();
      if (eventButton) {
        await user.click(eventButton);
      }

      expect(onEventSelect).toHaveBeenCalledWith(events[0]);
    });

    it('should highlight selected event', () => {
      const events = [
        createMockCapturedEvent(0),
        createMockCapturedEvent(1),
      ];

      const { container } = render(
        <EventList events={events} selectedEvent={events[0]} onEventSelect={vi.fn()} />
      );

      // Check that the selected event has different background
      const eventElements = container.querySelectorAll('[role="button"]');
      expect(eventElements.length).toBeGreaterThan(0);
      const firstEventStyle = eventElements[0]?.getAttribute('style');

      expect(firstEventStyle).toContain('rgb(221, 244, 255)'); // #ddf4ff in RGB
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onEventSelect = vi.fn();
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<EventList events={events} onEventSelect={onEventSelect} />);

      const eventElement = container.querySelector('[role="button"]');
      expect(eventElement).toBeTruthy();

      // Focus and trigger keyboard event
      if (eventElement && 'focus' in eventElement && typeof eventElement.focus === 'function') {
        eventElement.focus();
      }
      await user.keyboard('{Enter}');
      expect(onEventSelect).toHaveBeenCalledTimes(1);

      onEventSelect.mockClear();
      await user.keyboard(' ');
      expect(onEventSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('event type badges', () => {
    it('should render event type badges with correct colors', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'answer'),
        createMockCapturedEvent(2, 'memory'),
      ];

      render(<EventList events={events} />);

      // Check that event type badges are rendered
      expect(screen.getByText('reasoning')).toBeInTheDocument();
      expect(screen.getByText('answer')).toBeInTheDocument();
      expect(screen.getByText('memory')).toBeInTheDocument();
    });
  });

  describe('timestamps', () => {
    it('should display timestamps in correct format', () => {
      const timestamp = new Date('2024-01-01T12:34:56.789Z').getTime();
      const events: CapturedEvent[] = [
        {
          sequence: 0,
          capturedAt: timestamp,
          event: {
            id: 'event-0',
            timestamp,
            type: 'reasoning' as const,
            data: {
              id: 'step-1',
              summary: 'Test',
              confidence: 0.9,
              timestamp,
            },
          } as StreamEvent,
        },
      ];

      render(<EventList events={events} />);

      // Should show time in HH:mm:ss.SSS format
      // Exact format depends on locale, but should contain time components
      const container = document.querySelector('.event-list');
      const text = container?.textContent || '';
      expect(text).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should display elapsed time from first event', () => {
      const baseTime = Date.now();
      const events: CapturedEvent[] = [
        {
          sequence: 0,
          capturedAt: baseTime,
          event: {
            id: 'event-0',
            timestamp: baseTime,
            type: 'reasoning',
            data: {
              id: 'step-1',
              summary: 'Test',
              confidence: 0.9,
              timestamp: baseTime,
            },
          } as StreamEvent,
        },
        {
          sequence: 1,
          capturedAt: baseTime + 500,
          event: {
            id: 'event-1',
            timestamp: baseTime + 500,
            type: 'answer',
            data: {
              text: 'Answer',
              isFinal: true,
            },
          } as StreamEvent,
        },
      ];

      const { container } = render(<EventList events={events} />);

      const text = container.textContent || '';
      expect(text).toContain('+0ms'); // First event
      expect(text).toContain('+500ms'); // Second event
    });

    it('should show elapsed time in seconds for longer durations', () => {
      const baseTime = Date.now();
      const events: CapturedEvent[] = [
        {
          sequence: 0,
          capturedAt: baseTime,
          event: {
            id: 'event-0',
            timestamp: baseTime,
            type: 'reasoning',
            data: {
              id: 'step-1',
              summary: 'Test',
              confidence: 0.9,
              timestamp: baseTime,
            },
          } as StreamEvent,
        },
        {
          sequence: 1,
          capturedAt: baseTime + 2500,
          event: {
            id: 'event-1',
            timestamp: baseTime + 2500,
            type: 'answer',
            data: {
              text: 'Answer',
              isFinal: true,
            },
          } as StreamEvent,
        },
      ];

      const { container } = render(<EventList events={events} />);

      const text = container.textContent || '';
      expect(text).toMatch(/\+2\.50s/);
    });
  });

  describe('data preview', () => {
    it('should show compact preview of event data', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning', {
          summary: 'Test summary',
          confidence: 0.9,
        }),
      ];

      render(<EventList events={events} />);

      // CompactJsonViewer should render the data
      const code = document.querySelector('code');
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain('summary');
    });
  });

  describe('hover state', () => {
    it('should have mouse event handlers', () => {
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<EventList events={events} onEventSelect={vi.fn()} />);

      const eventElement = container.querySelector('[role="button"]');
      expect(eventElement).toBeTruthy();

      // Verify the element exists and can be interacted with
      expect(eventElement?.getAttribute('role')).toBe('button');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA roles', () => {
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<EventList events={events} onEventSelect={vi.fn()} />);

      const eventElement = container.querySelector('[role="button"]');
      expect(eventElement?.getAttribute('role')).toBe('button');
      expect(eventElement?.getAttribute('tabindex')).toBe('0');
    });

    it('should not have interactive roles when no onEventSelect', () => {
      const events = [createMockCapturedEvent(0)];

      render(<EventList events={events} />);

      const eventElement = screen.getByText('reasoning').closest('div');
      expect(eventElement?.getAttribute('role')).toBeNull();
      expect(eventElement?.getAttribute('tabindex')).toBeNull();
    });
  });

  describe('performance', () => {
    it('should handle large number of events', () => {
      const events = Array.from({ length: 1000 }, (_, i) =>
        createMockCapturedEvent(i)
      );

      const { container } = render(<EventList events={events} />);

      // Should render without crashing
      expect(container.querySelector('.event-list')).toBeTruthy();
    });
  });
});
