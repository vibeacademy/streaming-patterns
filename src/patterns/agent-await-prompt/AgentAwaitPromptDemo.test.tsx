/**
 * Tests for Agent-Await-Prompt Demo component.
 *
 * @module patterns/agent-await-prompt/AgentAwaitPromptDemo.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import AgentAwaitPromptDemo from './AgentAwaitPromptDemo';

describe('AgentAwaitPromptDemo', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should render the demo component', () => {
    render(<AgentAwaitPromptDemo />);

    expect(
      screen.getByText('Agent-Await-Prompt Pattern')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Interactive streaming with pause\/resume mechanics/)
    ).toBeInTheDocument();
  });

  it('should display scenario selector', () => {
    render(<AgentAwaitPromptDemo />);

    const select = screen.getByLabelText(/Demo Scenario:/i);
    expect(select).toBeInTheDocument();
  });

  it('should display stream state indicator', () => {
    render(<AgentAwaitPromptDemo />);

    expect(screen.getByText(/State:/i)).toBeInTheDocument();
  });

  it('should start streaming on mount', async () => {
    render(<AgentAwaitPromptDemo />);

    // Should show streaming indicator
    await waitFor(
      () => {
        const stateBadge = screen.getByText(/Streaming/i);
        expect(stateBadge).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should display text content from stream', async () => {
    render(<AgentAwaitPromptDemo />);

    await waitFor(
      () => {
        // Should have some text content
        const messageBubble = screen.getByText(/help you set up/i);
        expect(messageBubble).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should pause and show inline input fields', async () => {
    render(<AgentAwaitPromptDemo />);

    // Wait for stream to pause and show input fields
    await waitFor(
      () => {
        const continueButton = screen.getByRole('button', { name: /Continue/i });
        expect(continueButton).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Should show listening indicator
    expect(screen.getByText(/Listening for your response/i)).toBeInTheDocument();
  });

  it('should display required field indicators', async () => {
    render(<AgentAwaitPromptDemo />);

    await waitFor(
      () => {
        const continueButton = screen.getByRole('button', { name: /Continue/i });
        expect(continueButton).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Should have asterisks for required fields
    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThan(0);
  });

  it('should allow user to submit input and resume stream', async () => {
    const user = userEvent.setup();
    render(<AgentAwaitPromptDemo />);

    // Wait for input fields
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Fill in required fields
    const projectNameInput = screen.getByLabelText(/Project Name/i);
    await user.type(projectNameInput, 'Test Project');

    const teamSizeInput = screen.getByLabelText(/Team Size/i);
    await user.type(teamSizeInput, '5');

    const deadlineInput = screen.getByLabelText(/Target Deadline/i);
    await user.type(deadlineInput, '2025-12-31');

    // Submit
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);

    // Stream should resume
    await waitFor(
      () => {
        // Input fields should disappear
        expect(screen.queryByRole('button', { name: /Continue/i })).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show timeout countdown', async () => {
    render(<AgentAwaitPromptDemo />);

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Should show timeout countdown
    const timeoutElement = screen.getByText(/Respond within/i);
    expect(timeoutElement).toBeInTheDocument();
  });

  it('should display pattern mechanics explanation', () => {
    render(<AgentAwaitPromptDemo />);

    expect(screen.getByText('Pattern Mechanics')).toBeInTheDocument();
    expect(screen.getByText('1. Stream Pause')).toBeInTheDocument();
    expect(screen.getByText('2. Inline Input')).toBeInTheDocument();
    expect(screen.getByText('3. User Responds')).toBeInTheDocument();
    expect(screen.getByText('4. Stream Resumes')).toBeInTheDocument();
    expect(screen.getByText('5. Timeout Fallback')).toBeInTheDocument();
  });

  it('should display Network Inspector', () => {
    render(<AgentAwaitPromptDemo />);

    expect(screen.getByText('Network Inspector')).toBeInTheDocument();
  });

  it('should display educational notes', () => {
    render(<AgentAwaitPromptDemo />);

    expect(screen.getByText('Educational Notes')).toBeInTheDocument();
    expect(screen.getByText(/State Machine:/i)).toBeInTheDocument();
    expect(screen.getByText(/Stream Controller:/i)).toBeInTheDocument();
    expect(screen.getByText(/Inline UX:/i)).toBeInTheDocument();
  });

  it('should allow switching scenarios', async () => {
    render(<AgentAwaitPromptDemo />);

    const select = screen.getByLabelText(/Demo Scenario:/i);

    // Initially should be "Project Setup"
    expect(select).toHaveValue('project-setup');

    // Wait for initial stream to start
    await waitFor(() => {
      expect(screen.getByText(/help you set up/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Change scenario - Note: Select should be disabled while streaming
    // So we'll just verify the select exists and has options
    const options = within(select).getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
  });

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup();
    render(<AgentAwaitPromptDemo />);

    // Wait for input fields
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Try to submit without filling fields
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);

    // Should show validation errors
    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('should handle stream completion', async () => {
    const user = userEvent.setup();
    render(<AgentAwaitPromptDemo />);

    // Wait for input fields
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Fill and submit
    const projectNameInput = screen.getByLabelText(/Project Name/i);
    await user.type(projectNameInput, 'Test Project');

    const teamSizeInput = screen.getByLabelText(/Team Size/i);
    await user.type(teamSizeInput, '5');

    const deadlineInput = screen.getByLabelText(/Target Deadline/i);
    await user.type(deadlineInput, '2025-12-31');

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);

    // Wait for completion
    await waitFor(
      () => {
        const completedBadge = screen.getByText(/Completed/i);
        expect(completedBadge).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
