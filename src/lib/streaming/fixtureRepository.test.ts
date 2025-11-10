/**
 * Tests for Fixture Repository System
 *
 * Comprehensive test suite ensuring:
 * - Fixture registration and retrieval
 * - Validation of fixtures
 * - Immutability (INV-14)
 * - Deterministic access (INV-13)
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { StreamEvent } from '@/types/events';
import {
  registerFixture,
  getFixture,
  getFixtureEvents,
  getFixtureMetadata,
  hasFixture,
  listFixtures,
  findFixturesByPattern,
  findFixturesByTag,
  clearFixtures,
  getRegistryStats,
  validateFixture,
  createFixture,
  type Fixture,
  type FixtureMetadata,
} from './fixtureRepository';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockReasoningEvents: StreamEvent[] = [
  {
    id: 'reason-1',
    type: 'reasoning',
    timestamp: 1699564800000,
    data: {
      id: 'reason-1',
      summary: 'Test reasoning step',
      confidence: 0.9,
      timestamp: 1699564800000,
    },
  },
  {
    id: 'answer-1',
    type: 'answer',
    timestamp: 1699564801000,
    data: {
      text: 'Test answer',
      isFinal: true,
    },
  },
];

const validFixtureMetadata: FixtureMetadata = {
  id: 'test-reasoning-fixture',
  name: 'Test Reasoning',
  pattern: 'chain-of-reasoning',
  description: 'Test fixture for reasoning pattern',
  eventCount: 2,
  tags: ['test', 'reasoning'],
  version: '1.0',
};

const validFixture: Fixture = {
  metadata: validFixtureMetadata,
  events: mockReasoningEvents,
};

// ============================================================================
// Tests
// ============================================================================

describe('fixtureRepository', () => {
  // Clean up before each test
  beforeEach(() => {
    clearFixtures();
  });

  // Ensure cleanup after all tests
  afterEach(() => {
    clearFixtures();
  });

  describe('registerFixture', () => {
    it('should register a valid fixture', () => {
      expect(() => registerFixture(validFixture)).not.toThrow();
      expect(hasFixture('test-reasoning-fixture')).toBe(true);
    });

    it('should throw on invalid fixture', () => {
      const invalidFixture = {
        metadata: {
          ...validFixtureMetadata,
          id: '', // Invalid: empty ID
        },
        events: mockReasoningEvents,
      };

      expect(() => registerFixture(invalidFixture)).toThrow();
    });

    it('should throw on duplicate fixture ID', () => {
      registerFixture(validFixture);
      expect(() => registerFixture(validFixture)).toThrow(/already registered/);
    });

    it('should throw on event count mismatch', () => {
      const mismatchFixture = {
        metadata: {
          ...validFixtureMetadata,
          eventCount: 5, // Wrong count
        },
        events: mockReasoningEvents, // Only 2 events
      };

      expect(() => registerFixture(mismatchFixture)).toThrow(/Event count mismatch/);
    });

    it('should throw on invalid event in fixture', () => {
      const invalidEventFixture = {
        metadata: validFixtureMetadata,
        events: [
          {
            id: 'invalid',
            type: 'reasoning',
            timestamp: -1, // Invalid timestamp
            data: {},
          } as StreamEvent,
        ],
      };

      expect(() => registerFixture(invalidEventFixture)).toThrow();
    });
  });

  describe('getFixture', () => {
    beforeEach(() => {
      registerFixture(validFixture);
    });

    it('should retrieve a registered fixture', () => {
      const fixture = getFixture('test-reasoning-fixture');
      expect(fixture).toBeDefined();
      expect(fixture.metadata.id).toBe('test-reasoning-fixture');
      expect(fixture.events).toHaveLength(2);
    });

    it('should throw on non-existent fixture', () => {
      expect(() => getFixture('nonexistent')).toThrow(/not found/);
    });

    it('should return deep clone by default (immutability)', () => {
      const fixture1 = getFixture('test-reasoning-fixture');
      const fixture2 = getFixture('test-reasoning-fixture');

      // Should be equal but not the same reference
      expect(fixture1).toEqual(fixture2);
      expect(fixture1).not.toBe(fixture2);
      expect(fixture1.events).not.toBe(fixture2.events);

      // Mutating one should not affect the other
      fixture1.events.push({
        id: 'new-event',
        type: 'answer',
        timestamp: Date.now(),
        data: { text: 'new', isFinal: true },
      });

      expect(fixture1.events).toHaveLength(3);
      expect(fixture2.events).toHaveLength(2);
    });

    it('should return same reference when clone=false', () => {
      const fixture1 = getFixture('test-reasoning-fixture', { clone: false });
      const fixture2 = getFixture('test-reasoning-fixture', { clone: false });

      expect(fixture1).toBe(fixture2);
      expect(fixture1.events).toBe(fixture2.events);
    });

    it('should optionally validate before returning', () => {
      // This should not throw for valid fixture
      expect(() =>
        getFixture('test-reasoning-fixture', { validate: true })
      ).not.toThrow();
    });
  });

  describe('getFixtureEvents', () => {
    beforeEach(() => {
      registerFixture(validFixture);
    });

    it('should return only events array', () => {
      const events = getFixtureEvents('test-reasoning-fixture');
      expect(Array.isArray(events)).toBe(true);
      expect(events).toHaveLength(2);
      expect(events[0].id).toBe('reason-1');
    });

    it('should return deep clone of events', () => {
      const events1 = getFixtureEvents('test-reasoning-fixture');
      const events2 = getFixtureEvents('test-reasoning-fixture');

      expect(events1).toEqual(events2);
      expect(events1).not.toBe(events2);
    });
  });

  describe('getFixtureMetadata', () => {
    beforeEach(() => {
      registerFixture(validFixture);
    });

    it('should return only metadata', () => {
      const metadata = getFixtureMetadata('test-reasoning-fixture');
      expect(metadata.id).toBe('test-reasoning-fixture');
      expect(metadata.name).toBe('Test Reasoning');
      expect(metadata.pattern).toBe('chain-of-reasoning');
    });

    it('should throw on non-existent fixture', () => {
      expect(() => getFixtureMetadata('nonexistent')).toThrow(/not found/);
    });

    it('should return a copy to prevent mutation', () => {
      const metadata1 = getFixtureMetadata('test-reasoning-fixture');
      const metadata2 = getFixtureMetadata('test-reasoning-fixture');

      metadata1.tags.push('modified');

      expect(metadata2.tags).not.toContain('modified');
    });
  });

  describe('hasFixture', () => {
    it('should return false for non-existent fixture', () => {
      expect(hasFixture('nonexistent')).toBe(false);
    });

    it('should return true for registered fixture', () => {
      registerFixture(validFixture);
      expect(hasFixture('test-reasoning-fixture')).toBe(true);
    });
  });

  describe('listFixtures', () => {
    it('should return empty array when no fixtures', () => {
      expect(listFixtures()).toEqual([]);
    });

    it('should return metadata for all fixtures', () => {
      registerFixture(validFixture);

      const secondFixture = createFixture('test-2', mockReasoningEvents, {
        name: 'Test 2',
        pattern: 'memory-timeline',
        description: 'Second test fixture',
        tags: ['test'],
      });
      registerFixture(secondFixture);

      const fixtures = listFixtures();
      expect(fixtures).toHaveLength(2);
      expect(fixtures.map((f) => f.id)).toContain('test-reasoning-fixture');
      expect(fixtures.map((f) => f.id)).toContain('test-2');
    });

    it('should return copies of metadata', () => {
      registerFixture(validFixture);
      const fixtures1 = listFixtures();
      const fixtures2 = listFixtures();

      fixtures1[0].tags.push('modified');
      expect(fixtures2[0].tags).not.toContain('modified');
    });
  });

  describe('findFixturesByPattern', () => {
    beforeEach(() => {
      registerFixture(validFixture);

      const memoryFixture = createFixture('memory-1', mockReasoningEvents, {
        name: 'Memory Test',
        pattern: 'multi-turn-memory-timeline',
        description: 'Memory fixture',
        tags: ['memory'],
      });
      registerFixture(memoryFixture);
    });

    it('should find fixtures by pattern', () => {
      const reasoningFixtures = findFixturesByPattern('chain-of-reasoning');
      expect(reasoningFixtures).toHaveLength(1);
      expect(reasoningFixtures[0].id).toBe('test-reasoning-fixture');

      const memoryFixtures = findFixturesByPattern('multi-turn-memory-timeline');
      expect(memoryFixtures).toHaveLength(1);
      expect(memoryFixtures[0].id).toBe('memory-1');
    });

    it('should return empty array for non-matching pattern', () => {
      const fixtures = findFixturesByPattern('nonexistent-pattern');
      expect(fixtures).toEqual([]);
    });
  });

  describe('findFixturesByTag', () => {
    beforeEach(() => {
      registerFixture(validFixture);

      const secondFixture = createFixture('test-2', mockReasoningEvents, {
        name: 'Test 2',
        pattern: 'memory-timeline',
        description: 'Second test fixture',
        tags: ['test', 'memory'],
      });
      registerFixture(secondFixture);
    });

    it('should find fixtures by tag', () => {
      const testFixtures = findFixturesByTag('test');
      expect(testFixtures).toHaveLength(2);

      const reasoningFixtures = findFixturesByTag('reasoning');
      expect(reasoningFixtures).toHaveLength(1);

      const memoryFixtures = findFixturesByTag('memory');
      expect(memoryFixtures).toHaveLength(1);
    });

    it('should return empty array for non-matching tag', () => {
      const fixtures = findFixturesByTag('nonexistent-tag');
      expect(fixtures).toEqual([]);
    });
  });

  describe('clearFixtures', () => {
    it('should remove all fixtures', () => {
      registerFixture(validFixture);
      expect(hasFixture('test-reasoning-fixture')).toBe(true);

      clearFixtures();
      expect(hasFixture('test-reasoning-fixture')).toBe(false);
      expect(listFixtures()).toHaveLength(0);
    });
  });

  describe('getRegistryStats', () => {
    it('should return zero stats when empty', () => {
      const stats = getRegistryStats();
      expect(stats.totalFixtures).toBe(0);
      expect(stats.totalEvents).toBe(0);
      expect(stats.patterns).toEqual([]);
      expect(stats.tags).toEqual([]);
    });

    it('should return accurate stats', () => {
      registerFixture(validFixture);

      const secondFixture = createFixture('test-2', mockReasoningEvents, {
        name: 'Test 2',
        pattern: 'memory-timeline',
        description: 'Second test fixture',
        tags: ['test', 'memory'],
      });
      registerFixture(secondFixture);

      const stats = getRegistryStats();
      expect(stats.totalFixtures).toBe(2);
      expect(stats.totalEvents).toBe(4); // 2 events per fixture
      expect(stats.patterns).toContain('chain-of-reasoning');
      expect(stats.patterns).toContain('memory-timeline');
      expect(stats.tags).toContain('test');
      expect(stats.tags).toContain('reasoning');
      expect(stats.tags).toContain('memory');
    });
  });

  describe('validateFixture', () => {
    it('should validate a correct fixture', () => {
      const result = validateFixture(validFixture);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing metadata', () => {
      const invalidFixture = {
        events: mockReasoningEvents,
      } as Fixture;

      const result = validateFixture(invalidFixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'structural')).toBe(true);
    });

    it('should detect missing required metadata fields', () => {
      const invalidFixture = {
        metadata: {
          id: 'test',
          // Missing other required fields
        } as FixtureMetadata,
        events: mockReasoningEvents,
      };

      const result = validateFixture(invalidFixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('name'))).toBe(true);
      expect(result.errors.some((e) => e.message.includes('pattern'))).toBe(true);
    });

    it('should detect event count mismatch', () => {
      const invalidFixture = {
        metadata: {
          ...validFixtureMetadata,
          eventCount: 10, // Wrong count
        },
        events: mockReasoningEvents, // Only 2 events
      };

      const result = validateFixture(invalidFixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Event count mismatch'))).toBe(
        true
      );
    });

    it('should detect invalid events array', () => {
      const invalidFixture = {
        metadata: validFixtureMetadata,
        events: 'not an array' as unknown as StreamEvent[],
      };

      const result = validateFixture(invalidFixture);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'structural')).toBe(true);
    });

    it('should detect timestamp order violations', () => {
      const outOfOrderEvents: StreamEvent[] = [
        {
          id: 'event-1',
          type: 'reasoning',
          timestamp: 2000,
          data: {
            id: 'event-1',
            summary: 'Test',
            confidence: 0.9,
            timestamp: 2000,
          },
        },
        {
          id: 'event-2',
          type: 'answer',
          timestamp: 1000, // Earlier than previous!
          data: { text: 'Test', isFinal: true },
        },
      ];

      const invalidFixture = {
        metadata: {
          ...validFixtureMetadata,
          eventCount: 2,
        },
        events: outOfOrderEvents,
      };

      const result = validateFixture(invalidFixture);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes('Timestamp order violation'))
      ).toBe(true);
    });

    it('should allow non-decreasing timestamps (equal is OK)', () => {
      const sameTimestampEvents: StreamEvent[] = [
        {
          id: 'event-1',
          type: 'reasoning',
          timestamp: 1000,
          data: {
            id: 'event-1',
            summary: 'Test',
            confidence: 0.9,
            timestamp: 1000,
          },
        },
        {
          id: 'event-2',
          type: 'answer',
          timestamp: 1000, // Same as previous - OK
          data: { text: 'Test', isFinal: true },
        },
      ];

      const fixture = {
        metadata: {
          ...validFixtureMetadata,
          eventCount: 2,
        },
        events: sameTimestampEvents,
      };

      const result = validateFixture(fixture);
      // Should not have timestamp order violations
      expect(
        result.errors.some((e) => e.message.includes('Timestamp order violation'))
      ).toBe(false);
    });
  });

  describe('createFixture', () => {
    it('should create fixture from events', () => {
      const fixture = createFixture('test-created', mockReasoningEvents, {
        name: 'Created Test',
        pattern: 'chain-of-reasoning',
        description: 'Created fixture',
        tags: ['created'],
      });

      expect(fixture.metadata.id).toBe('test-created');
      expect(fixture.metadata.name).toBe('Created Test');
      expect(fixture.metadata.eventCount).toBe(2);
      expect(fixture.events).toHaveLength(2);
    });

    it('should use defaults for missing options', () => {
      const fixture = createFixture('minimal', mockReasoningEvents, {});

      expect(fixture.metadata.id).toBe('minimal');
      expect(fixture.metadata.name).toBe('minimal');
      expect(fixture.metadata.pattern).toBe('unknown');
      expect(fixture.metadata.tags).toEqual([]);
      expect(fixture.metadata.version).toBe('1.0');
    });

    it('should auto-calculate event count', () => {
      const fixture = createFixture('auto-count', mockReasoningEvents, {
        pattern: 'test',
      });

      expect(fixture.metadata.eventCount).toBe(mockReasoningEvents.length);
    });
  });

  describe('deterministic behavior (INV-13)', () => {
    it('should return same events for same fixture ID', () => {
      registerFixture(validFixture);

      const events1 = getFixtureEvents('test-reasoning-fixture');
      const events2 = getFixtureEvents('test-reasoning-fixture');

      // Same content
      expect(events1).toEqual(events2);

      // Same order
      expect(events1[0].id).toBe(events2[0].id);
      expect(events1[1].id).toBe(events2[1].id);
    });

    it('should return events in same order across multiple calls', () => {
      registerFixture(validFixture);

      const calls = Array.from({ length: 5 }, () =>
        getFixtureEvents('test-reasoning-fixture')
      );

      // All calls should return events in same order
      calls.forEach((events) => {
        expect(events[0].id).toBe('reason-1');
        expect(events[1].id).toBe('answer-1');
      });
    });
  });

  describe('immutability (INV-14)', () => {
    it('should not allow mutations to affect registry', () => {
      registerFixture(validFixture);

      const fixture = getFixture('test-reasoning-fixture');
      fixture.metadata.name = 'MUTATED';
      fixture.events.push({
        id: 'new',
        type: 'answer',
        timestamp: Date.now(),
        data: { text: 'new', isFinal: true },
      });

      // Original in registry should be unchanged
      const original = getFixture('test-reasoning-fixture');
      expect(original.metadata.name).toBe('Test Reasoning');
      expect(original.events).toHaveLength(2);
    });

    it('should deep clone nested event data', () => {
      const fixtureWithNestedData = createFixture(
        'nested-test',
        [
          {
            id: 'event-1',
            type: 'schema',
            timestamp: 1000,
            data: {
              id: 'schema-1',
              name: 'Test Schema',
              columns: [{ id: 'col1', name: 'Column 1', type: 'string', required: true }],
            },
          },
        ],
        { pattern: 'test' }
      );

      registerFixture(fixtureWithNestedData);

      const fixture1 = getFixture('nested-test');
      const fixture2 = getFixture('nested-test');

      // Mutate nested data in fixture1
      if (fixture1.events[0].type === 'schema') {
        fixture1.events[0].data.columns.push({
          id: 'col2',
          name: 'Column 2',
          type: 'number',
          required: false,
        });
      }

      // fixture2 should be unaffected
      if (fixture2.events[0].type === 'schema') {
        expect(fixture2.events[0].data.columns).toHaveLength(1);
      }
    });
  });
});
