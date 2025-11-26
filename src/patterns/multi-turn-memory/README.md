# Multi-Turn Memory Timeline

## Intent

Make agent memory **visible**, **manageable**, and **transparent** across multi-turn conversations, enabling users to understand, control, and correct what the AI remembers.

## The Problem

LLMs maintain context across conversation turns, but users can't see what the model "remembers" or correct misconceptions. This creates trust issues:
- Users don't know if the AI forgot important details
- AI might remember wrong information
- Users can't prune irrelevant memories cluttering the context
- No provenance showing where memories came from

## The Pattern

The Multi-Turn Memory Timeline pattern surfaces agent memory as **explicit, visual artifacts** that users can inspect, pin, and prune.

### Key Components

1. **Memory Timeline**: Horizontal scrollable timeline showing all active memories
2. **Memory Cards**: Individual memory artifacts with type, summary, and provenance
3. **Memory Lifecycle**: Create, update, and prune events
4. **User Control**: Pin (prevent auto-pruning) and prune (manually remove) actions
5. **Provenance**: Hover tooltips showing exact token excerpts
6. **Filters**: Search, type filtering, and pinned-only views

## Demo Scenario

**StreamFlow PM Q4 Planning**

A product manager discusses Q4 goals across 3 conversation turns:
- Turn 1: Team size, budget, timeline
- Turn 2: Feature prioritization, risk identification
- Turn 3: Budget increase, resource reallocation

Watch how the agent:
- Creates memories for facts, decisions, tasks, and risks
- Updates memories when information changes (budget $500k → $600k)
- Prunes superseded memories (capacity risk resolved)

## UX Flow

```
1. User sends message
   ↓
2. Agent processes and responds
   ↓
3. Memory events stream alongside messages:
   - memory.create: "Budget: $500k" (fact)
   - memory.create: "Deadline: Dec 31" (fact)
   - memory.create: "Priority: Authentication" (decision)
   ↓
4. User continues conversation
   ↓
5. Agent updates memory:
   - memory.update: "Budget: $600k (increased from $500k)"
   ↓
6. User pins important memory (prevents pruning)
   ↓
7. User prunes irrelevant memory
```

## Stream Contract

### Memory Create Event
```typescript
{
  type: 'memory.create',
  timestamp: 1699545606000,
  data: {
    id: 'mem-001',
    memoryType: 'fact' | 'decision' | 'task' | 'risk',
    summary: 'Budget approved: $500k',
    tokenExcerpt: '...approved a budget of $500k for Q4...',
    ttl?: 3600, // seconds until auto-prune
    metadata?: {
      source: 'user' | 'agent',
      confidence: 0.95
    }
  }
}
```

### Memory Update Event
```typescript
{
  type: 'memory.update',
  timestamp: 1699545700000,
  data: {
    id: 'mem-001',
    updates: {
      summary: 'Budget increased to $600k'
    }
  }
}
```

### Memory Prune Event
```typescript
{
  type: 'memory.prune',
  timestamp: 1699545800000,
  data: {
    id: 'mem-002',
    reason: 'Superseded by newer information'
  }
}
```

### User Pin Event
```typescript
{
  type: 'memory.pin',
  timestamp: 1699545900000,
  data: {
    id: 'mem-001',
    pinned: true
  }
}
```

## UI Techniques

### 1. Memory Types with Visual Distinction
- **Facts** (blue): Objective information (team size, budget, dates)
- **Decisions** (green): Choices made during conversation
- **Tasks** (amber): Action items identified
- **Risks** (red): Potential issues flagged

### 2. Provenance Tooltips
Hover over any memory to see the exact token excerpt that created it:
```
📊 Team size: 8 engineers
   ↓ (hover)
Token Excerpt: "...we have a team of 8 engineers..."
```

### 3. Pin/Prune Actions
- **Pin** (📌): Prevents auto-pruning, persists across turns
- **Prune** (✕): Manually removes irrelevant memories

### 4. Horizontal Timeline
- Sticky positioning (visible while scrolling chat)
- Horizontal scroll for many memories
- Newest memories on the right

### 5. Filters
- Type filters (show only facts, decisions, etc.)
- Search (fuzzy match on summary and excerpt)
- Pinned-only view

