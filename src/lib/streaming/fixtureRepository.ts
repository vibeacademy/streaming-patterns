/**
 * Fixture Repository System
 *
 * This module provides the centralized fixture management system for the streaming-patterns
 * library. It ensures deterministic, immutable, and validated fixture data for all pattern
 * demonstrations.
 *
 * Key responsibilities:
 * - Load and validate fixture data
 * - Provide type-safe access to fixtures
 * - Ensure fixtures are immutable (deep cloning)
 * - Support fixture discovery and enumeration
 *
 * Invariants enforced:
 * - INV-13: Fixtures are deterministic (same ID → same events)
 * - INV-14: Fixtures are immutable (returns deep clones)
 * - INV-16: Fixture validation before use
 *
 * @module lib/streaming/fixtureRepository
 */

import type { StreamEvent } from '@/types/events';
import { validateEvent, type ValidationResult } from './eventSchema';

// ============================================================================
// Types
// ============================================================================

/**
 * Metadata about a fixture
 */
export interface FixtureMetadata {
  /** Unique identifier for this fixture */
  id: string;

  /** Human-readable name */
  name: string;

  /** Pattern this fixture belongs to */
  pattern: string;

  /** Description of what this fixture demonstrates */
  description: string;

  /** Number of events in this fixture */
  eventCount: number;

  /** Tags for categorization and search */
  tags: string[];

  /** Optional author information */
  author?: string;

  /** Version of fixture format */
  version: string;
}

/**
 * Complete fixture definition
 */
export interface Fixture {
  /** Fixture metadata */
  metadata: FixtureMetadata;

  /** Array of stream events */
  events: StreamEvent[];
}

/**
 * Options for loading fixtures
 */
export interface LoadFixtureOptions {
  /** Whether to validate events (default: true) */
  validate?: boolean;

  /** Whether to deep clone events for immutability (default: true) */
  clone?: boolean;
}

/**
 * Fixture validation result
 */
export interface FixtureValidationResult {
  /** Whether fixture is valid */
  valid: boolean;

  /** Validation errors */
  errors: FixtureValidationError[];
}

/**
 * Fixture validation error
 */
export interface FixtureValidationError {
  /** Type of error */
  type: 'metadata' | 'event' | 'structural';

  /** Error message */
  message: string;

  /** Optional context (e.g., event index) */
  context?: string | number;

  /** Event validation details if applicable */
  eventValidation?: ValidationResult;
}

// ============================================================================
// Fixture Registry
// ============================================================================

/**
 * In-memory fixture registry
 * Stores all loaded fixtures by ID for fast lookup
 */
const fixtureRegistry = new Map<string, Fixture>();

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Register a fixture in the repository
 *
 * Validates and stores a fixture for later retrieval. Fixtures are validated
 * against the event schema and checked for structural correctness.
 *
 * @param fixture - Fixture to register
 * @throws Error if fixture is invalid or ID already exists
 *
 * @example
 * ```typescript
 * registerFixture({
 *   metadata: {
 *     id: 'chain-of-reasoning-sprint-planning',
 *     name: 'Sprint Planning Reasoning',
 *     pattern: 'chain-of-reasoning',
 *     description: 'AI planning a 2-week sprint with visible reasoning',
 *     eventCount: 6,
 *     tags: ['sprint', 'planning', 'reasoning'],
 *     version: '1.0'
 *   },
 *   events: [...] // Stream events
 * });
 * ```
 */
export function registerFixture(fixture: Fixture): void {
  // Validate fixture
  const validationResult = validateFixture(fixture);

  if (!validationResult.valid) {
    const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
    throw new Error(`Cannot register invalid fixture: ${errorMessages}`);
  }

  // Check for duplicate ID
  if (fixtureRegistry.has(fixture.metadata.id)) {
    throw new Error(`Fixture with ID "${fixture.metadata.id}" already registered`);
  }

  // Store deep clone to ensure registry immutability
  fixtureRegistry.set(fixture.metadata.id, deepCloneFixture(fixture));
}

/**
 * Get a fixture by ID
 *
 * Retrieves a fixture from the registry. By default, returns a deep clone to
 * ensure immutability (INV-14). Original fixture in registry remains unchanged.
 *
 * @param id - Fixture ID
 * @param options - Load options
 * @returns Fixture if found
 * @throws Error if fixture not found
 *
 * @example
 * ```typescript
 * const fixture = getFixture('chain-of-reasoning-sprint-planning');
 * // fixture.events can be modified without affecting registry
 * ```
 */
