/**
 * Turn-Taking Co-Creation Pattern - TypeScript Type Definitions
 *
 * This file defines the type system for the Turn-Taking Co-Creation pattern,
 * which demonstrates how to build collaborative editing experiences where users
 * and AI take turns modifying a shared document in real-time.
 *
 * @pattern Turn-Taking Co-Creation
 * @educational Teaches bidirectional streaming, conflict resolution, authorship tracking
 */

/**
 * Author types for tracking who made each edit.
 */
export type Author = 'agent' | 'user';

/**
 * Patch operation types for document edits.
 *
 * - insert: Add new content at a position
 * - replace: Replace content in a range
 * - delete: Remove content in a range
 */
export type PatchOperation = 'insert' | 'replace' | 'delete';

/**
 * Position in document for patch application.
 *
 * Educational Note: Using character positions (like CodeMirror/VSCode) for simplicity.
 * Production systems might use line/column coordinates or operational transform positions.
 */
export interface Position {
  /** Character offset from document start */
  start: number;
  /** Character offset for end of range (exclusive) */
  end: number;
}

/**
 * Patch represents a single edit operation to the document.
 *
 * Educational Note: Patches are the fundamental unit of collaborative editing.
 * Each patch has an author (agent or user), operation type, and target position.
 */
export interface Patch {
  /** Unique identifier for this patch */
  id: string;

  /** Section of the document being edited */
  sectionId: string;

  /** Who authored this patch */
  author: Author;

  /** Type of edit operation */
  operation: PatchOperation;

  /** New content (for insert/replace) */
  content: string;

  /** Position in document where patch applies */
  position: Position;

  /** When this patch was created */
  timestamp: number;

  /** Optional: Patch this one supersedes (replaces) */
  supersedes?: string;

  /** Optional: Metadata for tracking */
  metadata?: {
    source?: string;
    confidence?: number;
    [key: string]: unknown;
  };
}

/**
 * Document section represents a logical part of the document.
 *
 * Educational Note: Breaking documents into sections (goals, scope, timeline)
 * makes patch application and conflict resolution more manageable.
 */
export interface DocumentSection {
  /** Unique identifier for this section */
  id: string;

  /** Section title (e.g., "Project Goals") */
  title: string;

  /** Current text content */
  content: string;

  /** Patches that have been applied to this section */
  patches: Patch[];

  /** Order for rendering sections */
  order: number;
}

/**
 * Complete collaborative document structure.
 */
export interface CollaborativeDocument {
  /** Document identifier */
  id: string;

  /** Document title */
  title: string;

  /** All sections in the document */
  sections: Map<string, DocumentSection>;

  /** Metadata */
  createdAt: number;
  updatedAt: number;
}

/**
 * Stream event types for collaborative editing.
 *
 * Educational Note: These events demonstrate bidirectional streaming where
 * both agent and user can propose edits simultaneously.
 */
export type StreamEventType =
  | 'agent_patch'
  | 'user_patch'
  | 'patch_ack'
  | 'section_complete'
  | 'conflict';

/**
 * Base interface for all stream events.
 */
interface BaseStreamEvent {
  type: StreamEventType;
  timestamp: number;
}

/**
 * Event emitted when agent proposes a patch.
 *
 * Educational Note: Agent patches stream in real-time as the AI drafts content.
 * The UI applies these optimistically and shows them in the agent's color.
 */
export interface AgentPatchEvent extends BaseStreamEvent {
  type: 'agent_patch';
  data: {
    patchId: string;
    sectionId: string;
    operation: PatchOperation;
    content: string;
    position: Position;
    metadata?: Patch['metadata'];
  };
}

/**
 * Event emitted when user submits an edit.
 *
 * Educational Note: This is client-initiated and sent to the server.
 * User edits take precedence and may supersede pending agent patches.
 */
export interface UserPatchEvent extends BaseStreamEvent {
  type: 'user_patch';
  data: {
    patchId: string;
    sectionId: string;
    operation: PatchOperation;
    content: string;
    position: Position;
    supersedes?: string; // Agent patch ID being replaced
  };
}

/**
 * Event emitted when agent acknowledges a user edit.
 *
 * Educational Note: Acknowledgment events show that the agent has incorporated
 * user feedback. This builds trust and demonstrates adaptability.
 */
export interface PatchAckEvent extends BaseStreamEvent {
  type: 'patch_ack';
  data: {
    patchId: string;
    status: 'accepted' | 'rejected' | 'modified';
    message: string;
  };
}

/**
 * Event emitted when agent finishes drafting a section.
 *
 * Educational Note: Section completion signals allow the UI to show progress
 * and enable user editing of completed sections.
 */
export interface SectionCompleteEvent extends BaseStreamEvent {
  type: 'section_complete';
  data: {
    sectionId: string;
  };
}

/**
 * Event emitted when a conflict is detected.
 *
 * Educational Note: Conflicts occur when agent and user edit the same region.
 * The UI should highlight conflicts and provide resolution options.
 */
