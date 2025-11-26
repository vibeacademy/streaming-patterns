/**
 * Custom React hooks for the Tabular Stream View pattern.
 *
 * This module provides the useTabularStream hook which manages the state
 * and lifecycle of a tabular data stream. The hook handles schema parsing,
 * progressive row rendering, sorting, filtering, and CSV export.
 *
 * Educational Note:
 * This hook demonstrates how to manage streaming structured data in React:
 * - Progressive rendering of table rows as they arrive
 * - Client-side sorting/filtering on partial datasets
 * - Type-safe state management with discriminated unions
 * - Integration with network capture for transparency
 *
 * @module patterns/tabular-stream-view/hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  TableSchema,
  TableRow,
  TableMetadata,
  TabularStreamConfig,
  TabularStreamState,
  SortConfig,
  FilterConfig,
} from './types';
import { StreamError } from './types';
import { createMockTabularStream } from './mockStream';

/**
 * Compares two values for sorting based on their types.
 *
 * @param a - First value
 * @param b - Second value
 * @param ascending - Sort direction
 * @returns Comparison result (-1, 0, 1)
 */
function compareValues(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
  ascending: boolean
): number {
  // Handle null values (always sort to end)
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  // Compare values
  let result = 0;
  if (a < b) result = -1;
  if (a > b) result = 1;

  // Reverse if descending
  return ascending ? result : -result;
}

/**
 * Applies a filter to a table row.
 *
 * @param row - The table row to filter
 * @param filter - The filter configuration
 * @returns True if row matches the filter
 */
function applyFilter(row: TableRow, filter: FilterConfig): boolean {
  const value = row.values[filter.columnId];

  // Null values don't match any filter
  if (value === null || value === undefined) return false;

  switch (filter.operator) {
    case 'equals':
      return value === filter.value;

    case 'contains':
      return String(value)
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());

    case 'gt':
      return typeof value === 'number' && value > Number(filter.value);

    case 'lt':
      return typeof value === 'number' && value < Number(filter.value);

    case 'gte':
      return typeof value === 'number' && value >= Number(filter.value);

    case 'lte':
      return typeof value === 'number' && value <= Number(filter.value);

    default:
      return true;
  }
}

/**
 * Converts table data to CSV format.
 *
 * @param schema - Table schema
 * @param rows - Table rows to export
 * @returns CSV string
 */
