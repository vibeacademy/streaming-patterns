/**
 * Integration tests for TabularStreamViewDemo component
 *
 * Verifies end-to-end functionality:
 * - Component renders without errors
 * - Stream completes and displays all data
 * - Controls work correctly
 * - Network inspector integration
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TabularStreamViewDemo } from './TabularStreamViewDemo';

// Mock NetworkInspector to avoid dependency issues
vi.mock('@/components/NetworkInspector', () => ({
  NetworkInspector: ({ events }: { events: unknown[] }) => (
    <div data-testid="network-inspector">
      {events.length} events captured
    </div>
  )
}));

describe('TabularStreamViewDemo', () => {
  it('should render without crashing', () => {
    render(<TabularStreamViewDemo />);

    expect(screen.getByText(/Tabular Stream View/i)).toBeInTheDocument();
  });

  it('should render scenario description', () => {
    render(<TabularStreamViewDemo />);

    // ScenarioCard renders with default "Scenario" title and custom description
    expect(screen.getByText(/Scenario/i)).toBeInTheDocument();
    expect(screen.getByText(/StreamFlow PM analyzes your engineering team/i)).toBeInTheDocument();
  });

  it('should render demo controls', () => {
    render(<TabularStreamViewDemo />);

    expect(screen.getByLabelText(/demo speed/i)).toBeInTheDocument();
    expect(screen.getByText(/restart/i)).toBeInTheDocument();
  });

  it('should stream data and complete', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for streaming to start (matches "Streaming data... (X of Y rows)")
    await waitFor(
      () => {
        expect(screen.getByText(/streaming data\.\.\./i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Wait for completion (specifically in the footer section)
    await waitFor(
      () => {
        const footer = document.querySelector('[class*="footer"]');
        expect(footer).toBeInTheDocument();
        expect(footer?.textContent).toMatch(/stream complete/i);
      },
      { timeout: 8000 }
    );
  });

  it('should display table data', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for schema to arrive - check for column header in table
    // Note: "Team Member" appears in both sort dropdown options AND table header
    await waitFor(
      () => {
        // Check for table header cells - schema must have arrived
        const headerCells = document.querySelectorAll('th');
        expect(headerCells.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Check for data rows (wait for at least one row to stream in)
    await waitFor(
      () => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + at least 1 data row
      },
      { timeout: 5000 }
    );
  });

  it('should show completion footer when done', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for completion footer to appear
    await waitFor(
      () => {
        const footer = document.querySelector('[class*="footer"]');
        expect(footer).toBeInTheDocument();
        expect(footer?.textContent).toMatch(/stream complete/i);
      },
      { timeout: 8000 }
    );

    // Check for aggregations section
    await waitFor(() => {
      expect(screen.getByText(/summary statistics/i)).toBeInTheDocument();
    });

    // Check for export button
    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
  });

  it('should integrate with network inspector', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for stream to start and capture events
    await waitFor(
      () => {
        const inspector = screen.getByTestId('network-inspector');
        const text = inspector.textContent || '';
        // Should have captured at least 1 event (schema + rows)
        expect(text).toMatch(/[1-9]\d* events captured/);
      },
      { timeout: 8000 }
    );
  });

  it('should allow speed selection', async () => {
    render(<TabularStreamViewDemo />);

    // Initially speed select should be present
    const speedSelect = screen.getByLabelText(/demo speed/i);
    expect(speedSelect).toBeInTheDocument();

    // Initial value should be 'normal'
    expect(speedSelect).toHaveValue('normal');

    // Options should be available
    expect(screen.getByRole('option', { name: /fast/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /normal/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /slow/i })).toBeInTheDocument();
  });

  it('should have restart button', () => {
    render(<TabularStreamViewDemo />);

    // Restart button should be present (using getByRole to get the button element, not the inner span)
    const restartButton = screen.getByRole('button', { name: /restart/i });
    expect(restartButton).toBeInTheDocument();

    // Button should be a button element
    expect(restartButton.tagName).toBe('BUTTON');
  });

  it('should render educational notes', () => {
    render(<TabularStreamViewDemo />);

    expect(screen.getByText(/Pattern Implementation Notes/i)).toBeInTheDocument();

    // Use getAllByText and check that at least one exists (matches heading in notes section)
    const progressiveRenderingElements = screen.getAllByText(/Progressive Rendering/i);
    expect(progressiveRenderingElements.length).toBeGreaterThan(0);

    expect(screen.getByText(/Client-Side Operations/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Flow/i)).toBeInTheDocument();
  });

  it('should show table controls', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for schema to load so controls appear
    await waitFor(
      () => {
        expect(screen.getByText(/sort by/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Filters text appears in control group
    const filtersElements = screen.getAllByText(/filters/i);
    expect(filtersElements.length).toBeGreaterThan(0);
  });

  it('should display aggregations when complete', async () => {
    render(<TabularStreamViewDemo />);

    // Wait for stream to complete and footer to appear
    await waitFor(
      () => {
        const footer = document.querySelector('[class*="footer"]');
        expect(footer).toBeInTheDocument();
        expect(footer?.textContent).toMatch(/stream complete/i);
      },
      { timeout: 8000 }
    );

    // Should show some aggregation values (Average or Total)
    await waitFor(() => {
      const aggregationText = document.body.textContent || '';
      expect(aggregationText).toMatch(/(average|total)/i);
    });
  });
});
