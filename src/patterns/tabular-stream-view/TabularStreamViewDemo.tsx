/**
 * Tabular Stream View Pattern Demo
 *
 * This component demonstrates the progressive table rendering pattern where
 * structured tabular data streams in row-by-row, allowing users to interact
 * with partial results before the full dataset arrives.
 *
 * Educational Focus:
 * - Progressive rendering of table rows
 * - Client-side sorting/filtering on streaming data
 * - Skeleton loading states for anticipated rows
 * - CSV export functionality
 * - Network inspector integration for stream transparency
 *
 * Demo Scenario:
 * StreamFlow PM team capacity matrix - AI analyzes team availability and
 * streams results progressively, showing capacity, rates, and skills.
 *
 * @module patterns/tabular-stream-view/TabularStreamViewDemo
 */

import { useState, useCallback, useMemo } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { NetworkInspector } from '@/components/NetworkInspector';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { useTabularStream } from './hooks';
import { StreamingTable } from './StreamingTable';
import { TableControls } from './TableControls';
import { CompletionFooter } from './CompletionFooter';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import type { StreamEvent as PatternStreamEvent } from './types';
import styles from './TabularStreamViewDemo.module.css';

/**
 * Map pattern-specific stream events to global event types for Network Inspector.
 *
 * This adapter function bridges between the pattern's internal event structure
 * and the global StreamEvent type used by the Network Inspector.
 */
