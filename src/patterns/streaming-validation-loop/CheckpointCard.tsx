/**
 * Streaming Validation Loop Pattern - Checkpoint Card Component
 *
 * This component displays a checkpoint requiring user approval, with actions
 * for approve, edit, and skip.
 *
 * Educational Note: The checkpoint card is the key UI element of this pattern.
 * It presents the proposed value, explains the decision, and provides clear
 * actions for the user. The countdown timer adds urgency and demonstrates
 * timeout handling.
 *
 * @pattern Streaming Validation Loop
 */

import { useState, useEffect } from 'react';
import type { CheckpointCardProps, BudgetAllocation } from './types';
import styles from './CheckpointCard.module.css';

export function CheckpointCard({
  checkpoint,
  onApprove,
  onEdit,
  onSkip,
  remainingTimeMs,
}: CheckpointCardProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedValue, setEditedValue] = useState<BudgetAllocation>(
    checkpoint.proposedValue
  );

  // Format remaining time as seconds
  const remainingSeconds = Math.ceil(remainingTimeMs / 1000);

  /**
   * Handle approve action.
   *
   * Educational Note: Keyboard shortcut (Enter) for quick approval.
   */
  const handleApprove = () => {
    onApprove();
  };

  /**
   * Handle skip action.
   *
   * Educational Note: Keyboard shortcut (Esc) for quick skip.
   */
  const handleSkip = () => {
    onSkip();
  };

  /**
   * Handle edit mode toggle.
   */
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  /**
   * Handle edit submission.
   */
  const handleEditSubmit = () => {
    onEdit(editedValue);
    setIsEditing(false);
  };

  /**
   * Handle budget field change.
   */
  const handleBudgetChange = (value: string) => {
    const budget = parseInt(value, 10);
    if (!isNaN(budget)) {
      setEditedValue((prev) => ({ ...prev, budget }));
    }
  };

  /**
   * Handle headcount field change.
   */
  const handleHeadcountChange = (value: string) => {
    const headcount = parseInt(value, 10);
    if (!isNaN(headcount)) {
      setEditedValue((prev) => ({ ...prev, headcount }));
    }
  };

  /**
   * Handle contractors field change.
   */
  const handleContractorsChange = (value: string) => {
    const contractors = parseInt(value, 10);
    if (!isNaN(contractors)) {
      setEditedValue((prev) => ({ ...prev, contractors }));
    }
  };

  /**
   * Keyboard shortcuts for quick actions.
   *
   * Educational Note: Keyboard accessibility is important for power users.
   * Enter = approve, Esc = skip, E = edit.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Disable shortcuts while editing

      if (e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleEditToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  return (
    <div className={styles.checkpointCard} role="dialog" aria-label={checkpoint.question}>
      {/* Timeout indicator */}
      <div className={styles.timeoutBar}>
        <div
          className={styles.timeoutProgress}
          style={{
            width: `${(remainingTimeMs / checkpoint.timeoutMs) * 100}%`,
          }}
        />
      </div>

      {/* Checkpoint question */}
      <div className={styles.header}>
        <h3 className={styles.question}>{checkpoint.question}</h3>
        <div className={styles.timeout} aria-live="polite">
          Auto-approve in {remainingSeconds}s
        </div>
      </div>

      {/* Proposed allocation details */}
      {!isEditing ? (
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Team:</span>
            <span className={styles.value}>{checkpoint.proposedValue.team}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Budget:</span>
            <span className={styles.value}>
              ${checkpoint.proposedValue.budget.toLocaleString()}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Headcount:</span>
            <span className={styles.value}>
              {checkpoint.proposedValue.headcount} FTEs
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Contractors:</span>
            <span className={styles.value}>
              {checkpoint.proposedValue.contractors}
            </span>
          </div>
          <div className={styles.rationale}>
            <strong>Rationale:</strong>
            <p>{checkpoint.proposedValue.rationale}</p>
          </div>
        </div>
      ) : (
        <div className={styles.editForm}>
          <div className={styles.formField}>
            <label htmlFor="budget">Budget ($):</label>
            <input
              id="budget"
              type="number"
              value={editedValue.budget}
              onChange={(e) => handleBudgetChange(e.target.value)}
              min={0}
              step={1000}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="headcount">Headcount (FTEs):</label>
            <input
              id="headcount"
              type="number"
              value={editedValue.headcount}
              onChange={(e) => handleHeadcountChange(e.target.value)}
              min={0}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="contractors">Contractors:</label>
            <input
              id="contractors"
              type="number"
              value={editedValue.contractors}
              onChange={(e) => handleContractorsChange(e.target.value)}
              min={0}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {!isEditing ? (
          <>
            <button
              className={`${styles.button} ${styles.approveButton}`}
              onClick={handleApprove}
              aria-label="Approve proposed allocation"
            >
              Approve
              <span className={styles.shortcut}>↵</span>
            </button>
            <button
              className={`${styles.button} ${styles.editButton}`}
              onClick={handleEditToggle}
              aria-label="Edit proposed allocation"
            >
              Edit
              <span className={styles.shortcut}>E</span>
            </button>
            <button
              className={`${styles.button} ${styles.skipButton}`}
              onClick={handleSkip}
              aria-label="Skip this allocation"
            >
              Skip
              <span className={styles.shortcut}>Esc</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={`${styles.button} ${styles.approveButton}`}
              onClick={handleEditSubmit}
              aria-label="Submit edited allocation"
            >
              Submit Changes
            </button>
            <button
              className={`${styles.button} ${styles.skipButton}`}
              onClick={() => {
                setIsEditing(false);
                setEditedValue(checkpoint.proposedValue);
              }}
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
