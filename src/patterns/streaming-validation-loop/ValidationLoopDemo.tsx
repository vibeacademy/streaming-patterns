/**
 * Streaming Validation Loop Pattern - Main Demo Component
 *
 * This component demonstrates the complete Streaming Validation Loop pattern
 * with checkpoint-based approvals during budget allocation.
 *
 * Educational Note: This demo shows how to build approval workflows where
 * the stream pauses at critical decision points, waits for user input, and
 * resumes with approved values. This is essential for human-in-the-loop systems.
 *
 * @pattern Streaming Validation Loop
 */

import { useState, useEffect } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { useValidationStream } from './hooks';
import { CheckpointCard } from './CheckpointCard';
import { Timeline } from './Timeline';
import styles from './ValidationLoopDemo.module.css';

export function ValidationLoopDemo() {
  const {
    activeCheckpoint,
    analyses,
    allocations,
    planSummary,
    isStreaming,
    isWaitingForApproval,
    timeline,
    actions,
  } = useValidationStream({
    speed: 'normal',
    onEvent: (event) => {
      // Log events for debugging (would go to network inspector in real app)
      console.log('Stream event:', event);
    },
  });

  // Track remaining time for active checkpoint
  const [remainingTimeMs, setRemainingTimeMs] = useState<number>(0);

  /**
   * Countdown timer for active checkpoint.
   *
   * Educational Note: This effect updates the remaining time every 100ms,
   * providing a smooth countdown animation. When time expires, we auto-approve.
   */
  useEffect(() => {
    if (!activeCheckpoint) {
      setRemainingTimeMs(0);
      return;
    }

    const startTime = activeCheckpoint.timestamp;
    const timeoutMs = activeCheckpoint.timeoutMs;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, timeoutMs - elapsed);
      setRemainingTimeMs(remaining);

      // Auto-approve when time expires
      if (remaining === 0) {
        actions.approve(activeCheckpoint.id);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeCheckpoint, actions]);

  return (
    <DemoContainer
      title="Streaming Validation Loop Pattern"
      description="Budget allocation with checkpoint approvals"
      maxWidth="2xl"
    >

      {/* Pattern explanation */}
      <section className={styles.explanation}>
        <h2>Pattern Overview</h2>
        <p>
          The <strong>Streaming Validation Loop</strong> pattern demonstrates
          how to pause streaming at critical decision points, collect user
          approval or edits, and resume with validated values.
        </p>
        <p>
          In this demo, an AI allocates Q1 budget across engineering teams.
          At each checkpoint, you can:
        </p>
        <ul>
          <li>
            <strong>Approve:</strong> Accept the proposed allocation
          </li>
          <li>
            <strong>Edit:</strong> Modify the budget, headcount, or contractors
          </li>
          <li>
            <strong>Skip:</strong> Reject this allocation (team gets $0)
          </li>
        </ul>
        <p>
          If you don't respond within 30 seconds, the checkpoint auto-approves.
        </p>
      </section>

      {/* Main content area */}
      <div className={styles.content}>
        {/* Left column: Budget analyses */}
        <div className={styles.analysesColumn}>
          <h3>Budget Analysis</h3>
          {analyses.size === 0 ? (
            <div className={styles.placeholder}>
              <p>Budget analyses will appear here as the stream progresses...</p>
            </div>
          ) : (
            <div className={styles.analysesList}>
              {Array.from(analyses.entries()).map(([team, analysis]) => (
                <div key={team} className={styles.analysisCard}>
                  <h4>{team} Team</h4>
                  <pre className={styles.analysisText}>{analysis}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Checkpoint and approvals */}
        <div className={styles.checkpointColumn}>
          {/* Active checkpoint card */}
          {activeCheckpoint && (
            <div className={styles.activeCheckpoint}>
              <CheckpointCard
                checkpoint={activeCheckpoint}
                onApprove={() => actions.approve(activeCheckpoint.id)}
                onEdit={(editedValue) =>
                  actions.edit(activeCheckpoint.id, editedValue)
                }
                onSkip={() => actions.skip(activeCheckpoint.id)}
                remainingTimeMs={remainingTimeMs}
              />
            </div>
          )}

          {/* Waiting indicator */}
          {isWaitingForApproval && (
            <div className={styles.waitingIndicator} aria-live="polite">
              <div className={styles.spinner} />
              <span>Stream paused - waiting for approval...</span>
            </div>
          )}

          {/* Approved allocations */}
          {allocations.length > 0 && (
            <div className={styles.allocations}>
              <h3>Approved Allocations</h3>
              <div className={styles.allocationsList}>
                {allocations.map((allocation) => (
                  <div key={allocation.team} className={styles.allocationCard}>
                    <div className={styles.allocationHeader}>
                      <span className={styles.allocationTeam}>
                        {allocation.team}
                      </span>
                      <span className={styles.allocationBudget}>
                        ${allocation.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.allocationDetails}>
                      {allocation.headcount} FTEs, {allocation.contractors}{' '}
                      contractors
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Timeline
          entries={timeline}
          activeCheckpointId={activeCheckpoint?.id || null}
        />
      )}

      {/* Final plan */}
      {planSummary && (
        <section className={styles.finalPlan}>
          <h2>Final Budget Plan</h2>
          <pre className={styles.planSummary}>{planSummary}</pre>
        </section>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <Button
          onClick={actions.reset}
          variant="secondary"
          size="sm"
          disabled={isStreaming && !isWaitingForApproval}
        >
          Reset Demo
        </Button>
        {isStreaming && (
          <div className={styles.streamingStatus} aria-live="polite">
            <div className={styles.pulse} />
            Streaming in progress...
          </div>
        )}
      </div>

      {/* Educational annotations */}
      <section className={styles.annotations}>
        <h2>Implementation Notes</h2>
        <details>
          <summary>How does the stream pause work?</summary>
          <p>
            The stream generator uses an async generator function with{' '}
            <code>await</code> to pause execution at checkpoint events. When a
            checkpoint is emitted, the generator awaits a Promise that resolves
            when the user responds (approve/edit/skip). This creates a natural
            pause/resume flow without complex state machines.
          </p>
        </details>
        <details>
          <summary>How are timeouts handled?</summary>
          <p>
            Each checkpoint has a <code>timeoutMs</code> property. The UI tracks
            elapsed time and auto-approves when the timeout expires. In production
            systems, the server would also enforce timeouts to prevent indefinite
            waiting.
          </p>
        </details>
        <details>
          <summary>What happens when the user edits a value?</summary>
          <p>
            Edit actions resolve the checkpoint Promise with the edited value.
            The stream resumes with this new value, which cascades to all
            downstream processing. The timeline shows edited checkpoints with a
            badge and budget comparison.
          </p>
        </details>
      </section>
    </DemoContainer>
  );
}

export default ValidationLoopDemo;
