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
import { Card } from '@/components/ui/Card';
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
  const [showInspector, setShowInspector] = useState(false);

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
      actions={
        <Button
          onClick={() => setShowInspector(!showInspector)}
          variant="ghost"
          size="sm"
          aria-pressed={showInspector}
        >
          {showInspector ? 'Hide Inspector' : 'Show Inspector'}
        </Button>
      }
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
          <label className={styles.label}>Scenario</label>
          <div className={styles.speedButtons} role="group" aria-label="Scenario selector">
            <Button
              onClick={() => setScenario('successful')}
              variant={scenario === 'successful' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={scenario === 'successful' ? 'true' : 'false'}
              title="Valid Payload - No errors"
            >
              ✅ Valid
            </Button>
            <Button
              onClick={() => setScenario('with-errors')}
              variant={scenario === 'with-errors' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={scenario === 'with-errors' ? 'true' : 'false'}
              title="Multiple Errors - Various validation failures"
            >
              ❌ Errors
            </Button>
            <Button
              onClick={() => setScenario('corrected')}
              variant={scenario === 'corrected' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={scenario === 'corrected' ? 'true' : 'false'}
              title="Auto-Corrected - Errors fixed during stream"
            >
              🔧 Corrected
            </Button>
            <Button
              onClick={() => setScenario('minimal')}
              variant={scenario === 'minimal' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={scenario === 'minimal' ? 'true' : 'false'}
              title="Minimal Valid - Only required fields"
            >
              📋 Minimal
            </Button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Stream Speed</label>
          <div className={styles.speedButtons} role="group" aria-label="Stream speed selector">
            <Button
              onClick={() => setSpeed('fast')}
              variant={speed === 'fast' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={speed === 'fast' ? 'true' : 'false'}
              title="Fast speed"
            >
              ⚡ Fast
            </Button>
            <Button
              onClick={() => setSpeed('normal')}
              variant={speed === 'normal' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={speed === 'normal' ? 'true' : 'false'}
              title="Normal speed"
            >
              ▶ Normal
            </Button>
            <Button
              onClick={() => setSpeed('slow')}
              variant={speed === 'slow' ? 'primary' : 'secondary'}
              size="sm"
              disabled={isStreaming}
              aria-pressed={speed === 'slow' ? 'true' : 'false'}
              title="Slow speed"
            >
              🐌 Slow
            </Button>
          </div>
        </div>

        <div className={styles.actionButtons}>
          {!isStreaming ? (
            <Button
              onClick={handleStart}
              variant="primary"
              size="sm"
            >
              ▶ Start Stream
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="secondary"
              size="sm"
            >
              ⏸ Stop Stream
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="secondary"
            size="sm"
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
      {showInspector && (
        <div className={styles.inspector}>
          <NetworkInspector
            events={events}
            onClearEvents={clearEvents}
            title="Stream Events"
          />
        </div>
      )}

      {/* Pattern Learning Points */}
      <div className={styles.notes}>
        <Card className={styles.learningCard}>
          <div className={styles.cardHeader}>
            <h4>Pattern Learning Points</h4>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.learningList}>
              <li>
                <strong>Progressive Validation:</strong> Schema validation runs on every payload chunk during streaming, not just the complete data
              </li>
              <li>
                <strong>Partial Mode:</strong> Zod's partial() allows validation of incomplete data, enabling real-time feedback as stream arrives
              </li>
              <li>
                <strong>Auto-Suggestions:</strong> Common errors (e.g., "25k" → 25000) trigger automatic fix suggestions for faster correction
              </li>
              <li>
                <strong>Field Highlighting:</strong> Hover over errors to highlight the problematic field in the schema HUD for quick identification
              </li>
              <li>
                <strong>Type Safety:</strong> Runtime validation with Zod ensures streaming data conforms to expected schema before processing
              </li>
              <li>
                <strong>Error Recovery:</strong> Auto-correction scenarios demonstrate graceful error handling during streaming
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </DemoContainer>
  );
}

export default SchemaExchangeDemo;
