/**
 * Agent-Await-Prompt Pattern Demo
 *
 * This component demonstrates the pause/resume streaming pattern where the AI
 * can pause mid-stream to request missing information from the user, then
 * resume once the input is provided.
 *
 * Educational Focus:
 * - Pause/resume stream mechanics
 * - Inline input field integration
 * - Timeout countdown and fallback behavior
 * - Stream state management (idle → streaming → awaiting → resuming)
 *
 * Demo Scenario:
 * StreamFlow PM project setup - AI discovers missing project metadata
 * and pauses to request it from the user inline.
 *
 * @module patterns/agent-await-prompt/AgentAwaitPromptDemo
 */

import { useState, useCallback } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { NetworkInspector } from '@/components/NetworkInspector';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { useAwaitPromptStream } from './hooks';
import { InlineInputFields } from './InlineInputFields';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import type { StreamEvent as PatternStreamEvent } from './types';
import styles from './AgentAwaitPromptDemo.module.css';

/**
 * Map pattern-specific stream events to global event types for Network Inspector.
 *
 * This adapter function bridges between the pattern's internal event structure
 * and the global StreamEvent type used by the Network Inspector.
 */
function adaptEventForNetworkInspector(
  event: PatternStreamEvent
): GlobalStreamEvent | null {
  const timestamp = Date.now();
  const id = `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  switch (event.type) {
    case 'await_input':
      // Map to global AwaitInputEvent format
      return {
        id,
        type: 'await_input',
        timestamp,
        data: {
          requestId: id,
          prompt: event.data.message,
          inputType: 'text', // Simplified for network inspector
          validation: {
            required: event.data.fields.some((f) => f.required),
          },
        },
      };

    case 'input_submission':
      // Map to global InputSubmissionEvent format
      return {
        id,
        type: 'input_submission',
        timestamp,
        data: {
          requestId: id,
          value: JSON.stringify(event.data),
          submittedAt: timestamp,
        },
      };

    // For text, resume, and timeout events, we don't have direct global equivalents
    // so we can skip them in the network inspector or create custom representations
    default:
      return null;
  }
}

/**
 * Demo scenario type.
 */
type DemoScenario = {
  id: string;
  name: string;
  prompt: string;
  description: string;
};

/**
 * Demo scenarios available in the dropdown.
 */
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'project-setup',
    name: 'Project Setup',
    prompt: 'Set up a new project in StreamFlow PM',
    description: 'AI pauses to request missing project details',
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    prompt: 'Plan the next 2-week sprint',
    description: 'AI requests sprint parameters mid-planning',
  },
  {
    id: 'timeout-fallback',
    name: 'Timeout Fallback',
    prompt: 'Set up project with timeout fallback',
    description: 'AI continues with defaults if user doesn\'t respond',
  },
  {
    id: 'multiple-inputs',
    name: 'Multiple Inputs',
    prompt: 'Create a complete project roadmap',
    description: 'Multiple pause/resume cycles',
  },
];

/**
 * Main demo component for the Agent-Await-Prompt pattern.
 *
 * This component showcases:
 * - Streaming text that pauses mid-flow
 * - Inline input fields appearing in the stream
 * - Timeout countdown UI
 * - Stream resumption after input submission
 * - Network inspector integration
 */
export default function AgentAwaitPromptDemo(): JSX.Element {
  // Network capture for inspector
  const { captureEvent, filteredEvents, clearEvents } = useNetworkCapture();

  // Selected scenario
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);

  // Network inspector visibility
  const [showInspector, setShowInspector] = useState(false);

  // Memoize event handler to prevent stream from restarting on every render
  const handleEvent = useCallback(
    (event: PatternStreamEvent) => {
      // Adapt and capture events for network inspector
      const globalEvent = adaptEventForNetworkInspector(event);
      if (globalEvent) {
        captureEvent(globalEvent);
      }
    },
    [captureEvent]
  );

  // Stream state from custom hook
  const {
    text,
    streamState,
    inputFields,
    inputMessage,
    submitInput,
    timeoutRemaining,
    error,
    isActive,
  } = useAwaitPromptStream(selectedScenario.prompt, {
    speed: 'normal',
    onEvent: handleEvent,
  });

  /**
   * Handle scenario change - clear state and restart stream.
   */
  const handleScenarioChange = (scenarioId: string) => {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) {
      clearEvents();
      setSelectedScenario(scenario);
    }
  };

  /**
   * Format stream state for display.
   */
  const getStateIndicator = () => {
    switch (streamState) {
      case 'idle':
        return { text: 'Idle', className: styles.stateIdle };
      case 'streaming':
        return { text: 'Streaming', className: styles.stateStreaming };
      case 'awaiting_input':
        return { text: 'Awaiting Input', className: styles.stateAwaiting };
      case 'resuming':
        return { text: 'Resuming', className: styles.stateResuming };
      case 'completed':
        return { text: 'Completed', className: styles.stateCompleted };
      case 'error':
        return { text: 'Error', className: styles.stateError };
      default:
        return { text: 'Unknown', className: styles.stateIdle };
    }
  };

  const stateIndicator = getStateIndicator();

  return (
    <DemoContainer
      title="Agent-Await-Prompt Pattern"
      description="Interactive streaming with pause/resume mechanics"
      maxWidth="2xl"
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

      {/* Scenario selector */}
      <div className={styles.controls}>
        <label htmlFor="scenario-select" className={styles.controlLabel}>
          Demo Scenario:
        </label>
        <select
          id="scenario-select"
          value={selectedScenario.id}
          onChange={(e) => handleScenarioChange(e.target.value)}
          className={styles.select}
          disabled={isActive}
        >
          {DEMO_SCENARIOS.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name} - {scenario.description}
            </option>
          ))}
        </select>

        {/* Stream state indicator */}
        <div className={styles.stateIndicatorContainer}>
          <span className={styles.stateLabel}>State:</span>
          <span className={`${styles.stateBadge} ${stateIndicator.className}`}>
            {stateIndicator.text}
          </span>
        </div>
      </div>

      {/* Scenario Context */}
      <div className={styles.scenario}>
        <ScenarioCard
          description="StreamFlow PM discovers missing project metadata during setup and pauses to request it inline."
        />
      </div>

      {/* Main content area */}
      <div className={styles.content}>
        {/* Message bubble with streaming text */}
        <div className={styles.messageBubble}>
          {/* Streaming indicator */}
          {streamState === 'streaming' && (
            <div className={styles.streamingIndicator}>
              <div className={styles.streamingDot} />
              <div className={styles.streamingDot} />
              <div className={styles.streamingDot} />
            </div>
          )}

          {/* Text content */}
          <div className={styles.messageText}>
            {text || <span className={styles.placeholder}>Waiting for stream...</span>}
          </div>

          {/* Inline input fields (shown when awaiting input) */}
          {streamState === 'awaiting_input' && inputFields && (
            <InlineInputFields
              fields={inputFields}
              message={inputMessage}
              onSubmit={submitInput}
              timeoutRemaining={timeoutRemaining}
              className={styles.inlineInputs}
            />
          )}

          {/* Error display */}
          {error && (
            <div className={styles.errorDisplay}>
              <h3 className={styles.errorTitle}>Stream Error</h3>
              <p className={styles.errorMessage}>{error.message}</p>
            </div>
          )}
        </div>


        {/* Network Inspector */}
        {showInspector && (
          <div className={styles.networkInspector}>
            <h2 className={styles.inspectorTitle}>Network Inspector</h2>
            <p className={styles.inspectorDescription}>
              View all streaming events including pause (<code>await_input</code>)
              and resume (<code>input_submission</code>) events.
            </p>
            <NetworkInspector events={filteredEvents} />
          </div>
        )}
      </div>

      {/* Pattern Learning Points */}
      <div className={styles.educationalNotes}>
        <Card className={styles.learningCard}>
          <div className={styles.cardHeader}>
            <h4>Pattern Learning Points</h4>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.learningList}>
              <li>
                <strong>Stream Pause/Resume:</strong> Agent can pause mid-stream using await_input events and resume after receiving user input
              </li>
              <li>
                <strong>Inline Input UX:</strong> Input fields appear embedded in the conversation flow, maintaining context without modals or separate forms
              </li>
              <li>
                <strong>State Machine:</strong> Stream transitions through idle → streaming → awaiting_input → resuming → completed states
              </li>
              <li>
                <strong>Timeout Handling:</strong> Visual countdown shows urgency with configurable fallback behavior when timeout expires
              </li>
              <li>
                <strong>Field Validation:</strong> Required fields are enforced before submission with type-specific validation
              </li>
              <li>
                <strong>Promise-Based Control:</strong> Pause/resume mechanism uses a Promise that the stream awaits until user input resolves it
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </DemoContainer>
  );
}
