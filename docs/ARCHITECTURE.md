# Architecture Deep Dive

This document provides a comprehensive technical overview of the streaming-patterns library's architecture. It explains how the mock streaming infrastructure works, how React components consume streams, and how all the pieces fit together to create educational pattern demonstrations.

**Audience**: This guide is written for intermediate React/TypeScript developers who want to understand the library's internals or contribute to the project.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Mock Streaming Infrastructure](#mock-streaming-infrastructure)
3. [Event Schema Design](#event-schema-design)
4. [React Hooks Architecture](#react-hooks-architecture)
5. [Network Inspector Implementation](#network-inspector-implementation)
6. [Pattern Component Structure](#pattern-component-structure)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)

---

## System Overview

The streaming-patterns library is built on a **mock-first architecture** that simulates Server-Sent Events (SSE) streaming without requiring real API endpoints or LLM services. This design enables:

- **Deterministic demonstrations**: Same input always produces the same output
- **Offline functionality**: No network requests, no API keys required
- **Educational transparency**: Stream mechanics are visible through the Network Inspector
- **Fast iteration**: No waiting for real API responses

### Core Principles

1. **Education Over Abstraction**: Code is readable and explicit, favoring clarity over DRY principles
2. **Mock Infrastructure is Core**: Mocks are not hacks—they're the educational foundation
3. **Components Own Their Logic**: Each pattern manages its own stream state via custom hooks
4. **Network Inspector First-Class**: Stream visibility is critical for learning

### Technology Stack

```
React 18+ (functional components, hooks, concurrent features)
├── TypeScript 5+ (strict mode, no any types)
├── Vite 5+ (fast HMR, optimized builds)
├── Vitest (Jest-compatible testing)
└── CSS Modules (scoped component styling)
```

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Pattern Demo Component                    │
│  (e.g., ChainOfReasoningDemo.tsx)                          │
│                                                             │
│  - UI Controls (speed, reset)                              │
│  - Scenario Context                                        │
│  - Reasoning Timeline / UI Components                      │
│  - Network Inspector                                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────────┐    ┌──────▼─────────┐
    │ Custom Hook  │    │ Network        │
    │ (useReasoning│    │ Capture Hook   │
    │  Stream)     │    │ (useNetwork    │
    │              │    │  Capture)      │
    └────┬─────────┘    └──────┬─────────┘
         │                     │
    ┌────▼─────────────────────▼──────┐
    │   useStreamProcessor Hook       │
    │   (Core streaming logic)        │
    └────┬──────────────────────┬─────┘
         │                      │
         │                      └─────> CapturedEvent[]
         │                               (for NetworkInspector)
    ┌────▼────────────────────────────┐
    │   Fixture Repository            │
    │   (getFixtureEvents)            │
    └────┬──────────────────────┬─────┘
         │                      │
    ┌────▼──────────┐     ┌─────▼──────────┐
    │ Fixture JSON  │     │ Event Schema   │
    │ (events[])    │     │ Validation     │
    └────┬──────────┘     └────────────────┘
         │
    ┌────▼────────────────────────────┐
    │   Mock SSE Generator            │
    │   (createMockStream)            │
    └────┬──────────────────────┬─────┘
         │                      │
    ┌────▼──────────┐     ┌─────▼──────────┐
    │ StreamSession │     │ StreamCursor   │
    │ (lifecycle)   │     │ (iteration)    │
    └───────────────┘     └────────────────┘
```

---

## Mock Streaming Infrastructure

The mock streaming infrastructure is the foundation of the library. It simulates SSE streams with realistic timing, pause/resume mechanics, and deterministic output.

### Core Components

#### 1. **Fixture Repository** (`src/lib/streaming/fixtureRepository.ts`)

The fixture repository is a centralized registry for managing mock data:

```typescript
interface Fixture {
  metadata: {
    id: string;                 // e.g., 'chain-of-reasoning-sprint-planning'
    name: string;               // Human-readable name
    pattern: string;            // Pattern name
    description: string;        // What this fixture demonstrates
    eventCount: number;         // Number of events
    tags: string[];             // For categorization
    version: string;            // Fixture format version
  };
  events: StreamEvent[];        // Array of stream events
}
```

**Key Features**:
- **Immutability**: Returns deep clones to prevent mutation
- **Validation**: Validates fixtures against event schema before registration
- **Discovery**: Supports finding fixtures by pattern, tag, or ID
- **Type Safety**: Full TypeScript support with strict types

**Usage Example**:
```typescript
import { registerFixture, getFixtureEvents } from '@/lib/streaming/fixtureRepository';

// Register a fixture (done once at app startup or in fixture files)
registerFixture({
  metadata: {
    id: 'chain-of-reasoning-sprint-planning',
    name: 'Sprint Planning Reasoning',
    pattern: 'chain-of-reasoning',
    description: 'AI planning a 2-week sprint with visible reasoning',
    eventCount: 6,
    tags: ['sprint', 'planning', 'reasoning'],
    version: '1.0'
  },
  events: [
    { id: '1', type: 'reasoning', timestamp: 1699920000000, data: {...} },
    { id: '2', type: 'reasoning', timestamp: 1699920300000, data: {...} },
    // ... more events
  ]
});

// Later, retrieve the events in a pattern
const events = getFixtureEvents('chain-of-reasoning-sprint-planning');
```

#### 2. **Stream Cursor** (`src/lib/streaming/streamCursor.ts`)

The StreamCursor manages iteration through fixture events:

```typescript
class StreamCursor {
  private events: StreamEvent[];
  private position: number = 0;

  hasNext(): boolean {
    return this.position < this.events.length;
  }

  next(): StreamEvent | null {
    if (!this.hasNext()) return null;
    return this.events[this.position++];
  }

  getPosition(): number {
    return this.position;
  }

  getTotalEvents(): number {
    return this.events.length;
  }

  getRemainingCount(): number {
    return this.events.length - this.position;
  }
}
```

**Purpose**: Encapsulates iteration logic, making StreamSession simpler and testable.

#### 3. **Stream Session** (`src/lib/streaming/streamSession.ts`)

StreamSession is an aggregate root managing the lifecycle of a single stream:

```typescript
type SessionState = 'idle' | 'active' | 'paused' | 'closed';

class StreamSession {
  private state: SessionState = 'idle';
  private cursor: StreamCursor;
  private delayProfile: 'fast' | 'normal' | 'slow';
  private isPaused: boolean = false;

  async *stream(): AsyncGenerator<EnrichedStreamEvent> {
    // Transition to active state
    this.state = 'active';

    const delayMs = this.getDelay(); // 50ms, 300ms, or 1000ms

    while (this.cursor.hasNext() && !this.isClosed()) {
      // Check for pause
      if (this.isPaused) {
        await this.waitForResume();
      }

      // Apply timing delay
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Get next event
      const event = this.cursor.next();
      if (!event) break;

      // Ensure monotonic timestamps
      const timestampedEvent = this.ensureMonotonicTimestamp(event);

      // Enrich with session metadata
      const enrichedEvent = this.enrichEvent(timestampedEvent);

      yield enrichedEvent;
    }

    // Auto-close when complete
    if (!this.isClosed()) {
      this.close();
    }
  }

  pause(): void {
    if (this.state !== 'active') {
      throw new Error(`Cannot pause session in ${this.state} state`);
    }
    this.state = 'paused';
    this.isPaused = true;
  }

  resume(): void {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume session in ${this.state} state`);
    }
    this.state = 'active';
    this.isPaused = false;
    // Resolve waiting promise...
  }

  close(): void {
    this.state = 'closed';
    this.isPaused = false;
    // Cleanup...
  }
}
```

**Invariants Enforced**:
- **INV-4**: Events emitted in fixture order (via cursor)
- **INV-5**: Timestamps monotonically increasing
- **INV-7**: Session closes cleanly when all events consumed
- **INV-8**: Cannot emit from closed session

**Delay Profiles**:
```typescript
const delays = {
  fast: 50,      // Quick demo (50ms between events)
  normal: 300,   // Realistic UX (300ms between events)
  slow: 1000     // Detailed observation (1s between events)
};
```

#### 4. **Mock SSE Generator** (`src/lib/streaming/mockSSE.ts`)

The main entry point for creating mock streams:

```typescript
interface CreateStreamOptions {
  events: StreamEvent[];           // Fixture events to stream
  delayProfile?: 'fast' | 'normal' | 'slow';
  sessionId?: string;              // Optional custom session ID
  enrichEvents?: boolean;          // Add metadata? (default: true)
}

async function* createMockStream(
  options: CreateStreamOptions
): AsyncGenerator<EnrichedStreamEvent> {
  const session = new StreamSession({
    sessionId: options.sessionId ?? generateSessionId(),
    events: options.events,
    delayProfile: options.delayProfile ?? 'normal',
    enrichEvents: options.enrichEvents ?? true
  });

  yield* session.stream();
}
```

**With Control Handle** (for pause/resume from UI):
```typescript
function createMockStreamWithHandle(options: CreateStreamOptions): {
  stream: AsyncGenerator<EnrichedStreamEvent>;
  handle: StreamHandle;
} {
  const session = new StreamSession(config);

  const handle = {
    sessionId: session.getSessionId(),
    pause: () => session.pause(),
    resume: () => session.resume(),
    close: () => session.close(),
    getState: () => session.getState(),
    getStatistics: () => session.getStatistics()
  };

  return {
    stream: session.stream(),
    handle
  };
}
```

**Usage in Patterns**:
```typescript
import { createMockStream } from '@/lib/streaming/mockSSE';

const stream = createMockStream({
  events: fixtureEvents,
  delayProfile: 'normal'
});

for await (const event of stream) {
  console.log(event.type, event.data);
}
```

---

## Event Schema Design

The library uses a **discriminated union** type system for events, enabling type-safe event handling with TypeScript.

### Base Event Structure

All events share a common base:

```typescript
interface BaseStreamEvent {
  id: string;           // Unique event identifier
  type: EventType;      // Discriminator: 'reasoning', 'answer', 'memory', etc.
  timestamp: number;    // Unix timestamp (milliseconds)
  sessionId?: string;   // Optional session ID
  data: unknown;        // Type-specific payload (refined by discriminator)
}
```

### Event Types

The library supports 15 event types across all patterns:

```typescript
type EventType =
  | 'reasoning'           // Chain-of-Reasoning: reasoning step
  | 'answer'              // Chain-of-Reasoning: final answer chunk
  | 'memory'              // Multi-Turn Memory: memory operation
  | 'await_input'         // Agent-Await-Prompt: request user input
  | 'input_submission'    // Agent-Await-Prompt: user's response
  | 'checkpoint'          // Validation Loop: validation checkpoint
  | 'validation'          // Validation Loop: validation result
  | 'schema'              // Tabular Stream View: table schema
  | 'table_row'           // Tabular Stream View: data row
  | 'table_meta'          // Tabular Stream View: completion status
  | 'agent_patch'         // Turn-Taking Co-Creation: agent edit
  | 'user_patch'          // Turn-Taking Co-Creation: user edit
  | 'schema_definition'   // Schema-Governed Exchange: schema def
  | 'payload'             // Schema-Governed Exchange: data payload
  | 'schema_error';       // Schema-Governed Exchange: validation error
```

### Example Event Schemas

#### Reasoning Event
```typescript
interface ReasoningEvent extends BaseStreamEvent {
  type: 'reasoning';
  data: {
    id: string;             // Step ID
    summary: string;        // Brief summary (e.g., "Analyzing backlog")
    confidence: number;     // 0.0 to 1.0
    timestamp: number;      // When step was created
    details?: string;       // Optional detailed explanation
  };
}
```

#### Answer Event
```typescript
interface AnswerEvent extends BaseStreamEvent {
  type: 'answer';
  data: {
    text: string;           // Answer text chunk
    isFinal: boolean;       // Is this the last chunk?
  };
}
```

#### Memory Event
```typescript
interface MemoryEvent extends BaseStreamEvent {
  type: 'memory';
  data: {
    id: string;
    operation: 'create' | 'update' | 'prune' | 'recall';
    content: string;        // Memory content
    importance: number;     // 0.0 to 1.0
    turn: number;           // Which conversation turn
    timestamp: number;
    tags?: string[];        // Optional tags
  };
}
```

### Runtime Validation

Events are validated at runtime using type guards:

```typescript
// src/lib/streaming/eventSchema.ts

export function isReasoningEvent(event: unknown): event is ReasoningEvent {
  if (!hasBaseEventFields(event)) return false;

  const e = event as Record<string, unknown>;
  if (e.type !== 'reasoning') return false;

  const data = e.data as Record<string, unknown> | undefined;
  if (!data) return false;

  return (
    isNonEmptyString(data.id) &&
    isNonEmptyString(data.summary) &&
    isValidConfidence(data.confidence) &&
    isValidTimestamp(data.timestamp)
  );
}

export function isStreamEvent(event: unknown): event is StreamEvent {
  return (
    isReasoningEvent(event) ||
    isAnswerEvent(event) ||
    isMemoryEvent(event) ||
    // ... other type guards
  );
}
```

**Usage**:
```typescript
import { isReasoningEvent } from '@/lib/streaming/eventSchema';

function processEvent(event: StreamEvent) {
  if (isReasoningEvent(event)) {
    // TypeScript knows event.data.summary exists
    console.log('Reasoning:', event.data.summary);
  }
}
```

### Enriched Events

Events from the mock SSE system are enriched with session metadata:

```typescript
interface SessionMetadata {
  source: 'mock';
  sessionId: string;
  sequenceNumber: number;  // Event number within session
}

type EnrichedStreamEvent = StreamEvent & {
  sessionId?: string;
  metadata?: SessionMetadata;
};
```

This metadata is added by `StreamSession` and is useful for debugging and the Network Inspector.

---

## React Hooks Architecture

The library uses a layered hook architecture, from low-level stream processing to pattern-specific state management.

### Layer 1: Core Stream Processor

**`useStreamProcessor`** (`src/lib/hooks/useStreamProcessor.ts`)

This is the foundational hook used by all patterns. It:
- Consumes async generators from the mock SSE system
- Manages streaming state (events, isStreaming, errors)
- Provides pause/resume/reset controls
- Integrates with Network Inspector via `onEvent` callback
- Ensures proper cleanup to prevent memory leaks

**Interface**:
```typescript
interface UseStreamProcessorOptions {
  fixtureId: string;                          // Fixture to load
  delayProfile?: 'fast' | 'normal' | 'slow'; // Timing control
  onEvent?: (event: StreamEvent) => void;     // Event callback
  autoStart?: boolean;                        // Auto-start? (default: true)
}

interface UseStreamProcessorResult<T extends StreamEvent> {
  events: T[];              // All events received so far
  isStreaming: boolean;     // Currently active?
  error: Error | null;      // Error if failed
  pause: () => void;        // Pause emission
  resume: () => void;       // Resume emission
  reset: () => void;        // Reset and restart
  state: string;            // Session state
  eventCount: number;       // Number of events
}
```

**Implementation Highlights**:
```typescript
export function useStreamProcessor<T extends StreamEvent = StreamEvent>(
  options: UseStreamProcessorOptions
): UseStreamProcessorResult<T> {
  const { fixtureId, delayProfile = 'normal', onEvent, autoStart = true } = options;

  const [events, setEvents] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const streamHandleRef = useRef<StreamHandle | null>(null);
  const consumptionCancelledRef = useRef(false);
  const mountedRef = useRef(true);

  const startStream = useCallback(() => {
    setEvents([]);
    setError(null);
    setIsStreaming(true);
    consumptionCancelledRef.current = false;

    (async () => {
      try {
        // Load fixture from repository
        const fixtureEvents = getFixtureEvents(fixtureId);

        // Create mock stream with handle
        const { stream, handle } = createMockStreamWithHandle({
          events: fixtureEvents,
          delayProfile
        });

        streamHandleRef.current = handle;

        // Consume stream
        for await (const enrichedEvent of stream) {
          if (consumptionCancelledRef.current || !mountedRef.current) {
            handle.close();
            break;
          }

          const event = enrichedEvent as unknown as T;
          setEvents(prev => [...prev, event]);

          // Call onEvent callback for Network Inspector
          if (onEvent) {
            onEvent(event);
          }
        }

        if (!consumptionCancelledRef.current && mountedRef.current) {
          setIsStreaming(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsStreaming(false);
        }
      }
    })();
  }, [fixtureId, delayProfile, onEvent]);

  const pause = useCallback(() => {
    if (streamHandleRef.current) {
      streamHandleRef.current.pause();
      setIsStreaming(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (streamHandleRef.current) {
      streamHandleRef.current.resume();
      setIsStreaming(true);
    }
  }, []);

  const reset = useCallback(() => {
    if (streamHandleRef.current) {
      streamHandleRef.current.close();
      consumptionCancelledRef.current = true;
    }
    setTimeout(() => {
      if (mountedRef.current) {
        startStream();
      }
    }, 0);
  }, [startStream]);

  useEffect(() => {
    if (autoStart) {
      startStream();
    }

    return () => {
      mountedRef.current = false;
      consumptionCancelledRef.current = true;
      if (streamHandleRef.current) {
        streamHandleRef.current.close();
      }
    };
  }, [autoStart, startStream]);

  return { events, isStreaming, error, pause, resume, reset, state, eventCount: events.length };
}
```

**Key Features**:
- **Memory Safety**: Cleanup on unmount prevents memory leaks
- **Stable References**: useCallback ensures stable function identities
- **Cancel Safety**: Checks `mountedRef` before state updates
- **Generic Type**: Type parameter `<T>` allows pattern-specific event types

### Layer 2: Network Capture Hook

**`useNetworkCapture`** (`src/lib/hooks/useNetworkCapture.ts`)

Provides event capture for the Network Inspector:

```typescript
interface CapturedEvent {
  event: StreamEvent;
  sequence: number;        // Order number
  capturedAt: number;      // Capture timestamp
}

export function useNetworkCapture() {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [filter, setFilter] = useState<EventFilter>({});

  const captureEvent = useCallback((event: StreamEvent) => {
    setEvents(prev => [
      ...prev,
      { event, sequence: prev.length, capturedAt: Date.now() }
    ]);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by event types
    if (filter.types?.length) {
      result = result.filter(c => filter.types?.includes(c.event.type));
    }

    // Filter by search query
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(c => {
        const eventStr = JSON.stringify(c.event).toLowerCase();
        return eventStr.includes(searchLower);
      });
    }

    return result;
  }, [events, filter]);

  return {
    events,
    filteredEvents,
    captureEvent,
    clearEvents,
    filter,
    setFilter,
    exportEvents: () => JSON.stringify(events, null, 2),
    totalEvents: events.length
  };
}
```

**Integration with useStreamProcessor**:
```typescript
function MyPatternDemo() {
  const { captureEvent } = useNetworkCapture();

  const { events } = useStreamProcessor({
    fixtureId: 'my-pattern-fixture',
    onEvent: captureEvent  // Capture all events
  });

  return <NetworkInspector events={filteredEvents} />;
}
```

### Layer 3: Pattern-Specific Hooks

Each pattern can create its own custom hook that wraps `useStreamProcessor` and provides pattern-specific state:

**Example: `useReasoningStream`** (from Chain-of-Reasoning pattern)

```typescript
// src/patterns/chain-of-reasoning/hooks.ts

export function useReasoningStream(
  prompt: string,
  config: ReasoningStreamConfig
) {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState('');

  const handleEvent = useCallback((event: StreamEvent) => {
    if (isReasoningEvent(event)) {
      setReasoning(prev => [...prev, event.data]);
    } else if (isAnswerEvent(event)) {
      setAnswer(prev => prev + event.data.text);
    }

    // Call user's onEvent if provided
    config.onEvent?.(event);
  }, [config.onEvent]);

  const { isStreaming, error, reset } = useStreamProcessor({
    fixtureId: 'chain-of-reasoning-sprint-planning',
    delayProfile: config.speed || 'normal',
    onEvent: handleEvent
  });

  return {
    reasoning,
    answer,
    isStreaming,
    error,
    reset
  };
}
```

**Usage in Component**:
```typescript
function ChainOfReasoningDemo() {
  const { captureEvent } = useNetworkCapture();

  const { reasoning, answer, isStreaming } = useReasoningStream(
    'Plan a sprint',
    {
      speed: 'normal',
      onEvent: captureEvent
    }
  );

  return (
    <div>
      <ReasoningBeadline reasoning={reasoning} />
      {answer && <AnswerDisplay text={answer} />}
    </div>
  );
}
```

---

## Network Inspector Implementation

The Network Inspector is a first-class feature that makes stream mechanics transparent for learning.

### Component Structure

```
NetworkInspector/
├── NetworkInspector.tsx      # Main container
├── EventList.tsx             # Event timeline
└── JsonViewer.tsx            # JSON payload viewer
```

### NetworkInspector Component

```typescript
interface NetworkInspectorProps {
  events: CapturedEvent[];
  filter?: EventFilter;
  onFilterChange?: (filter: EventFilter) => void;
  onClearEvents?: () => void;
  title?: string;
}

export function NetworkInspector({
  events,
  filter,
  onFilterChange,
  onClearEvents,
  title = 'Network Events'
}: NetworkInspectorProps) {
  const [selectedEvent, setSelectedEvent] = useState<CapturedEvent | null>(null);

  return (
    <div className={styles.inspector}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <div className={styles.stats}>
          <span>{events.length} events</span>
        </div>
        <Button onClick={onClearEvents} size="sm">Clear</Button>
      </div>

      {/* Filter Controls */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search events..."
          value={filter?.search || ''}
          onChange={e => onFilterChange?.({ ...filter, search: e.target.value })}
        />
        {/* Event type filters */}
      </div>

      {/* Event List */}
      <EventList
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
      />

      {/* JSON Viewer for selected event */}
      {selectedEvent && (
        <JsonViewer event={selectedEvent.event} />
      )}
    </div>
  );
}
```

### EventList Component

Displays events as a timeline:

```typescript
export function EventList({
  events,
  selectedEvent,
  onSelectEvent
}: EventListProps) {
  return (
    <div className={styles.eventList} role="log" aria-label="Event timeline">
      {events.map(captured => (
        <button
          key={captured.sequence}
          className={classNames(
            styles.eventItem,
            { [styles.selected]: captured === selectedEvent }
          )}
          onClick={() => onSelectEvent(captured)}
        >
          <div className={styles.eventHeader}>
            <span className={styles.eventType}>{captured.event.type}</span>
            <span className={styles.eventTime}>
              {formatTimestamp(captured.capturedAt)}
            </span>
          </div>
          <div className={styles.eventSummary}>
            {getEventSummary(captured.event)}
          </div>
        </button>
      ))}
    </div>
  );
}
```

### JsonViewer Component

Renders formatted JSON with syntax highlighting:

```typescript
export function JsonViewer({ event }: { event: StreamEvent }) {
  const formatted = JSON.stringify(event, null, 2);

  return (
    <div className={styles.jsonViewer}>
      <div className={styles.jsonHeader}>
        <h4>Event Details</h4>
        <Button onClick={() => navigator.clipboard.writeText(formatted)} size="sm">
          Copy JSON
        </Button>
      </div>
      <pre className={styles.jsonCode}>
        <code>{formatted}</code>
      </pre>
    </div>
  );
}
```

### Integration Pattern

Every pattern demo includes the Network Inspector:

```typescript
function PatternDemo() {
  const { events, captureEvent, clearEvents, filter, setFilter } = useNetworkCapture();
  const [showInspector, setShowInspector] = useState(false);

  const { /* pattern state */ } = usePatternStream({
    onEvent: captureEvent  // Capture all events
  });

  return (
    <div>
      {/* Pattern UI */}
      <PatternUI />

      {/* Toggle Button */}
      <Button onClick={() => setShowInspector(!showInspector)}>
        {showInspector ? 'Hide' : 'Show'} Inspector
      </Button>

      {/* Network Inspector */}
      {showInspector && (
        <NetworkInspector
          events={events}
          filter={filter}
          onFilterChange={setFilter}
          onClearEvents={clearEvents}
        />
      )}
    </div>
  );
}
```

---

## Pattern Component Structure

Each pattern follows a consistent file organization:

```
patterns/chain-of-reasoning/
├── ChainOfReasoningDemo.tsx       # Main demo component
├── ReasoningBeadline.tsx          # UI: reasoning bead list
├── hooks.ts                       # useReasoningStream hook
├── types.ts                       # TypeScript interfaces
├── ChainOfReasoningDemo.module.css# Styles
├── ChainOfReasoningDemo.test.tsx  # Component tests
└── README.md                      # Pattern documentation
```

### Typical Pattern Demo Component Structure

```typescript
// ChainOfReasoningDemo.tsx

import { useState, useCallback, useMemo } from 'react';
import { DemoContainer } from '@/components/layout/DemoContainer';
import { Button } from '@/components/ui/Button';
import { NetworkInspector } from '@/components/NetworkInspector';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { ReasoningBeadline } from './ReasoningBeadline';
import { useReasoningStream } from './hooks';

const DEMO_PROMPT = 'Plan a 2-week sprint for StreamFlow PM dashboard';

export function ChainOfReasoningDemo() {
  // State: UI controls
  const [speed, setSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [showInspector, setShowInspector] = useState(false);

  // Network capture for debugging
  const { events, captureEvent, clearEvents, filter, setFilter } = useNetworkCapture();

  // Pattern-specific streaming hook
  const { reasoning, answer, isStreaming, reset } = useReasoningStream(
    DEMO_PROMPT,
    {
      speed,
      onEvent: captureEvent  // Capture events for Network Inspector
    }
  );

  const handleReset = useCallback(() => {
    clearEvents();
    reset();
  }, [clearEvents, reset]);

  return (
    <DemoContainer
      title="Chain-of-Reasoning Pattern"
      description="Watch AI think through sprint planning with visible reasoning steps"
    >
      {/* Demo Controls */}
      <section className={styles.controls}>
        <div>
          <label>Stream Speed</label>
          <ButtonGroup>
            {['fast', 'normal', 'slow'].map(s => (
              <Button
                key={s}
                onClick={() => setSpeed(s)}
                variant={speed === s ? 'primary' : 'secondary'}
                disabled={isStreaming}
              >
                {s}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <Button onClick={handleReset} disabled={isStreaming}>
          Reset Demo
        </Button>
        <Button onClick={() => setShowInspector(!showInspector)}>
          {showInspector ? 'Hide' : 'Show'} Inspector
        </Button>
      </section>

      {/* Scenario Context */}
      <section>
        <ScenarioCard prompt={DEMO_PROMPT} />
      </section>

      {/* Reasoning Timeline */}
      <section>
        <h3>Reasoning Steps ({reasoning.length})</h3>
        <ReasoningBeadline reasoning={reasoning} />
      </section>

      {/* Final Answer */}
      {answer && (
        <section>
          <h3>Sprint Plan</h3>
          <pre>{answer}</pre>
        </section>
      )}

      {/* Network Inspector */}
      {showInspector && (
        <section>
          <h3>Network Inspector</h3>
          <NetworkInspector
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            onClearEvents={clearEvents}
          />
        </section>
      )}

      {/* Educational Notes */}
      <section>
        <Card>
          <h4>Pattern Learning Points</h4>
          <ul>
            <li><strong>Transparency:</strong> Users see AI reasoning...</li>
            <li><strong>Streaming UX:</strong> Steps arrive incrementally...</li>
            {/* ... more learning points */}
          </ul>
        </Card>
      </section>
    </DemoContainer>
  );
}
```

### Pattern-Specific Hook Structure

```typescript
// hooks.ts

import { useState, useCallback } from 'react';
import { useStreamProcessor } from '@/lib/hooks/useStreamProcessor';
import { isReasoningEvent, isAnswerEvent } from '@/lib/streaming/eventSchema';
import type { ReasoningStep, ReasoningStreamConfig } from './types';

export function useReasoningStream(
  prompt: string,
  config: ReasoningStreamConfig
) {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState('');

  // Event handler to process events into pattern-specific state
  const handleEvent = useCallback((event: StreamEvent) => {
    if (isReasoningEvent(event)) {
      setReasoning(prev => [...prev, event.data]);
    } else if (isAnswerEvent(event)) {
      setAnswer(prev => prev + event.data.text);
    }

    // Forward to Network Inspector
    config.onEvent?.(event);
  }, [config.onEvent]);

  // Use core stream processor
  const { isStreaming, error, reset } = useStreamProcessor({
    fixtureId: 'chain-of-reasoning-sprint-planning',
    delayProfile: config.speed || 'normal',
    onEvent: handleEvent
  });

  // Wrap reset to also clear pattern-specific state
  const resetWithClear = useCallback(() => {
    setReasoning([]);
    setAnswer('');
    reset();
  }, [reset]);

  return {
    reasoning,
    answer,
    isStreaming,
    error,
    reset: resetWithClear
  };
}
```

---

## Data Flow Diagrams

### Complete Event Flow

```
┌──────────────────────┐
│   Fixture JSON       │
│   (registered at     │
│    app startup)      │
└──────────┬───────────┘
           │
           │ getFixtureEvents(id)
           ▼
┌──────────────────────┐
│ Fixture Repository   │
│ - Validates events   │
│ - Returns deep clone │
└──────────┬───────────┘
           │
           │ events[]
           ▼
┌──────────────────────┐
│ createMockStream     │
│ - Creates session    │
│ - Returns generator  │
└──────────┬───────────┘
           │
           │ AsyncGenerator<Event>
           ▼
┌──────────────────────┐
│   StreamSession      │
│ - Manages lifecycle  │
│ - Applies delays     │
│ - Enriches events    │
└──────────┬───────────┘
           │
           │ for await (event of stream)
           ▼
┌──────────────────────┐
│ useStreamProcessor   │
│ - Consumes generator │
│ - Manages state      │
│ - Calls onEvent      │
└──────────┬───────────┘
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌───────────────────┐
│ Pattern Hook     │  │ useNetworkCapture │
│ - Processes      │  │ - Captures events │
│ - Updates state  │  │ - Filters/search  │
└────────┬─────────┘  └─────────┬─────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐  ┌───────────────────┐
│ Pattern UI       │  │ NetworkInspector  │
│ - ReasoningBead  │  │ - EventList       │
│ - AnswerDisplay  │  │ - JsonViewer      │
└──────────────────┘  └───────────────────┘
```

### State Management Flow

```
User Action (Reset Button)
         │
         ▼
┌──────────────────────┐
│   Component Handler  │
│   handleReset()      │
└──────────┬───────────┘
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌───────────────────┐
│ clearEvents()    │  │ reset()           │
│ (Network Capture)│  │ (Stream Processor)│
└──────────────────┘  └─────────┬─────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │ Close old stream │
                      │ Start new stream │
                      └─────────┬────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │ Load fixture     │
                      │ Create session   │
                      │ Start consumption│
                      └─────────┬────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │ Events flow      │
                      │ Component updates│
                      └──────────────────┘
```

---

## Testing Strategy

The library uses Vitest with different testing approaches for each layer.

### Unit Tests: Stream Infrastructure

```typescript
// src/lib/streaming/mockSSE.test.ts

import { describe, it, expect } from 'vitest';
import { createMockStream, collectStreamEvents } from './mockSSE';

describe('createMockStream', () => {
  it('should emit all events from fixture', async () => {
    const fixtureEvents = [
      { id: '1', type: 'reasoning', timestamp: 1000, data: {...} },
      { id: '2', type: 'answer', timestamp: 2000, data: {...} }
    ];

    const stream = createMockStream({
      events: fixtureEvents,
      delayProfile: 'fast'
    });

    const allEvents = await collectStreamEvents(stream);

    expect(allEvents).toHaveLength(2);
    expect(allEvents[0].type).toBe('reasoning');
    expect(allEvents[1].type).toBe('answer');
  });

  it('should apply correct delays for fast profile', async () => {
    const events = [
      { id: '1', type: 'reasoning', timestamp: 1000, data: {...} }
    ];

    const start = Date.now();
    const stream = createMockStream({ events, delayProfile: 'fast' });
    await collectStreamEvents(stream);
    const elapsed = Date.now() - start;

    // Fast profile is 50ms per event
    expect(elapsed).toBeGreaterThanOrEqual(50);
    expect(elapsed).toBeLessThan(150); // Allow some margin
  });
});
```

### Component Tests: React Components

```typescript
// src/patterns/chain-of-reasoning/ReasoningBeadline.test.tsx

import { render, screen } from '@testing-library/react';
import { ReasoningBeadline } from './ReasoningBeadline';

describe('ReasoningBeadline', () => {
  it('should render reasoning steps', () => {
    const reasoning = [
      { id: '1', summary: 'Analyzing backlog', confidence: 0.9, timestamp: 1000 },
      { id: '2', summary: 'Estimating capacity', confidence: 0.85, timestamp: 2000 }
    ];

    render(<ReasoningBeadline reasoning={reasoning} />);

    expect(screen.getByText('Analyzing backlog')).toBeInTheDocument();
    expect(screen.getByText('Estimating capacity')).toBeInTheDocument();
  });

  it('should show confidence levels', () => {
    const reasoning = [
      { id: '1', summary: 'High confidence', confidence: 0.95, timestamp: 1000 },
      { id: '2', summary: 'Low confidence', confidence: 0.3, timestamp: 2000 }
    ];

    render(<ReasoningBeadline reasoning={reasoning} />);

    const beads = screen.getAllByRole('listitem');
    expect(beads[0]).toHaveClass('highConfidence');
    expect(beads[1]).toHaveClass('lowConfidence');
  });
});
```

### Integration Tests: Full Pattern Flow

```typescript
// src/patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { ChainOfReasoningDemo } from './ChainOfReasoningDemo';

describe('Chain of Reasoning Demo', () => {
  it('should stream reasoning steps and final answer', async () => {
    render(<ChainOfReasoningDemo />);

    // Wait for first reasoning step
    await waitFor(() => {
      expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
    });

    // Wait for final answer
    await waitFor(() => {
      expect(screen.getByText(/Sprint Plan:/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify all events captured in Network Inspector
    // (if inspector is visible)
  });

  it('should support reset functionality', async () => {
    render(<ChainOfReasoningDemo />);

    // Wait for stream to complete
    await waitFor(() => {
      expect(screen.getByText(/Complete/i)).toBeInTheDocument();
    });

    // Click reset
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);

    // Should restart stream
    await waitFor(() => {
      expect(screen.getByText(/Streaming/i)).toBeInTheDocument();
    });
  });
});
```

---

## Performance Considerations

### Memory Management

**Problem**: Streaming large numbers of events can accumulate in memory.

**Solution**:
- Event arrays grow incrementally, not all at once
- Proper cleanup on component unmount prevents memory leaks
- Network Inspector limits visible events (virtualization for 100+ events)

```typescript
useEffect(() => {
  return () => {
    // Cleanup: close stream and cancel consumption
    mountedRef.current = false;
    if (streamHandleRef.current) {
      streamHandleRef.current.close();
    }
  };
}, []);
```

### Re-render Optimization

**Problem**: Frequent state updates during streaming can cause excessive re-renders.

**Solution**:
- Memoize expensive computations with `useMemo`
- Stable callback references with `useCallback`
- Component memoization with `React.memo` for list items

```typescript
// Memoize expensive filtering
const filteredEvents = useMemo(() => {
  return events.filter(e => e.type === filter.type);
}, [events, filter.type]);

// Memoize event list items
const ReasoningBead = memo(function ReasoningBead({ step }) {
  return <div>{step.summary}</div>;
});
```

### Timing Accuracy

**Problem**: JavaScript timers are not perfectly accurate.

**Solution**:
- Use `setTimeout` with realistic delays (50ms, 300ms, 1000ms)
- Accept some variance in timing (acceptable for demos)
- For precise timing, use `performance.now()` to measure actual elapsed time

```typescript
const startTime = performance.now();
await collectStreamEvents(stream);
const elapsed = performance.now() - startTime;
```

### Large Event Payloads

**Problem**: Some events (like table rows) can have large data payloads.

**Solution**:
- Use JSON serialization for deep cloning (fast and deterministic)
- Limit Network Inspector JSON viewer depth
- Provide collapse/expand for nested objects

```typescript
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
```

---

## Architectural Invariants

The system maintains these invariants across all operations:

1. **INV-4**: Events emitted in fixture order
2. **INV-5**: Timestamps monotonically increasing
3. **INV-7**: Sessions close cleanly
4. **INV-8**: Cannot emit from closed session
5. **INV-13**: Fixtures are deterministic (same ID → same events)
6. **INV-14**: Fixtures are immutable (returns deep clones)
7. **INV-16**: Fixtures validated before use

These invariants ensure:
- Predictable behavior for educational purposes
- Safe concurrent streams (no state interference)
- Type safety at runtime
- Testability (deterministic fixtures)

---

## Extension Points

The architecture is designed for extensibility:

### Adding a New Pattern

1. **Create pattern directory**: `src/patterns/my-new-pattern/`
2. **Define event types**: Add to `src/types/events.ts`
3. **Create fixtures**: Register with `registerFixture()`
4. **Build custom hook**: Wrap `useStreamProcessor`
5. **Design UI components**: Follow existing patterns
6. **Integrate Network Inspector**: Pass `captureEvent` to stream hook
7. **Write tests**: Unit, component, and integration tests

### Adding a New Event Type

1. **Define interface** in `src/types/events.ts`:
   ```typescript
   export interface MyNewEvent extends BaseStreamEvent {
     type: 'my_new_type';
     data: {
       // Event-specific fields
     };
   }
   ```

2. **Add to union type**:
   ```typescript
   export type StreamEvent =
     | ReasoningEvent
     | AnswerEvent
     | MyNewEvent  // Add here
     | ...;
   ```

3. **Create type guard** in `src/lib/streaming/eventSchema.ts`:
   ```typescript
   export function isMyNewEvent(event: unknown): event is MyNewEvent {
     // Validation logic
   }
   ```

4. **Update general type guard**:
   ```typescript
   export function isStreamEvent(event: unknown): event is StreamEvent {
     return (
       isReasoningEvent(event) ||
       isMyNewEvent(event) ||  // Add here
       ...
     );
   }
   ```

### Customizing Delay Profiles

Modify `StreamSession` to support additional timing modes:

```typescript
type DelayProfile = 'fast' | 'normal' | 'slow' | 'instant' | 'custom';

interface SessionConfig {
  delayProfile?: DelayProfile;
  customDelayMs?: number;  // For 'custom' profile
}
```

---

## Summary

The streaming-patterns library architecture is designed around three core principles:

1. **Education First**: Every design decision prioritizes clarity and learning over abstraction
2. **Deterministic Mocks**: Fixtures provide repeatable, testable demonstrations without real APIs
3. **Transparent Mechanics**: Network Inspector and annotated source make streaming visible

The layered architecture—from fixture repository through mock SSE to React hooks—provides a solid foundation for building educational streaming pattern demonstrations.

For implementation details, see:
- [CLAUDE.md](/CLAUDE.md) - Development standards and coding guidelines
- [CONTRIBUTING.md](/CONTRIBUTING.md) - How to contribute new patterns
- [Pattern README files](/src/patterns/) - Individual pattern documentation

---

**Last Updated**: December 1, 2025
