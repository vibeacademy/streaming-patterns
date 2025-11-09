/**
 * Event Schema Validation Utilities
 *
 * This module provides runtime validation and type guards for stream events.
 * TypeScript's type system provides compile-time safety, but these utilities
 * ensure runtime type safety when processing events from fixtures or external sources.
 *
 * @module lib/streaming/eventSchema
 */

import type {
  StreamEvent,
  EventType,
  BaseStreamEvent,
  ReasoningEvent,
  AnswerEvent,
  MemoryEvent,
  AwaitInputEvent,
  InputSubmissionEvent,
  CheckpointEvent,
  ValidationEvent,
  SchemaEvent,
  RowEvent,
  MetaEvent,
  AgentPatchEvent,
  UserPatchEvent,
  SchemaDefinitionEvent,
  PayloadEvent,
  SchemaErrorEvent,
} from '../../types/events';

// ============================================================================
// Base Validation Helpers
// ============================================================================

/**
 * Check if a value is a valid timestamp
 */
function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/**
 * Check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is a valid confidence score
 */
function isValidConfidence(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

/**
 * Validate base stream event fields
 */
function hasBaseEventFields(obj: unknown): obj is BaseStreamEvent {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const event = obj as Record<string, unknown>;

  return (
    isNonEmptyString(event.id) &&
    isValidTimestamp(event.timestamp) &&
    (event.sessionId === undefined || isNonEmptyString(event.sessionId))
  );
}

// ============================================================================
// Type Guards for Each Event Type
// ============================================================================

/**
 * Type guard for ReasoningEvent
 */
export function isReasoningEvent(event: unknown): event is ReasoningEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'reasoning') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.summary) &&
    isValidConfidence(data.confidence) &&
    isValidTimestamp(data.timestamp) &&
    (data.details === undefined || typeof data.details === 'string')
  );
}

/**
 * Type guard for AnswerEvent
 */
export function isAnswerEvent(event: unknown): event is AnswerEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'answer') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.text === 'string' && typeof data.isFinal === 'boolean';
}

/**
 * Type guard for MemoryEvent
 */
export function isMemoryEvent(event: unknown): event is MemoryEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'memory') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  const validOperations = ['create', 'update', 'prune', 'recall'];

  return (
    isNonEmptyString(data.id) &&
    typeof data.operation === 'string' &&
    validOperations.includes(data.operation) &&
    isNonEmptyString(data.content) &&
    isValidConfidence(data.importance) &&
    typeof data.turn === 'number' &&
    isValidTimestamp(data.timestamp) &&
    (data.tags === undefined || Array.isArray(data.tags))
  );
}

/**
 * Type guard for AwaitInputEvent
 */
export function isAwaitInputEvent(event: unknown): event is AwaitInputEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'await_input') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  const validInputTypes = ['text', 'select', 'multiselect', 'number'];

  return (
    isNonEmptyString(data.requestId) &&
    isNonEmptyString(data.prompt) &&
    typeof data.inputType === 'string' &&
    validInputTypes.includes(data.inputType)
  );
}

/**
 * Type guard for InputSubmissionEvent
 */
export function isInputSubmissionEvent(event: unknown): event is InputSubmissionEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'input_submission') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.requestId) &&
    (typeof data.value === 'string' || typeof data.value === 'number' || Array.isArray(data.value)) &&
    isValidTimestamp(data.submittedAt)
  );
}

/**
 * Type guard for CheckpointEvent
 */
export function isCheckpointEvent(event: unknown): event is CheckpointEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'checkpoint') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  const validStatuses = ['pending', 'validating', 'passed', 'failed'];

  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.name) &&
    typeof data.status === 'string' &&
    validStatuses.includes(data.status) &&
    isNonEmptyString(data.criteria) &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for ValidationEvent
 */
export function isValidationEvent(event: unknown): event is ValidationEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'validation') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.checkpointId) &&
    typeof data.passed === 'boolean' &&
    isNonEmptyString(data.message) &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for SchemaEvent (table schema)
 */
export function isSchemaEvent(event: unknown): event is SchemaEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'schema') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.name) &&
    Array.isArray(data.columns) &&
    data.columns.length > 0
  );
}

/**
 * Type guard for RowEvent
 */
export function isRowEvent(event: unknown): event is RowEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'table_row') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    typeof data.data === 'object' &&
    data.data !== null &&
    typeof data.rowNumber === 'number' &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for MetaEvent
 */
export function isMetaEvent(event: unknown): event is MetaEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'table_meta') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.isComplete === 'boolean';
}

/**
 * Type guard for AgentPatchEvent
 */
export function isAgentPatchEvent(event: unknown): event is AgentPatchEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'agent_patch') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    Array.isArray(data.operations) &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for UserPatchEvent
 */
export function isUserPatchEvent(event: unknown): event is UserPatchEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'user_patch') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    Array.isArray(data.operations) &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for SchemaDefinitionEvent
 */
