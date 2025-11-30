/**
 * Mock fixtures for Schema-Governed Exchange pattern
 *
 * Includes both valid and invalid payloads to demonstrate real-time schema validation,
 * error highlighting, and auto-suggestion features.
 */

import type { SchemaStreamEvent, ProjectSetupPayload } from './types';
import { projectSetupJsonSchema } from './schema';

/**
 * Valid project setup payload (demonstrates successful validation)
 */
export const validProjectPayload: ProjectSetupPayload = {
  projectName: 'Mobile App Redesign',
  description: 'Complete redesign of the StreamFlow PM mobile application for improved user experience',
  budget: 75000,
  teamIds: [
    '550e8400-e29b-41d4-a716-446655440001', // Design team
    '550e8400-e29b-41d4-a716-446655440002', // Engineering team
  ],
  deadline: '2026-06-30T23:59:59Z',
  priority: 'high',
  deliverables: [
    'UI/UX Mockups',
    'Interactive Prototype',
    'Design System',
    'Production Release',
  ],
  tags: ['mobile', 'ux', 'redesign', 'priority'],
  owner: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'sarah.chen@streamflow.pm',
  },
};

/**
 * Invalid project payload (demonstrates validation errors and suggestions)
 *
 * Intentional errors:
 * - budget: string "75k" instead of number 75000
 * - teamIds: single string instead of array
 * - deadline: past date
 * - owner.email: invalid email format
 */
export const invalidProjectPayload = {
  projectName: 'AI',  // Too short (min 3 chars)
  description: 'Test',
  budget: '75k',  // Should be number, not string
  teamIds: '550e8400-e29b-41d4-a716-446655440001',  // Should be array
  deadline: '2024-01-01T00:00:00Z',  // Past date
  priority: 'super-high',  // Invalid enum value
  owner: {
    userId: 'not-a-uuid',  // Invalid UUID format
    email: 'invalid-email',  // Invalid email format
  },
};

/**
 * Stream fixture: Successful validation flow
 *
 * Demonstrates progressive validation where payload builds up correctly.
 */
export const successfulValidationStream: SchemaStreamEvent[] = [
  // 1. Schema definition event (sent first)
  {
    type: 'schema',
    data: {
      schemaId: 'project-setup-v1',
      version: '1.0.0',
      description: 'StreamFlow PM project setup schema',
      schema: projectSetupJsonSchema,
    },
  },

  // 2. First chunk: projectName
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'Mobile App Redesign',
      },
      complete: false,
      chunkIndex: 0,
    },
  },

  // 3. Second chunk: add description and budget
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'Mobile App Redesign',
        description: 'Complete redesign of the StreamFlow PM mobile application',
        budget: 75000,
      },
      complete: false,
      chunkIndex: 1,
    },
  },

  // 4. Third chunk: add teamIds (satisfies required fields)
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'Mobile App Redesign',
        description: 'Complete redesign of the StreamFlow PM mobile application',
        budget: 75000,
        teamIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      },
      complete: false,
      chunkIndex: 2,
    },
  },

  // 5. Fourth chunk: add optional fields
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'Mobile App Redesign',
        description: 'Complete redesign of the StreamFlow PM mobile application',
        budget: 75000,
        teamIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
        deadline: '2026-06-30T23:59:59Z',
        priority: 'high',
        deliverables: ['UI/UX Mockups', 'Interactive Prototype'],
      },
      complete: false,
      chunkIndex: 3,
    },
  },

  // 6. Final chunk: complete payload
  {
    type: 'payload',
    data: {
      chunk: validProjectPayload as unknown as Record<string, unknown>,
      complete: true,
      chunkIndex: 4,
    },
  },
];

/**
 * Stream fixture: Validation errors and corrections
 *
 * Demonstrates error detection, highlighting, and auto-suggestions.
 */
