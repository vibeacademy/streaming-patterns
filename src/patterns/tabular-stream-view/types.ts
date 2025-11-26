/**
 * Type definitions for the Tabular Stream View pattern.
 *
 * This pattern demonstrates how to render structured data (tables) that stream
 * row-by-row, allowing users to interact with partial results before all data
 * has arrived. This is common in data dashboards, reports, and analytics interfaces.
 *
 * @module patterns/tabular-stream-view/types
 */

/**
 * Supported column data types in the streaming table.
 *
 * Each type determines how the column is rendered, sorted, and filtered.
 */
export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

/**
 * Aggregation functions for numeric columns.
 *
 * Applied to completed datasets to show totals, averages, etc.
 */
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count';

/**
 * Definition for a single column in the table schema.
 *
 * Columns are defined before rows start streaming to establish
 * the table structure and enable progressive rendering.
 *
 * @example
 * ```typescript
 * const column: ColumnDefinition = {
 *   id: 'allocation',
 *   label: 'Current Allocation',
 *   type: 'number',
 *   sortable: true,
 *   filterable: false,
 *   unit: '%',
 *   aggregation: 'avg'
 * };
 * ```
 */
export interface ColumnDefinition {
  /**
   * Unique identifier for the column.
   * Used as the key in row data objects.
   */
  id: string;

  /**
   * Human-readable column label shown in table header.
   */
  label: string;

  /**
   * Data type of column values.
   * Determines rendering, sorting, and filtering behavior.
   */
  type: ColumnType;

  /**
   * Whether the column can be sorted.
   * @default false
   */
  sortable?: boolean;

  /**
   * Whether the column can be filtered.
   * @default false
   */
  filterable?: boolean;

  /**
   * Optional unit label for numeric columns (e.g., '$', '%', 'hrs').
   * Displayed next to column values.
   */
  unit?: string;

  /**
   * Aggregation function to apply on completion.
   * Only valid for numeric columns.
   */
  aggregation?: AggregationType;

  /**
   * Optional width hint for the column (CSS value).
   * @example '200px', '20%', 'auto'
   */
  width?: string;

  /**
   * Whether this column should be hidden by default.
   * Users can still show it via column visibility controls.
   * @default false
   */
  hidden?: boolean;
}

/**
 * Table schema defining the structure before rows arrive.
 *
 * The schema event is the first event in a tabular stream,
 * establishing the column structure and metadata.
 *
 * @example
 * ```typescript
 * const schema: TableSchema = {
 *   columns: [
 *     { id: 'name', label: 'Team Member', type: 'string', sortable: true },
 *     { id: 'role', label: 'Role', type: 'string', filterable: true },
 *     { id: 'allocation', label: 'Allocation', type: 'number', unit: '%' }
 *   ],
 *   totalRows: 12
 * };
 * ```
 */
export interface TableSchema {
  /**
   * Array of column definitions.
   * Order determines the default column display order.
   */
  columns: ColumnDefinition[];

  /**
   * Hint for total number of rows that will be streamed.
   * Used for progress indicators. May be undefined if unknown.
   */
  totalRows?: number;

  /**
   * Optional table title or caption.
   */
  title?: string;

  /**
   * Optional metadata about the data source.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Single row of data in the table.
 *
 * Values object must have keys matching column IDs from the schema.
 * Missing values are treated as null/undefined.
 *
 * @example
 * ```typescript
 * const row: TableRow = {
 *   rowId: 'dev-001',
 *   values: {
 *     name: 'Sarah Chen',
 *     role: 'Senior Frontend',
 *     allocation: 85,
 *     hourlyRate: 125
 *   },
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface TableRow {
  /**
   * Unique identifier for this row.
   * Used for React keys and row operations.
   */
  rowId: string;

  /**
   * Row data values keyed by column IDs.
   * Keys must match column.id from the schema.
   */
  values: Record<string, string | number | boolean | null>;

  /**
   * Optional timestamp when row was generated (Unix epoch ms).
   * Useful for debugging and replay.
   */
  timestamp?: number;

  /**
   * Optional metadata for this specific row.
   * Can be used for row-specific styling or behavior.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated statistics for completed datasets.
 *
 * Contains totals, averages, etc. computed over all rows.
 * Only available after the stream has completed.
 *
 * @example
 * ```typescript
 * const meta: TableMetadata = {
 *   totalRows: 12,
 *   aggregations: {
 *     allocation: 78.5,
 *     hourlyRate: 110.25
 *   },
 *   completedAt: Date.now()
 * };
 * ```
 */
export interface TableMetadata {
  /**
   * Total number of rows streamed.
   * Should match schema.totalRows if it was provided.
   */
  totalRows: number;

  /**
   * Aggregated values keyed by column ID.
   * Only includes columns with aggregation functions defined.
   */
  aggregations?: Record<string, number>;

  /**
   * Timestamp when the stream completed (Unix epoch ms).
   */
  completedAt?: number;

  /**
   * Optional additional metadata from the server.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Stream event emitted with the table schema (first event).
 */
export interface SchemaStreamEvent {
  /**
   * Event type discriminator. Always 'schema' for schema events.
   */
  type: 'schema';

  /**
   * The table schema data payload.
   */
  data: TableSchema;
}

/**
 * Stream event emitted for each table row (progressive).
 */
export interface RowStreamEvent {
  /**
   * Event type discriminator. Always 'table_row' for row events.
   */
  type: 'table_row';

