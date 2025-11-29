/**
 * TypeScript type definitions for Schema-Governed Exchange pattern
 *
 * This pattern demonstrates real-time schema validation of streaming JSON payloads,
 * providing immediate feedback on type errors, missing fields, and validation constraints.
 */

import type { z } from 'zod';

/**
 * Severity levels for validation errors
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Overall validation status
 */
export type ValidationStatus = 'valid' | 'partial' | 'invalid' | 'pending';

/**
 * Schema definition event - sent at stream start to establish contract
 */
export interface SchemaEvent {
  type: 'schema';
  data: {
    schemaId: string;
    version: string;
    description?: string;
    schema: Record<string, unknown>; // JSON Schema representation
  };
}

/**
 * Payload chunk event - progressive JSON streaming
 */
export interface PayloadEvent {
  type: 'payload';
  data: {
    chunk: Record<string, unknown>; // Partial or complete payload
    complete: boolean; // true when payload is fully streamed
    chunkIndex: number; // sequence number for chunk ordering
  };
}

/**
 * Schema validation error event
 */
export interface SchemaErrorEvent {
  type: 'schema_error';
  data: {
    field: string; // JSON path to the problematic field (e.g., "budget", "teamIds[0]")
    error: string; // Human-readable error message
    suggestion?: string; // Auto-suggested fix (e.g., "Convert '25k' to 25000")
    severity: ValidationSeverity;
    code?: string; // Error code for programmatic handling
  };
}

/**
 * Union type for all stream events in this pattern
 */
export type SchemaStreamEvent = SchemaEvent | PayloadEvent | SchemaErrorEvent;

/**
 * Project setup payload structure (StreamFlow PM domain)
 */
export interface ProjectSetupPayload {
  projectName: string;
  description?: string;
  budget: number;
  teamIds: string[];
  deadline?: string; // ISO date string
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deliverables?: string[];
  tags?: string[];
  owner?: {
    userId: string;
    email: string;
  };
}

/**
 * Schema definition metadata
 */
export interface SchemaDefinition {
  schemaId: string;
  version: string;
  description: string;
  schema: z.ZodSchema; // Zod schema for runtime validation
  examples?: Record<string, unknown>[]; // Example valid payloads
}

/**
 * Validation result from Zod
 */
export interface ValidationResult {
  status: ValidationStatus;
  errors: ValidationError[];
  data?: Record<string, unknown>; // Validated data if successful
  partial?: boolean; // true if validating incomplete data
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string; // JSON path to field
  message: string; // Error message
  severity: ValidationSeverity;
  suggestion?: string; // Auto-generated fix suggestion
  code?: string; // Error code
}

/**
 * Auto-generated patch suggestion
 */
export interface PatchSuggestion {
  field: string;
  currentValue: unknown;
  suggestedValue: unknown;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Schema HUD display state
 */
export interface SchemaHUDState {
  visible: boolean;
  collapsed: boolean;
  highlightField?: string; // Field to highlight (when error occurs)
}

/**
 * Network capture event for inspector
 */
export interface NetworkEvent {
  id: string;
  timestamp: number;
  type: SchemaStreamEvent['type'];
  data: unknown;
  direction: 'inbound' | 'outbound';
}
