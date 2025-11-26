/**
 * Multi-Turn Memory Timeline Pattern - TypeScript Type Definitions
 *
 * This file defines the type system for the Multi-Turn Memory Timeline pattern,
 * which demonstrates how to surface and manage an agent's evolving memory across
 * multiple conversation turns.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Teaches memory state management, provenance transparency, user control over AI context
 */

/**
 * Memory types categorize different kinds of information the agent remembers.
 *
 * - fact: Objective information (team size, budget, dates)
 * - decision: Choices made during the conversation
 * - task: Action items or to-dos identified
 * - risk: Potential issues or concerns flagged
 */
export type MemoryType = 'fact' | 'decision' | 'task' | 'risk';

/**
 * Memory represents a single piece of information the agent remembers.
 *
 * Educational Note: Memories have lifecycle (created, updated, pruned) and provenance
 * (token excerpt shows where it came from). This transparency builds user trust.
 */
export interface Memory {
  /** Unique identifier for this memory */
  id: string;

  /** Category of memory for filtering and visual styling */
  memoryType: MemoryType;

  /** Human-readable summary of what is remembered */
  summary: string;

  /** The exact token excerpt from the stream that created this memory */
  tokenExcerpt: string;

  /** When this memory was created */
  timestamp: number;

  /** Whether user has pinned this memory (prevents auto-pruning) */
  pinned: boolean;

  /** Optional: Time-to-live in seconds before auto-pruning */
  ttl?: number;

  /** Optional: Additional metadata */
  metadata?: {
    source?: 'user' | 'agent';
    confidence?: number;
    [key: string]: unknown;
  };
}

/**
 * Stream event types for memory lifecycle management.
 *
 * Educational Note: These events demonstrate how to expose memory state changes
 * to the UI in real-time, allowing users to see how the agent's understanding evolves.
 */
export type MemoryEventType =
  | 'memory.create'
  | 'memory.update'
  | 'memory.prune'
  | 'memory.pin'
  | 'message';

/**
 * Base interface for all memory-related stream events.
 */
interface BaseMemoryEvent {
  type: MemoryEventType;
  timestamp: number;
}

/**
 * Event emitted when a new memory is created by the agent.
 *
 * Educational Note: Memory creation should happen during or immediately after
 * the agent processes new information. The tokenExcerpt provides provenance.
 */
export interface MemoryCreateEvent extends BaseMemoryEvent {
  type: 'memory.create';
  data: {
    id: string;
    memoryType: MemoryType;
    summary: string;
    tokenExcerpt: string;
    ttl?: number;
    metadata?: Memory['metadata'];
  };
}

/**
 * Event emitted when an existing memory is updated.
 *
 * Educational Note: Memories can evolve as the conversation progresses.
 * For example, "Budget: $500k" might update to "Budget: $600k".
 */
export interface MemoryUpdateEvent extends BaseMemoryEvent {
  type: 'memory.update';
  data: {
    id: string;
    updates: {
      summary?: string;
      tokenExcerpt?: string;
      memoryType?: MemoryType;
      metadata?: Memory['metadata'];
    };
  };
}

/**
 * Event emitted when a memory is pruned (removed from active set).
 *
 * Educational Note: Pruning manages context window size. Memories can be
 * auto-pruned (TTL expires) or manually pruned by the user.
 */
export interface MemoryPruneEvent extends BaseMemoryEvent {
  type: 'memory.prune';
  data: {
    id: string;
    reason: string;
  };
}

/**
 * Event emitted when user pins or unpins a memory.
 *
 * Educational Note: This is a user-initiated action sent to the server.
 * Pinned memories persist across turns and prevent auto-pruning.
 */
export interface MemoryPinEvent extends BaseMemoryEvent {
  type: 'memory.pin';
  data: {
    id: string;
    pinned: boolean;
  };
}

/**
 * Regular conversation message event.
 *
 * Educational Note: Messages and memories stream in parallel. This demonstrates
 * how to manage multiple concurrent streams in a single UI.
 */
export interface MessageEvent extends BaseMemoryEvent {
  type: 'message';
  data: {
    id: string;
    role: 'user' | 'agent';
    content: string;
    turnNumber: number;
  };
}

/**
 * Union type of all possible stream events.
 */
export type StreamEvent =
  | MemoryCreateEvent
  | MemoryUpdateEvent
  | MemoryPruneEvent
  | MemoryPinEvent
  | MessageEvent;

/**
 * Conversation message in the chat thread.
 */
export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  turnNumber: number;
  timestamp: number;
}

/**
 * Conversation turn groups a user message and agent response.
 *
 * Educational Note: Multi-turn conversations are structured as alternating
 * user/agent pairs. Each turn can create, update, or prune memories.
 */
export interface ConversationTurn {
  turnNumber: number;
  userMessage: Message;
  agentMessage: Message;
  memoriesCreated: string[]; // Memory IDs created in this turn
  memoriesUpdated: string[]; // Memory IDs updated in this turn
  memoriesPruned: string[]; // Memory IDs pruned in this turn
}

/**
 * Memory filter criteria for UI filtering.
 *
 * Educational Note: Filtering allows users to focus on specific memory types
 * or search for specific content. All filtering is client-side for performance.
 */
export interface MemoryFilters {
  /** Filter by memory type (empty array = show all) */
  types: MemoryType[];

  /** Search query for summary or tokenExcerpt */
  searchQuery: string;

  /** Show only pinned memories */
  pinnedOnly: boolean;
}

/**
 * State managed by the useMemoryTimeline hook.
 *
 * Educational Note: This interface demonstrates the complete state needed
 * to implement the Multi-Turn Memory Timeline pattern.
 */
export interface MemoryTimelineState {
  /** All active memories (Map for fast lookups by ID) */
  memories: Map<string, Memory>;

  /** Conversation messages in order */
  messages: Message[];

  /** Conversation structured as turns */
  turns: ConversationTurn[];

  /** Whether the stream is currently active */
  isStreaming: boolean;

  /** Current active filters */
  filters: MemoryFilters;

  /** Filtered and sorted memories for display */
  filteredMemories: Memory[];
}

/**
 * Actions for memory management.
 *
 * Educational Note: These actions demonstrate user control over AI memory.
 * Users can pin important facts or prune irrelevant information.
 */
export interface MemoryActions {
  /** Pin or unpin a memory */
  togglePin: (memoryId: string) => void;

  /** Manually prune a memory */
  pruneMemory: (memoryId: string, reason: string) => void;

  /** Update filter criteria */
  setFilters: (filters: Partial<MemoryFilters>) => void;

  /** Send a new user message (starts new turn) */
  sendMessage: (content: string) => void;
}

/**
 * Return type of useMemoryTimeline hook.
 */
export interface UseMemoryTimelineReturn extends MemoryTimelineState {
  actions: MemoryActions;
}
