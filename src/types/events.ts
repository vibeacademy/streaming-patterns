/**
 * Core Stream Event Types
 *
 * This module defines the foundational TypeScript interfaces for all streaming patterns
 * in the streaming-patterns library. These types represent the contract between
 * mock streaming infrastructure and pattern implementations.
 *
 * @module types/events
 */

/**
 * Base interface for all stream events
 * Every event must have these core fields for tracking and debugging
 */
export interface BaseStreamEvent {
  /** Unique identifier for this event */
  id: string;

  /** Timestamp when event was created (milliseconds since epoch) */
  timestamp: number;

  /** Optional session identifier for grouping related events */
  sessionId?: string;
}

// ============================================================================
// Chain-of-Reasoning Pattern Events
// ============================================================================

/**
 * Reasoning step event - represents one step in a chain of reasoning
 * Used by Chain-of-Reasoning pattern to show intermediate thought process
 */
export interface ReasoningStep {
  /** Unique ID for this reasoning step */
  id: string;

  /** Brief summary of this reasoning step (1-2 sentences) */
  summary: string;

  /** Confidence score for this reasoning step (0.0 to 1.0) */
  confidence: number;

  /** Optional detailed explanation of the reasoning */
  details?: string;

  /** Timestamp when this step was created */
  timestamp: number;
}

/**
 * Reasoning event - emitted when a new reasoning step is available
 */
export interface ReasoningEvent extends BaseStreamEvent {
  type: 'reasoning';
  data: ReasoningStep;
}

/**
 * Answer text chunk - partial or complete answer text
 */
export interface AnswerChunk {
  /** Text content of this chunk */
  text: string;

  /** Whether this is the final chunk */
  isFinal: boolean;
}

/**
 * Answer event - emitted when answer text is available
 * May be streamed in chunks or sent as complete answer
 */
export interface AnswerEvent extends BaseStreamEvent {
  type: 'answer';
  data: AnswerChunk;
}

// ============================================================================
// Multi-Turn Memory Timeline Pattern Events
// ============================================================================

/**
 * Memory operation types
 */
export type MemoryOperation = 'create' | 'update' | 'prune' | 'recall';

/**
 * Memory entry - represents a single memory in the timeline
 */
export interface MemoryEntry {
  /** Unique identifier for this memory */
  id: string;

  /** Type of memory operation */
  operation: MemoryOperation;

  /** Content/description of the memory */
  content: string;

  /** Importance score (0.0 to 1.0) - used for pruning */
  importance: number;

  /** Turn number when memory was created */
  turn: number;

  /** Optional tags for categorization */
  tags?: string[];

  /** Timestamp when memory was created */
  timestamp: number;
}

/**
 * Memory event - emitted when memory operations occur
 */
export interface MemoryEvent extends BaseStreamEvent {
  type: 'memory';
  data: MemoryEntry;
}

// ============================================================================
// Agent Await Prompt Pattern Events
// ============================================================================

/**
 * Input request - specifies what input is needed from user
 */
export interface InputRequest {
  /** Unique ID for this input request */
  requestId: string;

  /** Prompt/question to show user */
  prompt: string;

  /** Type of input expected */
  inputType: 'text' | 'select' | 'multiselect' | 'number';

  /** Optional validation requirements */
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };

  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * Await input event - emitted when agent needs user input
 */
export interface AwaitInputEvent extends BaseStreamEvent {
  type: 'await_input';
  data: InputRequest;
}

/**
 * Input submission - user's response to input request
 */
export interface InputSubmission {
  /** ID of the request being answered */
  requestId: string;

  /** User's input value */
  value: string | string[] | number;

  /** Timestamp of submission */
  submittedAt: number;
}

/**
 * Input submission event - emitted when user submits input
 */
export interface InputSubmissionEvent extends BaseStreamEvent {
  type: 'input_submission';
  data: InputSubmission;
}

// ============================================================================
// Streaming Validation Loop Pattern Events
// ============================================================================

/**
 * Checkpoint status
 */
export type CheckpointStatus = 'pending' | 'validating' | 'passed' | 'failed';

/**
 * Checkpoint - represents a validation point in the stream
 */
export interface Checkpoint {
  /** Unique ID for this checkpoint */
  id: string;

  /** Name/description of checkpoint */
  name: string;

  /** Current status */
  status: CheckpointStatus;

  /** Validation criteria description */
  criteria: string;

  /** Optional error message if validation failed */
  error?: string;

  /** Timestamp when checkpoint was created */
  timestamp: number;
}

/**
 * Checkpoint event - emitted when checkpoint is reached
 */
export interface CheckpointEvent extends BaseStreamEvent {
  type: 'checkpoint';
  data: Checkpoint;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** ID of checkpoint being validated */
  checkpointId: string;

  /** Whether validation passed */
  passed: boolean;

  /** Human-readable message */
  message: string;

  /** Optional suggestions for fixing failures */
  suggestions?: string[];

  /** Timestamp of validation */
  timestamp: number;
}

/**
 * Validation event - emitted when validation completes
 */
export interface ValidationEvent extends BaseStreamEvent {
  type: 'validation';
  data: ValidationResult;
}

// ============================================================================
// Tabular Stream View Pattern Events
// ============================================================================

/**
 * Column definition for table schema
 */
