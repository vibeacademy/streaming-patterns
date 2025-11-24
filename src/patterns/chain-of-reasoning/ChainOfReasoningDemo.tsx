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

import { useState, useCallback, useMemo } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import { ReasoningBeadline } from './ReasoningBeadline';
import { StreamErrorDisplay } from './StreamErrorDisplay';
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
 * Error simulation options for testing error handling.
 * These allow users to see how the pattern handles different failure modes.
 */
const ERROR_SIMULATION_OPTIONS: Array<{
  value: ReasoningStreamConfig['simulateError'];
  label: string;
  description: string;
}> = [
  {
    value: 'none',
    label: 'None',
    description: 'No errors - normal operation',
  },
  {
    value: 'timeout',
    label: 'Timeout',
    description: 'Simulate request timeout',
  },
  {
    value: 'network',
    label: 'Network',
    description: 'Simulate network failure',
  },
  {
    value: 'mid-stream',
    label: 'Mid-Stream',
    description: 'Simulate error during streaming',
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

  // State: Error simulation mode
  const [errorSimulation, setErrorSimulation] =
    useState<ReasoningStreamConfig['simulateError']>('none');

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

  // Memoize options to prevent unnecessary re-renders and stream aborts
  const streamOptions = useMemo(
    () => ({
      speed,
      onEvent: handleEventCapture,
      simulateError: errorSimulation,
      timeoutMs: 5000, // 5 second timeout for demo purposes
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        retryOnTimeout: true,
        retryOnNetwork: true,
        retryOnStream: false,
      },
    }),
    [speed, handleEventCapture, errorSimulation]
  );

  // Reasoning stream with reset capability and error handling
  const {
    reasoning,
    answer,
    isStreaming,
    error,
    retryCount,
    isRetrying,
    retryDelayMs,
    reset,
  } = useReasoningStreamWithReset(DEMO_PROMPT, streamOptions);

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
   * Handle error simulation mode change.
   * Note: This will restart the stream due to useReasoningStream's dependency array.
   */
  const handleErrorSimulationChange = useCallback(
    (mode: ReasoningStreamConfig['simulateError']): void => {
      setErrorSimulation(mode);
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
   * Shows user-friendly error message with retry information and manual retry option.
   */
  if (error && !isRetrying && retryCount && retryCount >= 3) {
    // Only show full-page error after all retries exhausted
    return (
      <DemoContainer
        title="Chain-of-Reasoning Pattern"
        description="An error occurred while streaming the reasoning"
        maxWidth="2xl"
      >
        <StreamErrorDisplay
          error={error}
          retryCount={retryCount}
          isRetrying={isRetrying}
          retryDelayMs={retryDelayMs}
          maxRetries={3}
          onRetry={handleReset}
        />
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
            aria-pressed={showInspector ? 'true' : 'false'}
            aria-label={
              showInspector ? 'Hide Inspector' : 'Show Inspector'
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
                aria-pressed={speed === option.value ? 'true' : 'false'}
                title={option.description}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="error-simulator">
            Error Simulation
          </label>
          <div className={styles.speedButtons} role="group" aria-labelledby="error-simulator">
            {ERROR_SIMULATION_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleErrorSimulationChange(option.value)}
                variant={errorSimulation === option.value ? 'primary' : 'secondary'}
                size="sm"
                disabled={isStreaming}
                aria-pressed={errorSimulation === option.value ? 'true' : 'false'}
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
              <span className="sr-only" aria-live="polite">
                Generating reasoning steps, please wait
              </span>
            </div>
          ) : reasoning.length > 0 ? (
            <div className={styles.statusComplete}>
              <span className={styles.statusIcon} aria-hidden="true">
                ✓
              </span>
              <span>Complete</span>
              <span className="sr-only" aria-live="polite">
                Stream complete, {reasoning.length} reasoning steps generated
              </span>
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
        {/* Inline Error Display (during retries or recoverable errors) */}
        {error && (retryCount === undefined || retryCount < 3 || isRetrying) && (
          <section className={styles.errorSection} aria-label="Error information">
            <StreamErrorDisplay
              error={error}
              retryCount={retryCount}
              isRetrying={isRetrying}
              retryDelayMs={retryDelayMs}
              maxRetries={3}
              onRetry={handleReset}
            />
          </section>
        )}

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
            <li>
              <strong>Error Handling:</strong> Network errors trigger automatic retries
              with exponential backoff, keeping the user informed of retry status
            </li>
            <li>
              <strong>Error Simulation:</strong> Test different failure modes (timeout,
              network, mid-stream) to see how the pattern handles errors gracefully
            </li>
          </ul>
        </Card>
      </section>
    </DemoContainer>
  );
}
