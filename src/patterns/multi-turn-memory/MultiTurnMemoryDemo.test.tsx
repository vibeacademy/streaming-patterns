/**
 * MultiTurnMemoryDemo Component Tests
 */

import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../tests/test-utils';
import { MultiTurnMemoryDemo } from './MultiTurnMemoryDemo';

describe('MultiTurnMemoryDemo', () => {
  it('renders without crashing', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText('Multi-Turn Memory Pattern')).toBeInTheDocument();
  });

  it('displays the pattern subtitle', () => {
    render(<MultiTurnMemoryDemo />);
    expect(
      screen.getByText(/Watch the agent build and maintain memory/i)
    ).toBeInTheDocument();
  });

  it('renders memory section header', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText('Agent Memory')).toBeInTheDocument();
  });

  it('renders conversation section header', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText('Conversation')).toBeInTheDocument();
  });

  it('shows streaming badge when streaming starts', async () => {
    render(<MultiTurnMemoryDemo />);

    await waitFor(
      () => {
        expect(screen.getByText('Streaming...')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('renders memory timeline container', () => {
    render(<MultiTurnMemoryDemo />);
    // Timeline should be present even if empty initially
    expect(screen.getByText('Agent Memory')).toBeInTheDocument();
  });

  it('renders chat thread container', () => {
    render(<MultiTurnMemoryDemo />);
    // Chat should be present
    expect(screen.getByText('Conversation')).toBeInTheDocument();
  });

  it('renders pattern learning points section', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();
    expect(screen.getByText(/Memory Lifecycle:/i)).toBeInTheDocument();
    expect(screen.getByText(/Provenance:/i)).toBeInTheDocument();
    expect(screen.getByText(/User Control:/i)).toBeInTheDocument();
  });

  it('renders learning points with key concepts', () => {
    render(<MultiTurnMemoryDemo />);
    // Verify learning points are present with consistent format
    expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();
  });

  it('shows filter toggle button', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText(/Hide Filters|Show Filters/i)).toBeInTheDocument();
  });

  it('displays speed control buttons', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByText('Stream Speed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /instant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fast$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument();
  });

  it('renders reset demo button', () => {
    render(<MultiTurnMemoryDemo />);
    expect(screen.getByRole('button', { name: /reset demo/i })).toBeInTheDocument();
  });
});
