/**
 * TableControls Component
 *
 * Provides controls for sorting, filtering, and demo speed adjustment.
 * Integrates with useTabularStream hook to manage table operations.
 *
 * Educational Focus:
 * - Client-side filtering on streaming data
 * - Dynamic sort controls
 * - Speed controls for demo purposes
 *
 * @module patterns/tabular-stream-view/TableControls
 */

import type { TableSchema, SortConfig, FilterConfig } from './types';
import styles from './TableControls.module.css';

/**
 * Props for the TableControls component
 */
export interface TableControlsProps {
  /**
   * Table schema defining available columns for sorting/filtering.
   * Undefined until schema event arrives.
   */
  schema?: TableSchema;

  /**
   * Current sort configuration.
   */
  sort: SortConfig | null;

  /**
   * Active filters.
   */
  filters: FilterConfig[];

  /**
   * Whether the stream is currently active.
   * Disables controls during streaming to avoid confusion.
   */
  isStreaming: boolean;

  /**
   * Callback to update sort configuration.
   */
  onSortChange: (sort: SortConfig | null) => void;

  /**
   * Callback to add or update a filter.
   */
  onFilterAdd: (filter: FilterConfig) => void;

  /**
   * Callback to remove a filter by column ID.
   */
  onFilterRemove: (columnId: string) => void;

  /**
   * Callback to clear all filters.
   */
  onFilterClear: () => void;

  /**
   * Optional CSS class name for custom styling.
   */
  className?: string;
}

/**
 * TableControls Component
 *
 * Renders controls for:
 * - Sort column and direction selection
 * - Filter inputs for filterable columns
 * - Clear filters button
 *
 * Controls are disabled during streaming to prevent confusion
 * about whether operations apply to partial or complete data.
 */
export function TableControls({
  schema,
  sort,
  filters,
  isStreaming,
  onSortChange,
  onFilterAdd,
  onFilterRemove,
  onFilterClear,
  className
}: TableControlsProps): JSX.Element {
  // Don't render controls if schema isn't loaded yet
  if (!schema) {
    return <div className={`${styles.controls} ${className || ''}`} />;
  }

  // Get sortable columns
  const sortableColumns = schema.columns.filter((col) => col.sortable);

  // Get filterable columns
  const filterableColumns = schema.columns.filter((col) => col.filterable);

  /**
   * Handle sort column change
   */
  const handleSortColumnChange = (e: React.ChangeEvent<{ value: string }>): void => {
    const columnId = e.target.value;

    if (!columnId) {
      // Clear sort
      onSortChange(null);
    } else {
      // Set new sort column (keep existing direction or default to asc)
      onSortChange({
        columnId,
        direction: sort?.columnId === columnId && sort.direction ? sort.direction : 'asc'
      });
    }
  };

  /**
   * Handle sort direction change
   */
  const handleSortDirectionChange = (e: React.ChangeEvent<{ value: string }>): void => {
    const direction = e.target.value as 'asc' | 'desc';

    if (sort?.columnId) {
      onSortChange({
        columnId: sort.columnId,
        direction
      });
    }
  };

  /**
   * Handle filter input change
   */
  const handleFilterChange = (columnId: string, value: string): void => {
    if (!value.trim()) {
      // Remove filter if value is empty
      onFilterRemove(columnId);
    } else {
      // Add/update filter
      onFilterAdd({
        columnId,
        operator: 'contains', // Simple text search for MVP
        value: value.trim()
      });
    }
  };

  /**
   * Get current filter value for a column
   */
  const getFilterValue = (columnId: string): string => {
    const filter = filters.find((f) => f.columnId === columnId);
    return filter ? String(filter.value) : '';
  };

  return (
    <div className={`${styles.controls} ${className || ''}`}>
      {/* Sort Controls */}
      {sortableColumns.length > 0 && (
        <div className={styles.controlGroup}>
          <label className={styles.label}>Sort by</label>
          <div className={styles.sortControls}>
            <select
              className={styles.select}
              value={sort?.columnId || ''}
              onChange={handleSortColumnChange}
              disabled={isStreaming}
              aria-label="Sort column"
            >
              <option value="">No sorting</option>
              {sortableColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>

            {sort?.columnId && (
              <select
                className={styles.select}
                value={sort.direction || 'asc'}
                onChange={handleSortDirectionChange}
                disabled={isStreaming}
                aria-label="Sort direction"
              >
                <option value="asc">Ascending ↑</option>
                <option value="desc">Descending ↓</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {filterableColumns.length > 0 && (
        <div className={styles.controlGroup}>
          <div className={styles.filterHeader}>
            <label className={styles.label}>Filters</label>
            {filters.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={onFilterClear}
                disabled={isStreaming}
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            )}
          </div>
          <div className={styles.filterInputs}>
            {filterableColumns.map((column) => (
              <div key={column.id} className={styles.filterInput}>
                <label className={styles.filterLabel} htmlFor={`filter-${column.id}`}>
                  {column.label}
                </label>
                <input
                  id={`filter-${column.id}`}
                  type="text"
                  className={styles.input}
                  placeholder={`Filter ${column.label.toLowerCase()}...`}
                  value={getFilterValue(column.id)}
                  onChange={(e) => handleFilterChange(column.id, e.target.value)}
                  disabled={isStreaming}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaming Notice */}
      {isStreaming && (
        <div className={styles.notice}>
          Controls disabled during streaming
        </div>
      )}
    </div>
  );
}
