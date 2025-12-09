/**
 * Turn-Taking Co-Creation Demo Component
 *
 * This is the main demo component that showcases the Turn-Taking Co-Creation pattern.
 * It demonstrates real-time collaborative editing between a user and AI agent, with
 * visible authorship highlighting, patch management, and conflict resolution.
 *
 * Educational Note:
 * This component brings together all pieces of the Turn-Taking Co-Creation pattern:
 * - Custom hook (useCollaborativeDocument) for state management
 * - UI components (CollaborativeEditor, PatchToolbar, etc.) for visualization
 * - Network Inspector for stream event transparency
 * - Demo controls for educational exploration
 *
 * Demo Scenario:
 * StreamFlow PM's AI assistant helps a product manager co-create a project charter.
 * The AI drafts content while the user can edit, accept, or reject suggestions in real-time.
 *
 * @module patterns/turn-taking-co-creation/TurnTakingDemo
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScenarioCard } from '@/components/ui/ScenarioCard';
import { PatternHelmet } from '@/components/PatternHelmet';
import { NetworkInspector } from '@/components/NetworkInspector/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import type { StreamEvent as GlobalStreamEvent } from '@/types/events';
import { CollaborativeEditor } from './CollaborativeEditor';
import { PatchToolbar } from './PatchToolbar';
import { AuthorshipLegend } from './AuthorshipLegend';
import { TurnIndicator } from './TurnIndicator';
import type { TurnState } from './TurnIndicator';
import { useCollaborativeDocument } from './hooks';
import type { StreamEvent as PatternStreamEvent } from './types';
import styles from './TurnTakingDemo.module.css';

/**
 * Speed options for controlling stream playback speed.
 */
