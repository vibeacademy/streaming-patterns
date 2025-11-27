/**
 * Turn-Taking Co-Creation Pattern - Patch Merge Engine
 *
 * This file implements the core logic for applying patches to documents,
 * detecting conflicts, and resolving them according to merge strategies.
 *
 * @pattern Turn-Taking Co-Creation
 * @educational Teaches operational transform concepts, conflict resolution, authorship tracking
 */

import type {
  Patch,
  DocumentSection,
  Author,
  AuthorshipSpan,
  MergeResult,
  MergeConfig,
} from './types';

/**
 * Apply a single patch to document content.
 *
 * Educational Note: This is a simplified patch application. Production systems
 * would use operational transform (OT) or CRDTs for more robust conflict handling.
 *
 * @param content - Current content of the section
 * @param patch - Patch to apply
 * @returns Updated content after applying the patch
 */
export function applyPatch(content: string, patch: Patch): string {
  const { operation, position, content: newContent } = patch;

  switch (operation) {
    case 'insert': {
      // Insert new content at position.start
      return (
        content.substring(0, position.start) +
        newContent +
        content.substring(position.start)
      );
    }

    case 'replace': {
      // Replace content between start and end with new content
      return (
        content.substring(0, position.start) +
        newContent +
        content.substring(position.end)
      );
    }

    case 'delete': {
      // Remove content between start and end
      return (
        content.substring(0, position.start) +
        content.substring(position.end)
      );
    }

    default: {
      // TypeScript ensures exhaustive checking
      const _exhaustive: never = operation;
      throw new Error(`Unknown operation: ${_exhaustive}`);
    }
  }
}

/**
 * Check if two patches overlap (edit the same region).
 *
 * Educational Note: Overlap detection is key to conflict resolution.
 * Patches overlap if their position ranges intersect.
 *
 * @param p1 - First patch
 * @param p2 - Second patch
 * @returns True if patches overlap
 */
export function patchesOverlap(p1: Patch, p2: Patch): boolean {
  // Different sections never overlap
  if (p1.sectionId !== p2.sectionId) {
    return false;
  }

  const { start: s1, end: e1 } = p1.position;
  const { start: s2, end: e2 } = p2.position;

  // Check if ranges intersect
  return s1 < e2 && s2 < e1;
}

/**
 * Merge two patches according to the merge strategy.
 *
 * Educational Note: This demonstrates simplified conflict resolution.
 * Real systems use operational transform or CRDTs for automatic merging.
 *
 * @param agentPatch - Patch from the agent
 * @param userPatch - Patch from the user
 * @param config - Merge configuration
 * @returns Merge result with winning patch and authorship
 */
export function mergePatches(
  agentPatch: Patch,
  userPatch: Patch,
  config: MergeConfig
): MergeResult {
  // Check if patches overlap
  if (!patchesOverlap(agentPatch, userPatch)) {
    // No conflict - both patches can be applied
    // Apply in timestamp order
    const firstPatch = agentPatch.timestamp < userPatch.timestamp ? agentPatch : userPatch;
    const secondPatch = agentPatch.timestamp < userPatch.timestamp ? userPatch : agentPatch;

    return {
      success: true,
      patch: secondPatch, // Return the later patch (both will be applied)
      authorshipSpans: [
        createAuthorshipSpan(firstPatch),
        createAuthorshipSpan(secondPatch),
      ],
    };
  }

  // Patches overlap - resolve conflict based on strategy
  switch (config.strategy) {
    case 'user_priority': {
      // User wins - return user patch
      return {
        success: true,
        patch: userPatch,
        authorshipSpans: [createAuthorshipSpan(userPatch)],
      };
    }

    case 'agent_priority': {
      // Agent wins - return agent patch
      return {
        success: true,
        patch: agentPatch,
        authorshipSpans: [createAuthorshipSpan(agentPatch)],
      };
    }

    case 'merge': {
      // Attempt to merge both patches
      // For simplicity, we'll concatenate the content with both authors
      const mergedContent = `${userPatch.content} [Agent: ${agentPatch.content}]`;
      const mergedPatch: Patch = {
        ...userPatch,
        content: mergedContent,
        metadata: {
          ...userPatch.metadata,
          merged: true,
          originalAgentContent: agentPatch.content,
        },
      };

      return {
        success: true,
        patch: mergedPatch,
        authorshipSpans: [
          createAuthorshipSpan(userPatch),
          {
            start: userPatch.content.length,
            end: mergedContent.length,
            author: 'agent',
            patchId: agentPatch.id,
          },
        ],
      };
    }

    default: {
      const _exhaustive: never = config.strategy;
      throw new Error(`Unknown merge strategy: ${_exhaustive}`);
    }
  }
}

