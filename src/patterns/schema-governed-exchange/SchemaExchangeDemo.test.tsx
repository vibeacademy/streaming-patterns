/**
 * SchemaExchangeDemo Component Tests
 *
 * Integration tests for the full pattern demo.
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../tests/test-utils';
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

    // Check for scenario buttons
    expect(screen.getByRole('button', { name: /✅ Valid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /❌ Errors/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🔧 Corrected/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /📋 Minimal/i })).toBeInTheDocument();
  });

  it('should render speed selector', () => {
    render(<SchemaExchangeDemo />);

    expect(screen.getByText(/^Stream Speed$/i)).toBeInTheDocument();

    // Check for speed buttons (look for unique text with emojis)
    expect(screen.getByRole('button', { name: /⚡ Fast/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /▶ Normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🐌 Slow/i })).toBeInTheDocument();
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

  it('should disable scenario and speed buttons while streaming', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const validButton = screen.getByRole('button', { name: /✅ Valid/i });
    const fastButton = screen.getByRole('button', { name: /⚡ Fast/i });

    expect(validButton).not.toBeDisabled();
    expect(fastButton).not.toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(validButton).toBeDisabled();
      expect(fastButton).toBeDisabled();
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
    const errorsButton = screen.getByRole('button', { name: /❌ Errors/i });
    await user.click(errorsButton);

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

  it('should toggle network inspector visibility', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

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

    // Start with successful scenario
    await user.click(screen.getByRole('button', { name: /Start Stream/i }));
    await waitFor(() => screen.getByRole('button', { name: /Stop Stream/i }));
    await user.click(screen.getByRole('button', { name: /Stop Stream/i }));

    // Change to error scenario
    const errorsButton = screen.getByRole('button', { name: /❌ Errors/i });
    await user.click(errorsButton);
    expect(errorsButton).toHaveAttribute('aria-pressed', 'true');

    // Start new stream
    await user.click(screen.getByRole('button', { name: /Start Stream/i }));
    await waitFor(() => screen.getByRole('button', { name: /Stop Stream/i }));
  });

  it('should handle fast speed setting', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    const fastButton = screen.getByRole('button', { name: /⚡ Fast/i });
    await user.click(fastButton);

    expect(fastButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    await waitFor(() => {
      expect(screen.getByText('Payload')).toBeInTheDocument();
    }, { timeout: 2000 }); // Should be faster than normal
  });

  it('should deduplicate errors and show consistent error count', async () => {
    const user = userEvent.setup();
    render(<SchemaExchangeDemo />);

    // Select error scenario which has both Zod and stream errors
    const errorsButton = screen.getByRole('button', { name: /❌ Errors/i });
    await user.click(errorsButton);

    // Use fast speed to make test faster
    const fastButton = screen.getByRole('button', { name: /⚡ Fast/i });
    await user.click(fastButton);

    await user.click(screen.getByRole('button', { name: /Start Stream/i }));

    // Wait for stream to complete and all errors to appear
    await waitFor(
      () => {
        // Wait for multiple validation errors (should be 7 in error scenario)
        const errorHighlighterHeader = screen.queryByText(/Validation Errors \(7\)/i);
        expect(errorHighlighterHeader).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Get error count from ErrorHighlighter header (e.g., "Validation Errors (7)")
    const errorHighlighterHeader = screen.getByText(/Validation Errors \(\d+\)/i);
    const highlighterMatch = errorHighlighterHeader.textContent?.match(/Validation Errors \((\d+)\)/);
    const highlighterCount = highlighterMatch?.[1];

    // Get error count from ValidationBadge description (e.g., "7 validation errors")
    // Use getAllByText since error messages might also contain "validation error"
    const validationBadgeDescription = screen.getByText(new RegExp(`${highlighterCount} validation error`, 'i'));
    const badgeMatch = validationBadgeDescription.textContent?.match(/(\d+) validation error/);
    const badgeCount = badgeMatch?.[1];

    // Both counts should exist and match
    expect(highlighterCount).toBeTruthy();
    expect(badgeCount).toBeTruthy();
    expect(badgeCount).toBe(highlighterCount);
  });
});
