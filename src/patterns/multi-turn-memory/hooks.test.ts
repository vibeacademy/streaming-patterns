/**
 * useMemoryTimeline Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMemoryTimeline } from './hooks';

describe('useMemoryTimeline', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ autoStart: false })
    );

    expect(result.current.memories.size).toBe(0);
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isStreaming).toBe(false);
  });

  it('starts streaming when autoStart is true', async () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ speed: 'instant', autoStart: true })
    );

    expect(result.current.isStreaming).toBe(true);

    await waitFor(
      () => {
        expect(result.current.memories.size).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );
  });

  it('processes memory create events', async () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ speed: 'instant', autoStart: true })
    );

    await waitFor(
      () => {
        expect(result.current.memories.size).toBeGreaterThan(0);
        const firstMemory = Array.from(result.current.memories.values())[0];
        expect(firstMemory).toHaveProperty('id');
        expect(firstMemory).toHaveProperty('summary');
        expect(firstMemory).toHaveProperty('memoryType');
      },
      { timeout: 2000 }
    );
  });

  it('processes message events', async () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ speed: 'instant', autoStart: true })
    );

    await waitFor(
      () => {
        expect(result.current.messages.length).toBeGreaterThan(0);
        const firstMessage = result.current.messages[0];
        expect(firstMessage).toHaveProperty('id');
        expect(firstMessage).toHaveProperty('role');
        expect(firstMessage).toHaveProperty('content');
      },
      { timeout: 2000 }
    );
  });

  it('calls onEvent callback for each event', async () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useMemoryTimeline({
        speed: 'instant',
        autoStart: true,
        onEvent,
      })
    );

    await waitFor(
      () => {
        expect(onEvent).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('provides togglePin action', async () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ speed: 'instant', autoStart: true })
    );

    // Wait for memories to load
    await waitFor(
      () => {
        expect(result.current.memories.size).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    const memoryId = Array.from(result.current.memories.keys())[0];

    // Action should be callable
    expect(() => result.current.actions.togglePin(memoryId)).not.toThrow();
  });

  it('provides setFilters action', () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ autoStart: false })
    );

    // Action should be callable
    expect(() => result.current.actions.setFilters({ pinnedOnly: true })).not.toThrow();
  });

  it('filters memories by type', async () => {
    const { result } = renderHook(() =>
      useMemoryTimeline({ speed: 'instant', autoStart: true })
    );

    // Wait for memories
    await waitFor(
      () => {
        expect(result.current.memories.size).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    // Apply type filter
    result.current.actions.setFilters({ types: ['fact'] });

    await waitFor(() => {
      const filtered = result.current.filteredMemories;
      expect(filtered.every((m) => m.memoryType === 'fact')).toBe(true);
    });
  });
});