const SPEED_OPTIONS: Array<{
  value: 'fast' | 'normal' | 'slow';
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
 * Props for the inner collaborative content component
 */
interface CollaborativeContentProps {
  speed: 'fast' | 'normal' | 'slow';
  onEventCapture: (event: PatternStreamEvent) => void;
}

/**
 * CollaborativeContent - Inner component that uses the collaborative document hook.
 *
 * Educational Note: This component is separated out so that it can be keyed by
 * demoKey. When demoKey changes, this entire component unmounts and remounts,
 * which properly resets the useCollaborativeDocument hook's internal state
 * (including streamActiveRef). Without this separation, changing demoKey would
 * only re-render the visual components but not reset the hook's refs.
 */
const CollaborativeContent = memo(function CollaborativeContent({
  speed,
  onEventCapture,
}: CollaborativeContentProps): JSX.Element {
  // Collaborative document with agent streaming
  const {
    sectionsWithAuthorship,
    isStreaming,
    pendingPatches,
    actions,
  } = useCollaborativeDocument({
    speed,
    fixture: 'full',
    variableDelay: true,
    autoStart: true,
    onEvent: onEventCapture,
  });

  /**
   * Calculate authorship statistics for the legend.
   */
  const authorshipStats = useMemo(() => {
    let agentCharCount = 0;
    let userCharCount = 0;
    let totalCharCount = 0;

    sectionsWithAuthorship.forEach((section) => {
      section.authorshipSpans.forEach((span) => {
        const length = span.end - span.start;
        totalCharCount += length;
        if (span.author === 'agent') {
          agentCharCount += length;
        } else {
          userCharCount += length;
        }
      });
    });

    return { agentCharCount, userCharCount, totalCharCount };
  }, [sectionsWithAuthorship]);

  /**
   * Determine current turn state based on streaming status.
   */
  const turnState: TurnState = useMemo(() => {
    if (isStreaming) {
      return 'agent';
    } else if (sectionsWithAuthorship.length > 0) {
      return 'user';
    } else {
      return 'idle';
    }
  }, [isStreaming, sectionsWithAuthorship.length]);

  return (
    <div className={styles.mainContent}>
      {/* Left Column: Document Editor */}
      <div className={styles.editorColumn}>
        <TurnIndicator
          turnState={turnState}
          isStreaming={isStreaming}
          className={styles.turnIndicator}
        />

        <div
          role="log"
          aria-live="polite"
          aria-label="Collaborative document editor"
        >
          <CollaborativeEditor
            sections={sectionsWithAuthorship}
            isStreaming={isStreaming}
            onUserEdit={actions.applyUserEdit}
            className={styles.editor}
          />
        </div>
      </div>

      {/* Right Column: Sidebar */}
      <div className={styles.sidebar}>
        <AuthorshipLegend
          stats={authorshipStats}
          showStats={authorshipStats.totalCharCount > 0}
          className={styles.legend}
        />

        <PatchToolbar
          pendingPatches={pendingPatches}
          onAcceptPatch={actions.acceptAgentPatch}
          onRejectPatch={(patchId) => actions.rejectAgentPatch(patchId, 'User rejected')}
          onAskWhy={actions.askWhy}
          isStreaming={isStreaming}
          className={styles.toolbar}
        />
      </div>
    </div>
  );
});

/**
 * TurnTakingDemo - Main pattern demonstration component
 *
 * This component provides a complete, self-contained demo of the Turn-Taking
 * Co-Creation pattern. It shows how to build real-time collaborative editing
 * with AI agents.
 *
 * Features:
 * - Real-time collaborative editing with authorship highlighting
 * - Patch management sidebar for reviewing agent suggestions
 * - Turn indicator showing current collaboration state
 * - Authorship legend with contribution statistics
 * - Network Inspector for stream event visualization
 * - Speed controls for educational exploration
 * - Reset functionality to replay the demo
 *
 * @example
 * ```tsx
 * // In your app router
 * <Route path="/patterns/turn-taking-co-creation" element={<TurnTakingDemo />} />
 * ```
 */
export function TurnTakingDemo(): JSX.Element {
  // State: Current streaming speed
  const [speed, setSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');

  // State: Whether Network Inspector is visible
  const [showInspector, setShowInspector] = useState(true);

  // State: Demo key for forcing reset
  const [demoKey, setDemoKey] = useState(0);

  // Network capture for debugging and visualization
  const { events, captureEvent, clearEvents, filter, setFilter } =
    useNetworkCapture();

  /**
   * Convert pattern-specific events to global StreamEvent format.
   * The NetworkInspector expects events with id and timestamp at the root level.
   *
   * Note: Pattern-specific event types aren't in the global enum, so we cast
   * to any to avoid TypeScript errors while maintaining event structure.
   */
  const handleEventCapture = useCallback(
    (event: PatternStreamEvent): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let globalEvent: any;

      switch (event.type) {
        case 'agent_patch':
          globalEvent = {
            id: event.data.patchId,
            timestamp: event.timestamp,
            type: 'agent_patch',
            data: event.data,
          };
          break;
        case 'user_patch':
          globalEvent = {
            id: event.data.patchId,
            timestamp: event.timestamp,
            type: 'user_patch',
            data: event.data,
          };
          break;
        case 'patch_ack':
          globalEvent = {
            id: `ack-${event.data.patchId}`,
            timestamp: event.timestamp,
            type: 'patch_ack',
            data: event.data,
          };
          break;
        case 'section_complete':
          globalEvent = {
            id: `complete-${event.data.sectionId}`,
            timestamp: event.timestamp,
            type: 'section_complete',
            data: event.data,
          };
          break;
        case 'conflict':
          globalEvent = {
            id: `conflict-${event.data.sectionId}`,
            timestamp: event.timestamp,
            type: 'conflict',
            data: event.data,
          };
          break;
        default: {
          const _exhaustive: never = event;
          throw new Error(`Unknown event type: ${_exhaustive}`);
        }
      }

      captureEvent(globalEvent as GlobalStreamEvent);
    },
    [captureEvent]
  );

  /**
   * Handle speed change from controls.
   * Note: Changing speed will restart the stream.
   */
  const handleSpeedChange = useCallback(
    (newSpeed: 'fast' | 'normal' | 'slow'): void => {
      setSpeed(newSpeed);
      // Reset demo to apply new speed
      setDemoKey((prev) => prev + 1);
      clearEvents();
    },
    [clearEvents]
  );

  /**
   * Handle demo reset.
   * Clears all state and restarts from the beginning.
   */
  const handleReset = useCallback((): void => {
    clearEvents();
    setDemoKey((prev) => prev + 1);
  }, [clearEvents]);

  /**
   * Handle Network Inspector toggle.
   */
  const handleToggleInspector = useCallback((): void => {
    setShowInspector((prev) => !prev);
  }, []);

  return (
    <>
      <PatternHelmet patternId="turn-taking-co-creation" />
      <DemoContainer
        title="Turn-Taking Co-Creation Pattern"
        description="Watch AI and user collaborate in real-time to create a project charter"
        maxWidth="full"
        className={styles.demoContainer}
        actions={
        <div className={styles.headerActions}>
          <Button
            onClick={handleToggleInspector}
            variant="ghost"
            size="sm"
            aria-pressed={showInspector ? 'true' : 'false'}
            aria-label={showInspector ? 'Hide Inspector' : 'Show Inspector'}
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
          <div
            className={styles.speedButtons}
            role="group"
            aria-labelledby="speed-selector"
          >
            {SPEED_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleSpeedChange(option.value)}
                variant={speed === option.value ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={speed === option.value ? 'true' : 'false'}
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
            aria-label="Reset demo to beginning"
          >
            Reset Demo
          </Button>
        </div>
      </section>

      {/* Scenario Context */}
      <section className={styles.scenarioSection} aria-label="Demo scenario">
        <ScenarioCard
          description="AI and user collaborate in real-time to co-create a project charter with visible authorship."
        />
      </section>

      {/* Main Content - Keyed for proper reset */}
      <CollaborativeContent
        key={demoKey}
        speed={speed}
        onEventCapture={handleEventCapture}
      />

      {/* Network Inspector */}
      {showInspector && (
        <section
          className={styles.inspectorSection}
          aria-label="Network inspector"
        >
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Network Inspector</h3>
            <p className={styles.sectionDescription}>
              Real-time visualization of collaboration events for debugging and
              learning
            </p>
          </div>

          <NetworkInspector
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            onClearEvents={clearEvents}
            title="Collaboration Events"
          />
        </section>
      )}

      {/* Pattern Learning Points */}
      <section className={styles.educationalNote} aria-label="Learning notes">
        <Card className={styles.noteCard}>
          <div className={styles.cardHeader}>
            <h4 className={styles.noteTitle}>Pattern Learning Points</h4>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.noteList}>
              <li>
                <strong>Bidirectional Streaming:</strong> Both agent and user can
                propose edits simultaneously, enabling true co-creation
              </li>
              <li>
                <strong>Authorship Tracking:</strong> Color-coded highlighting shows
                who wrote each part of the document, building transparency
              </li>
              <li>
                <strong>Patch-Based Editing:</strong> Changes are represented as
                discrete patches that can be accepted, rejected, or modified
              </li>
              <li>
                <strong>Turn-Taking Signals:</strong> Clear indicators show when
                it's safe to edit vs when the agent is actively drafting
              </li>
              <li>
                <strong>User Agency:</strong> Users can accept/reject agent
                suggestions and ask "why" to understand AI reasoning
              </li>
              <li>
                <strong>Conflict Resolution:</strong> When edits overlap, the system
                applies configurable merge strategies (user priority by default)
              </li>
            </ul>
          </div>
        </Card>
      </section>
    </DemoContainer>
    </>
  );
}
