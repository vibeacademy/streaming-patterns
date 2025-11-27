/**
 * Turn-Taking Co-Creation Pattern - Custom React Hook
 *
 * This file implements the useCollaborativeDocument hook, which manages the
 * complete state lifecycle for collaborative editing with an AI agent.
 *
 * @pattern Turn-Taking Co-Creation
 * @educational Teaches bidirectional streaming, patch management, conflict resolution
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  CollaborativeDocument,
  DocumentSection,
  Patch,
  StreamEvent,
  UseCollaborativeDocumentReturn,
  PatchWithStatus,
  SectionWithAuthorship,
  MergeConfig,
} from './types';
import {
  createMockCollaborationStream,
  type StreamConfig,
} from './mockStream';
import {
  applyPatch,
  buildAuthorshipSpans,
} from './patchEngine';
import { initialDocument } from './fixtures';

/**
 * Hook configuration options.
 */
export interface UseCollaborativeDocumentConfig extends Partial<StreamConfig> {
  /** Optional: Callback when events are emitted (for network inspector) */
  onEvent?: (event: StreamEvent) => void;

  /** Optional: Enable auto-start streaming */
  autoStart?: boolean;

  /** Optional: Merge strategy configuration */
  mergeConfig?: MergeConfig;
}

/**
 * useCollaborativeDocument - Core hook for Turn-Taking Co-Creation pattern
 *
 * This hook demonstrates how to:
 * 1. Manage document state with concurrent agent and user edits
 * 2. Process streaming patch events and apply them to sections
 * 3. Handle conflicts and merge patches according to strategy
 * 4. Track authorship for color-coded UI visualization
 * 5. Provide user actions for editing, accepting, and rejecting patches
 *
 * Educational Note: Collaborative editing requires careful state management
 * to ensure user edits don't get overwritten by streaming agent patches.
 *
 * @param config - Hook configuration
 * @returns Collaborative document state and actions
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { document, sectionsWithAuthorship, actions, isStreaming } =
 *     useCollaborativeDocument({
 *       fixture: 'full',
 *       speed: 'normal',
 *       onEvent: (event) => console.log(event),
 *     });
 *
 *   return (
 *     <div>
 *       {sectionsWithAuthorship.map(section => (
 *         <CollaborativeEditor
 *           key={section.id}
 *           section={section}
 *           onEdit={actions.applyUserEdit}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCollaborativeDocument(
  config: UseCollaborativeDocumentConfig = {}
): UseCollaborativeDocumentReturn {
  const {
    onEvent,
    autoStart = true,
    fixture = 'full',
    speed = 'normal',
    variableDelay = true,
  } = config;

  // ========== State Management ==========
  // Educational Note: Document is stored with sections as a Map for fast lookups.
  // Patches are tracked separately to support undo/redo and conflict detection.
  const [document, setDocument] = useState<CollaborativeDocument | null>(null);
  const [pendingPatches] = useState<PatchWithStatus[]>([]);
  const [patchHistory, setPatchHistory] = useState<Patch[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Ref to track if stream is currently running - prevents duplicate streams
  // CRITICAL: This prevents the stream from restarting when state changes trigger re-renders
  const streamActiveRef = useRef(false);

  // ========== Initialize Document ==========
  /**
   * Initialize document structure from fixture.
   *
   * Educational Note: Document starts empty and is populated by streaming patches.
   * This mirrors real-world scenarios where users start with a template.
   */
  useEffect(() => {
    const sectionsMap = new Map<string, DocumentSection>();
    initialDocument.sections.forEach((section) => {
      sectionsMap.set(section.id, section);
    });

    setDocument({
      ...initialDocument,
      sections: sectionsMap,
    });
  }, []);

  // ========== Stream Processing ==========
  /**
   * Process incoming stream events and update document state.
   *
   * Educational Note: This is the core of collaborative editing. Each event type
   * (agent_patch, user_patch, acknowledgment) triggers different state updates.
   *
   * CRITICAL FIX for Issue #129: We use a ref to prevent the stream from restarting
   * when state changes trigger re-renders. The stream should only start ONCE.
   * This is the same pattern used to fix Issue #123 (Multi-Turn Memory Timeline).
   */
  useEffect(() => {
    // CRITICAL: Prevent duplicate streams - only start if not already running
    if (!autoStart || !document || streamActiveRef.current) return;
    streamActiveRef.current = true;

    let cancelled = false;
    setIsStreaming(true);

    (async () => {
      try {
        const stream = createMockCollaborationStream({
          fixture,
          speed,
          variableDelay,
        });

        for await (const event of stream) {
          if (cancelled) break;

          // Notify external listeners (e.g., network inspector)
          if (onEvent) {
            onEvent(event);
          }

          // Process event based on type
          switch (event.type) {
            case 'agent_patch': {
              const patch: Patch = {
                id: event.data.patchId,
                sectionId: event.data.sectionId,
                author: 'agent',
                operation: event.data.operation,
                content: event.data.content,
                position: event.data.position,
                timestamp: event.timestamp,
                metadata: event.data.metadata,
              };

              // Apply patch to document
              applyPatchToDocument(patch);
              break;
            }

            case 'user_patch': {
              const patch: Patch = {
                id: event.data.patchId,
                sectionId: event.data.sectionId,
                author: 'user',
                operation: event.data.operation,
                content: event.data.content,
                position: event.data.position,
                timestamp: event.timestamp,
                supersedes: event.data.supersedes,
              };

              // Apply patch to document
              applyPatchToDocument(patch);
              break;
            }

            case 'patch_ack':
              // Educational Note: Acknowledgments don't change the document,
              // but they provide user feedback that the agent adapted to their edit.
              // In a real implementation, this would update UI feedback
              break;

            case 'section_complete':
              // Mark section as complete (allows user editing)
              setCompletedSections((prev) => new Set(prev).add(event.data.sectionId));
              break;

            case 'conflict':
              // Educational Note: Conflicts are resolved according to merge strategy.
              // The conflict event informs the UI to show resolution options.
              // In a real implementation, this would trigger conflict resolution UI
              break;

            default: {
              const _exhaustive: never = event;
              console.error('Unknown event type:', _exhaustive);
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        if (!cancelled) {
          setIsStreaming(false);
          streamActiveRef.current = false; // Allow stream to restart on next mount
        }
      }
    })();

    return () => {
      cancelled = true;
      setIsStreaming(false);
      streamActiveRef.current = false; // Reset on cleanup so stream can start again
    };
    // We include document in dependencies to trigger when it's initialized,
    // but streamActiveRef prevents the stream from restarting during the same session
  }, [autoStart, document, fixture, speed, variableDelay, onEvent]);

  // ========== Patch Application ==========
  /**
   * Apply a patch to the document.
   *
   * Educational Note: This is where patches modify the document content.
   * Patches are applied optimistically and added to history for undo/redo.
   */
  const applyPatchToDocument = useCallback(
    (patch: Patch) => {
      setDocument((prevDoc) => {
        if (!prevDoc) return prevDoc;

        const newSections = new Map(prevDoc.sections);
        const section = newSections.get(patch.sectionId);

        if (!section) {
          console.error(`Section ${patch.sectionId} not found`);
          return prevDoc;
        }

        // Apply patch to section content
        const newContent = applyPatch(section.content, patch);

        // Update section
        newSections.set(patch.sectionId, {
          ...section,
          content: newContent,
          patches: [...section.patches, patch],
        });

        // Add patch to history
        setPatchHistory((prev) => [...prev, patch]);

        return {
          ...prevDoc,
          sections: newSections,
          updatedAt: patch.timestamp,
        };
      });
    },
    []
  );

  // ========== Computed Values ==========
  /**
   * Enrich sections with authorship data for UI rendering.
   *
   * Educational Note: Authorship spans are computed from patches to enable
   * color-coded visualization showing who wrote each part of the document.
   */
  const sectionsWithAuthorship = useMemo<SectionWithAuthorship[]>(() => {
    if (!document) return [];

    return Array.from(document.sections.values())
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        ...section,
        authorshipSpans: buildAuthorshipSpans(section),
        isStreaming: isStreaming && !completedSections.has(section.id),
        isComplete: completedSections.has(section.id),
      }));
  }, [document, isStreaming, completedSections]);

  // ========== User Actions ==========
  /**
   * Apply a user edit to a section.
   *
   * Educational Note: User edits are applied immediately (optimistic UI) and
   * sent to the server. If they conflict with agent patches, the merge strategy
   * determines the winner.
   */
  const applyUserEdit = useCallback(
    (
      _sectionId: string,
      patchData: Omit<Patch, 'id' | 'author' | 'timestamp'>
    ) => {
      const patch: Patch = {
        ...patchData,
        id: `user-patch-${Date.now()}`,
        author: 'user',
        timestamp: Date.now(),
      };

      applyPatchToDocument(patch);

      // Notify server (in real app, this would be a WebSocket message)
      if (onEvent) {
        onEvent({
          type: 'user_patch',
          timestamp: patch.timestamp,
          data: {
            patchId: patch.id,
            sectionId: patch.sectionId,
            operation: patch.operation,
            content: patch.content,
            position: patch.position,
            supersedes: patch.supersedes,
          },
        });
      }
    },
    [applyPatchToDocument, onEvent]
  );

  /**
   * Accept an agent's proposed patch.
   *
   * Educational Note: In a real system, accepting a patch would send
   * confirmation to the server to finalize the edit.
   */
  const acceptAgentPatch = useCallback((_patchId: string) => {
    // In real app: send acceptance to server
  }, []);

  /**
   * Reject an agent's proposed patch.
   *
   * Educational Note: Rejection would trigger the agent to revise its output
   * or skip that particular edit.
   */
  const rejectAgentPatch = useCallback(
    (_patchId: string, _reason: string) => {
      // In real app: send rejection to server with reason
    },
    []
  );

  /**
   * Ask the agent why they made a specific edit.
   *
   * Educational Note: "Ask why" builds transparency and trust. The agent
   * can explain its reasoning, helping users learn from AI decisions.
   */
  const askWhy = useCallback((_patchId: string) => {
    // In real app: send request to server, agent streams explanation
  }, []);

  /**
   * Revert a section to a previous version.
   *
   * Educational Note: Undo functionality reconstructs the document by
   * replaying patches up to a specific point in time.
   */
  const revertSection = useCallback(
    (_sectionId: string, _targetPatchId: string) => {
      // In real app: find all patches after target, remove them, reapply from history
    },
    []
  );

  // ========== Return State and Actions ==========
  return {
    document,
    sectionsWithAuthorship,
    isStreaming,
    pendingPatches,
    patchHistory,
    actions: {
      applyUserEdit,
      acceptAgentPatch,
      rejectAgentPatch,
      askWhy,
      revertSection,
    },
  };
}
