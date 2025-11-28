/**
 * Streaming Validation Loop Pattern - TypeScript Type Definitions
 *
 * This file defines the type system for the Streaming Validation Loop pattern,
 * which demonstrates checkpoint-based validation where streams pause at critical
 * decision points, wait for user approval, and resume based on feedback.
 *
 * @pattern Streaming Validation Loop
 * @educational Teaches checkpoint management, approval workflows, timeout handling
 */

/**
 * Checkpoint phase represents the current state of a validation checkpoint.
 *
 * - drafting: Stream is generating content before checkpoint
 * - waiting_for_approval: Stream paused, waiting for user action
 * - resuming: User approved/edited, stream resuming
 * - timed_out: No user action within timeout period (auto-approved)
 */
export type CheckpointPhase =
  | 'drafting'
  | 'waiting_for_approval'
  | 'resuming'
  | 'timed_out';

/**
 * User actions available at a checkpoint.
 *
 * - approve: Accept the proposed value as-is
 * - edit: Modify the proposed value before proceeding
 * - skip: Use default/fallback value instead
 */
export type CheckpointAction = 'approve' | 'edit' | 'skip';

/**
 * Budget allocation for a team (StreamFlow PM context).
 *
 * Educational Note: This represents the critical data requiring approval.
 * In real systems, this could be any decision requiring human validation.
 */
export interface BudgetAllocation {
  /** Team receiving the budget */
  team: string;

  /** Total budget amount in USD */
  budget: number;

  /** Number of full-time employees */
  headcount: number;

  /** Number of contractors */
  contractors: number;

  /** Budget justification */
  rationale: string;
}

/**
 * Checkpoint represents a validation point in the stream.
 *
 * Educational Note: Checkpoints are the core mechanic of this pattern.
 * They pause the stream, present options to the user, and await a decision
 * before continuing. This enables human-in-the-loop workflows.
 */
export interface Checkpoint {
  /** Unique identifier for this checkpoint */
  id: string;

  /** Current phase of the checkpoint lifecycle */
  phase: CheckpointPhase;

  /** Question or prompt for the user */
  question: string;

  /** The value proposed by the AI that requires approval */
  proposedValue: BudgetAllocation;

  /** Available actions the user can take */
  actions: CheckpointAction[];

  /** Time in ms before auto-approval (0 = no timeout) */
  timeoutMs: number;

  /** When the checkpoint was created */
  timestamp: number;

  /** When the checkpoint was resolved (if applicable) */
  resolvedAt?: number;

  /** The action taken by the user (if resolved) */
  actionTaken?: CheckpointAction;

  /** The final approved value (may differ from proposedValue if edited) */
  approvedValue?: BudgetAllocation;

  /** Reason for timeout (if timed out) */
  timeoutReason?: string;
}

/**
 * Stream event types for validation loop lifecycle.
 *
 * Educational Note: These events expose the checkpoint lifecycle to the UI,
 * allowing visualization of pauses, approvals, edits, and timeouts.
 */
export type StreamEventType =
  | 'checkpoint'
  | 'checkpoint_response'
  | 'checkpoint_resume'
  | 'budget_analysis'
  | 'final_plan';

/**
 * Base interface for all stream events.
 */
interface BaseStreamEvent {
  type: StreamEventType;
  timestamp: number;
}

/**
 * Event emitted when the stream reaches a validation checkpoint.
 *
 * Educational Note: This event pauses the stream and displays a checkpoint card.
 * The stream will not continue until a checkpoint_response event is sent.
 */
export interface CheckpointEvent extends BaseStreamEvent {
  type: 'checkpoint';
  data: {
    checkpointId: string;
    phase: 'waiting_for_approval';
    question: string;
    proposedValue: BudgetAllocation;
    actions: CheckpointAction[];
    timeoutMs: number;
  };
}

/**
 * Event sent when the user responds to a checkpoint.
 *
 * Educational Note: This is a client-to-server event (user action).
 * The server processes this and emits a checkpoint_resume event.
 */
export interface CheckpointResponseEvent extends BaseStreamEvent {
  type: 'checkpoint_response';
  data: {
    checkpointId: string;
    action: CheckpointAction;
    editedValue?: BudgetAllocation;
  };
}

/**
 * Event emitted when the stream resumes after checkpoint approval.
 *
 * Educational Note: This event signals that the stream is continuing.
 * The approvedValue may differ from proposedValue if the user edited it.
 */
