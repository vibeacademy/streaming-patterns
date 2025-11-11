/**
 * Tests for NetworkInspector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetworkInspector } from './NetworkInspector';
import type { CapturedEvent } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent } from '@/types/events';

describe('NetworkInspector', () => {
  // Helper to create mock captured events
  const createMockCapturedEvent = (
    sequence: number,
    type: StreamEvent['type'] = 'reasoning',
    data: unknown = { test: 'data' }
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
    it('should render with default title', () => {
      render(<NetworkInspector events={[]} />);

      expect(screen.getByText('Network Inspector')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<NetworkInspector events={[]} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should show event count badge', () => {
      const events = [
        createMockCapturedEvent(0),
        createMockCapturedEvent(1),
        createMockCapturedEvent(2),
      ];

      render(<NetworkInspector events={events} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'answer'),
      ];

      const { container } = render(
        <NetworkInspector events={events} compact={true} />
      );

      const compact = container.querySelector('.network-inspector-compact');
      expect(compact).toBeTruthy();
      expect(compact?.textContent).toContain('Events: 2');
    });
  });

  describe('toolbar buttons', () => {
    it('should render export button', () => {
      render(<NetworkInspector events={[createMockCapturedEvent(0)]} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should disable export button when no events', () => {
      render(<NetworkInspector events={[]} />);

      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeDisabled();
    });

    it('should call onExportEvents when export clicked', async () => {
      const user = userEvent.setup();
      const onExportEvents = vi.fn();

      render(
        <NetworkInspector
          events={[createMockCapturedEvent(0)]}
          onExportEvents={onExportEvents}
        />
      );

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(onExportEvents).toHaveBeenCalled();
    });

    it('should render clear button', () => {
      render(<NetworkInspector events={[createMockCapturedEvent(0)]} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should disable clear button when no events', () => {
      render(<NetworkInspector events={[]} />);

      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeDisabled();
    });

    it('should call onClearEvents when clear clicked', async () => {
      const user = userEvent.setup();
      const onClearEvents = vi.fn();

      render(
        <NetworkInspector
          events={[createMockCapturedEvent(0)]}
          onClearEvents={onClearEvents}
        />
      );

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(onClearEvents).toHaveBeenCalled();
    });

    it('should render collapse/expand button', () => {
      render(<NetworkInspector events={[]} />);

      // Should show collapse button (▲) when expanded
      expect(screen.getByLabelText('Collapse inspector')).toBeInTheDocument();
    });

    it('should toggle collapse state', async () => {
      const user = userEvent.setup();
      render(<NetworkInspector events={[createMockCapturedEvent(0)]} />);

      const collapseButton = screen.getByLabelText('Collapse inspector');
      await user.click(collapseButton);

      // After collapse, should show expand button
      expect(screen.getByLabelText('Expand inspector')).toBeInTheDocument();

      // Search input should be hidden
      expect(screen.queryByPlaceholderText('Search events...')).not.toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should render search input', () => {
      render(<NetworkInspector events={[]} />);

      expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
    });

    it('should call onFilterChange when search input changes', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();

      render(
        <NetworkInspector
          events={[createMockCapturedEvent(0)]}
          onFilterChange={onFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'test');

      expect(onFilterChange).toHaveBeenCalled();
      const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
      expect(lastCall.search).toBe('test');
    });
  });

  describe('event type filters', () => {
    it('should render filter buttons for each event type', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'answer'),
        createMockCapturedEvent(2, 'memory'),
      ];

      render(<NetworkInspector events={events} />);

      expect(screen.getByRole('button', { name: /reasoning \(1\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /answer \(1\)/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /memory \(1\)/ })).toBeInTheDocument();
    });

    it('should show event count for each type', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'reasoning'),
        createMockCapturedEvent(2, 'answer'),
      ];

      render(<NetworkInspector events={events} />);

      expect(screen.getByText(/reasoning \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/answer \(1\)/)).toBeInTheDocument();
    });

    it('should toggle filter when type button clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();

      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'answer'),
      ];

      render(
        <NetworkInspector
          events={events}
          onFilterChange={onFilterChange}
        />
      );

      const reasoningButton = screen.getByRole('button', { name: /reasoning \(1\)/ });
      await user.click(reasoningButton);

      expect(onFilterChange).toHaveBeenCalled();
      const call = onFilterChange.mock.calls[0][0];
      expect(call.types).toContain('reasoning');
    });

    it('should update button style when filter is active', () => {
      const events = [createMockCapturedEvent(0, 'reasoning')];

      render(
        <NetworkInspector
          events={events}
          filter={{ types: ['reasoning'] }}
        />
      );

      const activeButton = screen.getByRole('button', { name: /reasoning \(1\)/ });
      expect(activeButton.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('event selection and details', () => {
    it('should not show details panel initially', () => {
      const events = [createMockCapturedEvent(0)];

      render(<NetworkInspector events={events} />);

      expect(screen.queryByText('Event Details')).not.toBeInTheDocument();
    });

    it('should show details panel when event is selected', async () => {
      const user = userEvent.setup();
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<NetworkInspector events={events} />);

      // Click on an event (this will be in the EventList)
      const eventButton = container.querySelector('[role="button"]');
      expect(eventButton).toBeTruthy();
      if (eventButton) {
        await user.click(eventButton);
      }

      // Details panel should appear
      expect(screen.getByText('Event Details')).toBeInTheDocument();
    });

    it('should display event metadata in details panel', async () => {
      const user = userEvent.setup();
      const timestamp = Date.now();
      const events: CapturedEvent[] = [
        {
          sequence: 5,
          capturedAt: timestamp,
          event: {
            id: 'test-event-id',
            timestamp,
            type: 'reasoning',
            data: {
              id: 'step-1',
              summary: 'Test step',
              confidence: 0.9,
              timestamp,
            },
          } as StreamEvent,
        },
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Click on the event in the EventList
      const eventButton = container.querySelector('[role="button"]');
      expect(eventButton).toBeTruthy();
      if (eventButton) {
        await user.click(eventButton);
      }

      // Wait for details panel to appear
      expect(screen.getByText('Event Details')).toBeInTheDocument();
      expect(screen.getByText(/Sequence:/)).toBeInTheDocument();
      expect(screen.getByText(/Type:/)).toBeInTheDocument();
      expect(screen.getByText(/test-event-id/)).toBeInTheDocument();
    });

    it('should close details panel when close button clicked', async () => {
      const user = userEvent.setup();
      const events = [createMockCapturedEvent(0)];

      const { container } = render(<NetworkInspector events={events} />);

      // Select event
      const eventButton = container.querySelector('[role="button"]');
      expect(eventButton).toBeTruthy();
      if (eventButton) {
        await user.click(eventButton);
      }

      // Close details
      const closeButton = screen.getByLabelText('Close details');
      await user.click(closeButton);

      expect(screen.queryByText('Event Details')).not.toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should create download link when exporting', async () => {
      const user = userEvent.setup();
      const events = [createMockCapturedEvent(0)];

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const createObjectURL = vi.fn(() => 'blob:mock-url');
      const revokeObjectURL = vi.fn();
      const originalURL = globalThis.URL;
      // @ts-expect-error - Mocking URL for test
      globalThis.URL = {
        ...originalURL,
        createObjectURL,
        revokeObjectURL,
      };

      render(<NetworkInspector events={events} />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(createObjectURL).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();

      // Restore original URL
      globalThis.URL = originalURL;
    });
  });

  describe('compact mode statistics', () => {
    it('should show event statistics in compact mode', () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning'),
        createMockCapturedEvent(1, 'reasoning'),
        createMockCapturedEvent(2, 'answer'),
      ];

      const { container } = render(
        <NetworkInspector events={events} compact={true} />
      );

      const text = container.textContent || '';
      expect(text).toContain('Events: 3');
      expect(text).toContain('reasoning: 2');
      expect(text).toContain('answer: 1');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<NetworkInspector events={[createMockCapturedEvent(0)]} />);

      expect(screen.getByLabelText('Collapse inspector')).toBeInTheDocument();
      expect(screen.getByLabelText('Search events')).toBeInTheDocument();
    });

    it('should have proper button states', () => {
      render(<NetworkInspector events={[]} />);

      const exportButton = screen.getByText('Export');
      const clearButton = screen.getByText('Clear');

      expect(exportButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });
  });

  describe('event filtering', () => {
    it('should filter events by type when badge is clicked', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
        createMockCapturedEvent(2, 'reasoning', { summary: 'Step 2' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Verify all 3 events are initially shown
      const eventItems = container.querySelectorAll('[role="button"]');
      expect(eventItems.length).toBe(3);

      // Click reasoning filter
      const reasoningButton = screen.getByRole('button', { name: /reasoning \(2\)/ });
      await user.click(reasoningButton);

      // Should only show 2 reasoning events
      const filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(2);
    });

    it('should support multiple type filters with OR logic', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
        createMockCapturedEvent(2, 'memory', { content: 'Memory 1' }),
        createMockCapturedEvent(3, 'reasoning', { summary: 'Step 2' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Click reasoning filter
      const reasoningButton = screen.getByRole('button', { name: /reasoning \(2\)/ });
      await user.click(reasoningButton);

      // Should show 2 reasoning events
      let filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(2);

      // Click answer filter (add to existing filter)
      const answerButton = screen.getByRole('button', { name: /answer \(1\)/ });
      await user.click(answerButton);

      // Should show 3 events (2 reasoning + 1 answer)
      filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(3);
    });

    it('should remove filter when clicking active badge', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Click reasoning filter
      const reasoningButton = screen.getByRole('button', { name: /reasoning \(1\)/ });
      await user.click(reasoningButton);

      // Should show 1 event
      let filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);

      // Click again to remove filter
      await user.click(reasoningButton);

      // Should show all 2 events again
      filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(2);
    });

    it('should show empty state when no events match type filter', async () => {
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
        createMockCapturedEvent(2, 'memory', { content: 'Memory 1' }),
      ];

      // Render with memory filter active (which would filter out reasoning and answer)
      render(
        <NetworkInspector events={events} filter={{ types: ['checkpoint'] }} />
      );

      // Should show empty state since no checkpoint events exist
      expect(screen.getByText('No matching events')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
    });

    it('should filter events by search query', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Analyzing backlog' }),
        createMockCapturedEvent(1, 'answer', { text: 'Sprint plan created' }),
        createMockCapturedEvent(2, 'reasoning', { summary: 'Checking capacity' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Type search query
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'backlog');

      // Should only show 1 event matching "backlog"
      const filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);
    });

    it('should search across event type, data, and timestamps', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Search by event type
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.clear(searchInput);
      await user.type(searchInput, 'reasoning');

      let filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);

      // Search by data content
      await user.clear(searchInput);
      await user.type(searchInput, 'Answer');

      filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);
    });

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Analyzing Backlog' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'BACKLOG');

      const filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);
    });

    it('should show empty state when search has no matches', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
      ];

      render(<NetworkInspector events={events} />);

      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No matching events')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
    });

    it('should combine type filter and search filter', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Analyzing backlog' }),
        createMockCapturedEvent(1, 'reasoning', { summary: 'Checking capacity' }),
        createMockCapturedEvent(2, 'answer', { text: 'Sprint plan' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Apply type filter for reasoning
      const reasoningButton = screen.getByRole('button', { name: /reasoning \(2\)/ });
      await user.click(reasoningButton);

      // Should show 2 reasoning events
      let filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(2);

      // Add search filter
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'backlog');

      // Should show 1 event (reasoning + contains "backlog")
      filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);
    });

    it('should clear search filter when input is cleared', async () => {
      const user = userEvent.setup();
      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
      ];

      const { container } = render(<NetworkInspector events={events} />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'reasoning');

      let filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(1);

      // Clear search
      await user.clear(searchInput);

      // Should show all events
      filteredItems = container.querySelectorAll('[role="button"]');
      expect(filteredItems.length).toBe(2);
    });
  });

  describe('integration', () => {
    it('should work end-to-end with multiple events and filters', async () => {
      const user = userEvent.setup();
      const onFilterChange = vi.fn();

      const events = [
        createMockCapturedEvent(0, 'reasoning', { summary: 'Step 1' }),
        createMockCapturedEvent(1, 'answer', { text: 'Answer 1' }),
        createMockCapturedEvent(2, 'reasoning', { summary: 'Step 2' }),
        createMockCapturedEvent(3, 'memory', { content: 'Memory 1' }),
      ];

      render(
        <NetworkInspector
          events={events}
          onFilterChange={onFilterChange}
        />
      );

      // Verify all events are shown
      expect(screen.getByText('4')).toBeInTheDocument();

      // Apply filter
      const reasoningButton = screen.getByText(/reasoning \(2\)/);
      await user.click(reasoningButton);

      expect(onFilterChange).toHaveBeenCalledWith({
        types: ['reasoning'],
      });

      // Use search
      const searchInput = screen.getByPlaceholderText('Search events...');
      await user.type(searchInput, 'Step 1');

      expect(onFilterChange).toHaveBeenCalled();
    });
  });
});