export const errorValidationStream: SchemaStreamEvent[] = [
  // 1. Schema definition
  {
    type: 'schema',
    data: {
      schemaId: 'project-setup-v1',
      version: '1.0.0',
      description: 'StreamFlow PM project setup schema',
      schema: projectSetupJsonSchema,
    },
  },

  // 2. First chunk: projectName too short
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',  // Too short
      },
      complete: false,
      chunkIndex: 0,
    },
  },

  // 3. Error event for short project name
  {
    type: 'schema_error',
    data: {
      field: 'projectName',
      error: 'Project name must be at least 3 characters',
      suggestion: 'Add 1 more character',
      severity: 'error',
      code: 'too_small',
    },
  },

  // 4. Second chunk: budget as string instead of number
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',  // Wrong type
      },
      complete: false,
      chunkIndex: 1,
    },
  },

  // 5. Error event for invalid budget type
  {
    type: 'schema_error',
    data: {
      field: 'budget',
      error: 'Expected number, got string',
      suggestion: 'Convert "75k" to 75000',
      severity: 'error',
      code: 'invalid_type',
    },
  },

  // 6. Third chunk: teamIds as string instead of array
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',
        teamIds: '550e8400-e29b-41d4-a716-446655440001',  // Should be array
      },
      complete: false,
      chunkIndex: 2,
    },
  },

  // 7. Error event for teamIds type
  {
    type: 'schema_error',
    data: {
      field: 'teamIds',
      error: 'Expected array, got string',
      suggestion: 'Wrap value in array: ["550e8400-e29b-41d4-a716-446655440001"]',
      severity: 'error',
      code: 'invalid_type',
    },
  },

  // 8. Fourth chunk: deadline in the past
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',
        teamIds: '550e8400-e29b-41d4-a716-446655440001',
        deadline: '2024-01-01T00:00:00Z',  // Past date
      },
      complete: false,
      chunkIndex: 3,
    },
  },

  // 9. Error event for past deadline
  {
    type: 'schema_error',
    data: {
      field: 'deadline',
      error: 'Deadline must be in the future',
      severity: 'error',
      code: 'custom',
    },
  },

  // 10. Fifth chunk: invalid enum value
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',
        teamIds: '550e8400-e29b-41d4-a716-446655440001',
        deadline: '2024-01-01T00:00:00Z',
        priority: 'super-high',  // Invalid enum
      },
      complete: false,
      chunkIndex: 4,
    },
  },

  // 11. Error event for invalid priority
  {
    type: 'schema_error',
    data: {
      field: 'priority',
      error: 'Priority must be one of: low, medium, high, critical',
      severity: 'error',
      code: 'invalid_enum_value',
    },
  },

  // 12. Sixth chunk: invalid owner data
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',
        teamIds: '550e8400-e29b-41d4-a716-446655440001',
        deadline: '2024-01-01T00:00:00Z',
        priority: 'super-high',
        owner: {
          userId: 'not-a-uuid',
          email: 'invalid-email',
        },
      },
      complete: true,
      chunkIndex: 5,
    },
  },

  // 13. Error events for invalid owner fields
  {
    type: 'schema_error',
    data: {
      field: 'owner.userId',
      error: 'Owner userId must be a valid UUID',
      suggestion: 'Use format: 550e8400-e29b-41d4-a716-446655440000',
      severity: 'error',
      code: 'invalid_string',
    },
  },

  {
    type: 'schema_error',
    data: {
      field: 'owner.email',
      error: 'Owner email must be a valid email address',
      suggestion: 'Use format: user@example.com',
      severity: 'error',
      code: 'invalid_string',
    },
  },
];

/**
 * Stream fixture: Corrected validation flow
 *
 * Demonstrates fixing errors and achieving valid state.
 */
export const correctedValidationStream: SchemaStreamEvent[] = [
  // 1. Schema definition
  {
    type: 'schema',
    data: {
      schemaId: 'project-setup-v1',
      version: '1.0.0',
      description: 'StreamFlow PM project setup schema',
      schema: projectSetupJsonSchema,
    },
  },

  // 2. Start with errors
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI',
        budget: '75k',
      },
      complete: false,
      chunkIndex: 0,
    },
  },

  {
    type: 'schema_error',
    data: {
      field: 'projectName',
      error: 'Project name must be at least 3 characters',
      suggestion: 'Add 1 more character',
      severity: 'error',
    },
  },

  {
    type: 'schema_error',
    data: {
      field: 'budget',
      error: 'Expected number, got string',
      suggestion: 'Convert "75k" to 75000',
      severity: 'error',
    },
  },

  // 3. Corrected payload
  {
    type: 'payload',
    data: {
      chunk: {
        projectName: 'AI Assistant Integration',  // Fixed: now 3+ chars
        budget: 75000,  // Fixed: now a number
        teamIds: ['550e8400-e29b-41d4-a716-446655440001'],  // Fixed: now array
        deadline: '2026-12-31T23:59:59Z',  // Fixed: future date
        priority: 'high',  // Fixed: valid enum
      } as unknown as Record<string, unknown>,
      complete: true,
      chunkIndex: 1,
    },
  },
];

/**
 * Minimal valid payload (only required fields)
 */
export const minimalValidPayload: ProjectSetupPayload = {
  projectName: 'Quick Project',
  budget: 5000,
  teamIds: ['550e8400-e29b-41d4-a716-446655440001'],
};

/**
 * Stream fixture: Minimal valid flow
 */
export const minimalValidStream: SchemaStreamEvent[] = [
  {
    type: 'schema',
    data: {
      schemaId: 'project-setup-v1',
      version: '1.0.0',
      description: 'StreamFlow PM project setup schema',
      schema: projectSetupJsonSchema,
    },
  },
  {
    type: 'payload',
    data: {
      chunk: minimalValidPayload as unknown as Record<string, unknown>,
      complete: true,
      chunkIndex: 0,
    },
  },
];
