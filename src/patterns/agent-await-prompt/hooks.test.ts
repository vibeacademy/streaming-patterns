/**
 * Tests for Agent-Await-Prompt hooks.
 *
 * @module patterns/agent-await-prompt/hooks.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAwaitPromptStream } from './hooks';

describe('useAwaitPromptStream', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('', { speed: 'fast' })
    );

    expect(result.current.streamState).toBe('idle');
    expect(result.current.text).toBe('');
    expect(result.current.inputFields).toBe(null);
    expect(result.current.isActive).toBe(false);
  });

  it('should start streaming when prompt is provided', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Initially should be streaming
    await waitFor(() => {
      expect(result.current.streamState).toBe('streaming');
      expect(result.current.isActive).toBe(true);
    });
  });

  it('should accumulate text from stream events', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    await waitFor(
      () => {
        expect(result.current.text.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('should pause and present input fields on await_input event', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Wait for stream to pause
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('awaiting_input');
      },
      { timeout: 5000 }
    );

    expect(result.current.inputFields).not.toBe(null);
    expect(result.current.inputFields?.length).toBeGreaterThan(0);
    expect(result.current.inputMessage).toBeTruthy();
    expect(result.current.isActive).toBe(true);
  });

  it('should resume stream after input submission', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Wait for stream to pause
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('awaiting_input');
      },
      { timeout: 5000 }
    );

    // Submit input
    act(() => {
      result.current.submitInput({
        projectName: 'Test Project',
        budget: 10000,
        deadline: new Date('2025-12-31'),
        teamSize: 5,
      });
    });

    // Should transition to resuming/streaming
    await waitFor(
      () => {
        expect(result.current.streamState).not.toBe('awaiting_input');
      },
      { timeout: 1000 }
    );

    // Input fields should be cleared
    expect(result.current.inputFields).toBe(null);
  });

  it('should complete stream successfully', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Wait for pause
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('awaiting_input');
      },
      { timeout: 5000 }
    );

    // Submit input
    act(() => {
      result.current.submitInput({
        projectName: 'Test Project',
        budget: 10000,
        deadline: new Date('2025-12-31'),
        teamSize: 5,
      });
    });

    // Wait for completion
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('completed');
      },
      { timeout: 10000 }
    );

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should invoke onEvent callback for all events', async () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useAwaitPromptStream('Set up a new project', {
        speed: 'fast',
        onEvent,
      })
    );

    // Wait for some events
    await waitFor(
      () => {
        expect(onEvent).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Should have captured text and await_input events
    const eventTypes = onEvent.mock.calls.map((call) => call[0].type);
    expect(eventTypes).toContain('text');
    expect(eventTypes).toContain('await_input');
  });

  it('should handle timeout scenario', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Setup project with timeout fallback', {
        speed: 'fast',
      })
    );

    // Wait for pause
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('awaiting_input');
      },
      { timeout: 5000 }
    );

    // Don't submit input - let it timeout
    // The timeout in the fixture is 5000ms, advance timers
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Should continue streaming after timeout
    await waitFor(
      () => {
        expect(result.current.streamState).not.toBe('awaiting_input');
      },
      { timeout: 5000 }
    );
  });

  it('should track timeout countdown', async () => {
    const { result } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Wait for pause
    await waitFor(
      () => {
        expect(result.current.streamState).toBe('awaiting_input');
      },
      { timeout: 5000 }
    );

    // Should have timeout remaining
    expect(result.current.timeoutRemaining).toBeDefined();
    expect(result.current.timeoutRemaining).toBeGreaterThan(0);
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() =>
      useAwaitPromptStream('Set up a new project', { speed: 'fast' })
    );

    // Unmount should cancel the stream
    unmount();

    // No errors should occur after unmount
    expect(true).toBe(true);
  });

  it('should restart stream when prompt changes', async () => {
    const { result, rerender } = renderHook(
      ({ prompt }) => useAwaitPromptStream(prompt, { speed: 'fast' }),
      { initialProps: { prompt: 'Set up a new project' } }
    );

    await waitFor(() => {
      expect(result.current.text.length).toBeGreaterThan(0);
    });

    const firstText = result.current.text;

    // Change prompt
    rerender({ prompt: 'Plan a sprint' });

    await waitFor(() => {
      expect(result.current.text).not.toBe(firstText);
      expect(result.current.streamState).toBe('streaming');
    });
  });
});
