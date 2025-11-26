/**
 * Mock data fixtures for the Tabular Stream View pattern.
 *
 * This file contains deterministic team capacity data for the StreamFlow PM
 * demo scenario. All data is intentionally hardcoded to ensure consistent,
 * repeatable demonstrations.
 *
 * @module patterns/tabular-stream-view/fixtures
 */

import type { TableSchema, TableRow, TableMetadata, StreamEvent } from './types';

/**
 * Table schema for the team capacity matrix.
 *
 * Defines columns for team member information, allocation, and rates.
 * This is sent as the first event in the stream to establish structure
 * before rows start arriving.
 */
export const teamCapacitySchema: TableSchema = {
  title: 'Team Capacity Matrix - Q1 2025',
  columns: [
    {
      id: 'name',
      label: 'Team Member',
      type: 'string',
      sortable: true,
      filterable: false,
      width: '200px'
    },
    {
      id: 'role',
      label: 'Role',
      type: 'string',
      sortable: true,
      filterable: true,
      width: '180px'
    },
    {
      id: 'skills',
      label: 'Skills',
      type: 'string',
      sortable: false,
      filterable: true,
      width: '250px'
    },
    {
      id: 'allocation',
      label: 'Current Allocation',
      type: 'number',
      sortable: true,
      filterable: false,
      unit: '%',
      aggregation: 'avg',
      width: '150px'
    },
    {
      id: 'availableHours',
      label: 'Available Hours/Week',
      type: 'number',
      sortable: true,
      filterable: false,
      unit: 'hrs',
      aggregation: 'sum',
      width: '180px'
    },
    {
      id: 'hourlyRate',
      label: 'Rate',
      type: 'number',
      sortable: true,
      filterable: false,
      unit: '$',
      aggregation: 'avg',
      width: '120px'
    },
    {
      id: 'availableFrom',
      label: 'Available From',
      type: 'date',
      sortable: true,
      filterable: false,
      width: '150px'
    },
    {
      id: 'isRemote',
      label: 'Remote',
      type: 'boolean',
      sortable: true,
      filterable: true,
      width: '100px'
    }
  ],
  totalRows: 12,
  metadata: {
    scenario: 'team-capacity',
    quarter: 'Q1 2025',
    department: 'Engineering'
  }
};

/**
 * Team capacity data rows.
 *
 * Represents a realistic team with diverse roles, skills, and availability.
 * Data is inspired by typical software development teams at mid-sized companies.
 */
