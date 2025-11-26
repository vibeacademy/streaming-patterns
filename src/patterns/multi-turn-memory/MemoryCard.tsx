/**
 * Multi-Turn Memory Timeline Pattern - MemoryCard Component
 *
 * Individual memory card displaying a single piece of remembered information
 * with pin/prune controls and provenance tooltip.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Demonstrates memory visualization with user controls
 */

import { useState } from 'react';
import type { Memory } from './types';
import styles from './MemoryCard.module.css';

export interface MemoryCardProps {
  /** The memory to display */
  memory: Memory;

  /** Callback when pin/unpin is clicked */
  onTogglePin: (memoryId: string) => void;

  /** Callback when prune is clicked */
  onPrune: (memoryId: string, reason: string) => void;

  /** Optional: Additional CSS class */
  className?: string;
}

/**
 * MemoryCard Component
 *
 * Educational Notes:
 * - Visual distinction by memory type (fact, decision, task, risk)
 * - Provenance tooltip shows exact token excerpt
 * - Pin icon indicates persistence across turns
 * - Prune action gives users control over AI memory
 *
 * @param props - Component props
 * @returns JSX element
 */
export function MemoryCard({
  memory,
  onTogglePin,
  onPrune,
  className = '',
}: MemoryCardProps): JSX.Element {
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [showPruneConfirm, setShowPruneConfirm] = useState(false);

  /**
   * Handle pin toggle.
   *
   * Educational Note: Pinning prevents auto-pruning and ensures
   * the memory persists across conversation turns.
   */
  const handleTogglePin = (): void => {
    onTogglePin(memory.id);
  };

  /**
   * Handle prune action.
   *
   * Educational Note: Pruning removes irrelevant memories, demonstrating
   * user control over AI context.
   */
  const handlePrune = (): void => {
    onPrune(memory.id, 'User manually pruned');
    setShowPruneConfirm(false);
  };

  /**
   * Get CSS class for memory type styling.
   */
  const typeClass = `memory-${memory.memoryType}`;

  /**
   * Get icon for memory type.
   */
  const getTypeIcon = (): string => {
    switch (memory.memoryType) {
      case 'fact':
        return '📊';
      case 'decision':
        return '✅';
      case 'task':
        return '📝';
      case 'risk':
        return '⚠️';
      default:
        return '💭';
    }
  };

  /**
   * Format timestamp for display.
   */
  const formattedTime = new Date(memory.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`${styles.card} ${styles[typeClass]} ${className}`}
      onMouseEnter={() => setShowExcerpt(true)}
      onMouseLeave={() => setShowExcerpt(false)}
    >
      {/* Memory Type Icon */}
      <div className={styles.typeIcon} title={memory.memoryType}>
        {getTypeIcon()}
      </div>

      {/* Memory Summary */}
      <div className={styles.content}>
        <div className={styles.summary}>{memory.summary}</div>
        <div className={styles.metadata}>
          <span className={styles.time}>{formattedTime}</span>
          {memory.metadata?.source && (
            <span className={styles.source}>
              {memory.metadata.source === 'user' ? 'You' : 'Agent'}
            </span>
          )}
          {memory.metadata?.confidence !== undefined && (
            <span className={styles.confidence}>
              {Math.round(memory.metadata.confidence * 100)}% confident
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Pin Button */}
        <button
          className={`${styles.actionButton} ${memory.pinned ? styles.pinned : ''}`}
          onClick={handleTogglePin}
          title={memory.pinned ? 'Unpin memory' : 'Pin memory'}
          aria-label={memory.pinned ? 'Unpin memory' : 'Pin memory'}
        >
          📌
        </button>

        {/* Prune Button */}
        {!memory.pinned && (
          <button
            className={styles.actionButton}
            onClick={() => setShowPruneConfirm(true)}
            title="Prune memory"
            aria-label="Prune memory"
          >
            ✕
          </button>
        )}
      </div>

      {/* Provenance Tooltip */}
      {showExcerpt && (
        <div className={styles.provenanceTooltip}>
          <div className={styles.tooltipHeader}>Token Excerpt</div>
          <div className={styles.tooltipExcerpt}>"{memory.tokenExcerpt}"</div>
        </div>
      )}

      {/* Prune Confirmation */}
      {showPruneConfirm && (
        <div className={styles.pruneConfirm}>
          <div className={styles.confirmText}>Remove this memory?</div>
          <div className={styles.confirmActions}>
            <button
              className={styles.confirmButton}
              onClick={handlePrune}
            >
              Yes
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setShowPruneConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
