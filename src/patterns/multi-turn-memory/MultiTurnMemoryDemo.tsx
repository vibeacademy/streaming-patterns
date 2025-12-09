/**
 * Multi-Turn Memory Timeline Pattern - Main Demo Component
 *
 * This component demonstrates the complete Multi-Turn Memory Timeline pattern,
 * showing how agents can maintain visible, manageable memory across conversation turns.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Full pattern implementation with network inspector integration
 */

import { useState, useCallback } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { PatternHelmet } from '@/components/PatternHelmet';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture, type EventFilter } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import { useMemoryTimeline } from './hooks';
import { MemoryTimeline } from './MemoryTimeline';
import { MemoryFilters } from './MemoryFilters';
import { ChatThread } from './ChatThread';
import type { StreamEvent as PatternStreamEvent } from './types';
import styles from './MultiTurnMemoryDemo.module.css';

/**
 * Props for the MemoryDemoContent component
 */
interface MemoryDemoContentProps {
  speed: 'instant' | 'fast' | 'normal' | 'slow';
  showFilters: boolean;
  showInspector: boolean;
  capturedEvents: Array<{ event: GlobalStreamEvent; sequence: number; capturedAt: number }>;
  onEventCapture: (event: GlobalStreamEvent) => void;
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  onClearEvents: () => void;
}

/**
 * MemoryDemoContent Component
 *
 * Inner component that contains the hook and all memory-related state.
 * Separated from the wrapper to enable proper reset via key prop.
 *
 * Educational Note: By putting the hook in a separate component that receives
 * a key prop, we can force a complete remount (and hook state reset) by
 * changing the key. This is the React-idiomatic way to reset component state.
 */
function MemoryDemoContent({ speed, showFilters, showInspector, capturedEvents, onEventCapture, filter, onFilterChange, onClearEvents }: MemoryDemoContentProps): JSX.Element {
  // Memoize the event callback to prevent infinite loops
  const handleEvent = useCallback((event: PatternStreamEvent) => {
    // Convert pattern-specific events to global StreamEvent format for network inspector
    // For multi-turn memory, we use the 'memory' type for all memory lifecycle events
    const globalEvent: GlobalStreamEvent = {
      id: `${event.type}-${event.timestamp}`,
      timestamp: event.timestamp,
      type: 'memory',
      data: {
        id: 'data' in event && typeof event.data === 'object' && event.data !== null && 'id' in event.data
          ? String(event.data.id)
          : `${event.type}-${event.timestamp}`,
        operation: event.type.includes('create') ? 'create' :
                   event.type.includes('update') ? 'update' :
                   event.type.includes('prune') ? 'prune' : 'recall',
        content: JSON.stringify(event.data),
        importance: 0.5,
        turn: 0,
        timestamp: event.timestamp,
      },
    };

    onEventCapture(globalEvent);
  }, [onEventCapture]);

  // Use the memory timeline hook with network inspector callback
  const {
    filteredMemories,
    messages,
    isStreaming,
    filters,
    actions,
    memories,
  } = useMemoryTimeline({
    speed,
    autoStart: true,
    onEvent: handleEvent,
  });

  return (
    <>
      {/* Memory Timeline (Sticky) */}
      <div className={styles.memorySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Agent Memory</h2>
          <div className={styles.memoryStats}>
            <span className={styles.stat}>
              {memories.size} total
            </span>
            <span className={styles.statSeparator}>•</span>
            <span className={styles.stat}>
              {filteredMemories.length} visible
            </span>
            <span className={styles.statSeparator}>•</span>
            <span className={styles.stat}>
              {Array.from(memories.values()).filter(m => m.pinned).length} pinned
            </span>
          </div>
        </div>

        <MemoryTimeline
          memories={filteredMemories}
          onTogglePin={actions.togglePin}
          onPrune={actions.pruneMemory}
        />
      </div>

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className={styles.sidebar}>
            <MemoryFilters
              filters={filters}
              memoryCount={filteredMemories.length}
              onFiltersChange={actions.setFilters}
            />
          </aside>
        )}

        {/* Chat Thread */}
        <main className={styles.main}>
          <div className={styles.chatHeader}>
            <h2 className={styles.sectionTitle}>Conversation</h2>
            {isStreaming && (
              <span className={styles.streamingBadge}>Streaming...</span>
            )}
          </div>

          <div
            role="log"
            aria-live="polite"
            aria-label="Chat conversation history"
          >
            <ChatThread messages={messages} isStreaming={isStreaming} />
          </div>
        </main>
      </div>

      {/* Network Inspector */}
      {showInspector && (
        <section className={styles.inspectorSection} aria-label="Network inspector">
          <NetworkInspector
            events={capturedEvents}
            filter={filter}
            onFilterChange={onFilterChange}
            onClearEvents={onClearEvents}
            title="Memory Stream Events"
          />
        </section>
      )}
    </>
  );
}

