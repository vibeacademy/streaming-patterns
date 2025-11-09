/**
 * Tests for Event Schema Validation Utilities
 *
 * @module lib/streaming/eventSchema.test
 */

import { describe, it, expect } from 'vitest';
import {
  isStreamEvent,
  isReasoningEvent,
  isAnswerEvent,
  isMemoryEvent,
  isAwaitInputEvent,
  isCheckpointEvent,
  isValidationEvent,
  isSchemaEvent,
  isRowEvent,
  isMetaEvent,
  isAgentPatchEvent,
  isUserPatchEvent,
  isSchemaDefinitionEvent,
  isPayloadEvent,
  isSchemaErrorEvent,
  isEventOfType,
  validateEvent,
  assertValidEvent,
} from './eventSchema';
import type {
  ReasoningEvent,
  AnswerEvent,
  MemoryEvent,
  AwaitInputEvent,
  CheckpointEvent,
  ValidationEvent,
  EventType,
} from '../../types/events';

describe('eventSchema', () => {
  // ============================================================================
  // Base Event Validation
  // ============================================================================

  describe('Base event validation', () => {
    it('should reject non-objects', () => {
      expect(isStreamEvent(null)).toBe(false);
      expect(isStreamEvent(undefined)).toBe(false);
      expect(isStreamEvent('string')).toBe(false);
      expect(isStreamEvent(123)).toBe(false);
      expect(isStreamEvent([])).toBe(false);
    });

    it('should reject objects without required base fields', () => {
      expect(isStreamEvent({})).toBe(false);
      expect(isStreamEvent({ id: 'test' })).toBe(false);
      expect(isStreamEvent({ id: 'test', timestamp: Date.now() })).toBe(false);
      expect(isStreamEvent({ id: 'test', timestamp: Date.now(), type: 'unknown' })).toBe(false);
    });

    it('should reject invalid timestamps', () => {
      expect(
        isStreamEvent({
          id: 'test',
          timestamp: -1,
          type: 'reasoning',
          data: {},
        })
      ).toBe(false);
      expect(
        isStreamEvent({
          id: 'test',
          timestamp: 0,
          type: 'reasoning',
          data: {},
        })
      ).toBe(false);
      expect(
        isStreamEvent({
          id: 'test',
          timestamp: Infinity,
          type: 'reasoning',
          data: {},
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // ReasoningEvent
  // ============================================================================

  describe('isReasoningEvent', () => {
    it('should validate valid reasoning events', () => {
      const validEvent: ReasoningEvent = {
        id: 'evt-1',
        type: 'reasoning',
        timestamp: Date.now(),
        data: {
          id: 'step-1',
          summary: 'Analyzing backlog priorities',
          confidence: 0.9,
          timestamp: Date.now(),
        },
      };

      expect(isReasoningEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate reasoning events with optional details', () => {
      const validEvent: ReasoningEvent = {
        id: 'evt-1',
        type: 'reasoning',
        timestamp: Date.now(),
        data: {
          id: 'step-1',
          summary: 'Analyzing backlog priorities',
          confidence: 0.9,
          details: 'Detailed explanation...',
          timestamp: Date.now(),
        },
      };

      expect(isReasoningEvent(validEvent)).toBe(true);
    });

    it('should reject reasoning events with invalid confidence', () => {
      expect(
        isReasoningEvent({
          id: 'evt-1',
          type: 'reasoning',
          timestamp: Date.now(),
          data: {
            id: 'step-1',
            summary: 'Test',
            confidence: 1.5, // Invalid: > 1
            timestamp: Date.now(),
          },
        })
      ).toBe(false);

      expect(
        isReasoningEvent({
          id: 'evt-1',
          type: 'reasoning',
          timestamp: Date.now(),
          data: {
            id: 'step-1',
            summary: 'Test',
            confidence: -0.1, // Invalid: < 0
            timestamp: Date.now(),
          },
        })
      ).toBe(false);
    });

    it('should reject reasoning events with missing fields', () => {
      expect(
        isReasoningEvent({
          id: 'evt-1',
          type: 'reasoning',
          timestamp: Date.now(),
          data: {
            id: 'step-1',
            summary: 'Test',
            // Missing confidence
            timestamp: Date.now(),
          },
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // AnswerEvent
  // ============================================================================

  describe('isAnswerEvent', () => {
    it('should validate valid answer events', () => {
      const validEvent: AnswerEvent = {
        id: 'evt-2',
        type: 'answer',
        timestamp: Date.now(),
        data: {
          text: 'Sprint Plan:\n\n1. Task A\n2. Task B',
          isFinal: true,
        },
      };

      expect(isAnswerEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate partial answer chunks', () => {
      const validEvent: AnswerEvent = {
        id: 'evt-2',
        type: 'answer',
        timestamp: Date.now(),
        data: {
          text: 'Sprint Plan:',
          isFinal: false,
        },
      };

      expect(isAnswerEvent(validEvent)).toBe(true);
    });

    it('should reject answer events with invalid isFinal', () => {
      expect(
        isAnswerEvent({
          id: 'evt-2',
          type: 'answer',
          timestamp: Date.now(),
          data: {
            text: 'Test',
            isFinal: 'yes', // Should be boolean
          },
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // MemoryEvent
  // ============================================================================

  describe('isMemoryEvent', () => {
    it('should validate valid memory events', () => {
      const validEvent: MemoryEvent = {
        id: 'evt-3',
        type: 'memory',
        timestamp: Date.now(),
        data: {
          id: 'mem-1',
          operation: 'create',
          content: 'User prefers afternoon meetings',
          importance: 0.8,
          turn: 1,
          timestamp: Date.now(),
        },
      };

      expect(isMemoryEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate all memory operations', () => {
      const operations = ['create', 'update', 'prune', 'recall'];

      operations.forEach((op) => {
        expect(
          isMemoryEvent({
            id: 'evt-3',
            type: 'memory',
            timestamp: Date.now(),
            data: {
              id: 'mem-1',
              operation: op,
              content: 'Test',
              importance: 0.5,
              turn: 1,
              timestamp: Date.now(),
            },
          })
        ).toBe(true);
      });
    });

    it('should reject invalid memory operations', () => {
      expect(
        isMemoryEvent({
          id: 'evt-3',
          type: 'memory',
          timestamp: Date.now(),
          data: {
            id: 'mem-1',
            operation: 'invalid_op',
            content: 'Test',
            importance: 0.5,
            turn: 1,
            timestamp: Date.now(),
          },
        })
      ).toBe(false);
    });

    it('should validate memory events with optional tags', () => {
      expect(
        isMemoryEvent({
          id: 'evt-3',
          type: 'memory',
          timestamp: Date.now(),
          data: {
            id: 'mem-1',
            operation: 'create',
            content: 'Test',
            importance: 0.5,
            turn: 1,
            tags: ['preference', 'scheduling'],
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });
  });

  // ============================================================================
  // AwaitInputEvent
  // ============================================================================

  describe('isAwaitInputEvent', () => {
    it('should validate valid await input events', () => {
      const validEvent: AwaitInputEvent = {
        id: 'evt-4',
        type: 'await_input',
        timestamp: Date.now(),
        data: {
          requestId: 'req-1',
          prompt: 'What is your team velocity?',
          inputType: 'number',
        },
      };

      expect(isAwaitInputEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate all input types', () => {
      const inputTypes = ['text', 'select', 'multiselect', 'number'];

      inputTypes.forEach((inputType) => {
        expect(
          isAwaitInputEvent({
            id: 'evt-4',
            type: 'await_input',
            timestamp: Date.now(),
            data: {
              requestId: 'req-1',
              prompt: 'Test?',
              inputType,
            },
          })
        ).toBe(true);
      });
    });

    it('should reject invalid input types', () => {
      expect(
        isAwaitInputEvent({
          id: 'evt-4',
          type: 'await_input',
          timestamp: Date.now(),
          data: {
            requestId: 'req-1',
            prompt: 'Test?',
            inputType: 'invalid',
          },
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // CheckpointEvent
  // ============================================================================

  describe('isCheckpointEvent', () => {
    it('should validate valid checkpoint events', () => {
      const validEvent: CheckpointEvent = {
        id: 'evt-5',
        type: 'checkpoint',
        timestamp: Date.now(),
        data: {
          id: 'chk-1',
          name: 'Capacity Check',
          status: 'pending',
          criteria: 'Verify team capacity is sufficient',
          timestamp: Date.now(),
        },
      };

      expect(isCheckpointEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate all checkpoint statuses', () => {
      const statuses = ['pending', 'validating', 'passed', 'failed'];

      statuses.forEach((status) => {
        expect(
          isCheckpointEvent({
            id: 'evt-5',
            type: 'checkpoint',
            timestamp: Date.now(),
            data: {
              id: 'chk-1',
              name: 'Test',
              status,
              criteria: 'Test criteria',
              timestamp: Date.now(),
            },
          })
        ).toBe(true);
      });
    });

    it('should reject invalid checkpoint statuses', () => {
      expect(
        isCheckpointEvent({
          id: 'evt-5',
          type: 'checkpoint',
          timestamp: Date.now(),
          data: {
            id: 'chk-1',
            name: 'Test',
            status: 'invalid',
            criteria: 'Test',
            timestamp: Date.now(),
          },
        })
      ).toBe(false);
    });
  });

  // ============================================================================
  // ValidationEvent
  // ============================================================================

  describe('isValidationEvent', () => {
    it('should validate valid validation events', () => {
      const validEvent: ValidationEvent = {
        id: 'evt-6',
        type: 'validation',
        timestamp: Date.now(),
        data: {
          checkpointId: 'chk-1',
          passed: true,
          message: 'Capacity check passed',
          timestamp: Date.now(),
        },
      };

      expect(isValidationEvent(validEvent)).toBe(true);
      expect(isStreamEvent(validEvent)).toBe(true);
    });

    it('should validate failed validations', () => {
      expect(
        isValidationEvent({
          id: 'evt-6',
          type: 'validation',
          timestamp: Date.now(),
          data: {
            checkpointId: 'chk-1',
            passed: false,
            message: 'Capacity check failed',
            suggestions: ['Reduce scope', 'Add team members'],
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });
  });

  // ============================================================================
  // isEventOfType
  // ============================================================================

  describe('isEventOfType', () => {
    it('should validate events by type string', () => {
      const reasoningEvent: ReasoningEvent = {
        id: 'evt-1',
        type: 'reasoning',
        timestamp: Date.now(),
        data: {
          id: 'step-1',
          summary: 'Test',
          confidence: 0.9,
          timestamp: Date.now(),
        },
      };

      expect(isEventOfType(reasoningEvent, 'reasoning')).toBe(true);
      expect(isEventOfType(reasoningEvent, 'answer')).toBe(false);
      expect(isEventOfType(reasoningEvent, 'memory')).toBe(false);
    });

    it('should work with all event types', () => {
      const types = [
        'reasoning',
        'answer',
        'memory',
        'await_input',
        'input_submission',
        'checkpoint',
        'validation',
        'schema',
        'table_row',
        'table_meta',
        'agent_patch',
        'user_patch',
        'schema_definition',
        'payload',
        'schema_error',
      ];

      types.forEach((type) => {
        const result = isEventOfType({ type }, type as EventType);
        // Will be false because data is missing, but shouldn't throw
        expect(typeof result).toBe('boolean');
      });
    });
  });

  // ============================================================================
  // validateEvent
  // ============================================================================

  describe('validateEvent', () => {
    it('should return validation errors for invalid events', () => {
      const result = validateEvent({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
      expect(result.errors.some((e) => e.field === 'timestamp')).toBe(true);
    });

    it('should return no errors for valid events', () => {
      const validEvent: ReasoningEvent = {
        id: 'evt-1',
        type: 'reasoning',
        timestamp: Date.now(),
        data: {
          id: 'step-1',
          summary: 'Test',
          confidence: 0.9,
          timestamp: Date.now(),
        },
      };

      const result = validateEvent(validEvent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide detailed error information', () => {
      const result = validateEvent({
        id: '',
        timestamp: -1,
        type: 'reasoning',
      });

      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach((error) => {
        expect(error.field).toBeDefined();
        expect(error.reason).toBeDefined();
      });
    });
  });

  // ============================================================================
  // assertValidEvent
  // ============================================================================

  describe('assertValidEvent', () => {
    it('should not throw for valid events', () => {
      const validEvent: ReasoningEvent = {
        id: 'evt-1',
        type: 'reasoning',
        timestamp: Date.now(),
        data: {
          id: 'step-1',
          summary: 'Test',
          confidence: 0.9,
          timestamp: Date.now(),
        },
      };

      expect(() => assertValidEvent(validEvent)).not.toThrow();
    });

    it('should throw for invalid events', () => {
      expect(() => assertValidEvent({})).toThrow(/Invalid stream event/);
      expect(() => assertValidEvent(null)).toThrow(/Invalid stream event/);
      expect(() =>
        assertValidEvent({
          id: 'test',
          timestamp: -1,
          type: 'unknown',
        })
      ).toThrow(/Invalid stream event/);
    });

    it('should include error details in thrown message', () => {
      try {
        assertValidEvent({});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid stream event');
        expect((error as Error).message).toContain('id');
        expect((error as Error).message).toContain('timestamp');
      }
    });
  });

  // ============================================================================
  // Additional Event Types (spot checks)
  // ============================================================================

  describe('Additional event type guards', () => {
    it('should validate SchemaEvent', () => {
      expect(
        isSchemaEvent({
          id: 'evt-7',
          type: 'schema',
          timestamp: Date.now(),
          data: {
            id: 'schema-1',
            name: 'Tasks',
            columns: [
              { id: 'title', name: 'Title', type: 'string', required: true },
              { id: 'points', name: 'Story Points', type: 'number' },
            ],
          },
        })
      ).toBe(true);
    });

    it('should validate RowEvent', () => {
      expect(
        isRowEvent({
          id: 'evt-8',
          type: 'table_row',
          timestamp: Date.now(),
          data: {
            id: 'row-1',
            data: { title: 'Implement feature', points: 5 },
            rowNumber: 1,
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });

    it('should validate MetaEvent', () => {
      expect(
        isMetaEvent({
          id: 'evt-9',
          type: 'table_meta',
          timestamp: Date.now(),
          data: {
            totalRows: 10,
            progress: 0.5,
            isComplete: false,
          },
        })
      ).toBe(true);
    });

    it('should validate AgentPatchEvent', () => {
      expect(
        isAgentPatchEvent({
          id: 'evt-10',
          type: 'agent_patch',
          timestamp: Date.now(),
          data: {
            id: 'patch-1',
            operations: [{ op: 'add', path: '/tasks/-', value: { title: 'New task' } }],
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });

    it('should validate UserPatchEvent', () => {
      expect(
        isUserPatchEvent({
          id: 'evt-11',
          type: 'user_patch',
          timestamp: Date.now(),
          data: {
            id: 'patch-2',
            operations: [{ op: 'replace', path: '/tasks/0/status', value: 'done' }],
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });

    it('should validate SchemaDefinitionEvent', () => {
      expect(
        isSchemaDefinitionEvent({
          id: 'evt-12',
          type: 'schema_definition',
          timestamp: Date.now(),
          data: {
            schema: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
        })
      ).toBe(true);
    });

    it('should validate PayloadEvent', () => {
      expect(
        isPayloadEvent({
          id: 'evt-13',
          type: 'payload',
          timestamp: Date.now(),
          data: {
            id: 'payload-1',
            payload: { name: 'Test Project' },
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });

    it('should validate SchemaErrorEvent', () => {
      expect(
        isSchemaErrorEvent({
          id: 'evt-14',
          type: 'schema_error',
          timestamp: Date.now(),
          data: {
            id: 'error-1',
            path: '/name',
            message: 'Missing required field',
            expected: 'string',
            timestamp: Date.now(),
          },
        })
      ).toBe(true);
    });
  });
});
