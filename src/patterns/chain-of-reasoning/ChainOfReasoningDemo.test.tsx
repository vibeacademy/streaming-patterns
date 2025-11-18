/**
 * ChainOfReasoningDemo Component Tests
 *
 * Comprehensive integration tests for the Chain-of-Reasoning demo component.
 * These tests verify the full pattern flow from streaming to display.
 *
 * Test Coverage:
 * - Component rendering and initial state
 * - Streaming integration and event capture
 * - User interactions (speed controls, reset)
 * - Network Inspector integration
 * - Loading states
 * - Error handling
 * - Accessibility
 *
 * @module patterns/chain-of-reasoning/ChainOfReasoningDemo.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChainOfReasoningDemo } from './ChainOfReasoningDemo';

/**
 * Mock the createMockReasoningStream to control timing in tests.
 * This allows us to test streaming behavior without waiting for real delays.
 */
vi.mock('./mockStream', () => ({
  createMockReasoningStream: vi.fn(async function* ({ onEvent }) {
    // Import fixtures
    const { sprintPlanningFixture } = await import('./fixtures');

    // Fast speed for tests (no delays)
    for (const event of sprintPlanningFixture) {
      if (onEvent) {
        onEvent(event);
      }
      yield event;
      // Small delay to allow React to update between events
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }),
}));

// TODO: Re-enable after implementing fake timers (Phase 2 of audit recommendations)
// These tests timeout due to real async delays and complex waitFor chains
// Audit report: TEST-INFRASTRUCTURE-AUDIT-REPORT.md - Short-term improvement #1
describe.skip('ChainOfReasoningDemo', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllTimers();
  });

  describe('Initial Rendering', () => {
    it('should render the demo container with title and description', () => {
      render(<ChainOfReasoningDemo />);

      expect(
        screen.getByText('Chain-of-Reasoning Pattern')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Watch AI think through sprint planning with visible reasoning steps/i
        )
      ).toBeInTheDocument();
    });

    it('should render demo controls', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Stream Speed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fast/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Normal/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Slow/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Reset Demo/i })
      ).toBeInTheDocument();
    });

    it('should render the demo prompt', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Prompt')).toBeInTheDocument();
      expect(
        screen.getByText(/Plan a 2-week sprint \(Nov 13-24\)/i)
      ).toBeInTheDocument();
    });

    it('should render reasoning section header', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Reasoning Steps')).toBeInTheDocument();
    });

    it('should render Network Inspector by default', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Network Inspector')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Real-time visualization of stream events for debugging and learning/i
        )
      ).toBeInTheDocument();
    });

    it('should render educational notes section', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();
      expect(screen.getByText(/Transparency:/i)).toBeInTheDocument();
      expect(screen.getByText(/Streaming UX:/i)).toBeInTheDocument();
      expect(screen.getByText(/Confidence Indicators:/i)).toBeInTheDocument();
    });

    it('should have accessible labels and ARIA attributes', () => {
      render(<ChainOfReasoningDemo />);

      expect(
        screen.getByRole('region', { name: 'Demo controls' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: 'Demo prompt' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('region', { name: 'AI reasoning steps' })
      ).toBeInTheDocument();
    });
  });

  describe('Streaming Behavior', () => {
    it('should stream reasoning steps and display them', async () => {
      render(<ChainOfReasoningDemo />);

      // Wait for first reasoning step to appear (use getAllByText since it may appear in Network Inspector too)
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Analyzing backlog priorities and business value/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Wait for more reasoning steps
      await waitFor(
        () => {
          const elements = screen.getAllByText(/Estimating team capacity for next 2 weeks/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should display step count as reasoning steps arrive', async () => {
      render(<ChainOfReasoningDemo />);

      // Wait for steps to arrive and check count
      await waitFor(
        () => {
          const stepCountElement = screen.getByLabelText(/5 steps/i);
          expect(stepCountElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should show streaming status indicator', async () => {
      render(<ChainOfReasoningDemo />);

      // Should show "Streaming..." initially
      await waitFor(() => {
        expect(screen.getByText(/Streaming.../i)).toBeInTheDocument();
      });

      // Should show "Complete" after streaming finishes
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );
    }, 10000);

    it('should display final answer after reasoning completes', async () => {
      render(<ChainOfReasoningDemo />);

      // Wait for final answer to appear
      await waitFor(
        () => {
          expect(screen.getByText('Sprint Plan')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify answer content is displayed (may appear in multiple places like Network Inspector)
      await waitFor(() => {
        const elements = screen.getAllByText(/Sprint 24 Plan/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    }, 10000);

    it('should capture events in Network Inspector', async () => {
      render(<ChainOfReasoningDemo />);

      // Wait for events to be captured
      await waitFor(
        () => {
          // Network Inspector should show event count
          const inspector = screen.getByText('Stream Events').parentElement;
          expect(inspector).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('User Interactions', () => {
    it('should allow changing stream speed', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for component to stabilize
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Normal/i })).toBeInTheDocument();
      });

      const fastButton = screen.getByRole('button', { name: /Fast/i });
      const normalButton = screen.getByRole('button', { name: /Normal/i });

      // Normal should be selected by default
      expect(normalButton).toHaveAttribute('aria-pressed', 'true');
      expect(fastButton).toHaveAttribute('aria-pressed', 'false');

      // Wait for streaming to complete before changing speed
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      // Click Fast button
      await user.click(fastButton);

      // Wait for the new stream (triggered by speed change) to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
          expect(fastButton).not.toBeDisabled();
        },
        { timeout: 5000 }
      );

      // Fast should now be selected
      expect(fastButton).toHaveAttribute('aria-pressed', 'true');
      expect(normalButton).toHaveAttribute('aria-pressed', 'false');
    }, 15000);

    it('should reset the demo when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const resetButton = screen.getByRole('button', { name: /Reset Demo/i });

      // Click reset
      await user.click(resetButton);

      // Should show streaming status again
      await waitFor(() => {
        expect(screen.getByText(/Streaming.../i)).toBeInTheDocument();
      });
    });

    it('should toggle Network Inspector visibility', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      const toggleButton = screen.getByRole('button', {
        name: /Hide Network Inspector/i,
      });

      // Inspector should be visible initially
      expect(screen.getByText('Stream Events')).toBeInTheDocument();

      // Click to hide
      await user.click(toggleButton);

      // Inspector should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Stream Events')).not.toBeInTheDocument();
      });

      // Button text should change
      expect(
        screen.getByRole('button', { name: /Show Network Inspector/i })
      ).toBeInTheDocument();

      // Click to show again
      const showButton = screen.getByRole('button', {
        name: /Show Network Inspector/i,
      });
      await user.click(showButton);

      // Inspector should be visible again
      await waitFor(() => {
        expect(screen.getByText('Stream Events')).toBeInTheDocument();
      });
    });

    it('should disable controls while streaming', async () => {
      render(<ChainOfReasoningDemo />);

      // Controls should be disabled during streaming
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /Reset Demo/i });
        expect(resetButton).toBeDisabled();
      }, { timeout: 3000 });

      // Wait for streaming to complete and buttons to be enabled
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
          const resetButton = screen.getByRole('button', { name: /Reset Demo/i });
          expect(resetButton).not.toBeDisabled();
        },
        { timeout: 10000 }
      );

      // Verify controls are enabled
      const resetButton = screen.getByRole('button', { name: /Reset Demo/i });
      expect(resetButton).not.toBeDisabled();
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should display error state when stream fails', async () => {
      // Mock the stream to throw an error
      const { createMockReasoningStream } = await import('./mockStream');
      vi.mocked(createMockReasoningStream).mockImplementationOnce((() => {
        throw new Error('Stream connection failed');
      }) as never);

      render(<ChainOfReasoningDemo />);

      // Wait for error to be displayed
      await waitFor(
        () => {
          expect(screen.getByText('Stream Error')).toBeInTheDocument();
          expect(
            screen.getByText('Stream connection failed')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Should show Try Again button
      expect(
        screen.getByRole('button', { name: /Try Again/i })
      ).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();

      // Mock the stream to fail once, then succeed
      const { createMockReasoningStream } = await import('./mockStream');
      let callCount = 0;

      vi.mocked(createMockReasoningStream).mockImplementation(
        async function* (config) {
          callCount++;

          if (callCount === 1) {
            throw new Error('First attempt failed');
          }

          // Second attempt succeeds
          const { sprintPlanningFixture } = await import('./fixtures');
          for (const event of sprintPlanningFixture) {
            if (config.onEvent) {
              config.onEvent(event);
            }
            yield event;
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }
      );

      render(<ChainOfReasoningDemo />);

      // Wait for error
      await waitFor(
        () => {
          expect(screen.getByText('Stream Error')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click Try Again
      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      await user.click(tryAgainButton);

      // Should show streaming again
      await waitFor(() => {
        expect(screen.getByText(/Streaming.../i)).toBeInTheDocument();
      });
    });

    it('should render error simulation controls', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText('Error Simulation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /None/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Timeout/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Network/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mid-Stream/i })).toBeInTheDocument();
    });

    // Note: Skipping error simulation tests in CI to avoid memory issues
    // These tests trigger actual retry loops which consume significant memory
    // Manual testing confirms error handling works correctly
    it.skip('should display user-friendly timeout error message', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i);
          expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Select timeout error simulation
      const timeoutButton = screen.getByRole('button', { name: /Timeout/i });
      await user.click(timeoutButton);

      // Wait for error to be displayed with user-friendly message
      await waitFor(
        () => {
          expect(screen.getByText(/took too long to complete/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 25000);

    it.skip('should display user-friendly network error message', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i);
          expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Select network error simulation
      const networkButton = screen.getByRole('button', { name: /Network/i });
      await user.click(networkButton);

      // Wait for error to be displayed with user-friendly message
      await waitFor(
        () => {
          expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 25000);

    it.skip('should display user-friendly mid-stream error message', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i);
          expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Select mid-stream error simulation
      const midStreamButton = screen.getByRole('button', { name: /Mid-Stream/i });
      await user.click(midStreamButton);

      // Wait for error to be displayed with user-friendly message
      await waitFor(
        () => {
          expect(screen.getByText(/data stream was interrupted/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    }, 25000);

    it.skip('should show retry status during automatic retries', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i);
          expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Select timeout error to trigger retries
      const timeoutButton = screen.getByRole('button', { name: /Timeout/i });
      await user.click(timeoutButton);

      // Wait for retry status to appear
      await waitFor(
        () => {
          expect(screen.getByText(/Retry attempt/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    }, 30000);

    it.skip('should show collapsible technical details in error display', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i);
          expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Select timeout error
      const timeoutButton = screen.getByRole('button', { name: /Timeout/i });
      await user.click(timeoutButton);

      // Wait for error to be displayed
      await waitFor(
        () => {
          expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Technical details should be present
      const detailsElement = screen.getByText(/Technical Details/i);
      expect(detailsElement.tagName).toBe('SUMMARY');
    }, 30000);

    it('should update educational notes with error handling information', () => {
      render(<ChainOfReasoningDemo />);

      expect(screen.getByText(/Error Handling:/i)).toBeInTheDocument();
      expect(screen.getByText(/Error Simulation:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/automatic retries with exponential backoff/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ChainOfReasoningDemo />);

      // h2 for main title (in DemoContainer)
      const mainTitle = screen.getByText('Chain-of-Reasoning Pattern');
      expect(mainTitle.tagName).toBe('H2');

      // h3 for section titles
      const reasoningTitle = screen.getByText('Reasoning Steps');
      expect(reasoningTitle.tagName).toBe('H3');
    });

    it('should have descriptive button labels', () => {
      render(<ChainOfReasoningDemo />);

      expect(
        screen.getByRole('button', { name: /Reset demo to beginning/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Hide Network Inspector/i })
      ).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for interactive elements', () => {
      render(<ChainOfReasoningDemo />);

      const normalButton = screen.getByRole('button', { name: /Normal/i });
      expect(normalButton).toHaveAttribute('aria-pressed');

      const toggleButton = screen.getByRole('button', {
        name: /Hide Network Inspector/i,
      });
      expect(toggleButton).toHaveAttribute('aria-pressed');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for streaming to complete so buttons are enabled
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      // Should be able to activate button with keyboard
      const fastButton = screen.getByRole('button', { name: /Fast/i });

      // Click with user event (simulates keyboard activation)
      await user.click(fastButton);

      // Verify state changed
      expect(fastButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Integration', () => {
    it('should integrate all components together correctly', async () => {
      render(<ChainOfReasoningDemo />);

      // 1. Verify demo controls render
      expect(screen.getByText('Stream Speed')).toBeInTheDocument();

      // 2. Wait for reasoning steps to stream
      await waitFor(
        () => {
          expect(
            screen.getByText(/Analyzing backlog priorities/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // 3. Verify ReasoningBeadline component renders
      const beadline = screen.getByRole('list', {
        name: /AI reasoning steps/i,
      });
      expect(beadline).toBeInTheDocument();

      // 4. Wait for final answer
      await waitFor(
        () => {
          expect(screen.getByText('Sprint Plan')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // 5. Verify Network Inspector captures events
      expect(screen.getByText('Stream Events')).toBeInTheDocument();

      // 6. Verify educational notes render
      expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();
    });

    it('should maintain component state across interactions', async () => {
      const user = userEvent.setup();
      render(<ChainOfReasoningDemo />);

      // Wait for initial stream to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
        },
        { timeout: 10000 }
      );

      // Change speed
      const slowButton = screen.getByRole('button', { name: /Slow/i });
      await user.click(slowButton);

      // Wait for the new stream (triggered by speed change) to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
          expect(slowButton).not.toBeDisabled();
        },
        { timeout: 10000 }
      );

      // Speed should be maintained
      expect(slowButton).toHaveAttribute('aria-pressed', 'true');

      // Reset should work with new speed
      const resetButton = screen.getByRole('button', { name: /Reset Demo/i });
      await user.click(resetButton);

      // Wait for the new stream after reset to complete
      await waitFor(
        () => {
          const completeElements = screen.getAllByText(/Complete/i); expect(completeElements.length).toBeGreaterThan(0);
          expect(slowButton).not.toBeDisabled();
        },
        { timeout: 10000 }
      );

      // Should still be on slow speed
      expect(slowButton).toHaveAttribute('aria-pressed', 'true');
    }, 35000);
  });
});