export function isSchemaDefinitionEvent(event: unknown): event is SchemaDefinitionEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'schema_definition') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return typeof data.schema === 'object' && data.schema !== null;
}

/**
 * Type guard for PayloadEvent
 */
export function isPayloadEvent(event: unknown): event is PayloadEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'payload') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    typeof data.payload === 'object' &&
    data.payload !== null &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * Type guard for SchemaErrorEvent
 */
export function isSchemaErrorEvent(event: unknown): event is SchemaErrorEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  const e = event as unknown as Record<string, unknown>;

  if (e.type !== 'schema_error') {
    return false;
  }

  const data = e.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.path) &&
    isNonEmptyString(data.message) &&
    isValidTimestamp(data.timestamp)
  );
}

/**
 * General type guard for any StreamEvent
 */
export function isStreamEvent(event: unknown): event is StreamEvent {
  if (!hasBaseEventFields(event)) {
    return false;
  }

  // Check if it matches any specific event type
  return (
    isReasoningEvent(event) ||
    isAnswerEvent(event) ||
    isMemoryEvent(event) ||
    isAwaitInputEvent(event) ||
    isInputSubmissionEvent(event) ||
    isCheckpointEvent(event) ||
    isValidationEvent(event) ||
    isSchemaEvent(event) ||
    isRowEvent(event) ||
    isMetaEvent(event) ||
    isAgentPatchEvent(event) ||
    isUserPatchEvent(event) ||
    isSchemaDefinitionEvent(event) ||
    isPayloadEvent(event) ||
    isSchemaErrorEvent(event)
  );
}

// ============================================================================
// Type Guard by Event Type String
// ============================================================================

/**
 * Map of event type strings to their type guards
 */
const TYPE_GUARDS: Record<EventType, (event: unknown) => boolean> = {
  reasoning: isReasoningEvent,
  answer: isAnswerEvent,
  memory: isMemoryEvent,
  await_input: isAwaitInputEvent,
  input_submission: isInputSubmissionEvent,
  checkpoint: isCheckpointEvent,
  validation: isValidationEvent,
  schema: isSchemaEvent,
  table_row: isRowEvent,
  table_meta: isMetaEvent,
  agent_patch: isAgentPatchEvent,
  user_patch: isUserPatchEvent,
  schema_definition: isSchemaDefinitionEvent,
  payload: isPayloadEvent,
  schema_error: isSchemaErrorEvent,
};

/**
 * Validate event by type string
 * @param event - Event to validate
 * @param expectedType - Expected event type
 * @returns True if event matches expected type
 */
export function isEventOfType<T extends EventType>(
  event: unknown,
  expectedType: T
): event is Extract<StreamEvent, { type: T }> {
  const guard = TYPE_GUARDS[expectedType];
  return guard ? guard(event) : false;
}

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Reason for validation failure */
  reason: string;

  /** Expected value or format */
  expected?: string;

  /** Actual value received */
  actual?: unknown;
}

/**
 * Result of event validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Validation errors if any */
  errors: ValidationError[];
}

/**
 * Validate an event and return detailed results
 * @param event - Event to validate
 * @returns Validation result with any errors
 */
export function validateEvent(event: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if it's an object
  if (typeof event !== 'object' || event === null) {
    errors.push({
      field: 'event',
      reason: 'Event must be an object',
      expected: 'object',
      actual: typeof event,
    });
    return { valid: false, errors };
  }

  const e = event as unknown as Record<string, unknown>;

  // Validate base fields
  if (!isNonEmptyString(e.id)) {
    errors.push({
      field: 'id',
      reason: 'Event ID must be a non-empty string',
      expected: 'string',
      actual: e.id,
    });
  }

  if (!isValidTimestamp(e.timestamp)) {
    errors.push({
      field: 'timestamp',
      reason: 'Timestamp must be a positive number',
      expected: 'number > 0',
      actual: e.timestamp,
    });
  }

  if (e.sessionId !== undefined && !isNonEmptyString(e.sessionId)) {
    errors.push({
      field: 'sessionId',
      reason: 'Session ID must be a non-empty string if provided',
      expected: 'string | undefined',
      actual: e.sessionId,
    });
  }

  // Check if type is valid
  if (!isNonEmptyString(e.type)) {
    errors.push({
      field: 'type',
      reason: 'Event type must be a non-empty string',
      expected: 'EventType',
      actual: e.type,
    });
    return { valid: false, errors };
  }

  // Validate type-specific fields
  if (!isStreamEvent(event)) {
    errors.push({
      field: 'data',
      reason: `Event data does not match schema for type: ${e.type}`,
      expected: `Valid ${e.type} event data`,
      actual: e.data,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Assert that an event is valid (throws on invalid)
 * @param event - Event to validate
 * @throws Error if event is invalid
 */
export function assertValidEvent(event: unknown): asserts event is StreamEvent {
  const result = validateEvent(event);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.field}: ${e.reason}`).join(', ');
    throw new Error(`Invalid stream event: ${errorMessages}`);
  }
}
