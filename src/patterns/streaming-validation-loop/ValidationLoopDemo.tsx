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

import { useState, useEffect, useCallback } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import { useValidationStream } from './hooks';
import { CheckpointCard } from './CheckpointCard';
import { Timeline } from './Timeline';
import type { StreamEvent as PatternStreamEvent } from './types';
import styles from './ValidationLoopDemo.module.css';

export function ValidationLoopDemo() {
  const [showInspector, setShowInspector] = useState(false);

  // Network capture for debugging and visualization
  const { events, captureEvent, clearEvents, filter, setFilter } = useNetworkCapture();

  /**
   * Convert pattern-specific events to global StreamEvent format for network inspector.
   */
  const handleEventCapture = useCallback((event: PatternStreamEvent): void => {
    // Map validation loop events to checkpoint/validation types
    let globalEvent: GlobalStreamEvent;

    if (event.type === 'checkpoint' && 'data' in event && typeof event.data === 'object' && event.data !== null) {
      const checkpointData = event.data as { checkpointId?: string };
      globalEvent = {
        id: checkpointData.checkpointId || `${event.type}-${event.timestamp}`,
        timestamp: event.timestamp,
        type: 'checkpoint',
        data: {
          id: checkpointData.checkpointId || `checkpoint-${event.timestamp}`,
          name: 'Budget Checkpoint',
          status: 'pending',
          criteria: JSON.stringify(event.data),
          timestamp: event.timestamp,
        },
      };
    } else {
      // Default to validation type for other events
      globalEvent = {
        id: `${event.type}-${event.timestamp}`,
        timestamp: event.timestamp,
        type: 'validation',
        data: {
          checkpointId: `${event.type}-${event.timestamp}`,
          passed: true,
          message: JSON.stringify(event.data),
          timestamp: event.timestamp,
        },
      };
    }

    captureEvent(globalEvent);
  }, [captureEvent]);

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
    onEvent: handleEventCapture,
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

  /**
   * Handle Network Inspector toggle.
   */
  const handleToggleInspector = useCallback((): void => {
    setShowInspector((prev) => !prev);
  }, []);

  /**
   * Handle demo reset with network events clearing.
   */
  const handleReset = useCallback((): void => {
    clearEvents();
    actions.reset();
  }, [clearEvents, actions]);

  return (
    <DemoContainer
      title="Streaming Validation Loop Pattern"
      description="Budget allocation with checkpoint approvals"
      maxWidth="2xl"
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

      {/* Scenario Context */}
      <section className={styles.scenario}>
        <ScenarioCard
          description="AI allocates Q1 budget across engineering teams with checkpoint approvals at each decision point."
        />
      </section>

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

      {/* Network Inspector */}
      {showInspector && (
        <section className={styles.inspectorSection} aria-label="Network inspector">
          <NetworkInspector
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            onClearEvents={clearEvents}
            title="Validation Stream Events"
          />
        </section>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <Button
          onClick={handleReset}
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

      {/* Pattern Learning Points */}
      <section className={styles.annotations}>
        <Card className={styles.learningCard}>
          <div className={styles.cardHeader}>
            <h4>Pattern Learning Points</h4>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.learningList}>
              <li>
                <strong>Checkpoint-Based Approvals:</strong> Stream pauses at critical decision points, waiting for user approval, edits, or skip actions before continuing
              </li>
              <li>
                <strong>Promise-Based Pausing:</strong> Async generator awaits a Promise at each checkpoint, which resolves when user responds, creating natural pause/resume flow
              </li>
              <li>
                <strong>Timeout Handling:</strong> Each checkpoint has a timeout that auto-approves if user doesn't respond, preventing indefinite waiting
              </li>
              <li>
                <strong>Edit Cascading:</strong> User edits at checkpoints cascade to all downstream processing, with timeline showing edited values and comparisons
              </li>
              <li>
                <strong>Human-in-the-Loop:</strong> Pattern enables critical human oversight for high-stakes decisions like budget allocation
              </li>
              <li>
                <strong>Timeline Visualization:</strong> Complete approval history shows all decisions, edits, and their impact on final plan
              </li>
            </ul>
          </div>
        </Card>
      </section>
    </DemoContainer>
  );
}

export default ValidationLoopDemo;