export const teamCapacityRows: TableRow[] = [
  {
    rowId: 'dev-001',
    values: {
      name: 'Sarah Chen',
      role: 'Senior Frontend Engineer',
      skills: 'React, TypeScript, CSS, Accessibility',
      allocation: 85,
      availableHours: 6,
      hourlyRate: 125,
      availableFrom: '2025-01-06',
      isRemote: true
    },
    timestamp: Date.now()
  },
  {
    rowId: 'dev-002',
    values: {
      name: 'Marcus Johnson',
      role: 'Full Stack Engineer',
      skills: 'Node.js, PostgreSQL, React, AWS',
      allocation: 90,
      availableHours: 4,
      hourlyRate: 115,
      availableFrom: '2025-01-06',
      isRemote: false
    },
    timestamp: Date.now() + 100
  },
  {
    rowId: 'dev-003',
    values: {
      name: 'Priya Sharma',
      role: 'Senior Backend Engineer',
      skills: 'Python, Django, Redis, Docker',
      allocation: 75,
      availableHours: 10,
      hourlyRate: 130,
      availableFrom: '2025-01-13',
      isRemote: true
    },
    timestamp: Date.now() + 200
  },
  {
    rowId: 'dev-004',
    values: {
      name: 'Alex Kim',
      role: 'Junior Frontend Engineer',
      skills: 'React, JavaScript, HTML/CSS',
      allocation: 60,
      availableHours: 16,
      hourlyRate: 75,
      availableFrom: '2025-01-06',
      isRemote: true
    },
    timestamp: Date.now() + 300
  },
  {
    rowId: 'dev-005',
    values: {
      name: 'Jordan Martinez',
      role: 'DevOps Engineer',
      skills: 'Kubernetes, Terraform, CI/CD, Monitoring',
      allocation: 95,
      availableHours: 2,
      hourlyRate: 140,
      availableFrom: '2025-01-20',
      isRemote: false
    },
    timestamp: Date.now() + 400
  },
  {
    rowId: 'dev-006',
    values: {
      name: 'Emily Davis',
      role: 'UX Engineer',
      skills: 'Figma, React, Animation, Design Systems',
      allocation: 70,
      availableHours: 12,
      hourlyRate: 105,
      availableFrom: '2025-01-06',
      isRemote: true
    },
    timestamp: Date.now() + 500
  },
  {
    rowId: 'dev-007',
    values: {
      name: 'Raj Patel',
      role: 'Senior Full Stack Engineer',
      skills: 'Node.js, React, MongoDB, GraphQL',
      allocation: 80,
      availableHours: 8,
      hourlyRate: 120,
      availableFrom: '2025-01-13',
      isRemote: false
    },
    timestamp: Date.now() + 600
  },
  {
    rowId: 'dev-008',
    values: {
      name: 'Sofia Rodriguez',
      role: 'Mobile Engineer',
      skills: 'React Native, iOS, Android, TypeScript',
      allocation: 100,
      availableHours: 0,
      hourlyRate: 110,
      availableFrom: '2025-02-03',
      isRemote: true
    },
    timestamp: Date.now() + 700
  },
  {
    rowId: 'dev-009',
    values: {
      name: 'Chris Lee',
      role: 'Data Engineer',
      skills: 'Python, Spark, Airflow, SQL',
      allocation: 65,
      availableHours: 14,
      hourlyRate: 135,
      availableFrom: '2025-01-06',
      isRemote: false
    },
    timestamp: Date.now() + 800
  },
  {
    rowId: 'dev-010',
    values: {
      name: 'Taylor Wong',
      role: 'Junior Backend Engineer',
      skills: 'Java, Spring Boot, MySQL',
      allocation: 55,
      availableHours: 18,
      hourlyRate: 70,
      availableFrom: '2025-01-13',
      isRemote: true
    },
    timestamp: Date.now() + 900
  },
  {
    rowId: 'dev-011',
    values: {
      name: 'Morgan Brooks',
      role: 'QA Engineer',
      skills: 'Selenium, Cypress, Jest, API Testing',
      allocation: 88,
      availableHours: 5,
      hourlyRate: 95,
      availableFrom: '2025-01-06',
      isRemote: false
    },
    timestamp: Date.now() + 1000
  },
  {
    rowId: 'dev-012',
    values: {
      name: 'Jamie Foster',
      role: 'Security Engineer',
      skills: 'Penetration Testing, OWASP, Encryption',
      allocation: 92,
      availableHours: 3,
      hourlyRate: 150,
      availableFrom: '2025-01-20',
      isRemote: true
    },
    timestamp: Date.now() + 1100
  }
];

/**
 * Metadata sent after all rows complete.
 *
 * Contains aggregated statistics matching the column aggregation functions
 * defined in the schema.
 */
export const teamCapacityMetadata: TableMetadata = {
  totalRows: 12,
  aggregations: {
    allocation: 79.58, // Average allocation across all team members
    availableHours: 98, // Total available hours per week
    hourlyRate: 114.17 // Average hourly rate
  },
  completedAt: Date.now() + 1200,
  metadata: {
    totalCost: 11320, // Total weekly cost (availableHours * hourlyRate summed)
    fullyAllocated: 2, // Number of team members at 100% allocation
    availableNow: 6, // Team members available in next week
    averageSkillsPerPerson: 3.75
  }
};

/**
 * Complete fixture data for the default team capacity scenario.
 *
 * This array contains all stream events in order: schema, rows, metadata.
 * Used by the mock stream generator to emit events progressively.
 */
export const teamCapacityFixture: StreamEvent[] = [
  // Schema event (first)
  {
    type: 'schema',
    data: teamCapacitySchema
  },
  // Row events (progressive)
  ...teamCapacityRows.map((row): StreamEvent => ({
    type: 'table_row',
    data: row
  })),
  // Metadata event (last)
  {
    type: 'table_meta',
    data: teamCapacityMetadata
  }
];

/**
 * Fixture registry for different scenarios.
 *
 * Allows demo to switch between different datasets.
 * Currently only includes team capacity, but could expand to:
 * - Sprint velocity tracking
 * - Budget allocation breakdown
 * - Project timeline Gantt data
 */
export const fixtureRegistry: Record<string, StreamEvent[]> = {
  'team-capacity': teamCapacityFixture,
  'default': teamCapacityFixture
};

/**
 * Get fixture data for a specific scenario.
 *
 * @param scenario - Scenario identifier (defaults to 'team-capacity')
 * @returns Array of stream events for the scenario
 *
 * @example
 * ```typescript
 * const events = getFixture('team-capacity');
 * console.log(events.length); // 14 (1 schema + 12 rows + 1 metadata)
 * ```
 */
export function getFixture(scenario: string = 'default'): StreamEvent[] {
  return fixtureRegistry[scenario] || fixtureRegistry.default;
}