export interface CheckpointResumeEvent extends BaseStreamEvent {
  type: 'checkpoint_resume';
  data: {
    checkpointId: string;
    approvedValue: BudgetAllocation;
    phase: 'resuming';
  };
}

/**
 * Event emitted during budget analysis (before checkpoint).
 *
 * Educational Note: This shows the AI's reasoning before pausing for approval.
 * It provides context for why the proposed budget allocation makes sense.
 */
export interface BudgetAnalysisEvent extends BaseStreamEvent {
  type: 'budget_analysis';
  data: {
    team: string;
    analysis: string;
  };
}

/**
 * Event emitted with the final budget allocation plan.
 *
 * Educational Note: This is the culmination of all approved checkpoints.
 * It shows the complete plan with user-approved values.
 */
export interface FinalPlanEvent extends BaseStreamEvent {
  type: 'final_plan';
  data: {
    allocations: BudgetAllocation[];
    totalBudget: number;
    summary: string;
  };
}

/**
 * Union type of all possible stream events.
 */
export type StreamEvent =
  | CheckpointEvent
  | CheckpointResponseEvent
  | CheckpointResumeEvent
  | BudgetAnalysisEvent
  | FinalPlanEvent;

/**
 * Timeline entry for retrospective visualization.
 *
 * Educational Note: Timeline entries show the complete history of checkpoints,
 * including when they were created, how long they took, and what action was taken.
 */
export interface TimelineEntry {
  /** Checkpoint ID this entry represents */
  checkpointId: string;

  /** Team name for this checkpoint */
  team: string;

  /** When the checkpoint was created */
  createdAt: number;

  /** When the checkpoint was resolved */
  resolvedAt: number;

  /** Time spent waiting for approval (ms) */
  durationMs: number;

  /** Action taken by the user */
  action: CheckpointAction;

  /** Original proposed value */
  proposedValue: BudgetAllocation;

  /** Final approved value */
  approvedValue: BudgetAllocation;

  /** Whether the value was edited */
  wasEdited: boolean;

  /** Whether the checkpoint timed out */
  wasTimedOut: boolean;
}

/**
 * State managed by the useValidationStream hook.
 *
 * Educational Note: This interface demonstrates the complete state needed
 * to implement the Streaming Validation Loop pattern.
 */
export interface ValidationStreamState {
  /** All checkpoints (Map for fast lookups by ID) */
  checkpoints: Map<string, Checkpoint>;

  /** Currently active checkpoint (null if none) */
  activeCheckpoint: Checkpoint | null;

  /** Budget analysis text for each team */
  analyses: Map<string, string>;

  /** Final approved budget allocations */
  allocations: BudgetAllocation[];

  /** Final plan summary */
  planSummary: string;

  /** Whether the stream is currently active */
  isStreaming: boolean;

  /** Whether we're waiting for user input at a checkpoint */
  isWaitingForApproval: boolean;

  /** Timeline entries for retrospective view */
  timeline: TimelineEntry[];
}

/**
 * Actions for checkpoint management.
 *
 * Educational Note: These actions demonstrate user control over the validation
 * workflow. Users can approve, edit, or skip checkpoints.
 */
export interface ValidationActions {
  /** Approve the proposed value */
  approve: (checkpointId: string) => void;

  /** Edit the proposed value */
  edit: (checkpointId: string, editedValue: BudgetAllocation) => void;

  /** Skip this checkpoint (use default) */
  skip: (checkpointId: string) => void;

  /** Reset the demo to initial state */
  reset: () => void;
}

/**
 * Return type of useValidationStream hook.
 */
export interface UseValidationStreamReturn extends ValidationStreamState {
  actions: ValidationActions;
}

/**
 * Props for CheckpointCard component.
 */
export interface CheckpointCardProps {
  /** The checkpoint to display */
  checkpoint: Checkpoint;

  /** Callback when user approves */
  onApprove: () => void;

  /** Callback when user edits (provides new value) */
  onEdit: (editedValue: BudgetAllocation) => void;

  /** Callback when user skips */
  onSkip: () => void;

  /** Remaining time in ms before timeout */
  remainingTimeMs: number;
}

/**
 * Props for Timeline component.
 */
export interface TimelineProps {
  /** Timeline entries to display */
  entries: TimelineEntry[];

  /** Currently active checkpoint ID (if any) */
  activeCheckpointId: string | null;
}
