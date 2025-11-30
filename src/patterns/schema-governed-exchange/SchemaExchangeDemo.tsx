/**
 * Schema-Governed Exchange Pattern Demo
 *
 * Demonstrates real-time schema validation of streaming JSON payloads.
 * Shows how to validate progressive data against Zod schemas with auto-suggestions.
 *
 * Educational Focus:
 * - Runtime schema validation with Zod
 * - Progressive validation of incomplete payloads
 * - Error highlighting with auto-fix suggestions
 * - Real-time validation status indicators
 */

import { useState, useCallback } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { Button } from '@/components/ui/Button';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { useSchemaValidation, useSchemaHUD } from './hooks';
import { SchemaHUD } from './SchemaHUD';
import { PayloadViewer } from './PayloadViewer';
import { ValidationBadge } from './ValidationBadge';
import { ErrorHighlighter } from './ErrorHighlighter';
import type { StreamScenario, StreamSpeed } from './mockStream';
import type { SchemaStreamEvent } from './types';
import styles from './SchemaExchangeDemo.module.css';

export function SchemaExchangeDemo() {
  const [scenario, setScenario] = useState<StreamScenario>('successful');
  const [speed, setSpeed] = useState<StreamSpeed>('normal');

  // Network capture for inspector
  const { captureEvent, events, clearEvents } = useNetworkCapture();

  // Schema validation state
  const {
    schema,
    payload,
    isComplete,
    isStreaming,
    validationResult,
    streamErrors,
    startStream,
    stopStream,
    reset,
  } = useSchemaValidation({ scenario, speed, onEvent: handleStreamEvent });

  // Schema HUD state
  const { state: hudState, toggleCollapse, highlightField } = useSchemaHUD();

  /**
   * Handle stream events for network capture
   */
  function handleStreamEvent(event: SchemaStreamEvent): void {
    // Capture event for network inspector
    // Note: We use 'as any' here because our SchemaStreamEvent types
    // are specific to this pattern and don't match the global StreamEvent union
    captureEvent({
      id: `${event.type}-${Date.now()}`,
      type: event.type as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      data: event.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      timestamp: Date.now(),
    });
  }

  /**
   * Start a new stream with selected scenario
   */
  const handleStart = useCallback(() => {
    reset();
    clearEvents();
    startStream();
  }, [reset, clearEvents, startStream]);

  /**
   * Stop current stream
   */
  const handleStop = useCallback(() => {
    stopStream();
  }, [stopStream]);

  /**
   * Reset demo to initial state
   */
  const handleReset = useCallback(() => {
    reset();
    clearEvents();
  }, [reset, clearEvents]);

  // Combine validation errors from Zod and stream
  const allErrors = [
    ...validationResult.errors,
    ...streamErrors,
  ];

  return (
    <DemoContainer
      title="Schema-Governed Exchange Pattern"
      description="Real-time validation of streaming JSON payloads against Zod schemas"
      maxWidth="full"
    >
      {/* Validation Badge */}
      <div className={styles.validationHeader}>
        <ValidationBadge
          validationResult={validationResult}
          showDescription={true}
        />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="scenario-select" className={styles.label}>
            Scenario:
          </label>
          <select
            id="scenario-select"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as StreamScenario)}
            disabled={isStreaming}
            className={styles.select}
          >
            <option value="successful">✅ Valid Payload</option>
            <option value="with-errors">❌ Multiple Errors</option>
            <option value="corrected">🔧 Auto-Corrected</option>
            <option value="minimal">📋 Minimal Valid</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="speed-select" className={styles.label}>
            Speed:
          </label>
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => setSpeed(e.target.value as StreamSpeed)}
            disabled={isStreaming}
            className={styles.select}
          >
            <option value="fast">⚡ Fast</option>
            <option value="normal">▶ Normal</option>
            <option value="slow">🐌 Slow</option>
          </select>
        </div>

        <div className={styles.buttonGroup}>
          {!isStreaming ? (
            <Button
              onClick={handleStart}
              variant="primary"
              size="md"
            >
              ▶ Start Stream
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="secondary"
              size="md"
            >
              ⏸ Stop Stream
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="secondary"
            size="md"
            disabled={isStreaming}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Scenario Context */}
      <div className={styles.scenario}>
        <ScenarioCard
          description="StreamFlow PM validates incoming project setup data against a Zod schema in real-time."
        />
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Panel - Schema HUD */}
        <div className={styles.leftPanel}>
          <SchemaHUD
            schema={schema}
            state={hudState}
            onToggleCollapse={toggleCollapse}
          />
        </div>

        {/* Right Panel - Payload & Errors */}
        <div className={styles.rightPanel}>
          <PayloadViewer
            payload={payload}
            errors={allErrors}
            isComplete={isComplete}
          />

          {allErrors.length > 0 && (
            <div className={styles.errorSection}>
              <ErrorHighlighter
                errors={allErrors}
                onHighlightField={highlightField}
              />
            </div>
          )}
        </div>
      </div>

      {/* Network Inspector */}
      <div className={styles.inspector}>
        <NetworkInspector
          events={events}
          onClearEvents={clearEvents}
          title="Stream Events"
        />
      </div>

      {/* Educational Notes */}
      <div className={styles.notes}>
        <h3>🎓 Learning Points</h3>
        <ul>
          <li>
            <strong>Progressive Validation:</strong> Schema validation runs on
            every payload chunk, not just the complete data.
          </li>
          <li>
            <strong>Partial Mode:</strong> Zod's <code>.partial()</code> allows
            validation of incomplete data during streaming.
          </li>
          <li>
            <strong>Auto-Suggestions:</strong> Common errors (e.g., "25k" → 25000)
            trigger automatic fix suggestions.
          </li>
          <li>
            <strong>Field Highlighting:</strong> Hover over errors to highlight
            the problematic field in the schema HUD.
          </li>
          <li>
            <strong>Network Events:</strong> Inspect <code>schema</code>,{' '}
            <code>payload</code>, and <code>schema_error</code> events in the
            inspector.
          </li>
        </ul>
      </div>
    </DemoContainer>
  );
}

export default SchemaExchangeDemo;
