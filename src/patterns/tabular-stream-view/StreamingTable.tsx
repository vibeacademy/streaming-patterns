/**
 * StreamingTable Component
 *
 * Displays a table that progressively renders rows as they stream in.
 * Shows skeleton loaders for pending rows and handles sorting/filtering.
 *
 * Educational Focus:
 * - Progressive rendering patterns (show data as it arrives)
 * - Skeleton loading states for anticipated rows
 * - Type-safe cell rendering based on column types
 * - Sort indicators and interactive headers
 *
 * @module patterns/tabular-stream-view/StreamingTable
 */

import type { TableSchema, TableRow, SortConfig, ColumnDefinition } from './types';
import styles from './StreamingTable.module.css';

/**
 * Props for the StreamingTable component
 */
export interface StreamingTableProps {
  /**
   * Table schema defining columns and structure.
   * Undefined until schema event arrives.
   */
  schema?: TableSchema;

  /**
   * Array of rows received so far.
   * Updates progressively as rows stream in.
   */
  rows: TableRow[];

  /**
   * Whether the stream is currently active.
   * Used to show loading states.
   */
  isStreaming: boolean;

  /**
   * Whether the stream has completed.
   * Affects rendering of skeleton rows.
   */
  isComplete: boolean;

  /**
   * Current sort configuration.
   * Used to show sort indicators in headers.
   */
  sort: SortConfig | null;

  /**
   * Callback when column header is clicked for sorting.
   */
  onSort?: (columnId: string) => void;

  /**
   * Optional CSS class name for custom styling.
   */
  className?: string;
}

/**
 * Render a cell value based on column type.
 *
 * This function handles type-specific formatting for different column types.
 * Educational note: Type-safe cell rendering ensures consistent data display.
 *
 * @param value - The cell value to render
 * @param column - Column definition with type and format info
 * @returns Formatted string representation of the value
 */
function formatCellValue(
  value: string | number | boolean | null,
  column: ColumnDefinition
): string {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return '—';
  }

  // Format based on column type
  switch (column.type) {
    case 'number': {
      // Format numbers with unit if provided
      const numStr = typeof value === 'number' ? value.toFixed(2).replace(/\.00$/, '') : String(value);
      return column.unit ? `${column.unit}${numStr}` : numStr;
    }

    case 'boolean':
      // Render boolean as Yes/No
      return value ? 'Yes' : 'No';

    case 'date':
      // Format date strings nicely
      if (typeof value === 'string') {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return String(value);

    case 'string':
    default:
      return String(value);
  }
}

/**
 * Skeleton row component for showing anticipated data.
 *
 * Displays a placeholder row with animated shimmer effect
 * to indicate that more data is coming.
 */
function SkeletonRow({ columnCount }: { columnCount: number }): JSX.Element {
  return (
    <tr className={styles.skeletonRow}>
      {Array.from({ length: columnCount }).map((_, index) => (
        <td key={index} className={styles.skeletonCell}>
          <div className={styles.skeleton} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table header cell with sort controls.
 *
 * Shows column label, sort indicator, and handles click events
 * for sortable columns.
 */
function HeaderCell({
  column,
  sort,
  onSort
}: {
  column: ColumnDefinition;
  sort: SortConfig | null;
  onSort?: (columnId: string) => void;
}): JSX.Element {
  const isSorted = sort?.columnId === column.id;
  const sortDirection = isSorted ? sort.direction : null;

  const handleClick = (): void => {
    if (column.sortable && onSort) {
      onSort(column.id);
    }
  };

  return (
    <th
      className={`${styles.headerCell} ${column.sortable ? styles.sortable : ''} ${isSorted ? styles.sorted : ''}`}
      onClick={handleClick}
      style={{ width: column.width }}
      aria-sort={
        isSorted
          ? sortDirection === 'asc'
            ? 'ascending'
            : sortDirection === 'desc'
            ? 'descending'
            : 'none'
          : undefined
      }
    >
      <div className={styles.headerContent}>
        <span className={styles.headerLabel}>{column.label}</span>
        {column.sortable && (
          <span className={styles.sortIndicator}>
            {isSorted ? (
              sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '⇅'
            ) : (
              '⇅'
            )}
          </span>
        )}
      </div>
    </th>
  );
}

/**
 * StreamingTable Component
 *
 * Main table component that renders:
 * - Table header with sortable columns
 * - Progressive row rendering
 * - Skeleton rows for anticipated data
 * - Empty states
 *
 * The table updates incrementally as rows stream in, providing
 * immediate visual feedback to users.
 */
export function StreamingTable({
  schema,
  rows,
  isStreaming,
  isComplete,
  sort,
  onSort,
  className
}: StreamingTableProps): JSX.Element {
  // Calculate skeleton rows to show
  const skeletonRowCount = (() => {
    if (isComplete) return 0;
    if (!schema?.totalRows) return 0;
    return Math.max(0, schema.totalRows - rows.length);
  })();

  // Handle empty state
  if (!schema) {
    return (
      <div className={`${styles.emptyState} ${className || ''}`}>
        <p>Waiting for table schema...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className || ''}`}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {schema.columns.map((column) => (
              <HeaderCell
                key={column.id}
                column={column}
                sort={sort}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {/* Render actual rows */}
          {rows.map((row) => (
            <tr key={row.rowId} className={styles.dataRow}>
              {schema.columns.map((column) => (
                <td key={column.id} className={styles.dataCell}>
                  {formatCellValue(row.values[column.id], column)}
                </td>
              ))}
            </tr>
          ))}

          {/* Render skeleton rows for anticipated data */}
          {Array.from({ length: skeletonRowCount }).map((_, index) => (
            <SkeletonRow key={`skeleton-${index}`} columnCount={schema.columns.length} />
          ))}

          {/* Empty state when no rows and stream is complete */}
          {rows.length === 0 && isComplete && (
            <tr>
              <td colSpan={schema.columns.length} className={styles.emptyCell}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className={styles.streamingIndicator}>
          <span className={styles.spinner} />
          <span>Streaming data... ({rows.length} of {schema.totalRows || '?'} rows)</span>
        </div>
      )}
    </div>
  );
}
