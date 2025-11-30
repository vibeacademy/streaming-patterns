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
import userEvent from '@testing-library/user-event';
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

    expect(screen.getByText(/stream speed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
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

  it('should toggle network inspector visibility', async () => {
    const user = userEvent.setup();
    render(<TabularStreamViewDemo />);

    // Inspector should be hidden by default
    expect(screen.queryByTestId('network-inspector')).not.toBeInTheDocument();

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /show inspector/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to show inspector
    await user.click(toggleButton);

    // Inspector should now be visible
    expect(screen.getByTestId('network-inspector')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide inspector/i })).toBeInTheDocument();

    // Click again to hide
    await user.click(screen.getByRole('button', { name: /hide inspector/i }));
    expect(screen.queryByTestId('network-inspector')).not.toBeInTheDocument();
  });

  it('should integrate with network inspector when visible', async () => {
    const user = userEvent.setup();
    render(<TabularStreamViewDemo />);

    // Show the inspector
    const toggleButton = screen.getByRole('button', { name: /show inspector/i });
    await user.click(toggleButton);

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

    // Speed buttons should be present
    const fastButton = screen.getByRole('button', { name: /^fast$/i });
    const normalButton = screen.getByRole('button', { name: /^normal$/i });
    const slowButton = screen.getByRole('button', { name: /^slow$/i });

    expect(fastButton).toBeInTheDocument();
    expect(normalButton).toBeInTheDocument();
    expect(slowButton).toBeInTheDocument();

    // Normal should be selected initially (primary variant)
    expect(normalButton).toHaveAttribute('aria-pressed', 'true');
    expect(fastButton).toHaveAttribute('aria-pressed', 'false');
    expect(slowButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have restart button', () => {
    render(<TabularStreamViewDemo />);

    // Restart button should be present (using getByRole to get the button element, not the inner span)
    const restartButton = screen.getByRole('button', { name: /restart/i });
    expect(restartButton).toBeInTheDocument();

    // Button should be a button element
    expect(restartButton.tagName).toBe('BUTTON');
  });

  it('should render pattern learning points', () => {
    render(<TabularStreamViewDemo />);

    expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();

    // Check for key learning concepts
    expect(screen.getByText(/Progressive Rendering:/i)).toBeInTheDocument();
    expect(screen.getByText(/Client-Side Operations:/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Flow:/i)).toBeInTheDocument();
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
