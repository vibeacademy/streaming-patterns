/**
 * Chain-of-Reasoning Demo Component
 *
 * This is the main demo component that showcases the Chain-of-Reasoning pattern.
 * It demonstrates how to make AI reasoning visible and interactive by streaming
 * reasoning steps before the final answer.
 *
 * Educational Note:
 * This component brings together all the pieces of the Chain-of-Reasoning pattern:
 * - Custom hook (useReasoningStream) for state management
 * - UI component (ReasoningBeadline) for displaying reasoning steps
 * - Network Inspector for visualizing stream events
 * - Demo controls for educational exploration
 *
 * Demo Scenario:
 * StreamFlow PM's AI assistant helping a product manager plan a 2-week sprint.
 * The AI shows its reasoning process before presenting the final sprint plan.
 *
 * @module patterns/chain-of-reasoning/ChainOfReasoningDemo
 */

import { useState, useCallback } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import { ReasoningBeadline } from './ReasoningBeadline';
import { useReasoningStreamWithReset } from './hooks';
import type { ReasoningStreamConfig, StreamEvent as PatternStreamEvent } from './types';
import styles from './ChainOfReasoningDemo.module.css';

/**
 * Demo prompt for the sprint planning scenario.
 * This represents a typical PM workflow in StreamFlow PM.
 */
const DEMO_PROMPT =
  'Plan a 2-week sprint (Nov 13-24) for the StreamFlow PM dashboard project. The team has 6 engineers, and we need to balance quick wins with strategic goals.';

/**
 * Speed options for controlling stream playback speed.
 * These allow users to explore the pattern at different rates for educational purposes.
 */
const SPEED_OPTIONS: Array<{
  value: ReasoningStreamConfig['speed'];
  label: string;
  description: string;
}> = [
  {
    value: 'fast',
    label: 'Fast',
    description: '50ms delay - Quick demonstration',
  },
  {
    value: 'normal',
    label: 'Normal',
    description: '300ms delay - Realistic timing',
  },
  {
    value: 'slow',
    label: 'Slow',
    description: '1000ms delay - Detailed observation',
  },
];

/**
 * ChainOfReasoningDemo - Main pattern demonstration component
 *
 * This component provides a complete, self-contained demo of the Chain-of-Reasoning
 * pattern. It shows how to integrate reasoning streams with UI components and
 * developer tools.
 *
 * Features:
 * - Streaming reasoning steps with confidence indicators
 * - Final answer display with formatted markdown
 * - Network Inspector for stream event visualization
 * - Speed controls for educational exploration
 * - Reset functionality to replay the demo
 * - Loading and error state handling
 * - Responsive layout for mobile and desktop
 *
 * @example
 * ```tsx
 * // In your app router
 * <Route path="/patterns/chain-of-reasoning" element={<ChainOfReasoningDemo />} />
 * ```
 */