function adaptEventForNetworkInspector(
  event: PatternStreamEvent
): GlobalStreamEvent | null {
  const timestamp = Date.now();
  const id = `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  switch (event.type) {
    case 'schema':
      // Map to global SchemaEvent format
      return {
        id,
        type: 'schema',
        timestamp,
        data: {
          id: event.data.title || 'table-schema',
          name: event.data.title || 'Table Schema',
          columns: event.data.columns.map((col) => ({
            id: col.id,
            name: col.label,
            type: col.type as 'string' | 'number' | 'boolean' | 'date' | 'json',
            required: false
          })),
          description: event.data.title
        }
      };

    case 'table_row':
      // Map to global RowEvent format
      return {
        id,
        type: 'table_row',
        timestamp: event.data.timestamp || timestamp,
        data: {
          id: event.data.rowId,
          data: event.data.values,
          rowNumber: 0, // Not used in pattern
          timestamp: event.data.timestamp || timestamp
        }
      };

    case 'table_meta':
      // Map to global MetaEvent format
      return {
        id,
        type: 'table_meta',
        timestamp: event.data.completedAt || timestamp,
        data: {
          totalRows: event.data.totalRows,
          progress: 1.0,
          isComplete: true,
          statusMessage: 'Stream complete'
        }
      };

    default:
      return null;
  }
}

/**
 * Demo speed options
 */
type DemoSpeed = 'fast' | 'normal' | 'slow';

/**
 * TabularStreamViewDemo Component
 *
 * Main demo component that:
 * 1. Streams team capacity data progressively
 * 2. Renders table with skeleton loading states
 * 3. Provides sort/filter controls
 * 4. Shows aggregated statistics on completion
 * 5. Integrates with network inspector
 */
export function TabularStreamViewDemo(): JSX.Element {
  // Demo controls state
  const [speed, setSpeed] = useState<DemoSpeed>('normal');
  const [isRestarting, setIsRestarting] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Network capture for inspector
  const { captureEvent, filteredEvents, clearEvents } = useNetworkCapture();

  // Tabular stream hook with event capture
  const tabularStream = useTabularStream({
    scenario: 'team-capacity',
    speed,
    onEvent: (event) => {
      // Adapt and capture event for network inspector
      const globalEvent = adaptEventForNetworkInspector(event);
      if (globalEvent) {
        captureEvent(globalEvent);
      }
    }
  });

  const {
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
    exportCSV
  } = tabularStream;

  // Get visible rows (with filters/sort applied)
  const visibleRows = useMemo(() => getVisibleRows(), [getVisibleRows]);

  /**
   * Handle sort changes from table header clicks
   */
  const handleHeaderSort = useCallback(
    (columnId: string): void => {
      if (sort?.columnId === columnId) {
        // Toggle sort direction
        const newDirection = sort.direction === 'asc' ? 'desc' : sort.direction === 'desc' ? null : 'asc';
        setSort(newDirection ? { columnId, direction: newDirection } : null);
      } else {
        // Set new column with ascending sort
        setSort({ columnId, direction: 'asc' });
      }
    },
    [sort, setSort]
  );

  /**
   * Restart the demo with new speed
   */
  const handleRestart = useCallback((): void => {
    setIsRestarting(true);
    clearEvents();
    clearFilters();
    setSort(null);

    // Reset after a brief delay to allow UI to update
    setTimeout(() => {
      setIsRestarting(false);
    }, 100);
  }, [clearEvents, clearFilters, setSort]);

  /**
   * Handle speed change
   */
  const handleSpeedChange = useCallback(
    (newSpeed: DemoSpeed): void => {
      setSpeed(newSpeed);
      handleRestart();
    },
    [handleRestart]
  );

  return (
    <DemoContainer
      title="Tabular Stream View Pattern"
      description="Progressive rendering of structured table data as it streams in"
      maxWidth="full"
      actions={
        <Button
          onClick={() => setShowInspector(!showInspector)}
          variant="ghost"
          size="sm"
          aria-pressed={showInspector}
        >
          {showInspector ? 'Hide Inspector' : 'Show Inspector'}
        </Button>
      }
    >

        {/* Demo Controls */}
        <div className={styles.demoControls}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Stream Speed</label>
            <div className={styles.speedButtons} role="group" aria-label="Stream speed selector">
              <Button
                onClick={() => handleSpeedChange('fast')}
                variant={speed === 'fast' ? 'primary' : 'secondary'}
                size="sm"
                disabled={isStreaming}
                aria-pressed={speed === 'fast' ? 'true' : 'false'}
                title="Fast - 50ms delay"
              >
                Fast
              </Button>
              <Button
                onClick={() => handleSpeedChange('normal')}
                variant={speed === 'normal' ? 'primary' : 'secondary'}
                size="sm"
                disabled={isStreaming}
                aria-pressed={speed === 'normal' ? 'true' : 'false'}
                title="Normal - 300ms delay"
              >
                Normal
              </Button>
              <Button
                onClick={() => handleSpeedChange('slow')}
                variant={speed === 'slow' ? 'primary' : 'secondary'}
                size="sm"
                disabled={isStreaming}
                aria-pressed={speed === 'slow' ? 'true' : 'false'}
                title="Slow - 1000ms delay"
              >
                Slow
              </Button>
            </div>
          </div>

          <Button
            onClick={handleRestart}
            variant="secondary"
            size="sm"
            disabled={isStreaming || isRestarting}
          >
            Restart
          </Button>
        </div>

      {/* Scenario Description */}
      <div className={styles.scenario}>
        <ScenarioCard
          description="StreamFlow PM analyzes your engineering team's availability for Q1 2025, streaming results progressively."
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <strong>Stream Error:</strong> {error.message}
        </div>
      )}

      {/* Main Content */}
      {!error && !isRestarting && (
        <div className={styles.content}>
          {/* Table Controls */}
          <TableControls
            schema={schema}
            sort={sort}
            filters={filters}
            isStreaming={isStreaming}
            onSortChange={setSort}
            onFilterAdd={addFilter}
            onFilterRemove={removeFilter}
            onFilterClear={clearFilters}
          />

          {/* Streaming Table */}
          <StreamingTable
            schema={schema}
            rows={visibleRows}
            isStreaming={isStreaming}
            isComplete={isComplete}
            sort={sort}
            onSort={handleHeaderSort}
          />

          {/* Completion Footer */}
          <CompletionFooter
            schema={schema}
            metadata={metadata}
            isComplete={isComplete}
            visibleRowCount={visibleRows.length}
            totalRowCount={rows.length}
            onExportCSV={exportCSV}
          />
        </div>
      )}

      {/* Network Inspector */}
      {showInspector && (
        <section className={styles.inspectorSection}>
          <NetworkInspector
            events={filteredEvents}
            title="Stream Events"
          />
        </section>
      )}

      {/* Educational Notes */}
      <div className={styles.educationalNotes}>
        <h2 className={styles.notesTitle}>Pattern Implementation Notes</h2>
        <div className={styles.notes}>
          <div className={styles.note}>
            <h3 className={styles.noteTitle}>Progressive Rendering</h3>
            <p className={styles.noteText}>
              Rows appear immediately as they arrive from the stream. Skeleton
              loaders show anticipated rows based on <code>totalRows</code> hint
              in the schema event.
            </p>
          </div>

          <div className={styles.note}>
            <h3 className={styles.noteTitle}>Client-Side Operations</h3>
            <p className={styles.noteText}>
              Sorting and filtering work on whatever data has arrived so far.
              Users can start exploring partial results before the stream completes.
            </p>
          </div>

          <div className={styles.note}>
            <h3 className={styles.noteTitle}>Event Flow</h3>
            <p className={styles.noteText}>
              1. <code>schema</code> event defines table structure
              <br />
              2. <code>table_row</code> events arrive progressively
              <br />
              3. <code>table_meta</code> event signals completion with aggregations
            </p>
          </div>

          <div className={styles.note}>
            <h3 className={styles.noteTitle}>Export Functionality</h3>
            <p className={styles.noteText}>
              CSV export works at any time, even before stream completes. Exported
              data respects current filters and sort order.
            </p>
          </div>
        </div>
      </div>
    </DemoContainer>
  );
}

export default TabularStreamViewDemo;
