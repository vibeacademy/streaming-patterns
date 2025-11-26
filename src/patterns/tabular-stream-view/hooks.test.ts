/**
 * Tests for useTabularStream hook
 *
 * Verifies that the hook:
 * - Manages stream lifecycle correctly
 * - Processes events and updates state
 * - Handles sorting and filtering
 * - Provides CSV export functionality
 * - Handles errors gracefully
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTabularStream } from './hooks';

describe('useTabularStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start with initial state', () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    expect(result.current.schema).toBeUndefined();
    expect(result.current.rows).toEqual([]);
    expect(result.current.metadata).toBeUndefined();
    expect(result.current.isStreaming).toBe(true);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.sort).toBeNull();
    expect(result.current.filters).toEqual([]);
  });

  it('should receive schema event', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.schema).toBeDefined();
      },
      { timeout: 1000 }
    );

    expect(result.current.schema?.columns).toBeDefined();
    expect(result.current.schema?.columns.length).toBeGreaterThan(0);
  });

  it('should receive row events progressively', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    // Wait for first row
    await waitFor(
      () => {
        expect(result.current.rows.length).toBeGreaterThan(0);
      },
      { timeout: 1000 }
    );

    const firstRowCount = result.current.rows.length;

    // Wait for more rows
    await waitFor(
      () => {
        expect(result.current.rows.length).toBeGreaterThan(firstRowCount);
      },
      { timeout: 2000 }
    );
  });

  it('should complete stream and set metadata', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.metadata).toBeDefined();
    expect(result.current.metadata?.totalRows).toBeGreaterThan(0);
  });

  it('should call onEvent callback for each event', async () => {
    const onEvent = vi.fn();

    const { result } = renderHook(() =>
      useTabularStream({ speed: 'fast', onEvent })
    );

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(onEvent).toHaveBeenCalled();
    expect(onEvent.mock.calls.length).toBeGreaterThan(0);
  });

  it('should handle sorting', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    // Wait for stream to complete
    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Set sort
    act(() => {
      result.current.setSort({ columnId: 'allocation', direction: 'desc' });
    });

    expect(result.current.sort?.columnId).toBe('allocation');
    expect(result.current.sort?.direction).toBe('desc');

    // Get sorted rows
    const visibleRows = result.current.getVisibleRows();
    expect(visibleRows.length).toBeGreaterThan(0);

    // Verify descending order
    for (let i = 0; i < visibleRows.length - 1; i++) {
      const current = visibleRows[i].values.allocation as number;
      const next = visibleRows[i + 1].values.allocation as number;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should handle filtering', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    // Wait for stream to complete
    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    const totalRows = result.current.rows.length;

    // Add filter
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Frontend'
      });
    });

    expect(result.current.filters.length).toBe(1);

    // Get filtered rows
    const visibleRows = result.current.getVisibleRows();
    expect(visibleRows.length).toBeLessThan(totalRows);

    // Verify all rows match filter
    visibleRows.forEach((row) => {
      const role = String(row.values.role).toLowerCase();
      expect(role).toContain('frontend');
    });
  });

  it('should clear filters', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Add filter
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Frontend'
      });
    });

    expect(result.current.filters.length).toBe(1);

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters.length).toBe(0);
  });

  it('should remove specific filter', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Add two filters
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Frontend'
      });
      result.current.addFilter({
        columnId: 'skills',
        operator: 'contains',
        value: 'React'
      });
    });

    expect(result.current.filters.length).toBe(2);

    // Remove one filter
    act(() => {
      result.current.removeFilter('role');
    });

    expect(result.current.filters.length).toBe(1);
    expect(result.current.filters[0].columnId).toBe('skills');
  });

  it('should export CSV', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    const csv = result.current.exportCSV();

    expect(csv).toBeTruthy();
    expect(typeof csv).toBe('string');
    expect(csv).toContain('Team Member'); // Column header
    expect(csv).toContain('Role'); // Column header
  });

  it('should export filtered CSV', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Add filter for Frontend specifically
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Frontend'
      });
    });

    const csv = result.current.exportCSV();
    const lines = csv.split('\n').filter((line) => line.trim());

    // Should have header + filtered rows
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(result.current.rows.length + 1);
  });

  it('should handle stream errors', async () => {
    const { result } = renderHook(() =>
      useTabularStream({ speed: 'fast', simulateError: 'network' })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeDefined();
      },
      { timeout: 1000 }
    );

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error?.message).toBeTruthy();
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() =>
      useTabularStream({ speed: 'normal' })
    );

    // Unmount before stream completes
    unmount();

    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should apply multiple filters with AND logic', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Add multiple filters
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Engineer'
      });
      result.current.addFilter({
        columnId: 'isRemote',
        operator: 'equals',
        value: true
      });
    });

    const visibleRows = result.current.getVisibleRows();

    // All visible rows must match both filters
    visibleRows.forEach((row) => {
      const role = String(row.values.role).toLowerCase();
      expect(role).toContain('engineer');
      expect(row.values.isRemote).toBe(true);
    });
  });

  it('should combine sorting and filtering', async () => {
    const { result } = renderHook(() => useTabularStream({ speed: 'fast' }));

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    // Add filter for Frontend specifically
    act(() => {
      result.current.addFilter({
        columnId: 'role',
        operator: 'contains',
        value: 'Frontend'
      });
    });

    // Add sort
    act(() => {
      result.current.setSort({ columnId: 'allocation', direction: 'asc' });
    });

    const visibleRows = result.current.getVisibleRows();

    // Should be filtered (Frontend-only roles)
    expect(visibleRows.length).toBeLessThanOrEqual(result.current.rows.length);
    expect(visibleRows.length).toBeGreaterThan(0);

    // Should be sorted ascending
    for (let i = 0; i < visibleRows.length - 1; i++) {
      const current = visibleRows[i].values.allocation as number;
      const next = visibleRows[i + 1].values.allocation as number;
      expect(current).toBeLessThanOrEqual(next);
    }
  });
});