## Implementation Guide

### 1. Types (`types.ts`)
```typescript
interface Memory {
  id: string;
  memoryType: 'fact' | 'decision' | 'task' | 'risk';
  summary: string;
  tokenExcerpt: string;
  timestamp: number;
  pinned: boolean;
  ttl?: number;
  metadata?: {
    source?: 'user' | 'agent';
    confidence?: number;
  };
}
```

### 2. Custom Hook (`hooks.ts`)
```typescript
function useMemoryTimeline(config) {
  const [memories, setMemories] = useState<Map<string, Memory>>(new Map());
  const [messages, setMessages] = useState<Message[]>([]);
  const [filters, setFilters] = useState<MemoryFilters>(...);

  useEffect(() => {
    // Process stream events
    for await (const event of stream) {
      switch (event.type) {
        case 'memory.create': // Add to map
        case 'memory.update': // Update in map
        case 'memory.prune': // Delete from map
        case 'message': // Add to messages
      }
    }
  }, []);

  const togglePin = useCallback((id) => {
    // Update pinned status
  }, []);

  return { memories, messages, filters, actions: { togglePin, ... } };
}
```

### 3. Memory Card Component
```typescript
function MemoryCard({ memory, onTogglePin, onPrune }) {
  return (
    <div className="memory-card" data-type={memory.memoryType}>
      <div className="icon">{getTypeIcon(memory.memoryType)}</div>
      <div className="summary">{memory.summary}</div>
      <div className="actions">
        <button onClick={() => onTogglePin(memory.id)}>
          {memory.pinned ? '📌' : '○'}
        </button>
        <button onClick={() => onPrune(memory.id)}>✕</button>
      </div>
      {/* Provenance tooltip on hover */}
      <div className="tooltip">{memory.tokenExcerpt}</div>
    </div>
  );
}
```

## Server Notes

### When to Create Memories
- **Facts**: Extract from user messages (team size, budget, dates)
- **Decisions**: User makes explicit choices ("Focus on auth first")
- **Tasks**: Action items identified ("Launch mobile app")
- **Risks**: Agent identifies potential issues

### When to Update Memories
- New information supersedes old ("Budget increased from $500k to $600k")
- Context clarifies earlier memory
- Confidence level changes

### When to Prune Memories
- TTL expires (configurable per memory)
- User manually prunes
- Memory becomes irrelevant (e.g., risk mitigated)

### Context Window Management
Use pinned memories to prevent important facts from being pruned during aggressive context window management.

## Instrumentation

Track these metrics:
- **Memory creation rate**: Memories per conversation turn
- **Memory types distribution**: Ratio of facts/decisions/tasks/risks
- **Pin rate**: % of memories pinned by users
- **Prune rate**: % of memories pruned by users
- **Memory lifespan**: Time from create to prune
- **Filter usage**: Which filters users apply most

## Accessibility

- Keyboard navigation: Tab through memory cards
- Screen reader labels: "Fact memory: Budget $500k. Created at 3:45 PM. Pinned."
- Focus indicators: Clear visual focus state
- ARIA live regions: Announce new memories

## Performance Considerations

- Use `Map` instead of array for O(1) memory lookups
- Memoize filtered results
- Virtual scrolling for 100+ memories
- Debounce search input

## Running the Demo

```bash
npm run dev
# Navigate to http://localhost:5173/patterns/multi-turn-memory
```

## Testing

```bash
# Run all tests
npm test src/patterns/multi-turn-memory

# Run specific test file
npm test MultiTurnMemoryDemo.test.tsx
```

## Files

- `MultiTurnMemoryDemo.tsx` - Main demo component
- `MemoryTimeline.tsx` - Horizontal timeline
- `MemoryCard.tsx` - Individual memory card
- `MemoryFilters.tsx` - Filter controls
- `ChatThread.tsx` - Conversation UI
- `hooks.ts` - useMemoryTimeline custom hook
- `mockStream.ts` - Mock stream generator
- `fixtures.ts` - Q4 planning conversation data
- `types.ts` - TypeScript interfaces

## Further Reading

- [LangChain Memory Concepts](https://python.langchain.com/docs/modules/memory/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