/**
 * Create an authorship span from a patch.
 *
 * Educational Note: Authorship spans track who wrote which parts of the document.
 * This enables color-coded visualization in the UI.
 *
 * @param patch - Patch to create span from
 * @returns Authorship span
 */
function createAuthorshipSpan(patch: Patch): AuthorshipSpan {
  return {
    start: patch.position.start,
    end: patch.position.start + patch.content.length,
    author: patch.author,
    patchId: patch.id,
  };
}

/**
 * Internal type for tracking authorship at character level during replay.
 * Not exported - only used within buildAuthorshipSpans.
 */
interface CharacterMeta {
  author: Author;
  patchId: string;
}

/**
 * Convert character-level metadata to authorship spans.
 *
 * Educational Note: This function walks through the character metadata array
 * and groups consecutive characters with the same author into spans.
 * This naturally handles merging adjacent spans from the same author.
 *
 * @param charMeta - Array of per-character authorship metadata
 * @returns Array of authorship spans
 */
function buildSpansFromCharMeta(charMeta: CharacterMeta[]): AuthorshipSpan[] {
  if (charMeta.length === 0) return [];

  const spans: AuthorshipSpan[] = [];
  let currentSpan: AuthorshipSpan = {
    start: 0,
    end: 1,
    author: charMeta[0].author,
    patchId: charMeta[0].patchId,
  };

  for (let i = 1; i < charMeta.length; i++) {
    const meta = charMeta[i];

    // If same author, extend current span
    if (meta.author === currentSpan.author) {
      currentSpan.end = i + 1;
    } else {
      // Different author - save current span and start new one
      spans.push({ ...currentSpan });
      currentSpan = {
        start: i,
        end: i + 1,
        author: meta.author,
        patchId: meta.patchId,
      };
    }
  }

  // Don't forget the last span
  spans.push({ ...currentSpan });

  return spans;
}

/**
 * Build authorship spans for an entire document section.
 *
 * Educational Note: This function reconstructs authorship by replaying all patches
 * in order and tracking which characters came from which author. This approach
 * correctly handles:
 * - REPLACE operations that overwrite previous authorship
 * - Superseded patches (filtered out before replay)
 * - Position shifts from insert/delete operations
 *
 * The algorithm is similar to how collaborative editors like Google Docs track
 * authorship - by maintaining character-level metadata as edits are applied.
 *
 * @param section - Document section with patches
 * @returns Array of authorship spans covering the content
 */
export function buildAuthorshipSpans(section: DocumentSection): AuthorshipSpan[] {
  const { patches } = section;

  // Handle empty patches
  if (patches.length === 0) return [];

  // Step 1: Filter out superseded patches
  // A patch is superseded if another patch's `supersedes` field references its ID
  const supersededIds = new Set<string>();
  for (const patch of patches) {
    if (patch.supersedes) {
      supersededIds.add(patch.supersedes);
    }
  }
  const activePatches = patches.filter((p) => !supersededIds.has(p.id));

  // Handle case where all patches are superseded
  if (activePatches.length === 0) return [];

  // Step 2: Sort by timestamp (application order)
  const sortedPatches = [...activePatches].sort((a, b) => a.timestamp - b.timestamp);

  // Step 3: Replay patches with character-level tracking
  // Each element tracks: { author, patchId } for that character position
  let charMeta: CharacterMeta[] = [];

  for (const patch of sortedPatches) {
    const { operation, position, content, author, id: patchId } = patch;
    const { start, end } = position;

    // Create metadata for new characters
    const newMeta: CharacterMeta[] = content
      ? Array.from({ length: content.length }, () => ({ author, patchId }))
      : [];

    switch (operation) {
      case 'insert': {
        // Insert at position.start
        // For insert, start === end (insertion point)
        charMeta = [
          ...charMeta.slice(0, start),
          ...newMeta,
          ...charMeta.slice(start),
        ];
        break;
      }

      case 'replace': {
        // Remove [start, end) and insert new content
        // This correctly handles authorship transfer: the replaced region's
        // authorship is removed and new authorship is assigned
        charMeta = [
          ...charMeta.slice(0, start),
          ...newMeta,
          ...charMeta.slice(end),
        ];
        break;
      }

      case 'delete': {
        // Remove [start, end) - authorship of deleted characters is lost
        charMeta = [...charMeta.slice(0, start), ...charMeta.slice(end)];
        break;
      }

      default: {
        // TypeScript exhaustive check
        const _exhaustive: never = operation;
        throw new Error(`Unknown operation: ${_exhaustive}`);
      }
    }
  }

  // Step 4: Build spans from character metadata
  return buildSpansFromCharMeta(charMeta);
}

