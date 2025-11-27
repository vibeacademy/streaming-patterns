/**
 * Patch Toolbar Component
 *
 * Control panel for accepting, rejecting, or querying agent-proposed patches.
 * Shows pending patches and provides interactive buttons for user decisions.
 *
 * Educational Note:
 * This component demonstrates user agency in collaborative editing. Users can:
 * - Accept agent suggestions (applying them to the document)
 * - Reject agent suggestions (discarding them)
 * - Ask "why" to understand the agent's reasoning
 *
 * @module patterns/turn-taking-co-creation/PatchToolbar
 */

import { memo } from 'react';
import type { PatchWithStatus } from './types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import styles from './PatchToolbar.module.css';

/**
 * Props for PatchToolbar component
 */
export interface PatchToolbarProps {
  /** Pending patches awaiting user decision */
  pendingPatches: PatchWithStatus[];

  /** Callback when user accepts a patch */
  onAcceptPatch: (patchId: string) => void;

  /** Callback when user rejects a patch */
  onRejectPatch: (patchId: string) => void;

  /** Callback when user asks why a patch was made */
  onAskWhy: (patchId: string) => void;

  /** Whether the agent is currently streaming */
  isStreaming: boolean;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for individual patch item
 */
interface PatchItemProps {
  patch: PatchWithStatus;
  onAccept: () => void;
  onReject: () => void;
  onAskWhy: () => void;
  /** Whether this patch is in the process of being auto-accepted */
  isAccepted?: boolean;
}

/**
 * Get a human-readable description of a patch operation.
 *
 * Educational Note: Providing clear descriptions helps users understand
 * what each patch does without reading the raw operation data.
 */
function getPatchDescription(patch: PatchWithStatus): string {
  const { operation, content, position } = patch;

  switch (operation) {
    case 'insert':
      return `Insert "${content.substring(0, 30)}${
        content.length > 30 ? '...' : ''
      }" at position ${position.start}`;
    case 'replace':
      return `Replace text at ${position.start}-${position.end} with "${content.substring(
        0,
        30
      )}${content.length > 30 ? '...' : ''}"`;
    case 'delete':
      return `Delete text at ${position.start}-${position.end}`;
    default:
      return 'Unknown operation';
  }
}

/**
 * Get badge variant based on patch operation type.
 */
function getOperationBadge(
  operation: PatchWithStatus['operation']
): 'success' | 'warning' | 'error' {
  switch (operation) {
    case 'insert':
      return 'success';
    case 'replace':
      return 'warning';
    case 'delete':
      return 'error';
    default:
      return 'warning';
  }
}

/**
 * Patch Item - Renders a single pending patch with action buttons.
 *
 * Educational Note: Each patch item shows:
 * - Operation type (insert/replace/delete)
 * - Target section
 * - Preview of the change
 * - Action buttons (accept, reject, ask why)
 */
const PatchItem = memo(function PatchItem({
  patch,
  onAccept,
  onReject,
  onAskWhy,
  isAccepted = false,
}: PatchItemProps): JSX.Element {
  const description = getPatchDescription(patch);
  const badgeVariant = getOperationBadge(patch.operation);

  return (
    <div
      className={`${styles.patchItem} ${isAccepted ? styles.patchItemAccepted : ''}`}
      data-patch-id={patch.id}
      data-accepted={isAccepted}
    >
      <div className={styles.patchHeader}>
        <Badge variant={isAccepted ? 'success' : badgeVariant} className={styles.operationBadge}>
          {isAccepted ? 'accepted' : patch.operation}
        </Badge>
        <span className={styles.timestamp}>
          {new Date(patch.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className={styles.patchDescription}>{description}</div>

      <div className={styles.patchMeta}>
        <span className={styles.sectionLabel}>Section: {patch.sectionId}</span>
        {patch.metadata?.confidence && (
          <span className={styles.confidence}>
            Confidence: {(patch.metadata.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {!isAccepted && (
        <div className={styles.patchActions}>
          <Button
            onClick={onAccept}
            variant="primary"
            size="sm"
            aria-label={`Accept patch ${patch.id}`}
          >
            Accept
          </Button>
          <Button
            onClick={onReject}
            variant="secondary"
            size="sm"
            aria-label={`Reject patch ${patch.id}`}
          >
            Reject
          </Button>
          <Button
            onClick={onAskWhy}
            variant="ghost"
            size="sm"
            aria-label={`Ask why for patch ${patch.id}`}
          >
            Why?
          </Button>
        </div>
      )}

      {isAccepted && (
        <div className={styles.acceptedIndicator}>
          <span className={styles.checkmark}>✓</span>
          <span>Auto-accepted</span>
        </div>
      )}
    </div>
  );
});

/**
 * PatchToolbar - Control panel for managing agent patches
 *
 * This component provides a sidebar/toolbar for reviewing and acting on
 * patches proposed by the AI agent. Users can batch-review changes and
 * make informed decisions about what to keep or discard.
 *
 * Features:
 * - List of pending agent patches
 * - Accept/reject/ask-why actions
 * - Visual indicators for patch types
 * - Streaming status indicator
 * - Empty state when no patches pending
 *
 * @example
 * ```tsx
 * <PatchToolbar
 *   pendingPatches={pendingAgentPatches}
 *   onAcceptPatch={handleAccept}
 *   onRejectPatch={handleReject}
 *   onAskWhy={handleAskWhy}
 *   isStreaming={isAgentActive}
 * />
 * ```
 */
export function PatchToolbar({
  pendingPatches,
  onAcceptPatch,
  onRejectPatch,
  onAskWhy,
  isStreaming,
  className,
}: PatchToolbarProps): JSX.Element {
  // Show agent patches that are either pending or recently accepted
  // Educational Note: We show both states so users can see the flow:
  // 1. Patch appears as "pending" with action buttons
  // 2. After AUTO_ACCEPT_DELAY, patch transitions to "accepted" state
  // 3. Shortly after, patch is removed from the list
  const visiblePatches = pendingPatches.filter(
    (p) => p.author === 'agent' && (p.status === 'pending' || p.status === 'accepted')
  );

  const pendingCount = pendingPatches.filter(
    (p) => p.author === 'agent' && p.status === 'pending'
  ).length;

  return (
    <Card className={`${styles.toolbar} ${className || ''}`}>
      <div className={styles.toolbarHeader}>
        <h3 className={styles.toolbarTitle}>Agent Suggestions</h3>
        <Badge variant={visiblePatches.length > 0 ? 'warning' : 'neutral'}>
          {pendingCount > 0 ? `${pendingCount} pending` : visiblePatches.length > 0 ? 'accepting...' : '0 pending'}
        </Badge>
      </div>

      {isStreaming && (
        <div className={styles.streamingBanner}>
          <span className={styles.streamingDot} aria-hidden="true"></span>
          <span>Agent is drafting more content...</span>
          <span className="sr-only" aria-live="polite">
            Agent is currently streaming new patches
          </span>
        </div>
      )}

      <div
        className={styles.patchList}
        role="list"
        aria-label="Agent patches"
      >
        {visiblePatches.length === 0 ? (
          <div className={styles.emptyState}>
            {isStreaming ? (
              <>
                <p className={styles.emptyTitle}>Waiting for suggestions...</p>
                <p className={styles.emptyDescription}>
                  Agent suggestions will appear here as they are generated.
                  They will be auto-accepted after a brief preview.
                </p>
              </>
            ) : (
              <>
                <p className={styles.emptyTitle}>Collaboration complete</p>
                <p className={styles.emptyDescription}>
                  The agent has finished drafting. Click any section to edit,
                  add your own text, or modify the agent's suggestions.
                </p>
              </>
            )}
          </div>
        ) : (
          visiblePatches.map((patch) => (
            <PatchItem
              key={patch.id}
              patch={patch}
              onAccept={() => onAcceptPatch(patch.id)}
              onReject={() => onRejectPatch(patch.id)}
              onAskWhy={() => onAskWhy(patch.id)}
              isAccepted={patch.status === 'accepted'}
            />
          ))
        )}
      </div>

      {/* Educational note */}
      <div className={styles.toolbarFooter}>
        <p className={styles.footerNote}>
          <strong>Educational Note:</strong> Agent patches appear here briefly
          before being auto-accepted. In a production system, you could pause
          auto-acceptance to manually review each suggestion.
        </p>
      </div>
    </Card>
  );
}
