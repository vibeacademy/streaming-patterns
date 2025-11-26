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

    expect(screen.getByText(/Team Capacity Planning/i)).toBeInTheDocument();
    expect(screen.getByText(/StreamFlow PM/i)).toBeInTheDocument();
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

    // Wait for data to appear
    await waitFor(
      () => {
        expect(screen.getByText(/Team Member/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Check for some team member names
    await waitFor(
      () => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data rows
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

    // Restart button should be present
    const restartButton = screen.getByText(/restart/i);
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
