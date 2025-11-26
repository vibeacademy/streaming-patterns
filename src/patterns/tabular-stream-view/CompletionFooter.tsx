/**
 * CompletionFooter Component
 *
 * Displays aggregated statistics and export options when the stream completes.
 * Shows totals, averages, and other aggregations defined in the schema.
 *
 * Educational Focus:
 * - Computing aggregations on streamed data
 * - CSV export functionality
 * - Completion indicators and stats
 *
 * @module patterns/tabular-stream-view/CompletionFooter
 */

import type { TableSchema, TableMetadata } from './types';
import styles from './CompletionFooter.module.css';

/**
 * Props for the CompletionFooter component
 */
export interface CompletionFooterProps {
  /**
   * Table schema with column definitions and aggregation functions.
   */
  schema?: TableSchema;

  /**
   * Table metadata with aggregated values.
   * Undefined until stream completes.
   */
  metadata?: TableMetadata;

  /**
   * Whether the stream has completed.
   */
  isComplete: boolean;

  /**
   * Number of rows currently displayed (after filters).
   */
  visibleRowCount: number;

  /**
   * Total number of rows received.
   */
  totalRowCount: number;

  /**
   * Callback to export data as CSV.
   */
  onExportCSV: () => string;

  /**
   * Optional CSS class name for custom styling.
   */
  className?: string;
}

/**
 * Format aggregation value based on column type and unit.
 *
 * @param value - The aggregated value
 * @param columnId - Column ID to look up type and unit
 * @param schema - Table schema
 * @returns Formatted string
 */
function formatAggregation(
  value: number,
  columnId: string,
  schema: TableSchema
): string {
  const column = schema.columns.find((col) => col.id === columnId);

  if (!column) {
    return value.toFixed(2);
  }

  // Format based on column type
  const formatted = value.toFixed(2).replace(/\.00$/, '');

  // Add unit if present
  if (column.unit) {
    return `${column.unit}${formatted}`;
  }

  return formatted;
}

/**
 * Get aggregation label based on type.
 *
 * @param columnId - Column ID
 * @param schema - Table schema
 * @returns Human-readable label
 */
function getAggregationLabel(columnId: string, schema: TableSchema): string {
  const column = schema.columns.find((col) => col.id === columnId);

  if (!column) {
    return columnId;
  }

  const aggregationType = column.aggregation || 'sum';
  const typeLabel = {
    sum: 'Total',
    avg: 'Average',
    min: 'Min',
    max: 'Max',
    count: 'Count'
  }[aggregationType];

  return `${typeLabel} ${column.label}`;
}

/**
 * Download CSV file to user's computer.
 *
 * @param csvContent - CSV string content
 * @param filename - Suggested filename
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new window.Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = window.document.createElement('a');

  if (link.download !== undefined) {
    // Create download link
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

/**
 * CompletionFooter Component
 *
 * Shows:
 * - Completion status and row counts
 * - Aggregated statistics (totals, averages, etc.)
 * - CSV export button
 *
 * Only visible when stream is complete and metadata is available.
 */
export function CompletionFooter({
  schema,
  metadata,
  isComplete,
  visibleRowCount,
  totalRowCount,
  onExportCSV,
  className
}: CompletionFooterProps): JSX.Element | null {
  // Don't render if stream not complete or no metadata
  if (!isComplete || !metadata || !schema) {
    return null;
  }

  /**
   * Handle CSV export button click
   */
  const handleExport = (): void => {
    try {
      const csv = onExportCSV();
      const filename = `${schema.title?.replace(/\s+/g, '-').toLowerCase() || 'table-export'}-${Date.now()}.csv`;
      downloadCSV(csv, filename);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  // Check if there are any aggregations to show
  const hasAggregations = Boolean(metadata.aggregations && Object.keys(metadata.aggregations).length > 0);

  return (
    <div className={`${styles.footer} ${className || ''}`}>
      {/* Completion Status */}
      <div className={styles.statusSection}>
        <div className={styles.statusIcon}>✓</div>
        <div className={styles.statusText}>
          <div className={styles.statusTitle}>Stream Complete</div>
          <div className={styles.statusDetails}>
            {visibleRowCount === totalRowCount ? (
              `Showing all ${totalRowCount} rows`
            ) : (
              `Showing ${visibleRowCount} of ${totalRowCount} rows (filtered)`
            )}
          </div>
        </div>
      </div>

      {/* Aggregations */}
      {hasAggregations && metadata.aggregations && (
        <div className={styles.aggregationsSection}>
          <div className={styles.aggregationsTitle}>Summary Statistics</div>
          <div className={styles.aggregations}>
            {Object.entries(metadata.aggregations).map(([columnId, value]) => (
              <div key={columnId} className={styles.aggregation}>
                <span className={styles.aggregationLabel}>
                  {getAggregationLabel(columnId, schema)}:
                </span>
                <span className={styles.aggregationValue}>
                  {formatAggregation(value, columnId, schema)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className={styles.exportSection}>
        <button
          className={styles.exportButton}
          onClick={handleExport}
          aria-label="Export data as CSV"
        >
          <span className={styles.exportIcon}>⬇</span>
          Export as CSV
        </button>
      </div>
    </div>
  );
}
