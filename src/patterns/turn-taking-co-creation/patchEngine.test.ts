/**
 * Patch Engine Tests
 *
 * Tests for patch application, conflict detection, and merge resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  applyPatch,
  patchesOverlap,
  mergePatches,
  buildAuthorshipSpans,
  adjustPatchPosition,
  calculatePatchStats,
  reconstructContent,
  findConflicts,
} from './patchEngine';
import type { Patch, DocumentSection, MergeConfig } from './types';

describe('applyPatch', () => {
  it('should insert text at the correct position', () => {
    const content = 'Hello world';
    const patch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: ' beautiful',
      position: { start: 5, end: 5 },
      timestamp: Date.now(),
    };

    const result = applyPatch(content, patch);
    expect(result).toBe('Hello beautiful world');
  });

  it('should replace text in the correct range', () => {
    const content = 'Hello world';
    const patch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'replace',
      content: 'everyone',
      position: { start: 6, end: 11 },
      timestamp: Date.now(),
    };

    const result = applyPatch(content, patch);
    expect(result).toBe('Hello everyone');
  });

  it('should delete text in the correct range', () => {
    const content = 'Hello beautiful world';
    const patch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'delete',
      content: '',
      position: { start: 5, end: 15 },
      timestamp: Date.now(),
    };

    const result = applyPatch(content, patch);
    expect(result).toBe('Hello world');
  });

  it('should handle insert at the beginning', () => {
    const content = 'world';
    const patch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'Hello ',
      position: { start: 0, end: 0 },
      timestamp: Date.now(),
    };

    const result = applyPatch(content, patch);
    expect(result).toBe('Hello world');
  });

  it('should handle insert at the end', () => {
    const content = 'Hello';
    const patch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: ' world',
      position: { start: 5, end: 5 },
      timestamp: Date.now(),
    };

    const result = applyPatch(content, patch);
    expect(result).toBe('Hello world');
  });
});

describe('patchesOverlap', () => {
  it('should detect overlapping patches in the same section', () => {
    const p1: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'test',
      position: { start: 0, end: 10 },
      timestamp: 1000,
    };

    const p2: Patch = {
      id: 'patch-2',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'test',
      position: { start: 5, end: 15 },
      timestamp: 1001,
    };

    expect(patchesOverlap(p1, p2)).toBe(true);
  });

  it('should not detect overlap for non-overlapping patches', () => {
    const p1: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'test',
      position: { start: 0, end: 5 },
      timestamp: 1000,
    };

    const p2: Patch = {
      id: 'patch-2',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'test',
      position: { start: 10, end: 15 },
      timestamp: 1001,
    };

    expect(patchesOverlap(p1, p2)).toBe(false);
  });

  it('should not detect overlap for patches in different sections', () => {
    const p1: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'test',
      position: { start: 0, end: 10 },
      timestamp: 1000,
    };

    const p2: Patch = {
      id: 'patch-2',
      sectionId: 'section-2',
      author: 'user',
      operation: 'insert',
      content: 'test',
      position: { start: 5, end: 15 },
      timestamp: 1001,
    };

    expect(patchesOverlap(p1, p2)).toBe(false);
  });

  it('should detect adjacent patches as not overlapping', () => {
    const p1: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'test',
      position: { start: 0, end: 5 },
      timestamp: 1000,
    };

    const p2: Patch = {
      id: 'patch-2',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'test',
      position: { start: 5, end: 10 },
      timestamp: 1001,
    };

    expect(patchesOverlap(p1, p2)).toBe(false);
  });
});

describe('mergePatches', () => {
  it('should apply user_priority strategy for overlapping patches', () => {
    const agentPatch: Patch = {
      id: 'agent-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'agent content',
      position: { start: 0, end: 10 },
      timestamp: 1000,
    };

    const userPatch: Patch = {
      id: 'user-1',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'user content',
      position: { start: 5, end: 15 },
      timestamp: 1001,
    };

    const config: MergeConfig = {
      strategy: 'user_priority',
      showConflictUI: true,
    };

    const result = mergePatches(agentPatch, userPatch, config);

    expect(result.success).toBe(true);
    expect(result.patch).toEqual(userPatch);
    expect(result.authorshipSpans).toHaveLength(1);
    expect(result.authorshipSpans[0].author).toBe('user');
  });

  it('should apply agent_priority strategy for overlapping patches', () => {
    const agentPatch: Patch = {
      id: 'agent-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'agent content',
      position: { start: 0, end: 10 },
      timestamp: 1000,
    };

    const userPatch: Patch = {
      id: 'user-1',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'user content',
      position: { start: 5, end: 15 },
      timestamp: 1001,
    };

    const config: MergeConfig = {
      strategy: 'agent_priority',
      showConflictUI: true,
    };

    const result = mergePatches(agentPatch, userPatch, config);

    expect(result.success).toBe(true);
    expect(result.patch).toEqual(agentPatch);
    expect(result.authorshipSpans).toHaveLength(1);
    expect(result.authorshipSpans[0].author).toBe('agent');
  });

  it('should apply merge strategy for overlapping patches', () => {
    const agentPatch: Patch = {
      id: 'agent-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'agent content',
      position: { start: 0, end: 10 },
      timestamp: 1000,
    };

    const userPatch: Patch = {
      id: 'user-1',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'user content',
      position: { start: 5, end: 15 },
      timestamp: 1001,
    };

    const config: MergeConfig = {
      strategy: 'merge',
      showConflictUI: true,
    };

    const result = mergePatches(agentPatch, userPatch, config);

    expect(result.success).toBe(true);
    expect(result.patch?.content).toContain('user content');
    expect(result.patch?.content).toContain('agent content');
    expect(result.authorshipSpans).toHaveLength(2);
  });

  it('should allow both patches when they do not overlap', () => {
    const agentPatch: Patch = {
      id: 'agent-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'agent content',
      position: { start: 0, end: 5 },
      timestamp: 1000,
    };

    const userPatch: Patch = {
      id: 'user-1',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'user content',
      position: { start: 10, end: 15 },
      timestamp: 1001,
    };

    const config: MergeConfig = {
      strategy: 'user_priority',
      showConflictUI: true,
    };

    const result = mergePatches(agentPatch, userPatch, config);

    expect(result.success).toBe(true);
    expect(result.authorshipSpans).toHaveLength(2);
  });
});

describe('buildAuthorshipSpans', () => {
  it('should build authorship spans from patches', () => {
    const section: DocumentSection = {
      id: 'section-1',
      title: 'Test Section',
      content: 'Hello world',
      order: 0,
      patches: [
        {
          id: 'patch-1',
          sectionId: 'section-1',
          author: 'agent',
          operation: 'insert',
          content: 'Hello ',
          position: { start: 0, end: 0 },
          timestamp: 1000,
        },
        {
          id: 'patch-2',
          sectionId: 'section-1',
          author: 'user',
          operation: 'insert',
          content: 'world',
          position: { start: 6, end: 6 },
          timestamp: 1001,
        },
      ],
    };

    const spans = buildAuthorshipSpans(section);

    expect(spans).toHaveLength(2);
    expect(spans[0].author).toBe('agent');
    expect(spans[0].start).toBe(0);
    expect(spans[0].end).toBe(6);
    expect(spans[1].author).toBe('user');
    expect(spans[1].start).toBe(6);
    expect(spans[1].end).toBe(11);
  });

  it('should merge adjacent spans from the same author', () => {
    const section: DocumentSection = {
      id: 'section-1',
      title: 'Test Section',
      content: 'Hello world',
      order: 0,
      patches: [
        {
          id: 'patch-1',
          sectionId: 'section-1',
          author: 'agent',
          operation: 'insert',
          content: 'Hello ',
          position: { start: 0, end: 0 },
          timestamp: 1000,
        },
        {
          id: 'patch-2',
          sectionId: 'section-1',
          author: 'agent',
          operation: 'insert',
          content: 'world',
          position: { start: 6, end: 6 },
          timestamp: 1001,
        },
      ],
    };

    const spans = buildAuthorshipSpans(section);

    // Should merge into a single span
    expect(spans).toHaveLength(1);
    expect(spans[0].author).toBe('agent');
    expect(spans[0].start).toBe(0);
    expect(spans[0].end).toBe(11);
  });

  it('should handle empty patches', () => {
    const section: DocumentSection = {
      id: 'section-1',
      title: 'Test Section',
      content: '',
      order: 0,
      patches: [],
    };

    const spans = buildAuthorshipSpans(section);

    expect(spans).toHaveLength(0);
  });
});

describe('adjustPatchPosition', () => {
  it('should adjust position when patch is after an insert', () => {
    const patch: Patch = {
      id: 'patch-2',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'world',
      position: { start: 0, end: 0 },
      timestamp: 1001,
    };

    const appliedPatch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'Hello ',
      position: { start: 0, end: 0 },
      timestamp: 1000,
    };

    const adjusted = adjustPatchPosition(patch, appliedPatch);

    expect(adjusted.position.start).toBe(6); // Shifted by length of "Hello "
    expect(adjusted.position.end).toBe(6);
  });

  it('should not adjust position for different sections', () => {
    const patch: Patch = {
      id: 'patch-2',
      sectionId: 'section-2',
      author: 'user',
      operation: 'insert',
      content: 'world',
      position: { start: 0, end: 0 },
      timestamp: 1001,
    };

    const appliedPatch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'insert',
      content: 'Hello ',
      position: { start: 0, end: 0 },
      timestamp: 1000,
    };

    const adjusted = adjustPatchPosition(patch, appliedPatch);

    expect(adjusted.position).toEqual(patch.position);
  });

  it('should adjust position when patch is after a delete', () => {
    const patch: Patch = {
      id: 'patch-2',
      sectionId: 'section-1',
      author: 'user',
      operation: 'insert',
      content: 'world',
      position: { start: 10, end: 10 },
      timestamp: 1001,
    };

    const appliedPatch: Patch = {
      id: 'patch-1',
      sectionId: 'section-1',
      author: 'agent',
      operation: 'delete',
      content: '',
      position: { start: 0, end: 5 },
      timestamp: 1000,
    };

    const adjusted = adjustPatchPosition(patch, appliedPatch);

    expect(adjusted.position.start).toBe(5); // Shifted back by 5
    expect(adjusted.position.end).toBe(5);
  });
});

describe('calculatePatchStats', () => {
  it('should calculate statistics correctly', () => {
    const patches: Patch[] = [
      {
        id: 'patch-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'Hello',
        position: { start: 0, end: 0 },
        timestamp: 1000,
      },
      {
        id: 'patch-2',
        sectionId: 'section-1',
        author: 'user',
        operation: 'replace',
        content: 'world',
        position: { start: 6, end: 11 },
        timestamp: 1001,
        supersedes: 'patch-1',
      },
      {
        id: 'patch-3',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'delete',
        content: '',
        position: { start: 0, end: 5 },
        timestamp: 1002,
      },
    ];

    const stats = calculatePatchStats(patches);

    expect(stats.total).toBe(3);
    expect(stats.byAuthor.agent).toBe(2);
    expect(stats.byAuthor.user).toBe(1);
    expect(stats.byOperation.insert).toBe(1);
    expect(stats.byOperation.replace).toBe(1);
    expect(stats.byOperation.delete).toBe(1);
    expect(stats.conflicts).toBe(1);
  });

  it('should handle empty patch array', () => {
    const stats = calculatePatchStats([]);

    expect(stats.total).toBe(0);
    expect(stats.byAuthor.agent).toBe(0);
    expect(stats.byAuthor.user).toBe(0);
    expect(stats.conflicts).toBe(0);
  });
});

describe('reconstructContent', () => {
  it('should reconstruct content from patches in order', () => {
    const patches: Patch[] = [
      {
        id: 'patch-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'Hello ',
        position: { start: 0, end: 0 },
        timestamp: 1000,
      },
      {
        id: 'patch-2',
        sectionId: 'section-1',
        author: 'user',
        operation: 'insert',
        content: 'world',
        position: { start: 6, end: 6 },
        timestamp: 1001,
      },
    ];

    const content = reconstructContent('', patches);

    expect(content).toBe('Hello world');
  });

  it('should handle patches in wrong order by sorting them', () => {
    const patches: Patch[] = [
      {
        id: 'patch-2',
        sectionId: 'section-1',
        author: 'user',
        operation: 'insert',
        content: 'world',
        position: { start: 6, end: 6 },
        timestamp: 1001,
      },
      {
        id: 'patch-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'Hello ',
        position: { start: 0, end: 0 },
        timestamp: 1000,
      },
    ];

    const content = reconstructContent('', patches);

    expect(content).toBe('Hello world');
  });
});

describe('findConflicts', () => {
  it('should find conflicts between agent and user patches', () => {
    const patches: Patch[] = [
      {
        id: 'agent-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'agent content',
        position: { start: 0, end: 10 },
        timestamp: 1000,
      },
      {
        id: 'user-1',
        sectionId: 'section-1',
        author: 'user',
        operation: 'insert',
        content: 'user content',
        position: { start: 5, end: 15 },
        timestamp: 1001,
      },
    ];

    const conflicts = findConflicts(patches);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].agentPatch.id).toBe('agent-1');
    expect(conflicts[0].userPatch.id).toBe('user-1');
  });

  it('should not find conflicts for non-overlapping patches', () => {
    const patches: Patch[] = [
      {
        id: 'agent-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'agent content',
        position: { start: 0, end: 5 },
        timestamp: 1000,
      },
      {
        id: 'user-1',
        sectionId: 'section-1',
        author: 'user',
        operation: 'insert',
        content: 'user content',
        position: { start: 10, end: 15 },
        timestamp: 1001,
      },
    ];

    const conflicts = findConflicts(patches);

    expect(conflicts).toHaveLength(0);
  });

  it('should not find conflicts for patches from the same author', () => {
    const patches: Patch[] = [
      {
        id: 'agent-1',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'agent content',
        position: { start: 0, end: 10 },
        timestamp: 1000,
      },
      {
        id: 'agent-2',
        sectionId: 'section-1',
        author: 'agent',
        operation: 'insert',
        content: 'more agent content',
        position: { start: 5, end: 15 },
        timestamp: 1001,
      },
    ];

    const conflicts = findConflicts(patches);

    expect(conflicts).toHaveLength(0);
  });
});