function rowsToCSV(schema: TableSchema | undefined, rows: TableRow[]): string {
  if (!schema || rows.length === 0) {
    return '';
  }

  // Create header row
  const headers = schema.columns.map((col) => col.label).join(',');

  // Create data rows
  const dataRows = rows.map((row) => {
    return schema.columns
      .map((col) => {
        const value = row.values[col.id];
        // Escape values containing commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [headers, ...dataRows].join('\n');
}

/**
 * Custom hook for managing tabular stream state and operations.
 *
 * This hook encapsulates the complexity of:
 * - Consuming an AsyncGenerator stream
 * - Managing schema, rows, and metadata state
 * - Applying sorting and filtering to partial data
 * - Exporting data to CSV
 *
 * @param config - Configuration for the tabular stream
 * @returns Tabular stream state and operations
 *
 * @example
 * ```typescript
 * function TeamCapacityDemo() {
 *   const {
 *     schema,
 *     rows,
 *     metadata,
 *     isStreaming,
 *     isComplete,
 *     getVisibleRows,
 *     setSort,
 *     addFilter,
 *     exportCSV
 *   } = useTabularStream({
 *     scenario: 'team-capacity',
 *     speed: 'normal',
 *     onEvent: (event) => console.log('Event:', event.type)
 *   });
 *
 *   const visibleRows = getVisibleRows();
 *
 *   return (
 *     <div>
 *       <table>
 *         {schema?.columns.map(col => (
 *           <th key={col.id} onClick={() => setSort({ columnId: col.id, direction: 'asc' })}>
 *             {col.label}
 *           </th>
 *         ))}
 *         {visibleRows.map(row => (
 *           <tr key={row.rowId}>
 *             {schema?.columns.map(col => (
 *               <td key={col.id}>{row.values[col.id]}</td>
 *             ))}
 *           </tr>
 *         ))}
 *       </table>
 *       {isComplete && <button onClick={() => console.log(exportCSV())}>Export CSV</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTabularStream(
  config: TabularStreamConfig = {}
): TabularStreamState {
  // State management
  const [schema, setSchema] = useState<TableSchema | undefined>();
  const [rows, setRows] = useState<TableRow[]>([]);
  const [metadata, setMetadata] = useState<TableMetadata | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);

  // Ref to track if component is mounted (prevents state updates after unmount)
  const isMountedRef = useRef(true);

  // Ref to track cancellation
  const cancelledRef = useRef(false);

  /**
   * Consume the stream and update state progressively.
   *
   * This effect runs when the config changes and handles:
   * - Starting the stream
   * - Processing events as they arrive
   * - Handling errors
   * - Cleanup on unmount
   */
  useEffect(() => {
    // Reset cancellation flag
    cancelledRef.current = false;

    // Reset state for new stream
    setSchema(undefined);
    setRows([]);
    setMetadata(undefined);
    setIsStreaming(true);
    setIsComplete(false);
    setError(undefined);

    // Create and consume stream
    (async () => {
      try {
        const stream = createMockTabularStream(config);

        for await (const event of stream) {
          // Check if component unmounted or stream cancelled
          if (!isMountedRef.current || cancelledRef.current) {
            break;
          }

          // Process event based on type
          switch (event.type) {
            case 'schema':
              setSchema(event.data);
              break;

            case 'table_row':
              setRows((prevRows) => [...prevRows, event.data]);
              break;

            case 'table_meta':
              setMetadata(event.data);
              setIsComplete(true);
              break;
          }
        }

        // Stream completed successfully
        if (isMountedRef.current && !cancelledRef.current) {
          setIsStreaming(false);
        }
      } catch (err) {
        // Handle stream errors
        if (isMountedRef.current && !cancelledRef.current) {
          const streamError =
            err instanceof StreamError
              ? err
              : new StreamError(
                  err instanceof Error ? err.message : 'Unknown stream error',
                  'unknown'
                );

          setError(streamError);
          setIsStreaming(false);
        }
      }
    })();

    // Cleanup function
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.scenario, config.speed, config.simulateError]); // Only re-run if these change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Add or update a filter.
   */
  const addFilter = useCallback((filter: FilterConfig) => {
    setFilters((prevFilters) => {
      // Remove existing filter for this column
      const withoutColumn = prevFilters.filter(
        (f) => f.columnId !== filter.columnId
      );
      // Add new filter
      return [...withoutColumn, filter];
    });
  }, []);

  /**
   * Remove a filter by column ID.
   */
  const removeFilter = useCallback((columnId: string) => {
    setFilters((prevFilters) =>
      prevFilters.filter((f) => f.columnId !== columnId)
    );
  }, []);

  /**
   * Clear all filters.
   */
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  /**
   * Get filtered and sorted rows.
   *
   * This function applies current filters and sorting to the raw rows.
   * It's memoized to avoid unnecessary recalculations.
   */
  const getVisibleRows = useCallback((): TableRow[] => {
    let visibleRows = [...rows];

    // Apply filters
    if (filters.length > 0) {
      visibleRows = visibleRows.filter((row) => {
        // Row must match ALL active filters (AND logic)
        return filters.every((filter) => applyFilter(row, filter));
      });
    }

    // Apply sorting
    if (sort && sort.direction) {
      visibleRows.sort((a, b) => {
        const aValue = a.values[sort.columnId];
        const bValue = b.values[sort.columnId];
        return compareValues(aValue, bValue, sort.direction === 'asc');
      });
    }

    return visibleRows;
  }, [rows, filters, sort]);

  /**
   * Export current data as CSV.
   *
   * This function converts the currently visible rows (with filters/sort applied)
   * to CSV format. It can be called at any time, even before the stream completes.
   */
  const exportCSV = useCallback((): string => {
    const visibleRows = getVisibleRows();
    return rowsToCSV(schema, visibleRows);
  }, [schema, getVisibleRows]);

  return {
    schema,
    rows,
    metadata,
    isStreaming,
    isComplete,
    error,
    sort,
    filters,
    setSort,
    addFilter,
    removeFilter,
    clearFilters,
    getVisibleRows,
    exportCSV,
  };
}
