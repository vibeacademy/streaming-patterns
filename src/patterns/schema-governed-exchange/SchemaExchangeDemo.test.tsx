/**
 * SchemaExchangeDemo Component Tests
 *
 * Integration tests for the full pattern demo.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SchemaExchangeDemo } from './SchemaExchangeDemo';

// Mock NetworkInspector to avoid test complexity
vi.mock('@/components/NetworkInspector/NetworkInspector', () => ({
  NetworkInspector: () => <div data-testid="network-inspector">Network Inspector</div>,
}));

describe('SchemaExchangeDemo', () => {
  it('should render the demo with initial state', () => {
    render(<SchemaExchangeDemo />);

    expect(screen.getByText('Schema-Governed Exchange Pattern')).toBeInTheDocument();
    expect(screen.getByText(/Real-time validation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Stream/i })).toBeInTheDocument();
  });

  it('should render scenario selector with all options', () => {
    render(<SchemaExchangeDemo />);

    const scenarioSelect = screen.getByLabelText(/Scenario:/i) as HTMLSelectElement;
    expect(scenarioSelect).toBeInTheDocument();

    const scenarioOptions = scenarioSelect.options;
    expect(scenarioOptions.length).toBe(4);
    expect(screen.getByText(/Valid Payload/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple Errors/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Corrected/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimal Valid/i)).toBeInTheDocument();
  });

  it('should render speed selector', () => {
    render(<SchemaExchangeDemo />);

    const speedSelect = screen.getByLabelText(/Speed:/i);
    expect(speedSelect).toBeInTheDocument();

    expect(screen.getByText(/Fast/i)).toBeInTheDocument();
    expect(screen.getByText(/Normal/i)).toBeInTheDocument();
    expect(screen.getByText(/Slow/i)).toBeInTheDocument();
  });

  it('should show validation badge in pending state initially', () => {
    render(<SchemaExchangeDemo />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should start stream when Start button is clicked', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const startButton = screen.getByRole('button', { name: /Start Stream/i });
    await user.click(startButton);

    // Should show Stop button when streaming
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stop Stream/i })).toBeInTheDocument();
    });
  });

  it('should disable scenario and speed selects while streaming', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const scenarioSelect = screen.getByLabelText(/Scenario:/i);
    const speedSelect = screen.getByLabelText(/Speed:/i);

    expect(scenarioSelect).not.toBeDisabled();
    expect(speedSelect).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(scenarioSelect).toBeDisabled();
      expect(speedSelect).toBeDisabled();
    });
  });

  it('should stop stream when Stop button is clicked', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stop Stream/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Stop Stream/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Stream/i })).toBeInTheDocument();
    });
  });

  it('should reset demo when Reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Stop Stream/i }));
    await user.click(screen.getByRole('button', { name: /Reset/i }));

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should disable Reset button while streaming', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    expect(resetButton).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(resetButton).toBeDisabled();
    });
  });

  it('should stream schema event first', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    // Schema HUD should become visible with schema data
    await waitFor(
      () => {
        expect(screen.getByText('Schema')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should stream payload chunks progressively', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    // Wait for payload to start appearing
    await waitFor(
      () => {
        expect(screen.getByText('Payload')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should show validation errors for error scenario', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    // Select error scenario
    const scenarioSelect = screen.getByLabelText(/Scenario:/i);
    await user.selectOptions(scenarioSelect, 'with-errors');

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    // Wait for errors to appear
    await waitFor(
      () => {
        expect(screen.getByText(/Validation Errors/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should show valid status for successful scenario', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    // Successful scenario is default
    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    // Wait for valid status
    await waitFor(
      () => {
        const validBadge = screen.queryByText('Valid');
        const partialBadge = screen.queryByText('Partial');
        expect(validBadge || partialBadge).toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  });

  it('should render network inspector', () => {
    render(<SchemaExchangeDemo />);
    expect(screen.getByTestId('network-inspector')).toBeInTheDocument();
  });

  it('should render educational notes', () => {
    render(<SchemaExchangeDemo />);

    expect(screen.getByText(/Learning Points/i)).toBeInTheDocument();
    expect(screen.getByText(/Progressive Validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Partial Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Suggestions/i)).toBeInTheDocument();
  });

  it('should allow changing scenario between streams', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const scenarioSelect = screen.getByLabelText(/Scenario:/i);

    // Start with successful scenario
    await user.click(screen.getByRole('button', { name: /Start Stream/i }));
    await waitFor(() => screen.getByRole('button', { name: /Stop Stream/i }));
    await user.click(screen.getByRole('button', { name: /Stop Stream/i }));

    // Change to error scenario
    await user.selectOptions(scenarioSelect, 'with-errors');
    expect(scenarioSelect).toHaveValue('with-errors');

    // Start new stream
    await user.click(screen.getByRole('button', { name: /Start Stream/i }));
    await waitFor(() => screen.getByRole('button', { name: /Stop Stream/i }));
  });

  it('should handle fast speed setting', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const speedSelect = screen.getByLabelText(/Speed:/i);
    await user.selectOptions(speedSelect, 'fast');

    expect(speedSelect).toHaveValue('fast');

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(screen.getByText('Payload')).toBeInTheDocument();
    }, { timeout: 2000 }); // Should be faster than normal
  });
});
