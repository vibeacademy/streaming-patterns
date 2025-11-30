/**
 * React hooks for Schema-Governed Exchange pattern
 *
 * Provides hooks for schema validation, stream processing, and UI state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  SchemaStreamEvent,
  ValidationResult,
  ValidationError,
  ValidationStatus,
  SchemaErrorEvent,
  SchemaHUDState,
} from './types';
import { createMockSchemaStream, type MockStreamOptions } from './mockStream';
import { partialProjectSetupSchema, formatZodError } from './schema';

/**
 * Hook for processing schema validation streams
 *
 * Manages stream lifecycle, progressive validation, and error tracking.
 */
export function useSchemaValidation(options: MockStreamOptions = {}) {
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    status: 'pending',
    errors: [],
  });
  const [streamErrors, setStreamErrors] = useState<ValidationError[]>([]);

  // Track stream abort controller
  // eslint-disable-next-line no-undef
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Start the validation stream
   */
  const startStream = useCallback(() => {
    // Reset state
    setSchema(null);
    setPayload({});
    setIsComplete(false);
    setValidationResult({ status: 'pending', errors: [] });
    setStreamErrors([]);
    setIsStreaming(true);

    // Create new abort controller
    // eslint-disable-next-line no-undef
    abortControllerRef.current = new AbortController();

    // Start async stream processing
    (async () => {
      try {
        const stream = createMockSchemaStream(options);

        for await (const event of stream) {
          // Check if stream was aborted
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          processEvent(event);
        }

        setIsStreaming(false);
      } catch (error) {
        console.error('Stream error:', error);
        setIsStreaming(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  /**
   * Stop the stream
   */
  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    stopStream();
    setSchema(null);
    setPayload({});
    setIsComplete(false);
    setValidationResult({ status: 'pending', errors: [] });
    setStreamErrors([]);
  }, [stopStream]);

  /**
   * Process individual stream events
   */
  const processEvent = useCallback((event: SchemaStreamEvent) => {
    switch (event.type) {
      case 'schema':
        setSchema(event.data.schema);
        break;

      case 'payload':
        setPayload(event.data.chunk);
        setIsComplete(event.data.complete);
        // Validate payload after update
        validatePayload(event.data.chunk, event.data.complete);
        break;

      case 'schema_error':
        handleSchemaError(event);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Validate payload using Zod schema
   */
  const validatePayload = useCallback((
    data: Record<string, unknown>,
    complete: boolean
  ) => {
    try {
      // Use partial schema for incomplete payloads
      const result = partialProjectSetupSchema.safeParse(data);

      if (result.success) {
        // Check if all required fields are present
        const hasRequiredFields = 'projectName' in data && 'budget' in data && 'teamIds' in data;
        const status: ValidationStatus = complete && hasRequiredFields ? 'valid' : 'partial';

        setValidationResult({
          status,
          errors: [],
          data: result.data,
          partial: !complete,
        });
      } else {
        // Convert Zod errors to our format
        const errors: ValidationError[] = result.error.issues.map((issue) => {
          const formatted = formatZodError(issue);
          return {
            field: formatted.field,
            message: formatted.message,
            severity: 'error',
            suggestion: formatted.suggestion,
            code: issue.code,
          };
        });

        setValidationResult({
          status: 'invalid',
          errors,
          partial: !complete,
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        status: 'invalid',
        errors: [{
          field: '__root__',
          message: 'Validation failed',
          severity: 'error',
        }],
      });
    }
  }, []);

  /**
   * Handle schema error events from stream
   */
  const handleSchemaError = useCallback((event: SchemaErrorEvent) => {
    const error: ValidationError = {
      field: event.data.field,
      message: event.data.error,
      severity: event.data.severity,
      suggestion: event.data.suggestion,
      code: event.data.code,
    };

    setStreamErrors((prev) => [...prev, error]);
  }, []);

  return {
    // State
    schema,
    payload,
    isComplete,
    isStreaming,
    validationResult,
    streamErrors,

    // Actions
    startStream,
    stopStream,
    reset,
  };
}

/**
 * Hook for managing Schema HUD visibility and state
 */
export function useSchemaHUD() {
  const [state, setState] = useState<SchemaHUDState>({
    visible: true,
    collapsed: false,
  });

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, visible: !prev.visible }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setState((prev) => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const highlightField = useCallback((field?: string) => {
    setState((prev) => ({ ...prev, highlightField: field }));
  }, []);

  return {
    state,
    toggle,
    toggleCollapse,
    highlightField,
  };
}

/**
 * Hook for generating auto-fix suggestions
 */
export function useAutoFixSuggestions(errors: ValidationError[]) {
  const [suggestions, setSuggestions] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const newSuggestions = new Map<string, string>();

    errors.forEach((error) => {
      if (error.suggestion) {
        newSuggestions.set(error.field, error.suggestion);
      }
    });

    setSuggestions(newSuggestions);
  }, [errors]);

  const applySuggestion = useCallback((field: string): string | undefined => {
    return suggestions.get(field);
  }, [suggestions]);

  return {
    suggestions,
    applySuggestion,
    hasSuggestions: suggestions.size > 0,
  };
}

/**
 * Hook for validation status badge
 */
export function useValidationStatus(validationResult: ValidationResult): {
  status: ValidationStatus;
  label: string;
  color: 'green' | 'amber' | 'red' | 'gray';
  description: string;
} {
  const { status, errors } = validationResult;

  switch (status) {
    case 'valid':
      return {
        status: 'valid',
        label: 'Valid',
        color: 'green',
        description: 'All validation checks passed',
      };

    case 'partial':
      return {
        status: 'partial',
        label: 'Partial',
        color: 'amber',
        description: 'Validation in progress (incomplete data)',
      };

    case 'invalid':
      return {
        status: 'invalid',
        label: 'Invalid',
        color: 'red',
        description: `${errors.length} validation error${errors.length === 1 ? '' : 's'}`,
      };

    case 'pending':
    default:
      return {
        status: 'pending',
        label: 'Pending',
        color: 'gray',
        description: 'Waiting for schema and payload',
      };
  }
}
