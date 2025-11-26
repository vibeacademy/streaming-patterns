/**
 * Tests for mockStream module
 *
 * Verifies that the mock stream generator:
 * - Emits events in correct order (schema, rows, metadata)
 * - Respects speed presets
 * - Handles error simulation correctly
 * - Provides synchronous helper functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockTabularStream,
  streamToArray,
  getEventCount,
  getSchemaSync
} from './mockStream';
import { StreamError } from './types';

describe('mockStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMockTabularStream', () => {
    it('should emit schema event first', async () => {
      const stream = createMockTabularStream({ speed: 'fast' });
      const firstEvent = await stream.next();

      expect(firstEvent.done).toBe(false);
      expect(firstEvent.value?.type).toBe('schema');
    });

    it('should emit events in correct order', async () => {
      const events = await streamToArray({ speed: 'fast' });

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('schema');
      expect(events[events.length - 1].type).toBe('table_meta');

      // All middle events should be rows
      const middleEvents = events.slice(1, -1);
      middleEvents.forEach((event) => {
        expect(event.type).toBe('table_row');
      });
    });

    it('should emit correct number of events for team capacity', async () => {
      const events = await streamToArray({ speed: 'fast', scenario: 'team-capacity' });

      // Should have: 1 schema + 12 rows + 1 metadata = 14 events
      expect(events.length).toBe(14);
    });

    it('should call onEvent callback for each event', async () => {
      const onEvent = vi.fn();
      const stream = createMockTabularStream({
        speed: 'fast',
        onEvent
      });

      // Consume all events
      for await (const _event of stream) {
        // Just consume
      }

      expect(onEvent).toHaveBeenCalled();
      expect(onEvent.mock.calls.length).toBeGreaterThan(0);
    });

    it('should respect fast speed preset', async () => {
      const startTime = Date.now();
      await streamToArray({ speed: 'fast' });
      const elapsed = Date.now() - startTime;

      // Fast mode (50ms between events) should complete quickly
      // 14 events * 50ms = 700ms, give it some buffer
      expect(elapsed).toBeLessThan(2000);
    });

    it('should throw StreamError for timeout simulation', async () => {
      await expect(
        streamToArray({ speed: 'fast', simulateError: 'timeout' })
      ).rejects.toThrow(StreamError);

      try {
        await streamToArray({ speed: 'fast', simulateError: 'timeout' });
      } catch (error) {
        expect(error).toBeInstanceOf(StreamError);
        expect((error as StreamError).type).toBe('timeout');
      }
    });

    it('should throw StreamError for network simulation', async () => {
      await expect(
        streamToArray({ speed: 'fast', simulateError: 'network' })
      ).rejects.toThrow(StreamError);

      try {
        await streamToArray({ speed: 'fast', simulateError: 'network' });
      } catch (error) {
        expect(error).toBeInstanceOf(StreamError);
        expect((error as StreamError).type).toBe('network');
      }
    });

    it('should throw StreamError for mid-stream error', async () => {
      await expect(
        streamToArray({ speed: 'fast', simulateError: 'mid-stream' })
      ).rejects.toThrow(StreamError);
    });

    it('should emit schema with correct structure', async () => {
      const events = await streamToArray({ speed: 'fast' });
      const schemaEvent = events[0];

      expect(schemaEvent.type).toBe('schema');
      if (schemaEvent.type === 'schema') {
        expect(schemaEvent.data).toHaveProperty('columns');
        expect(schemaEvent.data).toHaveProperty('totalRows');
        expect(Array.isArray(schemaEvent.data.columns)).toBe(true);
        expect(schemaEvent.data.columns.length).toBeGreaterThan(0);
      }
    });

    it('should emit rows with correct structure', async () => {
      const events = await streamToArray({ speed: 'fast' });
      const rowEvents = events.filter((e) => e.type === 'table_row');

      rowEvents.forEach((event) => {
        expect(event.data).toHaveProperty('rowId');
        expect(event.data).toHaveProperty('values');
        expect(typeof event.data.rowId).toBe('string');
        expect(typeof event.data.values).toBe('object');
      });
    });

    it('should emit metadata with aggregations', async () => {
      const events = await streamToArray({ speed: 'fast' });
      const metaEvent = events[events.length - 1];

      expect(metaEvent.type).toBe('table_meta');
      if (metaEvent.type === 'table_meta') {
        expect(metaEvent.data).toHaveProperty('totalRows');
        expect(metaEvent.data).toHaveProperty('aggregations');
        expect(typeof metaEvent.data.totalRows).toBe('number');
      }
    });
  });

  describe('streamToArray', () => {
    it('should convert stream to array', async () => {
      const events = await streamToArray({ speed: 'fast' });

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should work with default config', async () => {
      const events = await streamToArray();

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('getEventCount', () => {
    it('should return correct event count for default scenario', () => {
      const count = getEventCount();

      expect(count).toBe(14); // 1 schema + 12 rows + 1 metadata
    });

    it('should return correct event count for team-capacity scenario', () => {
      const count = getEventCount('team-capacity');

      expect(count).toBe(14);
    });
  });

  describe('getSchemaSync', () => {
    it('should return schema without streaming', () => {
      const schema = getSchemaSync();

      expect(schema).toHaveProperty('columns');
      expect(schema).toHaveProperty('totalRows');
      expect(Array.isArray(schema.columns)).toBe(true);
    });

    it('should return schema for team-capacity scenario', () => {
      const schema = getSchemaSync('team-capacity');

      expect(schema.title).toContain('Team Capacity');
      expect(schema.columns.length).toBeGreaterThan(0);
    });

    it('should have correct column definitions', () => {
      const schema = getSchemaSync('team-capacity');

      // Check for expected columns
      const columnIds = schema.columns.map((col) => col.id);
      expect(columnIds).toContain('name');
      expect(columnIds).toContain('role');
      expect(columnIds).toContain('allocation');
    });

    it('should include aggregation definitions', () => {
      const schema = getSchemaSync('team-capacity');

      const columnsWithAggregation = schema.columns.filter((col) => col.aggregation);
      expect(columnsWithAggregation.length).toBeGreaterThan(0);
    });
  });
});
