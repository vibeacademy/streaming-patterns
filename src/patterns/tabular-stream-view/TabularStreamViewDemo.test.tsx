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
import { userEvent } from '@testing-library/user-event';
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

    // Wait for streaming to start
    await waitFor(
      () => {
        expect(screen.getByText(/streaming data/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByText(/stream complete/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
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

    await waitFor(
      () => {
        expect(screen.getByText(/stream complete/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText(/summary statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
  });

  it('should integrate with network inspector', async () => {
    render(<TabularStreamViewDemo />);

    await waitFor(
      () => {
        const inspector = screen.getByTestId('network-inspector');
        const text = inspector.textContent || '';
        // Should have captured events
        expect(text).toMatch(/\d+ events captured/);
      },
      { timeout: 5000 }
    );
  });

  it('should allow speed selection', async () => {
    const user = userEvent.setup();

    render(<TabularStreamViewDemo />);

    const speedSelect = screen.getByLabelText(/demo speed/i);

    // Change speed
    await user.selectOptions(speedSelect, 'fast');

    // Speed select should update (component will restart)
    await waitFor(() => {
      expect((speedSelect as HTMLSelectElement).value).toBe('fast');
    });
  });

  it('should allow restart', async () => {
    const user = userEvent.setup();

    render(<TabularStreamViewDemo />);

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.getByText(/streaming data/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    const restartButton = screen.getByText(/restart/i);

    // Click restart
    await user.click(restartButton);

    // Should restart streaming
    await waitFor(
      () => {
        expect(screen.getByText(/streaming data/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should render educational notes', () => {
    render(<TabularStreamViewDemo />);

    expect(screen.getByText(/Pattern Implementation Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Progressive Rendering/i)).toBeInTheDocument();
    expect(screen.getByText(/Client-Side Operations/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Flow/i)).toBeInTheDocument();
  });

  it('should show table controls', async () => {
    render(<TabularStreamViewDemo />);

    await waitFor(
      () => {
        expect(screen.getByText(/sort by/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('should display aggregations when complete', async () => {
    render(<TabularStreamViewDemo />);

    await waitFor(
      () => {
        expect(screen.getByText(/stream complete/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Should show some aggregation values
    expect(screen.getByText(/average/i)).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });
});
