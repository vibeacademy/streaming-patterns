import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/**
 * Test suite for App component
 *
 * This test verifies the basic functionality of the root App component
 * and serves as a smoke test for the entire Vitest testing infrastructure.
 */
describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { name: /streaming patterns/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the educational description', () => {
    render(<App />);

    const description = screen.getByText(
      /Educational Pattern Library for Streaming AI\/LLM UX/i
    );
    expect(description).toBeInTheDocument();
  });

  it('renders the counter button with initial count', () => {
    render(<App />);

    const button = screen.getByRole('button', { name: /count is 0/i });
    expect(button).toBeInTheDocument();
  });

  it('increments count when button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /count is 0/i });

    // Click the button
    await user.click(button);

    // Verify count increased
    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument();
  });

  it('increments count multiple times', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /count is 0/i });

    // Click three times
    await user.click(button);
    await user.click(screen.getByRole('button', { name: /count is 1/i }));
    await user.click(screen.getByRole('button', { name: /count is 2/i }));

    // Verify final count
    expect(screen.getByRole('button', { name: /count is 3/i })).toBeInTheDocument();
  });

  it('displays success message', () => {
    render(<App />);

    const message = screen.getByText(
      /Vite \+ React \+ TypeScript foundation initialized successfully/i
    );
    expect(message).toBeInTheDocument();
  });
});