export function ChainOfReasoningDemo(): JSX.Element {
  // State: Current streaming speed
  const [speed, setSpeed] =
    useState<ReasoningStreamConfig['speed']>('normal');

  // State: Whether Network Inspector is visible
  const [showInspector, setShowInspector] = useState(true);

  // Network capture for debugging and visualization
  const { events, captureEvent, clearEvents, filter, setFilter } =
    useNetworkCapture();

  /**
   * Convert pattern-specific events to global StreamEvent format.
   * The NetworkInspector expects events with id and timestamp at the root level.
   */
  const handleEventCapture = useCallback(
    (event: PatternStreamEvent): void => {
      let globalEvent: GlobalStreamEvent;

      if (event.type === 'reasoning') {
        globalEvent = {
          id: event.data.id,
          timestamp: event.data.timestamp,
          type: 'reasoning',
          data: event.data,
        };
      } else {
        // answer event
        globalEvent = {
          id: `answer-${Date.now()}`,
          timestamp: Date.now(),
          type: 'answer',
          data: { text: event.data.text, isFinal: true },
        };
      }

      captureEvent(globalEvent);
    },
    [captureEvent]
  );

  // Reasoning stream with reset capability
  const { reasoning, answer, isStreaming, error, reset } =
    useReasoningStreamWithReset(DEMO_PROMPT, {
      speed,
      onEvent: handleEventCapture,
    });

  /**
   * Handle speed change from controls.
   * Note: This will restart the stream due to useReasoningStream's dependency array.
   */
  const handleSpeedChange = useCallback(
    (newSpeed: ReasoningStreamConfig['speed']): void => {
      setSpeed(newSpeed);
    },
    []
  );

  /**
   * Handle demo reset.
   * Clears both reasoning state and captured events for a fresh start.
   */
  const handleReset = useCallback((): void => {
    clearEvents();
    reset();
  }, [clearEvents, reset]);

  /**
   * Handle Network Inspector toggle.
   */
  const handleToggleInspector = useCallback((): void => {
    setShowInspector((prev) => !prev);
  }, []);

  /**
   * Render error state.
   * Shows user-friendly error message with retry option.
   */
  if (error) {
    return (
      <DemoContainer
        title="Chain-of-Reasoning Pattern"
        description="An error occurred while streaming the reasoning"
        maxWidth="2xl"
      >
        <Card className={styles.errorCard}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon} aria-hidden="true">
              ⚠️
            </div>
            <h3 className={styles.errorTitle}>Stream Error</h3>
            <p className={styles.errorMessage}>{error.message}</p>
            <Button onClick={handleReset} variant="primary">
              Try Again
            </Button>
          </div>
        </Card>
      </DemoContainer>
    );
  }

  /**
   * Render main demo interface.
   */
  return (
    <DemoContainer
      title="Chain-of-Reasoning Pattern"
      description="Watch AI think through sprint planning with visible reasoning steps"
      maxWidth="2xl"
      className={styles.demoContainer}
      actions={
        <div className={styles.headerActions}>
          <Button
            onClick={handleToggleInspector}
            variant="ghost"
            size="sm"
            aria-pressed={String(showInspector)}
            aria-label={
              showInspector ? 'Hide Network Inspector' : 'Show Network Inspector'
            }
          >
            {showInspector ? 'Hide Inspector' : 'Show Inspector'}
          </Button>
        </div>
      }
    >
      {/* Demo Controls */}
      <section className={styles.controls} aria-label="Demo controls">
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="speed-selector">
            Stream Speed
          </label>
          <div className={styles.speedButtons} role="group" aria-labelledby="speed-selector">
            {SPEED_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleSpeedChange(option.value)}
                variant={speed === option.value ? 'primary' : 'secondary'}
                size="sm"
                disabled={isStreaming}
                aria-pressed={String(speed === option.value)}
                title={option.description}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <Button
            onClick={handleReset}
            variant="secondary"
            size="sm"
            disabled={isStreaming}
            aria-label="Reset demo to beginning"
          >
            Reset Demo
          </Button>
        </div>

        {/* Stream status indicator */}
        <div className={styles.statusIndicator}>
          {isStreaming ? (
            <div className={styles.statusStreaming}>
              <Spinner size="sm" variant="primary" />
              <span>Streaming...</span>
            </div>
          ) : reasoning.length > 0 ? (
            <div className={styles.statusComplete}>
              <span className={styles.statusIcon} aria-hidden="true">
                ✓
              </span>
              <span>Complete</span>
            </div>
          ) : (
            <div className={styles.statusReady}>
              <span>Ready</span>
            </div>
          )}
        </div>
      </section>

      {/* Demo Prompt */}
      <section className={styles.promptSection} aria-label="Demo prompt">
        <Card className={styles.promptCard}>
          <div className={styles.promptHeader}>
            <span className={styles.promptLabel}>Prompt</span>
          </div>
          <p className={styles.promptText}>{DEMO_PROMPT}</p>
        </Card>
      </section>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Reasoning Timeline */}
        <section
          className={styles.reasoningSection}
          aria-label="AI reasoning steps"
        >
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Reasoning Steps</h3>
            <span className={styles.stepCount} aria-label={`${reasoning.length} steps`}>
              {reasoning.length} {reasoning.length === 1 ? 'step' : 'steps'}
            </span>
          </div>

          <ReasoningBeadline
            reasoning={reasoning}
            className={styles.beadline}
          />

          {!isStreaming && reasoning.length === 0 && (
            <div className={styles.emptyState}>
              <p>Click "Reset Demo" to see the AI reasoning process</p>
            </div>
          )}
        </section>

        {/* Final Answer */}
        {answer && (
          <section className={styles.answerSection} aria-label="Final sprint plan">
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Sprint Plan</h3>
              <div className={styles.answerBadge}>
                <span className={styles.answerIcon} aria-hidden="true">
                  📋
                </span>
                <span>Final Answer</span>
              </div>
            </div>

            <Card className={styles.answerCard}>
              <div className={styles.answerContent}>
                {/*
                  Note: For MVP, we'll render the answer as plain text.
                  In a future iteration, we can add markdown rendering.
                */}
                <pre className={styles.answerText}>{answer}</pre>
              </div>
            </Card>
          </section>
        )}
      </div>

      {/* Network Inspector */}
      {showInspector && (
        <section className={styles.inspectorSection} aria-label="Network inspector">
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Network Inspector</h3>
            <p className={styles.sectionDescription}>
              Real-time visualization of stream events for debugging and learning
            </p>
          </div>

          <NetworkInspector
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            onClearEvents={clearEvents}
            title="Stream Events"
          />
        </section>
      )}

      {/* Educational Note */}
      <section className={styles.educationalNote} aria-label="Learning notes">
        <Card className={styles.noteCard}>
          <h4 className={styles.noteTitle}>Pattern Learning Points</h4>
          <ul className={styles.noteList}>
            <li>
              <strong>Transparency:</strong> Users see the AI's reasoning process,
              building trust and understanding
            </li>
            <li>
              <strong>Streaming UX:</strong> Reasoning steps arrive incrementally,
              keeping users engaged during processing
            </li>
            <li>
              <strong>Confidence Indicators:</strong> Each step shows confidence
              level (high/medium/low) through color coding
            </li>
            <li>
              <strong>Traceability:</strong> The final answer references specific
              reasoning steps (e.g., "Based on reason-1")
            </li>
            <li>
              <strong>Interactivity:</strong> Users can expand reasoning details and
              promote steps to their plan
            </li>
          </ul>
        </Card>
      </section>
    </DemoContainer>
  );
}