  /**
   * The table row data payload.
   */
  data: TableRow;
}

/**
 * Stream event emitted with metadata (completion or intermediate stats).
 */
export interface MetadataStreamEvent {
  /**
   * Event type discriminator. Always 'table_meta' for metadata events.
   */
  type: 'table_meta';

  /**
   * The table metadata payload.
   */
  data: TableMetadata;
}

/**
 * Union type of all possible stream events in the Tabular Stream View pattern.
 *
 * This discriminated union enables type-safe event handling.
 *
 * @example
 * ```typescript
 * function handleEvent(event: StreamEvent): void {
 *   switch (event.type) {
 *     case 'schema':
 *       console.log('Schema:', event.data.columns.length, 'columns');
 *       break;
 *     case 'table_row':
 *       console.log('Row:', event.data.rowId);
 *       break;
 *     case 'table_meta':
 *       console.log('Metadata:', event.data.totalRows, 'rows');
 *       break;
 *   }
 * }
 * ```
 */
export type StreamEvent = SchemaStreamEvent | RowStreamEvent | MetadataStreamEvent;

/**
 * Sort direction for column sorting.
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort configuration for the table.
 *
 * @example
 * ```typescript
 * const sort: SortConfig = {
 *   columnId: 'allocation',
 *   direction: 'desc'
 * };
 * ```
 */
export interface SortConfig {
  /**
   * ID of the column to sort by.
   */
  columnId: string;

  /**
   * Sort direction (ascending, descending, or none).
   */
  direction: SortDirection;
}

/**
 * Filter operator types.
 */
export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';

/**
 * Filter configuration for a single column.
 *
 * @example
 * ```typescript
 * const filter: FilterConfig = {
 *   columnId: 'role',
 *   operator: 'contains',
 *   value: 'Frontend'
 * };
 * ```
 */
export interface FilterConfig {
  /**
   * ID of the column to filter.
   */
  columnId: string;

  /**
   * Filter operator to apply.
   */
  operator: FilterOperator;

  /**
   * Value to filter by.
   */
  value: string | number | boolean;
}

/**
 * Configuration options for the tabular stream.
 *
 * Used to control streaming behavior and support different demo speeds.
 */
export interface TabularStreamConfig {
  /**
   * Optional scenario identifier to select fixture data.
   * If not provided, uses default team capacity scenario.
   */
  scenario?: string;

  /**
   * Stream speed control for educational demos.
   * - 'fast': 50ms delay between rows
   * - 'normal': 300ms delay between rows
   * - 'slow': 1000ms delay between rows
   * @default 'normal'
   */
  speed?: 'fast' | 'normal' | 'slow';

  /**
   * Optional callback invoked when each event is emitted.
   * Useful for network capture, logging, and debugging.
   */
  onEvent?: (event: StreamEvent) => void;

  /**
   * Maximum time to wait for stream completion (ms).
   * @default 30000 (30 seconds)
   */
  timeoutMs?: number;

  /**
   * Error simulation mode for testing error handling.
   * - 'none': No errors (default)
   * - 'timeout': Simulate a timeout error
   * - 'network': Simulate a network failure
   * - 'mid-stream': Simulate an error halfway through
   * @default 'none'
   */
  simulateError?: 'none' | 'timeout' | 'network' | 'mid-stream';
}

/**
 * Return type for the useTabularStream hook.
 *
 * Provides reactive state and metadata about the streaming table.
 */
export interface TabularStreamState {
  /**
   * The table schema (undefined until schema event arrives).
   */
  schema?: TableSchema;

  /**
   * Array of table rows received so far.
   * Updates incrementally as new row events arrive.
   */
  rows: TableRow[];

  /**
   * Table metadata (undefined until meta event arrives).
   * Contains aggregations and completion stats.
   */
  metadata?: TableMetadata;

  /**
   * True if the stream is currently active and emitting events.
   */
  isStreaming: boolean;

  /**
   * True if the stream has completed successfully.
   */
  isComplete: boolean;

  /**
   * Error object if the stream encountered an error.
   * Undefined if no error has occurred.
   */
  error?: Error;

  /**
   * Current sort configuration.
   */
  sort: SortConfig | null;

  /**
   * Active filters.
   */
  filters: FilterConfig[];

  /**
   * Apply a new sort configuration.
   * Works on whatever rows currently exist.
   */
  setSort: (sort: SortConfig | null) => void;

  /**
   * Add or update a filter.
   */
  addFilter: (filter: FilterConfig) => void;

  /**
   * Remove a filter by column ID.
   */
  removeFilter: (columnId: string) => void;

  /**
   * Clear all filters.
   */
  clearFilters: () => void;

  /**
   * Get filtered and sorted rows.
   * Applies current sort and filter configurations.
   */
  getVisibleRows: () => TableRow[];

  /**
   * Export current data as CSV.
   * Works on filtered/sorted rows if filters/sort are active.
   */
  exportCSV: () => string;
}

/**
 * Types of errors that can occur during tabular streaming.
 */
export type StreamErrorType = 'timeout' | 'network' | 'stream' | 'schema' | 'unknown';

/**
 * Error class for tabular stream failures.
 *
 * @example
 * ```typescript
 * throw new StreamError('Invalid schema: missing required column', 'schema');
 * ```
 */
export class StreamError extends Error {
  constructor(
    message: string,
    public readonly type: StreamErrorType
  ) {
    super(message);
    this.name = 'StreamError';
  }
}
