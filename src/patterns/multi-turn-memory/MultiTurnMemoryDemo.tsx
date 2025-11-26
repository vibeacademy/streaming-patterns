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
import { useMemoryTimeline } from './hooks';
import { MemoryTimeline } from './MemoryTimeline';
import { MemoryFilters } from './MemoryFilters';
import { ChatThread } from './ChatThread';
import styles from './MultiTurnMemoryDemo.module.css';

/**
 * MultiTurnMemoryDemo Component
 *
 * Educational Notes:
 * - Demonstrates memory lifecycle (create, update, prune)
 * - Shows user control over AI memory (pin/prune)
 * - Visualizes provenance (token excerpts)
 * - Implements real-time filtering
 * - Separates memory timeline from chat UI
 *
 * @returns JSX element
 */
export function MultiTurnMemoryDemo(): JSX.Element {
  const [speed, setSpeed] = useState<'instant' | 'fast' | 'normal' | 'slow'>('normal');
  const [showFilters, setShowFilters] = useState(true);

  // Memoize the event callback to prevent infinite loops
  const handleEvent = useCallback((event: { type: string; data: unknown }) => {
    // Events can be captured for network inspector
    console.log('Memory event:', event.type, event.data);
  }, []);

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
    <div className={styles.demo}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Multi-Turn Memory Timeline</h1>
          <p className={styles.subtitle}>
            Watch the agent build and maintain memory across conversation turns
          </p>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <label className={styles.controlLabel}>
            Stream Speed:
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as typeof speed)}
              className={styles.select}
              disabled={isStreaming}
            >
              <option value="instant">Instant</option>
              <option value="fast">Fast</option>
              <option value="normal">Normal</option>
              <option value="slow">Slow</option>
            </select>
          </label>

          <button
            className={styles.toggleButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

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

          <ChatThread messages={messages} isStreaming={isStreaming} />
        </main>
      </div>

      {/* Pattern Info Footer */}
      <div className={styles.footer}>
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>Pattern Features</h3>
          <ul className={styles.featureList}>
            <li>
              <strong>Memory Lifecycle:</strong> Create, update, and prune events
            </li>
            <li>
              <strong>Provenance:</strong> Hover over memories to see token excerpts
            </li>
            <li>
              <strong>User Control:</strong> Pin important memories or prune irrelevant ones
            </li>
            <li>
              <strong>Filtering:</strong> Filter by type, search, or pinned status
            </li>
            <li>
              <strong>Multi-Turn:</strong> Memory persists and evolves across conversation
            </li>
          </ul>
        </div>

        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>Try It Out</h3>
          <ul className={styles.actionList}>
            <li>Hover over a memory card to see the token excerpt</li>
            <li>Click the pin icon to prevent auto-pruning</li>
            <li>Click the X to manually prune a memory</li>
            <li>Use filters to focus on specific memory types</li>
            <li>Watch how memories update across turns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MultiTurnMemoryDemo;
