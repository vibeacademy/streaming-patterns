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
}: PatchItemProps): JSX.Element {
  const description = getPatchDescription(patch);
  const badgeVariant = getOperationBadge(patch.operation);

  return (
    <div className={styles.patchItem} data-patch-id={patch.id}>
      <div className={styles.patchHeader}>
        <Badge variant={badgeVariant} className={styles.operationBadge}>
          {patch.operation}
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
  // Filter to only show agent patches with pending status
  const agentPendingPatches = pendingPatches.filter(
    (p) => p.author === 'agent' && p.status === 'pending'
  );

  return (
    <Card className={`${styles.toolbar} ${className || ''}`}>
      <div className={styles.toolbarHeader}>
        <h3 className={styles.toolbarTitle}>Agent Suggestions</h3>
        <Badge variant={agentPendingPatches.length > 0 ? 'warning' : 'neutral'}>
          {agentPendingPatches.length} pending
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
        aria-label="Pending agent patches"
      >
        {agentPendingPatches.length === 0 ? (
          <div className={styles.emptyState}>
            {isStreaming ? (
              <p>Waiting for agent suggestions...</p>
            ) : (
              <p>No pending suggestions. All patches have been reviewed.</p>
            )}
          </div>
        ) : (
          agentPendingPatches.map((patch) => (
            <PatchItem
              key={patch.id}
              patch={patch}
              onAccept={() => onAcceptPatch(patch.id)}
              onReject={() => onRejectPatch(patch.id)}
              onAskWhy={() => onAskWhy(patch.id)}
            />
          ))
        )}
      </div>

      {/* Educational note */}
      <div className={styles.toolbarFooter}>
        <p className={styles.footerNote}>
          Review each suggestion before accepting. Use "Why?" to understand the
          agent's reasoning.
        </p>
      </div>
    </Card>
  );
}
