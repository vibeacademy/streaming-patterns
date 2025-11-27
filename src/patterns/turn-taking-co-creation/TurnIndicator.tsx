/**
 * Turn Indicator Component
 *
 * Visual indicator showing whose turn it is in the collaborative editing session.
 * Displays whether the agent is drafting, the user can edit, or both are collaborating.
 *
 * Educational Note:
 * Turn-taking signals are crucial for collaborative UX. Users need to know when
 * they can interact and when they should wait for the agent to complete its work.
 *
 * @module patterns/turn-taking-co-creation/TurnIndicator
 */

import { Card } from '@/components/ui/Card';
import styles from './TurnIndicator.module.css';

/**
 * Turn state indicating who has control
 */
export type TurnState = 'agent' | 'user' | 'collaborative' | 'idle';

/**
 * Props for TurnIndicator component
 */
export interface TurnIndicatorProps {
  /** Current turn state */
  turnState: TurnState;

  /** Whether the agent is actively streaming */
  isStreaming: boolean;

  /** Optional message to display */
  message?: string;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Get display information based on turn state.
 *
 * Educational Note: Clear messaging helps users understand the collaboration flow.
 * Each turn state has distinct visual treatment and messaging.
 */
function getTurnDisplayInfo(
  turnState: TurnState,
  isStreaming: boolean
): {
  icon: string;
  label: string;
  description: string;
  variant: 'agent' | 'user' | 'collaborative' | 'idle';
} {
  switch (turnState) {
    case 'agent':
      return {
        icon: '🤖',
        label: "Agent's Turn",
        description: isStreaming
          ? 'AI is drafting content...'
          : 'AI is preparing to draft',
        variant: 'agent',
      };
    case 'user':
      return {
        icon: '✏️',
        label: 'Your Turn',
        description: 'You can now edit the document',
        variant: 'user',
      };
    case 'collaborative':
      return {
        icon: '🤝',
        label: 'Collaborative Editing',
        description: 'Both you and AI can make changes',
        variant: 'collaborative',
      };
    case 'idle':
    default:
      return {
        icon: '⏸️',
        label: 'Idle',
        description: 'Waiting to start collaboration',
        variant: 'idle',
      };
  }
}

/**
 * TurnIndicator - Shows whose turn it is in collaborative editing
 *
 * This component provides clear visual feedback about the current collaboration state.
 * Users know when they can edit, when to wait for the agent, and when both can work.
 *
 * Features:
 * - Visual indicators for each turn state
 * - Animated streaming indicator
 * - Clear messaging about what's happening
 * - Accessible announcements for screen readers
 *
 * @example
 * ```tsx
 * <TurnIndicator
 *   turnState="agent"
 *   isStreaming={true}
 *   message="Drafting project goals section..."
 * />
 * ```
 */
export function TurnIndicator({
  turnState,
  isStreaming,
  message,
  className,
}: TurnIndicatorProps): JSX.Element {
  const displayInfo = getTurnDisplayInfo(turnState, isStreaming);

  return (
    <Card className={`${styles.indicator} ${className || ''}`}>
      <div
        className={`${styles.indicatorContent} ${styles[displayInfo.variant]}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={styles.iconContainer}>
          <span className={styles.icon} aria-hidden="true">
            {displayInfo.icon}
          </span>
          {isStreaming && turnState === 'agent' && (
            <span className={styles.streamingDot} aria-hidden="true"></span>
          )}
        </div>

        <div className={styles.textContent}>
          <div className={styles.label}>{displayInfo.label}</div>
          <div className={styles.description}>
            {message || displayInfo.description}
          </div>
        </div>

        {/* Streaming progress indicator */}
        {isStreaming && turnState === 'agent' && (
          <div className={styles.progressIndicator}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
          </div>
        )}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {displayInfo.label}: {message || displayInfo.description}
      </div>
    </Card>
  );
}