export function getFixture(id: string, options: LoadFixtureOptions = {}): Fixture {
  const { clone = true, validate = false } = options;

  const fixture = fixtureRegistry.get(id);

  if (!fixture) {
    throw new Error(`Fixture not found: ${id}`);
  }

  // Optionally validate before returning
  if (validate) {
    const validationResult = validateFixture(fixture);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
      throw new Error(`Fixture "${id}" failed validation: ${errorMessages}`);
    }
  }

  // Return deep clone by default for immutability
  return clone ? deepCloneFixture(fixture) : fixture;
}

/**
 * Get fixture events only
 *
 * Convenience method to get just the events array from a fixture.
 * Returns a deep clone by default for immutability.
 *
 * @param id - Fixture ID
 * @param options - Load options
 * @returns Array of stream events
 *
 * @example
 * ```typescript
 * const events = getFixtureEvents('chain-of-reasoning-sprint-planning');
 * // Use events with createMockStream
 * ```
 */
export function getFixtureEvents(id: string, options: LoadFixtureOptions = {}): StreamEvent[] {
  const fixture = getFixture(id, options);
  return fixture.events;
}

/**
 * Get fixture metadata only
 *
 * Retrieves just the metadata without loading all events.
 * Useful for browsing available fixtures.
 *
 * @param id - Fixture ID
 * @returns Fixture metadata
 *
 * @example
 * ```typescript
 * const metadata = getFixtureMetadata('chain-of-reasoning-sprint-planning');
 * console.log(metadata.description);
 * ```
 */
export function getFixtureMetadata(id: string): FixtureMetadata {
  const fixture = fixtureRegistry.get(id);

  if (!fixture) {
    throw new Error(`Fixture not found: ${id}`);
  }

  // Deep clone metadata to prevent mutations (including arrays)
  return JSON.parse(JSON.stringify(fixture.metadata)) as FixtureMetadata;
}

/**
 * Check if a fixture exists
 *
 * @param id - Fixture ID to check
 * @returns True if fixture is registered
 */
export function hasFixture(id: string): boolean {
  return fixtureRegistry.has(id);
}

/**
 * List all registered fixtures
 *
 * Returns metadata for all fixtures in the registry.
 * Useful for building fixture browsers or tests.
 *
 * @returns Array of fixture metadata
 *
 * @example
 * ```typescript
 * const allFixtures = listFixtures();
 * allFixtures.forEach(meta => {
 *   console.log(`${meta.name}: ${meta.eventCount} events`);
 * });
 * ```
 */
export function listFixtures(): FixtureMetadata[] {
  return Array.from(fixtureRegistry.values()).map((fixture) =>
    JSON.parse(JSON.stringify(fixture.metadata)) as FixtureMetadata
  );
}

/**
 * Find fixtures by pattern
 *
 * Returns all fixtures for a specific pattern.
 *
 * @param pattern - Pattern name (e.g., 'chain-of-reasoning')
 * @returns Array of fixture metadata
 *
 * @example
 * ```typescript
 * const reasoningFixtures = findFixturesByPattern('chain-of-reasoning');
 * ```
 */
export function findFixturesByPattern(pattern: string): FixtureMetadata[] {
  return Array.from(fixtureRegistry.values())
    .filter((fixture) => fixture.metadata.pattern === pattern)
    .map((fixture) => JSON.parse(JSON.stringify(fixture.metadata)) as FixtureMetadata);
}

/**
 * Find fixtures by tag
 *
 * Returns all fixtures matching a specific tag.
 *
 * @param tag - Tag to search for
 * @returns Array of fixture metadata
 *
 * @example
 * ```typescript
 * const sprintFixtures = findFixturesByTag('sprint');
 * ```
 */
export function findFixturesByTag(tag: string): FixtureMetadata[] {
  return Array.from(fixtureRegistry.values())
    .filter((fixture) => fixture.metadata.tags.includes(tag))
    .map((fixture) => JSON.parse(JSON.stringify(fixture.metadata)) as FixtureMetadata);
}

/**
 * Clear all fixtures from registry
 *
 * Removes all registered fixtures. Primarily for testing.
 */
export function clearFixtures(): void {
  fixtureRegistry.clear();
}

/**
 * Get registry statistics
 *
 * Returns information about the current fixture registry state.
 *
 * @returns Registry statistics
 */
