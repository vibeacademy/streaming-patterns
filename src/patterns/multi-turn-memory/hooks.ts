/**
 * Multi-Turn Memory Timeline Pattern - Custom React Hook
 *
 * This file implements the useMemoryTimeline hook, which manages the complete
 * state lifecycle for the Multi-Turn Memory Timeline pattern.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Teaches memory state management, filtering, and user actions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Memory,
  Message,
  ConversationTurn,
  MemoryFilters,
  StreamEvent,
  UseMemoryTimelineReturn,
} from './types';
import { createMockMemoryStream, type MockStreamConfig } from './mockStream';

/**
 * Hook configuration options.
 */
export interface UseMemoryTimelineConfig extends MockStreamConfig {
  /** Optional: Callback when events are emitted (for network inspector) */
  onEvent?: (event: StreamEvent) => void;

  /** Optional: Enable auto-start streaming */
  autoStart?: boolean;
}

/**
 * useMemoryTimeline - Core hook for Multi-Turn Memory Timeline pattern
 *
 * This hook demonstrates how to:
 * 1. Manage memory state using Map for O(1) lookups
 * 2. Process streaming events and update state reactively
 * 3. Implement user actions (pin, prune, filter)
 * 4. Organize conversation into structured turns
 * 5. Apply client-side filtering efficiently
 *
 * Educational Note: Using Map instead of array for memories enables fast
 * lookups by ID, which is critical when processing updates and prunes.
 *
 * @param config - Hook configuration
 * @returns Memory timeline state and actions
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { memories, messages, actions, isStreaming } = useMemoryTimeline({
 *     speed: 'normal',
 *     onEvent: (event) => console.log(event),
 *   });
 *
 *   return (
 *     <div>
 *       <MemoryTimeline memories={memories} onPin={actions.togglePin} />
 *       <ChatThread messages={messages} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemoryTimeline(
  config: UseMemoryTimelineConfig = {}
): UseMemoryTimelineReturn {
  const { onEvent, autoStart = true, ...streamConfig } = config;

  // ========== State Management ==========
  // Educational Note: Using Map for memories provides O(1) lookups when processing
  // update and prune events. This is more efficient than array.find().
  const [memories, setMemories] = useState<Map<string, Memory>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Filters are managed separately to avoid re-processing on every filter change
  const [filters, setFiltersState] = useState<MemoryFilters>({
    types: [],
    searchQuery: '',
    pinnedOnly: false,
  });

  // ========== Stream Processing ==========
  /**
   * Process incoming stream events and update state.
   *
   * Educational Note: This effect demonstrates the core pattern of processing
   * streaming events. Each event type triggers specific state updates.
   */
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    setIsStreaming(true);

    (async () => {
      try {
        const stream = createMockMemoryStream(streamConfig);

        for await (const event of stream) {
          if (cancelled) break;

          // Notify external listeners (e.g., network inspector)
          if (onEvent) {
            onEvent(event);
          }

          // Process event based on type
          switch (event.type) {
            case 'memory.create':
              setMemories((prev) => {
                const newMemories = new Map(prev);
                newMemories.set(event.data.id, {
                  id: event.data.id,
                  memoryType: event.data.memoryType,
                  summary: event.data.summary,
                  tokenExcerpt: event.data.tokenExcerpt,
                  timestamp: event.timestamp,
                  pinned: false,
                  ttl: event.data.ttl,
                  metadata: event.data.metadata,
                });
                return newMemories;
              });
              break;

            case 'memory.update':
              setMemories((prev) => {
                const newMemories = new Map(prev);
                const existing = newMemories.get(event.data.id);

                if (existing) {
                  newMemories.set(event.data.id, {
                    ...existing,
                    ...event.data.updates,
                    // Preserve timestamp and pinned status
                    timestamp: existing.timestamp,
                    pinned: existing.pinned,
                  });
                }

                return newMemories;
              });
              break;

            case 'memory.prune':
              setMemories((prev) => {
                const newMemories = new Map(prev);
                newMemories.delete(event.data.id);
                return newMemories;
              });
              break;

            case 'message':
              setMessages((prev) => [
                ...prev,
                {
                  id: event.data.id,
                  role: event.data.role,
                  content: event.data.content,
                  turnNumber: event.data.turnNumber,
                  timestamp: event.timestamp,
                },
              ]);
              break;

            // memory.pin events are user-initiated, handled by togglePin action
            default:
              break;
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        if (!cancelled) {
          setIsStreaming(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]); // Only depend on autoStart to prevent infinite loops from object recreation

  // ========== Conversation Turns ==========
  /**
   * Organize messages into conversation turns.
   *
   * Educational Note: Turns group user/agent message pairs, making it easier
   * to visualize the conversation flow and associate memories with specific turns.
   */
  const turns = useMemo<ConversationTurn[]>(() => {
    const turnMap = new Map<number, ConversationTurn>();

    messages.forEach((msg) => {
      if (!turnMap.has(msg.turnNumber)) {
        turnMap.set(msg.turnNumber, {
          turnNumber: msg.turnNumber,
          userMessage: {} as Message, // Will be filled
          agentMessage: {} as Message, // Will be filled
          memoriesCreated: [],
          memoriesUpdated: [],
          memoriesPruned: [],
        });
      }

      const turn = turnMap.get(msg.turnNumber)!;

      if (msg.role === 'user') {
        turn.userMessage = msg;
      } else {
        turn.agentMessage = msg;
      }
    });

    return Array.from(turnMap.values()).sort((a, b) => a.turnNumber - b.turnNumber);
  }, [messages]);

  // ========== Filtered Memories ==========
  /**
   * Apply filters to memories for display.
   *
   * Educational Note: Filtering happens client-side using useMemo for performance.
   * This avoids re-filtering on every render.
   */
  const filteredMemories = useMemo<Memory[]>(() => {
    let result = Array.from(memories.values());

    // Filter by type
    if (filters.types.length > 0) {
      result = result.filter((mem) => filters.types.includes(mem.memoryType));
    }

    // Filter by pinned status
    if (filters.pinnedOnly) {
      result = result.filter((mem) => mem.pinned);
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (mem) =>
          mem.summary.toLowerCase().includes(query) ||
          mem.tokenExcerpt.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);

    return result;
  }, [memories, filters]);

  // ========== User Actions ==========
  /**
   * Toggle pin status for a memory.
   *
   * Educational Note: This is an optimistic update - we update local state
   * immediately and would send the pin event to the server in a real implementation.
   */
  const togglePin = useCallback((memoryId: string) => {
    setMemories((prev) => {
      const newMemories = new Map(prev);
      const memory = newMemories.get(memoryId);

      if (memory) {
        newMemories.set(memoryId, {
          ...memory,
          pinned: !memory.pinned,
        });

        // In a real app, emit memory.pin event to server here
        if (onEvent) {
          onEvent({
            type: 'memory.pin',
            timestamp: Date.now(),
            data: {
              id: memoryId,
              pinned: !memory.pinned,
            },
          });
        }
      }

      return newMemories;
    });
  }, [onEvent]);

  /**
   * Manually prune a memory.
   *
   * Educational Note: Users can prune irrelevant memories to clean up the timeline.
   * This demonstrates user control over AI memory.
   */
  const pruneMemory = useCallback((memoryId: string, reason: string) => {
    setMemories((prev) => {
      const newMemories = new Map(prev);
      newMemories.delete(memoryId);
      return newMemories;
    });

    // Emit prune event for network inspector
    if (onEvent) {
      onEvent({
        type: 'memory.prune',
        timestamp: Date.now(),
        data: {
          id: memoryId,
          reason,
        },
      });
    }
  }, [onEvent]);

  /**
   * Update filter criteria.
   *
   * Educational Note: Partial updates allow changing one filter at a time
   * without resetting others.
   */
  const setFilters = useCallback((newFilters: Partial<MemoryFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Send a new user message (starts a new turn).
   *
   * Educational Note: In a real implementation, this would send a message to
   * the server and trigger a new agent response stream.
   */
  const sendMessage = useCallback((content: string) => {
    // For demo, just log
    console.log('Send message:', content);
    // In real app: emit message event, trigger server response
  }, []);

  // ========== Return Hook Interface ==========
  return {
    memories,
    messages,
    turns,
    isStreaming,
    filters,
    filteredMemories,
    actions: {
      togglePin,
      pruneMemory,
      setFilters,
      sendMessage,
    },
  };
}
