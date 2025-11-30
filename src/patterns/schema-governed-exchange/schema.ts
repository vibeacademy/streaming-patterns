/**
 * Zod schema definitions for Schema-Governed Exchange pattern
 *
 * Demonstrates runtime validation of streaming JSON payloads using Zod.
 * These schemas validate StreamFlow PM project setup data.
 */

import { z } from 'zod';
import type { SchemaDefinition } from './types';

/**
 * User/Owner schema
 */
const ownerSchema = z.object({
  userId: z.string().uuid('Owner userId must be a valid UUID'),
  email: z.string().email('Owner email must be a valid email address'),
});

/**
 * Project priority levels
 */
const prioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Full project setup schema (StreamFlow PM)
 *
 * This schema validates the complete structure of a project setup payload,
 * including required fields, types, and business constraints.
 */
export const projectSetupSchema = z.object({
  projectName: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .trim(),

  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),

  budget: z
    .number()
    .min(1000, 'Budget must be at least $1,000')
    .max(10000000, 'Budget must not exceed $10,000,000')
    .finite('Budget must be a finite number'),

  teamIds: z
    .array(z.string().uuid('Team ID must be a valid UUID'))
    .min(1, 'At least one team must be assigned')
    .max(10, 'Cannot assign more than 10 teams'),

  deadline: z
    .string()
    .datetime('Deadline must be a valid ISO date string')
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const deadlineDate = new Date(date);
        const now = new Date();
        return deadlineDate > now;
      },
      { message: 'Deadline must be in the future' }
    ),

  priority: prioritySchema.optional().default('medium'),

  deliverables: z
    .array(z.string().min(1, 'Deliverable description cannot be empty'))
    .max(20, 'Cannot have more than 20 deliverables')
    .optional(),

  tags: z
    .array(z.string().min(1).max(30))
    .max(10, 'Cannot have more than 10 tags')
    .optional(),

  owner: ownerSchema.optional(),
});

/**
 * Partial schema for progressive validation
 *
 * This allows validation of incomplete payloads as they stream in.
 * All fields are optional to support partial validation.
 */
export const partialProjectSetupSchema = projectSetupSchema.partial();

/**
 * Schema definition with metadata for UI display
 */
export const projectSetupSchemaDefinition: SchemaDefinition = {
  schemaId: 'project-setup-v1',
  version: '1.0.0',
  description: 'StreamFlow PM project setup schema with validation constraints',
  schema: projectSetupSchema,
  examples: [
    {
      projectName: 'Mobile App Redesign',
      description: 'Redesign mobile app for better UX',
      budget: 50000,
      teamIds: ['550e8400-e29b-41d4-a716-446655440001'],
      deadline: '2027-12-31T23:59:59Z',
      priority: 'high',
      deliverables: ['UI Mockups', 'Prototype', 'Production Release'],
      tags: ['mobile', 'ux', 'redesign'],
    },
    {
      projectName: 'API Integration',
      budget: 25000,
      teamIds: [
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ],
      priority: 'medium',
    },
  ],
};

/**
 * Validation helper: Convert Zod errors to friendly messages with suggestions
 */
export function formatZodError(error: z.ZodIssue): {
  field: string;
  message: string;
  suggestion?: string;
} {
  const field = error.path.join('.');

  // Auto-generate suggestions for common errors
  let suggestion: string | undefined;

  if (error.code === 'invalid_type') {
    const expected = error.expected;

    if (expected === 'number') {
      suggestion = 'Expected a number value';
    }

    if (expected === 'array') {
      suggestion = 'Wrap value in array: [value]';
    }
  }

  if (error.code === 'too_small') {
    if ('minimum' in error) {
      const min = error.minimum as number;
      suggestion = `Must be at least ${min}`;
    }
  }

  if (error.code === 'too_big') {
    if ('maximum' in error) {
      const max = error.maximum as number;
      suggestion = `Must be no more than ${max}`;
    }
  }

  // Handle string validation errors
  if (error.message.includes('email')) {
    suggestion = 'Use format: user@example.com';
  }

  if (error.message.includes('UUID') || error.message.includes('uuid')) {
    suggestion = 'Use format: 550e8400-e29b-41d4-a716-446655440000';
  }

  return {
    field,
    message: error.message,
    suggestion,
  };
}

/**
 * JSON Schema representation for Schema HUD display
 *
 * This converts Zod schema to a JSON Schema-like structure
 * for UI visualization purposes.
 */
export const projectSetupJsonSchema = {
  type: 'object',
  properties: {
    projectName: {
      type: 'string',
      description: 'Project name (3-100 characters)',
      minLength: 3,
      maxLength: 100,
      example: 'Mobile App Redesign',
    },
    description: {
      type: 'string',
      description: 'Optional project description (max 500 characters)',
      maxLength: 500,
      example: 'Redesign mobile app for better UX',
    },
    budget: {
      type: 'number',
      description: 'Project budget in USD ($1,000 - $10,000,000)',
      minimum: 1000,
      maximum: 10000000,
      example: 50000,
    },
    teamIds: {
      type: 'array',
      description: 'Array of team UUIDs (1-10 teams)',
      items: {
        type: 'string',
        format: 'uuid',
      },
      minItems: 1,
      maxItems: 10,
      example: ['550e8400-e29b-41d4-a716-446655440001'],
    },
    deadline: {
      type: 'string',
      format: 'date-time',
      description: 'Optional project deadline (ISO 8601, must be in future)',
      example: '2027-12-31T23:59:59Z',
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'critical'],
      description: 'Project priority level',
      default: 'medium',
    },
    deliverables: {
      type: 'array',
      description: 'Optional list of deliverables (max 20)',
      items: {
        type: 'string',
      },
      maxItems: 20,
      example: ['UI Mockups', 'Prototype', 'Production Release'],
    },
    tags: {
      type: 'array',
      description: 'Optional project tags (max 10, each tag max 30 chars)',
      items: {
        type: 'string',
        maxLength: 30,
      },
      maxItems: 10,
      example: ['mobile', 'ux', 'redesign'],
    },
    owner: {
      type: 'object',
      description: 'Optional project owner',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'owner@streamflow.pm',
        },
      },
    },
  },
  required: ['projectName', 'budget', 'teamIds'],
};