export function getRegistryStats(): {
  totalFixtures: number;
  totalEvents: number;
  patterns: string[];
  tags: string[];
} {
  const fixtures = Array.from(fixtureRegistry.values());

  const totalEvents = fixtures.reduce((sum, fixture) => sum + fixture.metadata.eventCount, 0);

  const patterns = [...new Set(fixtures.map((f) => f.metadata.pattern))];

  const tags = [...new Set(fixtures.flatMap((f) => f.metadata.tags))];

  return {
    totalFixtures: fixtures.length,
    totalEvents,
    patterns,
    tags,
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a fixture
 *
 * Performs comprehensive validation of fixture structure and content:
 * - Metadata completeness
 * - Event count accuracy
 * - Event schema validation
 * - Event order and timestamps
 *
 * @param fixture - Fixture to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const result = validateFixture(myFixture);
 * if (!result.valid) {
 *   result.errors.forEach(err => console.error(err.message));
 * }
 * ```
 */
export function validateFixture(fixture: Fixture): FixtureValidationResult {
  const errors: FixtureValidationError[] = [];

  // Validate metadata
  if (!fixture.metadata) {
    errors.push({
      type: 'structural',
      message: 'Fixture missing metadata',
    });
    return { valid: false, errors };
  }

  const { metadata, events } = fixture;

  // Validate required metadata fields
  if (!metadata.id || typeof metadata.id !== 'string') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "id" field',
    });
  }

  if (!metadata.name || typeof metadata.name !== 'string') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "name" field',
    });
  }

  if (!metadata.pattern || typeof metadata.pattern !== 'string') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "pattern" field',
    });
  }

  if (!metadata.description || typeof metadata.description !== 'string') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "description" field',
    });
  }

  if (typeof metadata.eventCount !== 'number') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "eventCount" field',
    });
  }

  if (!Array.isArray(metadata.tags)) {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata "tags" must be an array',
    });
  }

  if (!metadata.version || typeof metadata.version !== 'string') {
    errors.push({
      type: 'metadata',
      message: 'Fixture metadata missing or invalid "version" field',
    });
  }

  // Validate events array
  if (!Array.isArray(events)) {
    errors.push({
      type: 'structural',
      message: 'Fixture "events" must be an array',
    });
    return { valid: false, errors };
  }

  // Validate event count matches metadata
  if (events.length !== metadata.eventCount) {
    errors.push({
      type: 'structural',
      message: `Event count mismatch: metadata says ${metadata.eventCount}, found ${events.length}`,
    });
  }

  // Validate each event
  events.forEach((event, index) => {
    const eventValidation = validateEvent(event);

    if (!eventValidation.valid) {
      errors.push({
        type: 'event',
        message: `Event at index ${index} is invalid`,
        context: index,
        eventValidation,
      });
    }
  });

  // Validate timestamp ordering (should be non-decreasing)
  for (let i = 1; i < events.length; i++) {
    if (events[i].timestamp < events[i - 1].timestamp) {
      errors.push({
        type: 'event',
        message: `Timestamp order violation at index ${i}: timestamps should be non-decreasing`,
        context: i,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep clone a fixture
 *
 * Creates a deep copy of a fixture to ensure immutability.
 * Uses JSON serialization for simplicity and determinism.
 *
 * @param fixture - Fixture to clone
 * @returns Deep copy of fixture
 */
function deepCloneFixture(fixture: Fixture): Fixture {
  // Use JSON stringify/parse for deep clone
  // This ensures no shared references and is deterministic
  return JSON.parse(JSON.stringify(fixture)) as Fixture;
}

/**
 * Create fixture from events
 *
 * Helper to create a fixture from an events array with auto-generated metadata.
 *
 * @param id - Fixture ID
 * @param events - Stream events
 * @param options - Optional metadata overrides
 * @returns Complete fixture
 *
 * @example
 * ```typescript
 * const fixture = createFixture(
 *   'test-reasoning',
 *   reasoningEvents,
 *   {
 *     name: 'Test Reasoning',
 *     pattern: 'chain-of-reasoning',
 *     description: 'Test fixture',
 *     tags: ['test']
 *   }
 * );
 * ```
 */
export function createFixture(
  id: string,
  events: StreamEvent[],
  options: Partial<Omit<FixtureMetadata, 'id' | 'eventCount'>>
): Fixture {
  return {
    metadata: {
      id,
      name: options.name ?? id,
      pattern: options.pattern ?? 'unknown',
      description: options.description ?? `Fixture: ${id}`,
      eventCount: events.length,
      tags: options.tags ?? [],
      author: options.author,
      version: options.version ?? '1.0',
    },
    events,
  };
}