export interface ConflictEvent extends BaseStreamEvent {
  type: 'conflict';
  data: {
    sectionId: string;
    agentPatchId: string;
    userPatchId: string;
    resolution: 'user_wins' | 'agent_wins' | 'manual';
  };
}

/**
 * Union type of all possible stream events.
 */
export type StreamEvent =
  | AgentPatchEvent
  | UserPatchEvent
  | PatchAckEvent
  | SectionCompleteEvent
  | ConflictEvent;

/**
 * Patch status for UI rendering.
 *
 * - pending: Patch is queued, not yet applied
 * - applied: Patch has been successfully applied
 * - conflict: Patch conflicts with another edit
 * - superseded: Patch was replaced by another patch
 * - accepted: Patch was auto-accepted (briefly shown before removal)
 */
export type PatchStatus = 'pending' | 'applied' | 'conflict' | 'superseded' | 'accepted';

/**
 * Enriched patch with UI state.
 */
export interface PatchWithStatus extends Patch {
  status: PatchStatus;
}

/**
 * Authorship span for color-coding in the UI.
 *
 * Educational Note: Tracking authorship at the text span level allows
 * fine-grained visualization of who wrote what.
 */
export interface AuthorshipSpan {
  /** Character range in document */
  start: number;
  end: number;
  /** Who authored this text */
  author: Author;
  /** Original patch ID that created this span */
  patchId: string;
}

/**
 * Deletion span for showing strikethrough in the UI.
 *
 * Educational Note: Similar to GitHub diffs, we show deleted text with
 * strikethrough to help users understand what changed. This requires
 * tracking the original content that was deleted, not just the position.
 */
export interface DeletionSpan {
  /** Position in the current document where deletion occurred */
  position: number;
  /** The original text that was deleted */
  deletedContent: string;
  /** Who authored the original text (for color-coding) */
  originalAuthor: Author;
  /** Who performed the deletion */
  deletedBy: Author;
  /** Patch ID of the delete/replace operation */
  patchId: string;
}

/**
 * Section with authorship information for rendering.
 */
export interface SectionWithAuthorship extends DocumentSection {
  /** Authorship spans for color-coding */
  authorshipSpans: AuthorshipSpan[];
  /** Deletion spans for strikethrough display */
  deletionSpans: DeletionSpan[];
  /** Whether this section is currently being edited by agent */
  isStreaming: boolean;
  /** Whether this section is complete (user can edit) */
  isComplete: boolean;
}

/**
 * Actions for collaborative editing.
 *
 * Educational Note: These actions demonstrate user control in collaborative editing.
 * Users can edit, accept, reject, or ask why for any agent-proposed change.
 */
export interface CollaborativeActions {
  /** Apply a user edit to a section */
  applyUserEdit: (sectionId: string, patch: Omit<Patch, 'id' | 'author' | 'timestamp'>) => void;

  /** Accept an agent's proposed patch */
  acceptAgentPatch: (patchId: string) => void;

  /** Reject an agent's proposed patch */
  rejectAgentPatch: (patchId: string, reason: string) => void;

  /** Ask agent why they made this edit */
  askWhy: (patchId: string) => void;

  /** Revert to a previous version of a section */
  revertSection: (sectionId: string, patchId: string) => void;
}

/**
 * State managed by the useCollaborativeDocument hook.
 *
 * Educational Note: This interface demonstrates the complete state needed
 * to implement real-time collaborative editing with an AI agent.
 */
export interface CollaborativeDocumentState {
  /** The document being edited */
  document: CollaborativeDocument | null;

  /** Sections enriched with authorship data */
  sectionsWithAuthorship: SectionWithAuthorship[];

  /** Whether the agent stream is currently active */
  isStreaming: boolean;

  /** Queue of pending patches not yet applied */
  pendingPatches: PatchWithStatus[];

  /** History of all patches for undo/redo */
  patchHistory: Patch[];
}

/**
 * Return type of useCollaborativeDocument hook.
 */
export interface UseCollaborativeDocumentReturn extends CollaborativeDocumentState {
  actions: CollaborativeActions;
}

/**
 * Configuration for patch merge strategy.
 *
 * Educational Note: Different merge strategies suit different use cases.
 * user_priority: User edits always win (good for human-in-control scenarios)
 * agent_priority: Agent edits win unless user explicitly rejects (good for AI-first drafting)
 * merge: Attempt to merge both edits (complex but most flexible)
 */
export interface MergeConfig {
  strategy: 'user_priority' | 'agent_priority' | 'merge';
  /** Maximum time (ms) to wait before auto-accepting agent patches */
  autoAcceptTimeout?: number;
  /** Whether to show conflict resolution UI */
  showConflictUI: boolean;
}

/**
 * Result of a patch merge operation.
 */
export interface MergeResult {
  /** Whether the merge was successful */
  success: boolean;
  /** Merged patch (if successful) */
  patch?: Patch;
  /** Conflict information (if merge failed) */
  conflict?: {
    agentPatch: Patch;
    userPatch: Patch;
    reason: string;
  };
  /** Authorship spans after merge */
  authorshipSpans: AuthorshipSpan[];
}
