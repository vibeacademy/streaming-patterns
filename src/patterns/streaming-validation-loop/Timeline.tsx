/**
 * Streaming Validation Loop Pattern - Timeline Component
 *
 * This component displays a retrospective timeline of all checkpoints,
 * showing when they occurred, how long they took, and what action was taken.
 *
 * Educational Note: The timeline provides transparency into the checkpoint
 * workflow. Users can see the complete history of approvals, edits, and skips.
 * This is valuable for audit trails and understanding the decision flow.
 *
 * @pattern Streaming Validation Loop
 */

import type { TimelineProps } from './types';
import styles from './Timeline.module.css';

export function Timeline({ entries, activeCheckpointId }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <div className={styles.emptyTimeline}>
        <p>No checkpoints yet. Timeline will appear as approvals are made.</p>
      </div>
    );
  }

  /**
   * Format duration in human-readable form.
   */
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  /**
   * Format timestamp as time string.
   */
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  /**
   * Get action badge color.
   */
  const getActionColor = (action: string): string => {
    switch (action) {
      case 'approve':
        return styles.approveAction;
      case 'edit':
        return styles.editAction;
      case 'skip':
        return styles.skipAction;
      default:
        return '';
    }
  };

  return (
    <div className={styles.timeline} role="region" aria-label="Checkpoint timeline">
      <h3 className={styles.timelineTitle}>Checkpoint History</h3>
      <div className={styles.timelineList}>
        {entries.map((entry, index) => {
          const isActive = entry.checkpointId === activeCheckpointId;

          return (
            <div
              key={entry.checkpointId}
              className={`${styles.timelineEntry} ${
                isActive ? styles.activeEntry : ''
              }`}
            >
              {/* Timeline marker */}
              <div className={styles.marker}>
                <div className={styles.markerDot} />
                {index < entries.length - 1 && (
                  <div className={styles.markerLine} />
                )}
              </div>

              {/* Entry content */}
              <div className={styles.entryContent}>
                {/* Header */}
                <div className={styles.entryHeader}>
                  <div className={styles.entryTeam}>{entry.team}</div>
                  <div
                    className={`${styles.entryAction} ${getActionColor(
                      entry.action
                    )}`}
                  >
                    {entry.action}
                  </div>
                </div>

                {/* Details */}
                <div className={styles.entryDetails}>
                  <div className={styles.entryTime}>
                    {formatTime(entry.createdAt)} → {formatTime(entry.resolvedAt)}
                  </div>
                  <div className={styles.entryDuration}>
                    {formatDuration(entry.durationMs)}
                  </div>
                </div>

                {/* Budget comparison */}
                <div className={styles.budgetComparison}>
                  <div className={styles.budgetRow}>
                    <span className={styles.budgetLabel}>Proposed:</span>
                    <span className={styles.budgetValue}>
                      ${entry.proposedValue.budget.toLocaleString()}
                    </span>
                  </div>
                  {entry.wasEdited && (
                    <div className={styles.budgetRow}>
                      <span className={styles.budgetLabel}>Approved:</span>
                      <span
                        className={`${styles.budgetValue} ${styles.budgetEdited}`}
                      >
                        ${entry.approvedValue.budget.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className={styles.badges}>
                  {entry.wasEdited && (
                    <span className={styles.badge}>
                      Edited
                    </span>
                  )}
                  {entry.wasTimedOut && (
                    <span className={`${styles.badge} ${styles.timeoutBadge}`}>
                      Timed Out
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
