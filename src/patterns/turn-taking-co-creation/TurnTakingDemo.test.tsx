/**
 * Turn-Taking Co-Creation Demo Tests
 *
 * Integration tests for the complete turn-taking co-creation pattern demo.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TurnTakingDemo } from './TurnTakingDemo';

describe('TurnTakingDemo', () => {
  it('should render the demo title and description', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Turn-Taking Co-Creation Pattern')).toBeInTheDocument();
    expect(
      screen.getByText(/Watch AI and user collaborate in real-time/i)
    ).toBeInTheDocument();
  });

  it('should render speed control buttons', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByRole('button', { name: /fast/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument();
  });

  it('should render reset button', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByRole('button', { name: /reset demo/i })).toBeInTheDocument();
  });

  it('should render the collaborative editor', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Project Charter')).toBeInTheDocument();
  });

  it('should render the authorship legend', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Authorship Guide')).toBeInTheDocument();
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
    expect(screen.getByText('You (User)')).toBeInTheDocument();
  });

  it('should render the patch toolbar', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Agent Suggestions')).toBeInTheDocument();
  });

  it('should render the turn indicator', () => {
    render(<TurnTakingDemo />);

    // Turn indicator should show some state
    const turnIndicator = screen.getByRole('status');
    expect(turnIndicator).toBeInTheDocument();
  });

  it('should render the network inspector by default', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Network Inspector')).toBeInTheDocument();
  });

  it('should render educational learning points', () => {
    render(<TurnTakingDemo />);

    expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();
    expect(screen.getByText(/Bidirectional Streaming/i)).toBeInTheDocument();
    expect(screen.getByText(/Authorship Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Patch-Based Editing/i)).toBeInTheDocument();
  });

  it('should mark sections as complete after stream finishes', async () => {
    render(<TurnTakingDemo />);

    // Wait for the goals section_complete event (event #7 in fixture)
    // At 300ms/event + variance, need ~3-4 seconds for the first section_complete
    await waitFor(
      () => {
        const goalsSection = document.querySelector('[data-section-id="goals"]');
        expect(goalsSection?.getAttribute('data-complete')).toBe('true');
      },
      { timeout: 8000 }
    );

    // Verify the goals section is marked complete
    const goalsSection = document.querySelector('[data-section-id="goals"]');
    expect(goalsSection?.getAttribute('data-complete')).toBe('true');
  }, 15000);

  it('should enable editing when clicking a complete section', async () => {
    const user = userEvent.setup();
    render(<TurnTakingDemo />);

    // Wait for the goals section to be complete
    await waitFor(
      () => {
        const goalsSection = document.querySelector('[data-section-id="goals"]');
        expect(goalsSection?.getAttribute('data-complete')).toBe('true');
      },
      { timeout: 8000 }
    );

    // Find the goals section content area
    const goalsSection = document.querySelector('[data-section-id="goals"]');
    expect(goalsSection).not.toBeNull();

    // Click on the section content to start editing
    const sectionContent = goalsSection?.querySelector('[role="textbox"]');
    expect(sectionContent).not.toBeNull();

    await user.click(sectionContent as Element);

    // After clicking, editing mode should be enabled (textarea appears)
    await waitFor(() => {
      const textarea = goalsSection?.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    // Verify the section is in editing mode
    expect(goalsSection?.getAttribute('data-editing')).toBe('true');
  }, 15000);
});