/**
 * MultiTurnMemoryDemo Component
 *
 * Wrapper component that manages demo-level state (speed, filters visibility, demo key).
 * The actual memory state lives in MemoryDemoContent, which can be reset via key change.
 *
 * Educational Notes:
 * - Demonstrates memory lifecycle (create, update, prune)
 * - Shows user control over AI memory (pin/prune)
 * - Visualizes provenance (token excerpts)
 * - Implements real-time filtering
 * - Separates memory timeline from chat UI
 * - Reset functionality via component key change
 *
 * @returns JSX element
 */
export function MultiTurnMemoryDemo(): JSX.Element {
  const [speed, setSpeed] = useState<'instant' | 'fast' | 'normal' | 'slow'>('normal');
  const [showFilters, setShowFilters] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  // Demo key for forcing reset - incrementing this remounts MemoryDemoContent
  const [demoKey, setDemoKey] = useState(0);

  // Network capture for debugging and visualization
  const { events, captureEvent, clearEvents, filter, setFilter } = useNetworkCapture();

  /**
   * Handle demo reset.
   * Clears all state by remounting the content component.
   */
  const handleReset = useCallback((): void => {
    clearEvents();
    setDemoKey((prev) => prev + 1);
  }, [clearEvents]);

  /**
   * Handle speed change.
   * Also resets the demo since changing speed mid-stream isn't supported.
   */
  const handleSpeedChange = useCallback((newSpeed: typeof speed): void => {
    setSpeed(newSpeed);
    clearEvents();
    setDemoKey((prev) => prev + 1);
  }, [clearEvents]);

  /**
   * Handle Network Inspector toggle.
   */
  const handleToggleInspector = useCallback((): void => {
    setShowInspector((prev) => !prev);
  }, []);

  return (
    <>
      <PatternHelmet patternId="multi-turn-memory" />
      <DemoContainer
        title="Multi-Turn Memory Pattern"
        description="Watch the agent build and maintain memory across conversation turns"
        maxWidth="full"
        actions={
        <Button
          onClick={handleToggleInspector}
          variant="ghost"
          size="sm"
          aria-pressed={showInspector ? 'true' : 'false'}
          aria-label={showInspector ? 'Hide Inspector' : 'Show Inspector'}
        >
          {showInspector ? 'Hide Inspector' : 'Show Inspector'}
        </Button>
      }
    >
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Stream Speed</label>
          <div className={styles.speedButtons} role="group" aria-label="Stream speed selector">
            {(['instant', 'fast', 'normal', 'slow'] as const).map((speedOption) => (
              <Button
                key={speedOption}
                onClick={() => handleSpeedChange(speedOption)}
                variant={speed === speedOption ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={speed === speedOption ? 'true' : 'false'}
                title={`${speedOption.charAt(0).toUpperCase() + speedOption.slice(1)} speed`}
              >
                {speedOption.charAt(0).toUpperCase() + speedOption.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <button
          className={styles.toggleButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>

        <Button
          onClick={handleReset}
          variant="secondary"
          size="sm"
          aria-label="Reset demo to beginning"
        >
          Reset Demo
        </Button>
      </div>

      {/* Scenario Context */}
      <div className={styles.scenario}>
        <ScenarioCard
          description="StreamFlow PM's agent maintains visible memory across a multi-turn project planning conversation."
        />
      </div>

      {/* Main Content - Keyed for proper reset */}
      <MemoryDemoContent
        key={demoKey}
        speed={speed}
        showFilters={showFilters}
        showInspector={showInspector}
        capturedEvents={events}
        onEventCapture={captureEvent}
        filter={filter}
        onFilterChange={setFilter}
        onClearEvents={clearEvents}
      />

      {/* Pattern Learning Points */}
      <div className={styles.footer}>
        <Card className={styles.learningCard}>
          <div className={styles.cardHeader}>
            <h4>Pattern Learning Points</h4>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.learningList}>
              <li>
                <strong>Memory Lifecycle:</strong> Explicit create, update, and prune events make agent memory transparent and manageable
              </li>
              <li>
                <strong>Provenance:</strong> Each memory links back to conversation tokens, showing where information came from
              </li>
              <li>
                <strong>User Control:</strong> Users can pin important memories or prune irrelevant ones, giving agency over agent knowledge
              </li>
              <li>
                <strong>Filtering:</strong> Real-time filters by type, search, or pinned status help users navigate large memory sets
              </li>
              <li>
                <strong>Multi-Turn Persistence:</strong> Memory persists and evolves across conversation turns, enabling context-aware responses
              </li>
              <li>
                <strong>Timeline Visualization:</strong> Separate memory panel keeps context visible without cluttering the conversation
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </DemoContainer>
    </>
  );
}

export default MultiTurnMemoryDemo;