/**
 * Adjust patch positions after another patch is applied.
 *
 * Educational Note: This is operational transform (OT) - when patches are
 * applied concurrently, their positions must be adjusted to account for
 * earlier edits.
 *
 * @param patch - Patch to adjust
 * @param appliedPatch - Patch that was already applied
 * @returns Adjusted patch with updated positions
 */
export function adjustPatchPosition(patch: Patch, appliedPatch: Patch): Patch {
  // Different sections don't affect each other
  if (patch.sectionId !== appliedPatch.sectionId) {
    return patch;
  }

  const { start, end } = patch.position;
  const { position: appliedPos, operation, content } = appliedPatch;

  // Calculate offset caused by the applied patch
  let offset = 0;
  if (operation === 'insert') {
    offset = content.length;
  } else if (operation === 'replace') {
    offset = content.length - (appliedPos.end - appliedPos.start);
  } else if (operation === 'delete') {
    offset = -(appliedPos.end - appliedPos.start);
  }

  // Adjust positions if patch is after the applied patch
  let newStart = start;
  let newEnd = end;

  if (start >= appliedPos.end) {
    // Patch is entirely after applied patch - shift by offset
    newStart = start + offset;
    newEnd = end + offset;
  } else if (start >= appliedPos.start && start < appliedPos.end) {
    // Patch starts inside applied patch - complex case
    // For simplicity, move to end of applied patch
    newStart = appliedPos.start + content.length;
    newEnd = newStart + (end - start);
  }

  return {
    ...patch,
    position: {
      start: newStart,
      end: newEnd,
    },
  };
}

/**
 * Calculate patch statistics for instrumentation.
 *
 * Educational Note: Tracking patch metrics helps understand collaboration patterns.
 * Who makes more edits? Where do conflicts happen?
 *
 * @param patches - Array of patches to analyze
 * @returns Statistics object
 */
export function calculatePatchStats(patches: Patch[]): {
  total: number;
  byAuthor: Record<Author, number>;
  byOperation: Record<string, number>;
  conflicts: number;
} {
  const byAuthor: Record<Author, number> = {
    agent: 0,
    user: 0,
  };

  const byOperation: Record<string, number> = {
    insert: 0,
    replace: 0,
    delete: 0,
  };

  let conflicts = 0;

  for (const patch of patches) {
    byAuthor[patch.author]++;
    byOperation[patch.operation]++;

    if (patch.supersedes) {
      conflicts++;
    }
  }

  return {
    total: patches.length,
    byAuthor,
    byOperation,
    conflicts,
  };
}

/**
 * Reconstruct document content from patches.
 *
 * Educational Note: This demonstrates how to rebuild the entire document
 * by replaying all patches in order. Useful for undo/redo and debugging.
 *
 * @param initialContent - Starting content (usually empty)
 * @param patches - Patches to apply in order
 * @returns Final content after all patches
 */
export function reconstructContent(initialContent: string, patches: Patch[]): string {
  // Sort patches by timestamp
  const sortedPatches = [...patches].sort((a, b) => a.timestamp - b.timestamp);

  let content = initialContent;

  for (const patch of sortedPatches) {
    content = applyPatch(content, patch);
  }

  return content;
}

/**
 * Find conflicting patches in a set.
 *
 * Educational Note: Conflict detection is important for showing users
 * where simultaneous edits occurred and need resolution.
 *
 * @param patches - Patches to check for conflicts
 * @returns Array of conflicting patch pairs
 */
export function findConflicts(
  patches: Patch[]
): Array<{ agentPatch: Patch; userPatch: Patch }> {
  const conflicts: Array<{ agentPatch: Patch; userPatch: Patch }> = [];

  for (let i = 0; i < patches.length; i++) {
    for (let j = i + 1; j < patches.length; j++) {
      const p1 = patches[i];
      const p2 = patches[j];

      // Check if one is agent and one is user
      if (p1.author !== p2.author && patchesOverlap(p1, p2)) {
        const agentPatch = p1.author === 'agent' ? p1 : p2;
        const userPatch = p1.author === 'user' ? p1 : p2;

        conflicts.push({ agentPatch, userPatch });
      }
    }
  }

  return conflicts;
}