export interface ColumnDefinition {
  /** Column identifier */
  id: string;

  /** Display name */
  name: string;

  /** Data type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';

  /** Optional format hint */
  format?: string;

  /** Whether column is required */
  required?: boolean;
}

/**
 * Table schema - defines structure of tabular data
 */
export interface TableSchema {
  /** Schema identifier */
  id: string;

  /** Table name */
  name: string;

  /** Column definitions */
  columns: ColumnDefinition[];

  /** Optional description */
  description?: string;
}

/**
 * Schema event - emitted when table schema is defined
 */
export interface SchemaEvent extends BaseStreamEvent {
  type: 'schema';
  data: TableSchema;
}

/**
 * Table row data
 */
export interface TableRow {
  /** Row identifier */
  id: string;

  /** Row data matching schema columns */
  data: Record<string, unknown>;

  /** Row sequence number */
  rowNumber: number;

  /** Timestamp when row was created */
  timestamp: number;
}

/**
 * Row event - emitted when new table row is available
 */
export interface RowEvent extends BaseStreamEvent {
  type: 'table_row';
  data: TableRow;
}

/**
 * Table metadata
 */
export interface TableMetadata {
  /** Total rows expected (if known) */
  totalRows?: number;

  /** Current progress (0.0 to 1.0) */
  progress?: number;

  /** Whether stream is complete */
  isComplete: boolean;

  /** Optional status message */
  statusMessage?: string;
}

/**
 * Metadata event - emitted for table-level metadata updates
 */
export interface MetaEvent extends BaseStreamEvent {
  type: 'table_meta';
  data: TableMetadata;
}

// ============================================================================
// Turn-Taking Co-Creation Pattern Events
// ============================================================================

/**
 * JSON Patch operation (RFC 6902)
 */
export interface PatchOperation {
  /** Operation type */
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

  /** JSON Pointer to target location */
  path: string;

  /** Value for add/replace operations */
  value?: unknown;

  /** Source path for move/copy operations */
  from?: string;
}

/**
 * Agent-generated patch
 */
export interface AgentPatch {
  /** Patch identifier */
  id: string;

  /** Array of patch operations */
  operations: PatchOperation[];

  /** Optional explanation of changes */
  explanation?: string;

  /** Timestamp when patch was created */
  timestamp: number;
}

/**
 * Agent patch event - emitted when agent proposes changes
 */
export interface AgentPatchEvent extends BaseStreamEvent {
  type: 'agent_patch';
  data: AgentPatch;
}

/**
 * User-generated patch
 */
export interface UserPatch {
  /** Patch identifier */
  id: string;

  /** Array of patch operations */
  operations: PatchOperation[];

  /** Timestamp when patch was created */
  timestamp: number;
}

/**
 * User patch event - emitted when user makes changes
 */
export interface UserPatchEvent extends BaseStreamEvent {
  type: 'user_patch';
  data: UserPatch;
}

// ============================================================================
// Schema-Governed Exchange Pattern Events
// ============================================================================

/**
 * JSON Schema for payload validation
 */
export interface JsonSchema {
  /** Schema identifier */
  $id?: string;

  /** Schema version */
  $schema?: string;

  /** Schema type */
  type: string;

  /** Schema properties (for objects) */
  properties?: Record<string, unknown>;

  /** Required properties */
  required?: string[];

  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Schema definition event - emitted when schema is established
 */
export interface SchemaDefinitionEvent extends BaseStreamEvent {
  type: 'schema_definition';
  data: {
    schema: JsonSchema;
    description?: string;
  };
}

/**
 * Payload data conforming to schema
 */
export interface PayloadData {
  /** Payload identifier */
  id: string;

  /** The actual payload data */
  payload: Record<string, unknown>;

  /** Schema ID this payload conforms to */
  schemaId?: string;

  /** Timestamp when payload was created */
  timestamp: number;
}

/**
 * Payload event - emitted when schema-conformant data is available
 */
export interface PayloadEvent extends BaseStreamEvent {
  type: 'payload';
  data: PayloadData;
}

/**
 * Schema validation error
 */
export interface SchemaError {
  /** Error identifier */
  id: string;

  /** Path to invalid field (JSON Pointer) */
  path: string;

  /** Error message */
  message: string;

  /** Expected value/format */
  expected?: string;

  /** Actual value received */
  actual?: unknown;

  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Schema error event - emitted when payload fails validation
 */
export interface SchemaErrorEvent extends BaseStreamEvent {
  type: 'schema_error';
  data: SchemaError;
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union type of all possible stream events
 * This is the primary type used throughout the application
 */
export type StreamEvent =
  | ReasoningEvent
  | AnswerEvent
  | MemoryEvent
  | AwaitInputEvent
  | InputSubmissionEvent
  | CheckpointEvent
  | ValidationEvent
  | SchemaEvent
  | RowEvent
  | MetaEvent
  | AgentPatchEvent
  | UserPatchEvent
  | SchemaDefinitionEvent
  | PayloadEvent
  | SchemaErrorEvent;

/**
 * Event type discriminator
 */
export type EventType = StreamEvent['type'];

/**
 * Helper type to extract data type from event type
 */
export type EventData<T extends EventType> = Extract<StreamEvent, { type: T }>['data'];
