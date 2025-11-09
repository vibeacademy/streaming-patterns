# Domain-Driven Design Workup: Streaming Patterns Library

## Table of Contents
1. [Domain Overview](#domain-overview)
2. [Bounded Contexts](#bounded-contexts)
3. [Aggregates](#aggregates)
4. [Entities vs Value Objects](#entities-vs-value-objects)
5. [Domain Events](#domain-events)
6. [Invariants](#invariants)
7. [Repositories](#repositories)
8. [Domain Services](#domain-services)
9. [Application Services](#application-services)
10. [Context Map](#context-map)
11. [Implementation Guide](#implementation-guide)

---

## Domain Overview

### Core Domain: Educational Streaming Pattern Exhibition

**Primary Mission**: Teach frontend developers how to build streaming AI/LLM interfaces through working, deterministic demonstrations.

**What Makes This Domain Unique**:
- **Mock-First Architecture**: Deterministic streaming is not a workaround—it's the product. Every demo must be repeatable, observable, and independent of external APIs.
- **Learning Through Code**: The codebase itself is curriculum. Patterns teach by example, with annotated source code serving as inline documentation.
- **Transparency as a Feature**: Developers must see what's happening "under the hood" (stream events, state transitions, timing) to understand streaming mechanics.

### Supporting Domains

**1. Mock Streaming Infrastructure**
- Simulates SSE (Server-Sent Events) without real servers
- Provides deterministic event sequences from fixtures
- Controls timing, chunking, and error injection

**2. Developer Tools Domain**
- Network Inspector: Captures and visualizes stream events
- Annotated Source Viewer: Highlights key code with explanations
- Pattern Playground (future): Interactive experimentation

**3. StreamFlow PM Business Context**
- Fictional project management SaaS providing realistic demo scenarios
- Bounded context for business domain modeling (sprints, tasks, teams, budgets)
- Not the product itself—a teaching vehicle

### Strategic Design Decisions

**Decision 1: Education Over Abstraction**
- **Why**: Developers learn best from explicit, readable code they can trace
- **Impact**: Intentional code duplication across patterns; avoid "clever" abstractions
- **Trade-off**: More lines of code, but each pattern is self-contained and understandable

**Decision 2: Mock Infrastructure as Core Domain**
- **Why**: Determinism is critical for education; real LLMs are unpredictable and costly
- **Impact**: Fixtures are version-controlled; mocks are first-class citizens, not afterthoughts
- **Trade-off**: Mocks may not perfectly represent real-world edge cases

**Decision 3: Transparency Through Observability**
- **Why**: Understanding streaming requires seeing events in real-time
- **Impact**: Network inspector is mandatory for every pattern
- **Trade-off**: Additional UI complexity, but essential for learning

---

## Bounded Contexts

### 1. Pattern Exhibition Context

**Responsibility**: Orchestrate the demonstration of streaming patterns to users.

**Ubiquitous Language**:
- **Pattern**: A named UX solution for a specific streaming challenge (e.g., "Chain-of-Reasoning")
- **Demo Session**: A single execution of a pattern with specific input/fixtures
- **Demo State**: Current phase of the demo (idle, streaming, paused, completed, error)
- **Pattern Specification**: Metadata describing intent, UX flow, stream contract, UI techniques
- **Fixture**: Deterministic mock data for a demo scenario

**Core Entities**:
- `PatternDemo` (aggregate root): Orchestrates a single demo execution
- `DemoSession`: Tracks lifecycle of one demo run
- `PatternMetadata`: Describes pattern capabilities and requirements

**Value Objects**:
- `PatternId`, `DemoSpeed`, `DemoPhase`, `FixtureIdentifier`

**Key Operations**:
- `startDemo(patternId, fixtureId, speed)`: Initiates a pattern demonstration
- `pauseDemo(sessionId)`: Suspends streaming mid-execution
- `resumeDemo(sessionId)`: Continues from pause point
- `resetDemo(sessionId)`: Returns to initial state
- `completeDemo(sessionId)`: Finalizes and archives results

**Bounded Context Boundaries**:
- **IN scope**: Demo lifecycle, UI state management, user interactions with demos
- **OUT of scope**: How streams are generated (that's Streaming Infrastructure Context)
- **OUT of scope**: How events are inspected (that's Developer Tools Context)

**Example from Codebase**:
```typescript
// src/patterns/chain-of-reasoning/ChainOfReasoningDemo.tsx
// PatternDemo orchestrates demo lifecycle
export function ChainOfReasoningDemo() {
  const [demoState, setDemoState] = useState<DemoPhase>('idle');
  const { reasoning, answer, isStreaming } = useReasoningStream(prompt);

  // Demo controls: start, pause, reset
  const handleStart = () => setDemoState('streaming');
  const handleReset = () => { /* reset logic */ };

  return (
    <PatternPage>
      <DemoContainer demoState={demoState} />
      <NetworkInspector />
      <AnnotatedSource />
    </PatternPage>
  );
}
```

---

### 2. Streaming Infrastructure Context

**Responsibility**: Generate deterministic mock streaming events that simulate real LLM behavior.

**Ubiquitous Language**:
- **Stream Session**: Lifecycle of a single event stream (start → events → end)
- **Stream Event**: Discrete data chunk with type, payload, timestamp
- **Event Channel**: Logical grouping of event types (reasoning channel, answer channel)
- **Stream Contract**: Schema defining event types and their payloads for a pattern
- **Chunk**: Smallest unit of data in a stream (word, sentence, token)
- **Delay Profile**: Timing configuration (fast: 50ms, normal: 300ms, slow: 1000ms)
- **Fixture**: Pre-recorded event sequences for deterministic replay

**Core Entities**:
- `StreamSession` (aggregate root): Manages lifecycle of an event stream
- `StreamGenerator`: Produces events from fixtures
- `EventSchema`: Defines structure for stream events

**Value Objects**:
- `StreamEvent`, `Timestamp`, `EventType`, `ChunkSize`, `DelayProfile`

**Key Operations**:
- `createStream(fixtureId, delayProfile)`: Initializes a new stream session
- `emitEvent(event)`: Yields next event in sequence
- `pauseStream(sessionId)`: Suspends event generation
- `resumeStream(sessionId)`: Continues from last event
- `closeStream(sessionId)`: Cleans up session resources

**Bounded Context Boundaries**:
- **IN scope**: Event generation, timing, chunking, fixture management
- **OUT of scope**: How events are rendered in UI (that's Pattern Exhibition)
- **OUT of scope**: How events are captured for inspection (that's Developer Tools)

**Stream Contract Example**:
```typescript
// src/lib/streaming/eventSchema.ts
// Stream events are value objects describing data chunks
export interface StreamEvent {
  id: string;
  type: 'reasoning' | 'answer' | 'memory' | 'validation' | 'table_row' | 'await_input' | 'schema_error';
  data: unknown;
  timestamp: number;
}

export interface ReasoningEvent extends StreamEvent {
  type: 'reasoning';
  data: {
    id: string;
    summary: string;
    confidence: number;
    details?: string;
  };
}
```

**Implementation Example**:
```typescript
// src/lib/streaming/mockSSE.ts
// StreamSession aggregate manages event generation
export async function* createMockStream(
  fixture: StreamEvent[],
  delayProfile: DelayProfile = 'normal'
): AsyncGenerator<StreamEvent> {
  const delays = { fast: 50, normal: 300, slow: 1000 };
  const delayMs = delays[delayProfile];

  for (const event of fixture) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield event;
  }
}
```

---

### 3. Developer Tools Context

**Responsibility**: Provide observability and learning aids for developers exploring patterns.

**Ubiquitous Language**:
- **Network Capture**: Recording of all stream events for a demo session
- **Captured Event**: Enriched stream event with metadata (stack trace, capture time)
- **Event Filter**: Criteria for showing/hiding event types in inspector
- **Event Inspector**: UI component visualizing captured events
- **Annotated Source**: Code viewer with inline educational explanations
- **Annotation**: Comment/highlight explaining a code section
- **Export Log**: Downloadable JSON file of captured events

**Core Entities**:
- `NetworkCapture` (aggregate root): Manages event recording for a session
- `AnnotationRegistry`: Maintains code annotations for patterns
- `InspectorSession`: Tracks user's inspection state (filters, selected event)

**Value Objects**:
- `CapturedEvent`, `EventFilter`, `Annotation`, `CodeHighlight`

**Key Operations**:
- `captureEvent(event)`: Records an event for inspection
- `filterEvents(criteria)`: Applies filters to captured events
- `selectEvent(eventId)`: Focuses on specific event in inspector
- `exportEvents(sessionId)`: Generates downloadable event log
- `loadAnnotations(patternId)`: Retrieves code annotations for a pattern

**Bounded Context Boundaries**:
- **IN scope**: Event capture, visualization, filtering, annotation management
- **OUT of scope**: Generating events (that's Streaming Infrastructure)
- **OUT of scope**: Demo lifecycle (that's Pattern Exhibition)

**Integration Points**:
- Consumes `StreamEvent`s from Streaming Infrastructure Context
- Notifies Pattern Exhibition Context when events are captured (optional)

**Implementation Example**:
```typescript
// src/lib/hooks/useNetworkCapture.ts
// NetworkCapture aggregate manages event recording
export function useNetworkCapture() {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [filters, setFilters] = useState<EventFilter[]>([]);

  const captureEvent = useCallback((event: StreamEvent) => {
    const captured: CapturedEvent = {
      ...event,
      capturedAt: Date.now(),
      stackTrace: new Error().stack, // For debugging
    };
    setEvents(prev => [...prev, captured]);
  }, []);

  const clearEvents = () => setEvents([]);

  const exportEvents = () => {
    const json = JSON.stringify(events, null, 2);
    // Download logic...
  };

  return { events, captureEvent, clearEvents, exportEvents, filters, setFilters };
}
```

---

### 4. StreamFlow PM Business Context

**Responsibility**: Provide realistic business domain for pattern demonstrations (project management SaaS).

**Ubiquitous Language**:
- **Project**: Collection of work with goals, timelines, team, budget
- **Sprint**: Time-boxed iteration of work (typically 2 weeks)
- **Backlog**: Prioritized list of work items
- **Task**: Unit of work assigned to team member
- **Team Member**: Person with role, capacity, skills
- **Budget**: Financial resources allocated to project
- **Risk**: Potential issue that may impact project success
- **Charter**: Foundational document defining project scope and goals

**Core Entities** (for demo purposes only):
- `Project` (aggregate root)
- `Sprint`
- `Task`
- `Team`
- `TeamMember`

**Value Objects**:
- `TaskStatus`, `Priority`, `Estimate`, `Budget`, `DateRange`, `RiskLevel`

**Key Operations** (simulated in demos):
- `planSprint(backlog, teamCapacity)`: AI generates sprint plan
- `assessRisk(project)`: AI identifies project risks
- `draftCharter(projectGoals)`: Collaborative charter creation
- `allocateBudget(resources)`: Budget validation loop
- `calculateCapacity(team, sprint)`: Team availability matrix

**Bounded Context Boundaries**:
- **IN scope**: Domain concepts for realistic demos (projects, tasks, teams)
- **OUT of scope**: Actual project management features (this is not a real PM tool)
- **OUT of scope**: Data persistence, authentication, real business logic

**Important Note**: StreamFlow PM is **fictional**. It exists solely to provide relatable scenarios for pattern demonstrations. It is not a product being built, but a teaching vehicle.

**Fixture Example**:
```typescript
// src/fixtures/projects.json
// StreamFlow PM domain objects used in demos
{
  "projects": [
    {
      "id": "proj-123",
      "name": "Dashboard Redesign",
      "team": ["Alice", "Bob", "Carol"],
      "budget": 50000,
      "sprints": [
        {
          "id": "sprint-1",
          "startDate": "2024-11-11",
          "endDate": "2024-11-24",
          "tasks": [
            {
              "id": "task-1",
              "title": "Design wireframes",
              "assignee": "Alice",
              "estimate": 5,
              "priority": "high"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Aggregates

### Aggregate Design Principles

**Key Rules**:
1. **One Aggregate Root**: Single entity serves as the entry point and enforces invariants
2. **Consistency Boundary**: All changes within an aggregate are atomic
3. **Reference by ID**: Aggregates reference other aggregates by ID, not direct pointers
4. **Small Aggregates**: Keep aggregates focused; don't create "god objects"

---

### Pattern Exhibition Context Aggregates

#### Aggregate: `PatternDemo`

**Aggregate Root**: `PatternDemo`

**Entities**:
- `DemoSession`: Tracks single execution (start time, end time, events emitted)
- `DemoControls`: User interactions (pause, resume, reset, speed change)

**Value Objects**:
- `PatternId`: Unique identifier for pattern (e.g., "chain-of-reasoning")
- `DemoPhase`: Current state (idle, streaming, paused, completed, error)
- `FixtureIdentifier`: Points to specific fixture for replay
- `DemoSpeed`: Timing profile (fast, normal, slow)

**Invariants**:
- A demo cannot be paused unless it's currently streaming
- A demo cannot be resumed unless it's currently paused
- Only one demo session can be active per pattern instance
- Demo must have a valid fixture before starting

**Key Methods**:
```typescript
class PatternDemo {
  private session: DemoSession | null = null;
  private phase: DemoPhase = 'idle';

  start(fixtureId: FixtureIdentifier, speed: DemoSpeed): void {
    if (this.phase !== 'idle') {
      throw new Error('Demo already running');
    }
    this.session = new DemoSession(fixtureId, speed);
    this.phase = 'streaming';
  }

  pause(): void {
    if (this.phase !== 'streaming') {
      throw new Error('Cannot pause: demo not streaming');
    }
    this.phase = 'paused';
    this.session?.pause();
  }

  resume(): void {
    if (this.phase !== 'paused') {
      throw new Error('Cannot resume: demo not paused');
    }
    this.phase = 'streaming';
    this.session?.resume();
  }

  reset(): void {
    this.session?.cleanup();
    this.session = null;
    this.phase = 'idle';
  }
}
```

**Implementation Location**: `/src/patterns/{pattern-name}/{PatternName}Demo.tsx`

---

### Streaming Infrastructure Context Aggregates

#### Aggregate: `StreamSession`

**Aggregate Root**: `StreamSession`

**Entities**:
- `EventGenerator`: Yields events from fixture
- `StreamCursor`: Tracks current position in event sequence

**Value Objects**:
- `StreamEvent`: Individual data chunk
- `SessionId`: Unique identifier for stream session
- `Timestamp`: Event emission time
- `DelayProfile`: Timing configuration

**Invariants**:
- Events must be emitted in order (no out-of-order events)
- Once a stream is closed, no more events can be emitted
- Paused streams must retain cursor position for resume
- Every event must have a unique ID within the session
- Timestamps must be monotonically increasing

**Key Methods**:
```typescript
class StreamSession {
  private sessionId: SessionId;
  private cursor: StreamCursor;
  private fixture: StreamEvent[];
  private state: 'active' | 'paused' | 'closed' = 'active';

  async *generate(): AsyncGenerator<StreamEvent> {
    while (!this.cursor.isAtEnd() && this.state !== 'closed') {
      if (this.state === 'paused') {
        await this.waitForResume();
      }

      const event = this.cursor.next();
      await this.applyDelay(event);
      yield this.enrichEvent(event);
    }
  }

  pause(): void {
    if (this.state !== 'active') {
      throw new Error('Cannot pause: stream not active');
    }
    this.state = 'paused';
  }

  resume(): void {
    if (this.state !== 'paused') {
      throw new Error('Cannot resume: stream not paused');
    }
    this.state = 'active';
  }

  close(): void {
    this.state = 'closed';
    this.cleanup();
  }

  private enrichEvent(event: StreamEvent): StreamEvent {
    return {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };
  }
}
```

**Implementation Location**: `/src/lib/streaming/mockSSE.ts`

---

### Developer Tools Context Aggregates

#### Aggregate: `NetworkCapture`

**Aggregate Root**: `NetworkCapture`

**Entities**:
- `EventLog`: Ordered list of captured events
- `InspectorSession`: User's current inspection state

**Value Objects**:
- `CapturedEvent`: Stream event + metadata (capture time, stack trace)
- `EventFilter`: Criteria for filtering events
- `ExportFormat`: Output format for logs (JSON, CSV)

**Invariants**:
- Captured events must preserve original order
- Each captured event must have a unique capture ID
- Filters cannot remove events from log (only hide in UI)
- Export must include all captured events (ignoring filters)

**Key Methods**:
```typescript
class NetworkCapture {
  private log: EventLog = new EventLog();
  private filters: EventFilter[] = [];

  capture(event: StreamEvent): void {
    const captured: CapturedEvent = {
      ...event,
      captureId: this.generateCaptureId(),
      capturedAt: Date.now(),
      stackTrace: this.captureStackTrace(),
    };
    this.log.append(captured);
  }

  applyFilters(filters: EventFilter[]): void {
    this.filters = filters;
  }

  getVisibleEvents(): CapturedEvent[] {
    return this.log.filter(event =>
      this.filters.every(filter => filter.matches(event))
    );
  }

  export(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.log.getAllEvents(), null, 2);
      case 'csv':
        return this.convertToCSV(this.log.getAllEvents());
    }
  }

  clear(): void {
    this.log.clear();
  }
}
```

**Implementation Location**: `/src/components/NetworkInspector/NetworkInspector.tsx` and `/src/lib/hooks/useNetworkCapture.ts`

---

### StreamFlow PM Context Aggregates

**Note**: These are **fictional** aggregates for demo purposes only. They model the business domain of project management to provide realistic contexts for pattern demonstrations.

#### Aggregate: `Project`

**Aggregate Root**: `Project`

**Entities**:
- `Sprint`: Time-boxed iteration
- `Task`: Work item within sprint
- `Budget`: Financial tracking

**Value Objects**:
- `ProjectId`, `DateRange`, `Budget`, `TaskStatus`, `Priority`

**Invariants** (simulated in demos):
- A project must have at least one sprint
- All tasks must belong to a sprint
- Sprint date ranges cannot overlap
- Budget allocations cannot exceed total budget

**Implementation**: Fixture data in `/src/fixtures/projects.json`, not actual aggregate classes (since this is for demos only).

---

## Entities vs Value Objects

### Design Principle: When to Use Each

**Entity Characteristics**:
- Has identity that persists over time
- Can change its attributes while remaining the same entity
- Equality based on ID, not attributes
- Lifecycle: created → modified → deleted

**Value Object Characteristics**:
- No identity; defined purely by attributes
- Immutable (cannot change; create new instance instead)
- Equality based on attribute values
- Lifecycle: created → used → discarded

---

### Pattern Exhibition Context

#### Entities

**`PatternDemo`** (aggregate root)
- **Identity**: `demoId` (unique per demo instance)
- **Why Entity**: Same demo can be run multiple times; each run has its own identity
- **Mutable**: State changes (idle → streaming → completed)
- **Lifecycle**: Created when user starts demo, disposed when reset

**`DemoSession`**
- **Identity**: `sessionId` (unique per execution)
- **Why Entity**: Tracks history of one demo run (start time, events, end time)
- **Mutable**: Accumulates events over time
- **Lifecycle**: Created on start, finalized on completion

#### Value Objects

**`PatternId`**
- **No Identity**: "chain-of-reasoning" is always "chain-of-reasoning"
- **Why Value Object**: Two patterns with same name are identical
- **Immutable**: Pattern names don't change
- **Example**: `new PatternId('chain-of-reasoning')`

**`DemoPhase`**
- **No Identity**: "streaming" is just a state label
- **Why Value Object**: Phases are pure values (idle, streaming, paused, completed, error)
- **Immutable**: Don't modify phase; replace with new phase
- **Example**: `demoPhase = 'streaming'` (simple string/enum)

**`DemoSpeed`**
- **No Identity**: "fast" speed is always "fast" speed
- **Why Value Object**: Speed profiles are configuration values
- **Immutable**: Speed settings don't change; create new profile
- **Example**: `new DemoSpeed('fast', 50)` // 50ms delay

---

### Streaming Infrastructure Context

#### Entities

**`StreamSession`** (aggregate root)
- **Identity**: `sessionId` (unique per stream)
- **Why Entity**: Tracks lifecycle of event generation (active → paused → closed)
- **Mutable**: State changes; cursor advances
- **Lifecycle**: Created on stream start, closed on completion

#### Value Objects

**`StreamEvent`**
- **No Identity**: Event defined by its content (type, data, timestamp)
- **Why Value Object**: Events are immutable once created
- **Immutable**: Never modify event after emission; create new event
- **Example**:
```typescript
const event: StreamEvent = {
  id: 'event-123', // Identity within stream, but event itself is a value
  type: 'reasoning',
  data: { summary: 'Analyzing backlog' },
  timestamp: Date.now(),
};
```

**Note on `StreamEvent.id`**: While events have an `id` field, they are still value objects because:
1. The ID is for referencing (e.g., "reasoning step 3"), not identity
2. Two events with identical content are interchangeable
3. Events are never "updated"—new events are created

**`Timestamp`**
- **No Identity**: Time is a measurement, not an entity
- **Why Value Object**: 1699891200000 (milliseconds) is always that point in time
- **Immutable**: Time doesn't change (though current time advances)
- **Example**: `new Timestamp(Date.now())`

**`DelayProfile`**
- **No Identity**: Timing configuration is pure data
- **Why Value Object**: `{ fast: 50ms }` is identical to any other `{ fast: 50ms }`
- **Immutable**: Profiles are defined once, not mutated
- **Example**: `const profile = new DelayProfile('normal', 300)`

---

### Developer Tools Context

#### Entities

**`NetworkCapture`** (aggregate root)
- **Identity**: `captureId` (unique per capture session)
- **Why Entity**: Accumulates events over time; has lifecycle
- **Mutable**: Event log grows; filters change
- **Lifecycle**: Created with demo, cleared on reset

**`InspectorSession`**
- **Identity**: `inspectorSessionId`
- **Why Entity**: Tracks user's inspection state (selected event, filters)
- **Mutable**: User changes selections, applies filters
- **Lifecycle**: Created when inspector opens, disposed when closed

#### Value Objects

**`CapturedEvent`**
- **No Identity**: Enriched stream event with metadata
- **Why Value Object**: Immutable snapshot of event + capture context
- **Immutable**: Never modified after capture
- **Example**:
```typescript
const capturedEvent: CapturedEvent = {
  ...originalEvent,
  captureId: 'capture-456',
  capturedAt: Date.now(),
  stackTrace: '...',
};
```

**`EventFilter`**
- **No Identity**: Filter criteria are pure data
- **Why Value Object**: `{ type: 'reasoning' }` is always the same filter
- **Immutable**: Create new filter instead of modifying
- **Example**: `new EventFilter({ type: ['reasoning', 'answer'] })`

**`Annotation`**
- **No Identity**: Code explanation is content-defined
- **Why Value Object**: Two annotations with same text and location are identical
- **Immutable**: Annotations don't change (edit creates new annotation)
- **Example**:
```typescript
const annotation: Annotation = {
  text: 'This hook manages reasoning state',
  lineRange: { start: 42, end: 56 },
  category: 'state-management',
};
```

---

### StreamFlow PM Context

**Note**: These are **fixture data**, not actual entities/value objects in code (since StreamFlow PM is purely for demo scenarios).

#### Entities (Conceptual)

**`Project`**: Has identity (projectId), can be modified
**`Sprint`**: Has identity (sprintId), accumulates tasks
**`Task`**: Has identity (taskId), changes status

#### Value Objects (Conceptual)

**`TaskStatus`**: Enum-like value (todo, in_progress, done)
**`Budget`**: Monetary amount (immutable number)
**`DateRange`**: Start/end dates (immutable pair)
**`Priority`**: Enum-like value (low, medium, high)

---

## Domain Events

### Event Design Principles

**Domain Event Characteristics**:
1. **Past Tense**: Events describe what happened, not what should happen
2. **Immutable**: Once emitted, events cannot change
3. **Rich Context**: Include all information needed by subscribers
4. **Timestamped**: Always include when event occurred
5. **Named Clearly**: Event name reveals intent (e.g., `ReasoningStepReceived`, not `DataArrived`)

---

### Pattern Exhibition Context Events

#### `DemoStarted`
**Emitted When**: User clicks "Start Demo"
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  demoId: string;
  patternId: string;
  fixtureId: string;
  speed: DemoSpeed;
}
```
**Subscribers**: NetworkCapture (to begin recording), Analytics (to track usage)

---

#### `DemoPaused`
**Emitted When**: User clicks "Pause" or pattern pauses for input
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  demoId: string;
  sessionId: string;
  reason: 'user_action' | 'await_input' | 'checkpoint';
}
```
**Subscribers**: NetworkCapture, UI (to show pause state)

---

#### `DemoResumed`
**Emitted When**: User clicks "Resume" or input is provided
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  demoId: string;
  sessionId: string;
  resumedFrom: StreamEvent;
}
```
**Subscribers**: NetworkCapture, UI

---

#### `DemoCompleted`
**Emitted When**: Stream finishes all events
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  demoId: string;
  sessionId: string;
  duration: number; // milliseconds
  eventCount: number;
}
```
**Subscribers**: NetworkCapture, Analytics

---

#### `DemoReset`
**Emitted When**: User clicks "Reset"
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  demoId: string;
  sessionId: string;
}
```
**Subscribers**: NetworkCapture (to clear log), UI (to reset state)

---

### Streaming Infrastructure Context Events

#### `StreamSessionCreated`
**Emitted When**: New stream session initialized
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  sessionId: string;
  fixtureId: string;
  totalEvents: number;
}
```
**Subscribers**: NetworkCapture

---

#### `StreamEventEmitted`
**Emitted When**: Stream yields an event
**Payload**: (This is the actual `StreamEvent` payload)
```typescript
{
  id: string;
  type: 'reasoning' | 'answer' | 'memory' | 'validation' | 'table_row' | 'await_input' | 'schema_error';
  data: unknown; // Pattern-specific payload
  timestamp: number;
  sessionId: string;
}
```
**Subscribers**: Pattern UI (to update display), NetworkCapture

**Pattern-Specific Event Types**:

**`reasoning` event** (Chain-of-Reasoning pattern):
```typescript
{
  id: string;
  type: 'reasoning';
  data: {
    id: string;
    summary: string;
    confidence: number;
    details?: string;
  };
  timestamp: number;
}
```

**`answer` event** (Chain-of-Reasoning pattern):
```typescript
{
  id: string;
  type: 'answer';
  data: {
    text: string;
  };
  timestamp: number;
}
```

**`memory` event** (Multi-Turn Memory Timeline):
```typescript
{
  id: string;
  type: 'memory';
  data: {
    id: string;
    type: 'fact' | 'task' | 'risk' | 'decision';
    summary: string;
    ttl: number; // time-to-live (turns)
    excerpt: string; // original token that generated memory
  };
  timestamp: number;
}
```

**`await_input` event** (Agent Await Prompt):
```typescript
{
  id: string;
  type: 'await_input';
  data: {
    requiredFields: Array<{
      name: string;
      type: 'text' | 'date' | 'number' | 'select';
      label: string;
      options?: string[]; // for select fields
      validationHint?: string;
    }>;
    timeout?: number; // milliseconds until fallback
  };
  timestamp: number;
}
```

**`table_row` event** (Tabular Stream View):
```typescript
{
  id: string;
  type: 'table_row';
  data: {
    rowId: string;
    columns: Record<string, unknown>;
    isPartial: boolean; // true if cells are missing
  };
  timestamp: number;
}
```

**`schema_error` event** (Schema-Governed Exchange):
```typescript
{
  id: string;
  type: 'schema_error';
  data: {
    path: string; // JSON path to error
    message: string;
    suggestedFix?: unknown;
  };
  timestamp: number;
}
```

---

#### `StreamSessionPaused`
**Emitted When**: Stream suspends event generation
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  sessionId: string;
  cursorPosition: number; // index of last emitted event
}
```
**Subscribers**: NetworkCapture

---

#### `StreamSessionResumed`
**Emitted When**: Stream continues after pause
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  sessionId: string;
  resumedFrom: number; // cursor position
}
```
**Subscribers**: NetworkCapture

---

#### `StreamSessionClosed`
**Emitted When**: Stream finishes or is manually closed
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  sessionId: string;
  reason: 'completed' | 'cancelled' | 'error';
  eventsEmitted: number;
}
```
**Subscribers**: NetworkCapture, Pattern UI

---

### Developer Tools Context Events

#### `EventCaptured`
**Emitted When**: Network inspector records a stream event
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  captureId: string;
  originalEvent: StreamEvent;
  capturedAt: number;
  stackTrace: string;
}
```
**Subscribers**: NetworkInspector UI

---

#### `EventFilterApplied`
**Emitted When**: User changes event filters in inspector
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  filters: EventFilter[];
  visibleEventCount: number;
}
```
**Subscribers**: NetworkInspector UI

---

#### `EventSelected`
**Emitted When**: User clicks on event in inspector
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  selectedEventId: string;
}
```
**Subscribers**: NetworkInspector UI (to show detail panel)

---

#### `EventsExported`
**Emitted When**: User downloads event log
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  format: ExportFormat;
  eventCount: number;
}
```
**Subscribers**: Analytics

---

#### `SourceAnnotationViewed`
**Emitted When**: User opens annotated source viewer
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  patternId: string;
  fileName: string;
  annotationId: string;
}
```
**Subscribers**: Analytics

---

### User Interaction Events (Cross-Context)

#### `ReasoningStepPromoted`
**Emitted When**: User clicks "Promote to Plan" on reasoning bead
**Pattern**: Chain-of-Reasoning
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  reasoningStepId: string;
  promotedTo: 'main_chat' | 'plan_document';
}
```
**Subscribers**: Pattern UI, Analytics

---

#### `MemoryCardPinned`
**Emitted When**: User pins a memory card
**Pattern**: Multi-Turn Memory Timeline
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  memoryCardId: string;
  pinned: boolean;
}
```
**Subscribers**: Pattern UI, Analytics

---

#### `MemoryCardPruned`
**Emitted When**: User removes a memory card
**Pattern**: Multi-Turn Memory Timeline
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  memoryCardId: string;
}
```
**Subscribers**: Pattern UI, Analytics

---

#### `CheckpointApproved`
**Emitted When**: User approves a validation checkpoint
**Pattern**: Streaming Validation Loop
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  checkpointId: string;
  decision: 'approve' | 'edit' | 'skip';
  editedValue?: unknown;
}
```
**Subscribers**: Pattern UI, Stream (to resume)

---

#### `InputSubmitted`
**Emitted When**: User provides requested input
**Pattern**: Agent Await Prompt
**Payload**:
```typescript
{
  eventId: string;
  timestamp: number;
  inputRequestId: string;
  fields: Record<string, unknown>;
}
```
**Subscribers**: Pattern UI, Stream (to resume with input)

---

## Invariants

### Pattern Exhibition Context Invariants

**INV-1: Single Active Demo**
- **Rule**: Only one demo session can be active per pattern instance at a time
- **Why**: Prevents state conflicts and confusing UI
- **Enforcement**: `PatternDemo.start()` throws error if session already exists
- **Test**: Attempt to start demo twice; expect error

**INV-2: State Transition Validity**
- **Rule**: Demos must follow valid state transitions:
  - `idle` → `streaming` (via start)
  - `streaming` → `paused` (via pause)
  - `paused` → `streaming` (via resume)
  - `streaming` → `completed` (via natural completion)
  - Any state → `idle` (via reset)
- **Why**: Prevents invalid operations (e.g., pausing idle demo)
- **Enforcement**: State machine checks in `PatternDemo` methods
- **Test**: Attempt invalid transitions; expect errors

**INV-3: Fixture Required Before Start**
- **Rule**: Demo cannot start without a valid fixture identifier
- **Why**: Ensures deterministic behavior
- **Enforcement**: `PatternDemo.start()` validates fixture exists
- **Test**: Start demo with missing fixture; expect error

---

### Streaming Infrastructure Context Invariants

**INV-4: Event Order Preservation**
- **Rule**: Events must be emitted in the order they appear in the fixture
- **Why**: Ensures deterministic, predictable behavior
- **Enforcement**: `StreamSession.generate()` uses cursor that advances sequentially
- **Test**: Verify events arrive in fixture order

**INV-5: Unique Event IDs Within Session**
- **Rule**: No two events in the same stream session can have the same ID
- **Why**: Enables reliable event referencing and tracking
- **Enforcement**: `StreamSession` validates event IDs before emission
- **Test**: Fixture with duplicate IDs; expect error

**INV-6: Monotonic Timestamps**
- **Rule**: Each event's timestamp must be >= previous event's timestamp
- **Why**: Maintains temporal consistency
- **Enforcement**: `StreamSession.enrichEvent()` checks timestamp
- **Test**: Verify timestamps are non-decreasing

**INV-7: Closed Stream Immutability**
- **Rule**: Once a stream is closed, no more events can be emitted
- **Why**: Prevents resource leaks and unexpected behavior
- **Enforcement**: `StreamSession.generate()` checks state before yielding
- **Test**: Attempt to emit event after close; expect no-op or error

**INV-8: Pause Cursor Preservation**
- **Rule**: When paused, stream must retain cursor position for resume
- **Why**: Enables seamless pause/resume without data loss
- **Enforcement**: `StreamSession.pause()` saves cursor; `resume()` restores it
- **Test**: Pause, resume; verify next event is correct

---

### Developer Tools Context Invariants

**INV-9: Capture Order Preservation**
- **Rule**: Captured events must maintain the order they were captured
- **Why**: Reflects actual event sequence for debugging
- **Enforcement**: `NetworkCapture.capture()` appends to ordered log
- **Test**: Capture events; verify log order matches capture order

**INV-10: Filter Non-Destructiveness**
- **Rule**: Filters hide events in UI but do not remove them from log
- **Why**: Ensures complete audit trail
- **Enforcement**: `NetworkCapture.applyFilters()` affects visibility only
- **Test**: Apply filter, export; verify all events in export

**INV-11: Unique Capture IDs**
- **Rule**: Each captured event must have a unique capture ID
- **Why**: Enables precise event referencing
- **Enforcement**: `NetworkCapture.capture()` generates unique IDs
- **Test**: Capture multiple events; verify no duplicate capture IDs

**INV-12: Export Completeness**
- **Rule**: Exported logs must include all captured events
- **Why**: Full audit trail for debugging
- **Enforcement**: `NetworkCapture.export()` ignores filters
- **Test**: Apply restrictive filter, export; verify all events in export

---

### Mock Determinism Invariants (Cross-Context)

**INV-13: Fixture Determinism**
- **Rule**: Same fixture + same speed → identical event sequence
- **Why**: Core educational value; enables reliable demos
- **Enforcement**: Fixtures are static JSON; no randomness in mock streams
- **Test**: Run demo twice; expect identical events

**INV-14: Timing Consistency**
- **Rule**: Delay between events must match configured delay profile
- **Why**: Predictable demo pacing
- **Enforcement**: `createMockStream()` applies consistent delays
- **Test**: Measure inter-event delays; expect consistency

---

### StreamFlow PM Context Invariants (Conceptual)

**Note**: These are **business rules in demo scenarios**, not enforced in code (since StreamFlow PM is fictional).

**INV-15: Sprint Non-Overlap**
- **Rule**: Sprint date ranges within a project cannot overlap
- **Why**: Sprints are sequential in agile methodology
- **Fixture Design**: Ensure fixtures have non-overlapping sprints

**INV-16: Budget Allocation**
- **Rule**: Sum of task budgets cannot exceed sprint budget
- **Why**: Financial constraint realism
- **Fixture Design**: Ensure fixtures respect budget constraints

**INV-17: Task Assignment**
- **Rule**: Tasks can only be assigned to team members on the project
- **Why**: Logical consistency
- **Fixture Design**: Ensure assignees are in team roster

---

## Repositories

### Repository Pattern Principles

**Purpose**: Abstract data access to provide illusion of in-memory collection of aggregates.

**Key Characteristics**:
1. **Aggregate-Oriented**: One repository per aggregate root
2. **Collection-Like Interface**: `find()`, `save()`, `delete()`
3. **Encapsulate Storage**: Hide implementation details (JSON files, memory, DB)
4. **Return Domain Objects**: Not DTOs or raw data

---

### Pattern Exhibition Context Repositories

#### `PatternRegistry`

**Responsibility**: Manage available patterns and their metadata.

**Interface**:
```typescript
interface PatternRegistry {
  // Retrieve pattern metadata by ID
  findById(patternId: PatternId): PatternMetadata | null;

  // List all available patterns
  findAll(): PatternMetadata[];

  // Search patterns by keyword
  search(query: string): PatternMetadata[];

  // Check if pattern exists
  exists(patternId: PatternId): boolean;
}
```

**Implementation**: Load from static registry file or scan `/src/patterns/` directory.

**Location**: `/src/lib/repositories/PatternRegistry.ts`

**Example**:
```typescript
class FileSystemPatternRegistry implements PatternRegistry {
  private patterns: Map<string, PatternMetadata> = new Map();

  constructor() {
    this.loadPatterns();
  }

  private loadPatterns(): void {
    // Load from /src/patterns/*/metadata.json
    const patternDirs = fs.readdirSync('/src/patterns');
    for (const dir of patternDirs) {
      const metadata = this.loadMetadata(dir);
      this.patterns.set(metadata.id, metadata);
    }
  }

  findById(patternId: PatternId): PatternMetadata | null {
    return this.patterns.get(patternId.value) || null;
  }

  findAll(): PatternMetadata[] {
    return Array.from(this.patterns.values());
  }
}
```

---

### Streaming Infrastructure Context Repositories

#### `FixtureRepository`

**Responsibility**: Load deterministic mock data for stream sessions.

**Interface**:
```typescript
interface FixtureRepository {
  // Load fixture by ID
  findById(fixtureId: FixtureIdentifier): StreamEvent[] | null;

  // List available fixtures for a pattern
  findByPattern(patternId: PatternId): FixtureIdentifier[];

  // Save fixture (for testing or future editing)
  save(fixtureId: FixtureIdentifier, events: StreamEvent[]): void;

  // Check if fixture exists
  exists(fixtureId: FixtureIdentifier): boolean;
}
```

**Implementation**: Load from JSON files in `/src/fixtures/` or `/src/patterns/{pattern}/fixtures/`.

**Location**: `/src/lib/repositories/FixtureRepository.ts`

**Example**:
```typescript
class JsonFixtureRepository implements FixtureRepository {
  private fixtures: Map<string, StreamEvent[]> = new Map();

  constructor(private basePath: string = '/src/fixtures') {
    this.loadFixtures();
  }

  findById(fixtureId: FixtureIdentifier): StreamEvent[] | null {
    return this.fixtures.get(fixtureId.value) || null;
  }

  findByPattern(patternId: PatternId): FixtureIdentifier[] {
    const patternFixtures: FixtureIdentifier[] = [];
    const patternDir = `${this.basePath}/${patternId.value}`;

    if (fs.existsSync(patternDir)) {
      const files = fs.readdirSync(patternDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          patternFixtures.push(new FixtureIdentifier(file.replace('.json', '')));
        }
      }
    }

    return patternFixtures;
  }

  save(fixtureId: FixtureIdentifier, events: StreamEvent[]): void {
    const path = `${this.basePath}/${fixtureId.value}.json`;
    fs.writeFileSync(path, JSON.stringify(events, null, 2));
    this.fixtures.set(fixtureId.value, events);
  }
}
```

---

### Developer Tools Context Repositories

#### `NetworkEventStore`

**Responsibility**: Persist captured events for inspection and export.

**Interface**:
```typescript
interface NetworkEventStore {
  // Append captured event to store
  append(event: CapturedEvent): void;

  // Retrieve all events for a demo session
  findBySession(sessionId: string): CapturedEvent[];

  // Retrieve events matching filter criteria
  query(filter: EventFilter): CapturedEvent[];

  // Clear all events (reset)
  clear(): void;

  // Export events in specified format
  export(format: ExportFormat): string;
}
```

**Implementation**: In-memory store (no persistence needed for MVP; events live only during demo session).

**Location**: `/src/lib/repositories/NetworkEventStore.ts`

**Example**:
```typescript
class InMemoryNetworkEventStore implements NetworkEventStore {
  private events: CapturedEvent[] = [];

  append(event: CapturedEvent): void {
    this.events.push(event);
  }

  findBySession(sessionId: string): CapturedEvent[] {
    return this.events.filter(e => e.sessionId === sessionId);
  }

  query(filter: EventFilter): CapturedEvent[] {
    return this.events.filter(e => filter.matches(e));
  }

  clear(): void {
    this.events = [];
  }

  export(format: ExportFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.events, null, 2);
      case 'csv':
        return this.convertToCSV(this.events);
    }
  }
}
```

---

#### `AnnotationRepository`

**Responsibility**: Manage code annotations for patterns.

**Interface**:
```typescript
interface AnnotationRepository {
  // Load annotations for a pattern file
  findByPatternAndFile(patternId: PatternId, fileName: string): Annotation[];

  // Save annotations (for future editing UI)
  save(patternId: PatternId, fileName: string, annotations: Annotation[]): void;
}
```

**Implementation**: Load from markdown files or JSON metadata alongside pattern source.

**Location**: `/src/lib/repositories/AnnotationRepository.ts`

**Example**:
```typescript
class MarkdownAnnotationRepository implements AnnotationRepository {
  findByPatternAndFile(patternId: PatternId, fileName: string): Annotation[] {
    const annotationPath = `/src/patterns/${patternId.value}/annotations/${fileName}.md`;

    if (!fs.existsSync(annotationPath)) {
      return [];
    }

    const markdown = fs.readFileSync(annotationPath, 'utf-8');
    return this.parseAnnotations(markdown);
  }

  private parseAnnotations(markdown: string): Annotation[] {
    // Parse markdown structure to extract annotations
    // Format:
    // ## Lines 42-56
    // This hook manages reasoning state...
    const annotations: Annotation[] = [];
    // Parsing logic...
    return annotations;
  }
}
```

---

## Domain Services

### Domain Service Principles

**When to Use Domain Services**:
- Logic doesn't naturally fit in a single entity or value object
- Operation involves multiple aggregates
- Stateless operations (no persistent identity)

**Naming Convention**: Use verb phrases (e.g., `StreamProcessor`, not `StreamProcessorService`)

---

### Streaming Infrastructure Context Services

#### `StreamProcessor`

**Responsibility**: Parse and chunk raw streaming data (SSE format, JSON parsing).

**Why a Service**: Operates on stream events but isn't part of StreamSession aggregate (processing is separate from generation).

**Interface**:
```typescript
interface StreamProcessor {
  // Parse SSE format into structured events
  parseSSE(rawData: string): StreamEvent[];

  // Chunk text into smaller pieces (word-by-word, sentence-by-sentence)
  chunkText(text: string, strategy: 'word' | 'sentence' | 'token'): string[];

  // Validate event against schema
  validateEvent(event: StreamEvent, schema: EventSchema): ValidationResult;
}
```

**Location**: `/src/lib/streaming/streamProcessor.ts`

**Example**:
```typescript
class StreamProcessor {
  parseSSE(rawData: string): StreamEvent[] {
    const lines = rawData.split('\n');
    const events: StreamEvent[] = [];
    let currentEvent: Partial<StreamEvent> = {};

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent.type = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        currentEvent.data = JSON.parse(line.substring(5).trim());
      } else if (line === '') {
        // End of event
        if (currentEvent.type && currentEvent.data) {
          events.push(this.completeEvent(currentEvent));
          currentEvent = {};
        }
      }
    }

    return events;
  }

  chunkText(text: string, strategy: 'word' | 'sentence' | 'token'): string[] {
    switch (strategy) {
      case 'word':
        return text.split(/\s+/);
      case 'sentence':
        return text.split(/(?<=[.!?])\s+/);
      case 'token':
        // Simulate tokenization (real LLMs use BPE tokenizer)
        return text.match(/.{1,4}/g) || [];
    }
  }

  validateEvent(event: StreamEvent, schema: EventSchema): ValidationResult {
    // Zod or custom validation logic
    try {
      schema.parse(event);
      return { valid: true };
    } catch (error) {
      return { valid: false, errors: error.errors };
    }
  }
}
```

---

#### `FixtureGenerator`

**Responsibility**: Create deterministic fixtures from templates or scripts.

**Why a Service**: Operates on multiple domain concepts (events, patterns, fixtures) without belonging to any single aggregate.

**Interface**:
```typescript
interface FixtureGenerator {
  // Generate fixture from template
  generateFromTemplate(template: FixtureTemplate): StreamEvent[];

  // Add realistic jitter to event timings
  applyJitter(events: StreamEvent[], jitterMs: number): StreamEvent[];

  // Merge multiple event channels into one stream
  mergeChannels(channels: StreamEvent[][]): StreamEvent[];
}
```

**Location**: `/src/lib/streaming/fixtureGenerator.ts`

**Example**:
```typescript
class FixtureGenerator {
  generateFromTemplate(template: FixtureTemplate): StreamEvent[] {
    const events: StreamEvent[] = [];

    for (const step of template.steps) {
      if (step.type === 'reasoning') {
        events.push({
          id: this.generateId(),
          type: 'reasoning',
          data: {
            id: step.id,
            summary: step.summary,
            confidence: step.confidence || 0.9,
          },
          timestamp: 0, // Will be set later
        });
      }
    }

    return events;
  }

  applyJitter(events: StreamEvent[], jitterMs: number): StreamEvent[] {
    return events.map(event => ({
      ...event,
      // Add random jitter within range
      jitterDelay: Math.random() * jitterMs,
    }));
  }
}
```

---

### Developer Tools Context Services

#### `EventExporter`

**Responsibility**: Convert captured events to various export formats.

**Why a Service**: Pure transformation logic; no state.

**Interface**:
```typescript
interface EventExporter {
  // Export events as JSON
  toJSON(events: CapturedEvent[]): string;

  // Export events as CSV
  toCSV(events: CapturedEvent[]): string;

  // Export events as Markdown report
  toMarkdown(events: CapturedEvent[]): string;
}
```

**Location**: `/src/lib/tools/eventExporter.ts`

**Example**:
```typescript
class EventExporter {
  toJSON(events: CapturedEvent[]): string {
    return JSON.stringify(events, null, 2);
  }

  toCSV(events: CapturedEvent[]): string {
    const headers = ['captureId', 'type', 'timestamp', 'data'];
    const rows = events.map(e => [
      e.captureId,
      e.type,
      new Date(e.timestamp).toISOString(),
      JSON.stringify(e.data),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  toMarkdown(events: CapturedEvent[]): string {
    let md = '# Stream Event Log\n\n';

    for (const event of events) {
      md += `## Event ${event.captureId}\n`;
      md += `- **Type**: ${event.type}\n`;
      md += `- **Timestamp**: ${new Date(event.timestamp).toISOString()}\n`;
      md += `- **Data**: \`${JSON.stringify(event.data)}\`\n\n`;
    }

    return md;
  }
}
```

---

## Application Services

### Application Service Principles

**Purpose**: Orchestrate use cases by coordinating domain objects, services, and repositories.

**Characteristics**:
1. **Thin Layer**: No business logic; delegates to domain layer
2. **Transaction Boundaries**: Manages unit of work (if applicable)
3. **Use Case Focused**: One method per use case
4. **Cross-Context Coordination**: Bridges multiple bounded contexts

---

### Pattern Exhibition Context Application Services

#### `PatternDemoOrchestrator`

**Responsibility**: Orchestrate the complete lifecycle of a pattern demonstration.

**Use Cases**:
1. Start a demo (load fixture, create stream session, initialize capture)
2. Pause a demo (pause stream, record pause event)
3. Resume a demo (resume stream, record resume event)
4. Reset a demo (cleanup resources, clear capture)
5. Complete a demo (finalize metrics, record completion)

**Coordinates**:
- `PatternDemo` (Pattern Exhibition Context)
- `StreamSession` (Streaming Infrastructure Context)
- `NetworkCapture` (Developer Tools Context)

**Interface**:
```typescript
interface PatternDemoOrchestrator {
  // Start a new demo
  startDemo(
    patternId: PatternId,
    fixtureId: FixtureIdentifier,
    speed: DemoSpeed
  ): DemoSession;

  // Pause running demo
  pauseDemo(sessionId: string): void;

  // Resume paused demo
  resumeDemo(sessionId: string): void;

  // Reset demo to initial state
  resetDemo(sessionId: string): void;

  // Complete demo and finalize
  completeDemo(sessionId: string): DemoSummary;
}
```

**Location**: `/src/lib/orchestrators/PatternDemoOrchestrator.ts`

**Example**:
```typescript
class PatternDemoOrchestrator {
  constructor(
    private fixtureRepo: FixtureRepository,
    private networkCapture: NetworkCapture,
    private eventBus: EventBus
  ) {}

  startDemo(
    patternId: PatternId,
    fixtureId: FixtureIdentifier,
    speed: DemoSpeed
  ): DemoSession {
    // 1. Load fixture from repository
    const events = this.fixtureRepo.findById(fixtureId);
    if (!events) {
      throw new Error(`Fixture not found: ${fixtureId.value}`);
    }

    // 2. Create stream session
    const streamSession = new StreamSession(events, speed);

    // 3. Create demo session
    const demoSession = new DemoSession(patternId, fixtureId, streamSession);

    // 4. Clear previous network capture
    this.networkCapture.clear();

    // 5. Emit DemoStarted event
    this.eventBus.emit(new DemoStarted({
      demoId: demoSession.id,
      patternId: patternId.value,
      fixtureId: fixtureId.value,
      speed,
      timestamp: Date.now(),
    }));

    return demoSession;
  }

  pauseDemo(sessionId: string): void {
    // Coordinate pause across contexts
    const session = this.findSession(sessionId);
    session.streamSession.pause();

    this.eventBus.emit(new DemoPaused({
      sessionId,
      timestamp: Date.now(),
    }));
  }

  completeDemo(sessionId: string): DemoSummary {
    const session = this.findSession(sessionId);

    // Finalize stream
    session.streamSession.close();

    // Get captured events
    const capturedEvents = this.networkCapture.getVisibleEvents();

    // Create summary
    const summary: DemoSummary = {
      sessionId,
      duration: session.duration,
      eventCount: capturedEvents.length,
      completedAt: Date.now(),
    };

    // Emit completion event
    this.eventBus.emit(new DemoCompleted(summary));

    return summary;
  }
}
```

---

### Developer Tools Context Application Services

#### `NetworkInspectorService`

**Responsibility**: Manage network inspection sessions (capture, filter, export).

**Use Cases**:
1. Start capturing events for a demo
2. Apply filters to visible events
3. Select an event for detailed inspection
4. Export captured events

**Coordinates**:
- `NetworkCapture` (Developer Tools Context)
- `NetworkEventStore` (repository)
- `EventExporter` (domain service)

**Interface**:
```typescript
interface NetworkInspectorService {
  // Start capturing events
  startCapture(demoSessionId: string): void;

  // Capture a stream event
  captureEvent(event: StreamEvent): void;

  // Apply filters to visible events
  applyFilters(filters: EventFilter[]): void;

  // Get visible events (filtered)
  getVisibleEvents(): CapturedEvent[];

  // Select event for detail view
  selectEvent(captureId: string): CapturedEvent | null;

  // Export events
  exportEvents(format: ExportFormat): string;

  // Clear all captured events
  clearCapture(): void;
}
```

**Location**: `/src/lib/services/NetworkInspectorService.ts`

**Example**:
```typescript
class NetworkInspectorService {
  constructor(
    private capture: NetworkCapture,
    private store: NetworkEventStore,
    private exporter: EventExporter
  ) {}

  startCapture(demoSessionId: string): void {
    this.capture.clear();
    // Ready to capture events
  }

  captureEvent(event: StreamEvent): void {
    this.capture.capture(event);
    this.store.append(this.capture.getLastCaptured());
  }

  applyFilters(filters: EventFilter[]): void {
    this.capture.applyFilters(filters);
  }

  getVisibleEvents(): CapturedEvent[] {
    return this.capture.getVisibleEvents();
  }

  exportEvents(format: ExportFormat): string {
    const allEvents = this.store.query(new AllEventsFilter());
    return this.exporter.toJSON(allEvents); // or format-specific export
  }

  clearCapture(): void {
    this.capture.clear();
    this.store.clear();
  }
}
```

---

#### `AnnotatedSourceService`

**Responsibility**: Manage annotated source code viewing.

**Use Cases**:
1. Load source code for a pattern file
2. Retrieve annotations for code sections
3. Highlight specific code sections

**Coordinates**:
- `AnnotationRepository` (Developer Tools Context)

**Interface**:
```typescript
interface AnnotatedSourceService {
  // Load source code with annotations
  loadSource(
    patternId: PatternId,
    fileName: string
  ): AnnotatedSource;

  // Get annotations for a file
  getAnnotations(
    patternId: PatternId,
    fileName: string
  ): Annotation[];

  // Highlight specific lines
  highlightLines(
    source: AnnotatedSource,
    lineRange: { start: number; end: number }
  ): AnnotatedSource;
}
```

**Location**: `/src/lib/services/AnnotatedSourceService.ts`

---

## Context Map

### Visual Context Map

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         USER (Developer)                           │
│                                                                    │
└───────────────────────┬────────────────────────────────────────────┘
                        │
                        │ Views demos, inspects streams
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                  PATTERN EXHIBITION CONTEXT                         │
│                  (Aggregate: PatternDemo)                           │
│                                                                     │
│  - Demo lifecycle (start, pause, resume, reset)                    │
│  - UI state management                                              │
│  - User interactions                                                │
│                                                                     │
└──────┬────────────────────────────────────────┬─────────────────────┘
       │                                        │
       │ Customer/Supplier                      │ Customer/Supplier
       │ (Pattern Exhibition                    │ (Pattern Exhibition
       │  consumes streams)                     │  notifies capture)
       │                                        │
       ▼                                        ▼
┌─────────────────────────────────────┐  ┌────────────────────────────┐
│                                     │  │                            │
│  STREAMING INFRASTRUCTURE CONTEXT   │  │  DEVELOPER TOOLS CONTEXT   │
│  (Aggregate: StreamSession)         │  │  (Aggregate: NetworkCapture)│
│                                     │  │                            │
│  - Event generation                 │  │  - Event capture           │
│  - Fixtures                         │  │  - Inspection UI           │
│  - Timing/chunking                  │  │  - Annotated source        │
│                                     │  │                            │
└─────────────────┬───────────────────┘  └────────────────────────────┘
                  │                                 ▲
                  │ Conformist                      │
                  │ (Streaming Infrastructure       │
                  │  defines event schema;          │
                  │  Developer Tools conforms)      │
                  │                                 │
                  └─────────────────────────────────┘
                           StreamEvent schema


┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    STREAMFLOW PM CONTEXT                            │
│                    (Fictional Business Domain)                      │
│                                                                     │
│  - Project, Sprint, Task, Team (fixture data)                       │
│  - Provides realistic demo scenarios                                │
│  - No integration with other contexts (data only)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ Shared Kernel
                          │ (StreamFlow PM entities used as
                          │  fixture data across contexts)
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
  Pattern Exhibition               Streaming Infrastructure
  (uses PM scenarios)              (PM data in fixtures)
```

---

### Context Relationships

#### 1. Pattern Exhibition ↔ Streaming Infrastructure

**Relationship Type**: **Customer/Supplier**

**Upstream**: Streaming Infrastructure Context (supplier)
**Downstream**: Pattern Exhibition Context (customer)

**Integration Pattern**:
- Streaming Infrastructure **defines** `StreamEvent` schema
- Pattern Exhibition **consumes** stream events
- Pattern Exhibition has no influence on event structure

**Contract**:
```typescript
// Defined by Streaming Infrastructure (supplier)
interface StreamEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

// Consumed by Pattern Exhibition (customer)
function PatternDemo() {
  const stream = useStreamProcessor(); // Consumes StreamEvent

  stream.on('event', (event: StreamEvent) => {
    // Handle event
  });
}
```

**Why Customer/Supplier**:
- Streaming Infrastructure is reusable across all patterns
- Pattern Exhibition depends on stable event schema
- Changes to event schema require coordination

---

#### 2. Pattern Exhibition ↔ Developer Tools

**Relationship Type**: **Customer/Supplier** (with notification)

**Upstream**: Developer Tools Context (supplier of capture capability)
**Downstream**: Pattern Exhibition Context (customer)

**Integration Pattern**:
- Developer Tools **provides** `captureEvent()` hook
- Pattern Exhibition **notifies** Developer Tools of events
- Developer Tools operates independently (passive capture)

**Contract**:
```typescript
// Pattern Exhibition calls Developer Tools
function PatternDemo() {
  const { captureEvent } = useNetworkCapture(); // Developer Tools hook
  const { events } = useStreamProcessor();

  useEffect(() => {
    events.forEach(captureEvent); // Notify capture
  }, [events]);
}
```

**Why Customer/Supplier**:
- Pattern Exhibition controls when to capture
- Developer Tools is a passive observer (no control over demo)

---

#### 3. Streaming Infrastructure ↔ Developer Tools

**Relationship Type**: **Conformist**

**Upstream**: Streaming Infrastructure Context (defines event schema)
**Downstream**: Developer Tools Context (conforms to schema)

**Integration Pattern**:
- Streaming Infrastructure **defines** `StreamEvent` structure
- Developer Tools **accepts** events as-is (no translation)
- Developer Tools has no influence on event format

**Contract**:
```typescript
// Streaming Infrastructure defines schema
interface StreamEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

// Developer Tools conforms (no transformation)
class NetworkCapture {
  capture(event: StreamEvent): void {
    // Accept event exactly as defined
    const captured: CapturedEvent = {
      ...event, // No transformation
      captureId: this.generateId(),
      capturedAt: Date.now(),
    };
    this.log.append(captured);
  }
}
```

**Why Conformist**:
- Developer Tools must support all event types (generic capture)
- No need for Anti-Corruption Layer (schema is simple and stable)
- Tight coupling is acceptable (both contexts in same codebase)

---

#### 4. StreamFlow PM ↔ All Contexts

**Relationship Type**: **Shared Kernel** (fixture data)

**Integration Pattern**:
- StreamFlow PM entities (Project, Sprint, Task) used as **fixture data**
- All contexts reference same fixture files (`/src/fixtures/projects.json`)
- No code dependencies (data only)

**Contract**:
```typescript
// Shared fixture schema
interface StreamFlowProject {
  id: string;
  name: string;
  team: string[];
  budget: number;
  sprints: Sprint[];
}

// Used by Pattern Exhibition
function ChainOfReasoningDemo() {
  const project = fixtures.projects[0]; // Reference fixture
  // Display project data in demo
}

// Used by Streaming Infrastructure
function createReasoningStream() {
  const project = fixtures.projects[0]; // Reference fixture
  // Generate events about project
}
```

**Why Shared Kernel**:
- StreamFlow PM is fictional; no real business logic
- Fixture data is simple and stable
- All contexts need consistent demo scenarios
- Shared fixture files prevent duplication

---

### Integration Patterns Summary

| Relationship | Pattern | Upstream (Supplier) | Downstream (Customer) | Notes |
|--------------|---------|---------------------|----------------------|-------|
| Pattern Exhibition ← Streaming Infrastructure | Customer/Supplier | Streaming Infrastructure | Pattern Exhibition | Pattern consumes events |
| Pattern Exhibition ← Developer Tools | Customer/Supplier | Developer Tools | Pattern Exhibition | Pattern notifies capture |
| Developer Tools ← Streaming Infrastructure | Conformist | Streaming Infrastructure | Developer Tools | Tools conform to event schema |
| All ← StreamFlow PM | Shared Kernel | StreamFlow PM | All contexts | Shared fixture data |

---

## Implementation Guide

### How to Use This DDD Model in Practice

#### 1. Adding a New Pattern

**Steps**:

1. **Define Domain Events**
   - Identify pattern-specific event types (e.g., `reasoning`, `memory`)
   - Extend `StreamEvent` interface with pattern-specific payloads
   - Document in `/src/patterns/{pattern}/types.ts`

2. **Create Fixtures**
   - Design demo scenarios using StreamFlow PM context
   - Create fixture JSON in `/src/patterns/{pattern}/fixtures/`
   - Register fixture in `FixtureRepository`

3. **Implement Aggregate**
   - Create `{Pattern}Demo` component (aggregate root)
   - Manage demo lifecycle (start, pause, resume, reset)
   - Enforce invariants (state transitions, fixture requirements)

4. **Integrate Streaming Infrastructure**
   - Use `createMockStream()` from Streaming Infrastructure Context
   - Consume `StreamEvent`s via custom hook (e.g., `useReasoningStream`)
   - Respect event ordering invariant

5. **Integrate Developer Tools**
   - Use `useNetworkCapture()` hook to capture events
   - Notify capture on every event emission
   - Ensure Network Inspector shows pattern-specific events

6. **Write Tests**
   - Test invariants (state transitions, event ordering)
   - Test determinism (same fixture → same events)
   - Test integration (events captured correctly)

**Example**:
```typescript
// src/patterns/new-pattern/NewPatternDemo.tsx
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { createMockStream } from '@/lib/streaming/mockSSE';
import { newPatternFixture } from './fixtures';

export function NewPatternDemo() {
  // 1. Use Developer Tools Context
  const { captureEvent, events } = useNetworkCapture();

  // 2. Use Streaming Infrastructure Context
  const [patternEvents, setPatternEvents] = useState<StreamEvent[]>([]);

  useEffect(() => {
    const stream = createMockStream(newPatternFixture, 'normal');

    (async () => {
      for await (const event of stream) {
        // 3. Capture for Network Inspector
        captureEvent(event);

        // 4. Update pattern UI
        setPatternEvents(prev => [...prev, event]);
      }
    })();
  }, []);

  return (
    <DemoContainer>
      {/* Pattern-specific UI */}
      <PatternDisplay events={patternEvents} />

      {/* Developer Tools */}
      <NetworkInspector events={events} />
    </DemoContainer>
  );
}
```

---

#### 2. Modifying Stream Contract

**When**: Adding new event types or changing event structure.

**Steps**:

1. **Update Event Schema** (Streaming Infrastructure Context)
   - Modify `/src/lib/streaming/eventSchema.ts`
   - Add new event type or fields
   - Update TypeScript interfaces

2. **Update Fixtures** (Streaming Infrastructure Context)
   - Add new event types to fixture files
   - Ensure fixtures conform to updated schema

3. **Update Consumers** (Pattern Exhibition Context)
   - Update pattern components to handle new event types
   - Add UI for new event types

4. **Update Developer Tools** (Developer Tools Context)
   - Ensure Network Inspector displays new event types
   - Add filters for new types if needed

5. **Update Tests**
   - Test new event types in fixtures
   - Test pattern handling of new events
   - Test Network Inspector with new events

**Example**:
```typescript
// 1. Update schema (Streaming Infrastructure)
export interface NewEventType extends StreamEvent {
  type: 'new_event';
  data: {
    fieldA: string;
    fieldB: number;
  };
}

// 2. Update fixture
const fixture: StreamEvent[] = [
  {
    id: 'event-1',
    type: 'new_event',
    data: { fieldA: 'value', fieldB: 42 },
    timestamp: Date.now(),
  },
  // ...
];

// 3. Update pattern component (Pattern Exhibition)
function PatternDemo() {
  const handleEvent = (event: StreamEvent) => {
    if (event.type === 'new_event') {
      // Handle new event type
      console.log(event.data.fieldA);
    }
  };
}

// 4. Update Network Inspector (Developer Tools)
function EventTypeFilter() {
  return (
    <>
      <Checkbox type="reasoning" />
      <Checkbox type="answer" />
      <Checkbox type="new_event" /> {/* New filter */}
    </>
  );
}
```

---

#### 3. Refactoring Across Contexts

**When**: Improving code without changing behavior.

**Guidelines**:

- **Respect Context Boundaries**: Don't mix concerns from different contexts
- **Use Application Services**: For cross-context orchestration
- **Extract Domain Services**: For reusable logic (e.g., parsing, validation)
- **Keep Aggregates Focused**: One responsibility per aggregate

**Anti-Pattern Example**:
```typescript
// ❌ BAD: PatternDemo directly manages capture (crosses context boundary)
class PatternDemo {
  private capture: NetworkCapture; // Wrong! Developer Tools concern

  emitEvent(event: StreamEvent): void {
    this.capture.capture(event); // Crosses boundary
  }
}
```

**Correct Pattern**:
```typescript
// ✅ GOOD: PatternDemo notifies; NetworkCapture handles capture
class PatternDemo {
  private eventBus: EventBus; // Decoupled communication

  emitEvent(event: StreamEvent): void {
    this.eventBus.emit(new StreamEventEmitted(event));
    // NetworkCapture subscribes to EventEmitted and captures
  }
}
```

---

#### 4. Debugging with DDD Mindset

**When**: Tracing bugs or understanding flow.

**Steps**:

1. **Identify Affected Context**
   - Bug in demo UI? → Pattern Exhibition Context
   - Bug in event generation? → Streaming Infrastructure Context
   - Bug in Network Inspector? → Developer Tools Context

2. **Check Invariants**
   - Is an invariant violated?
   - Example: Events out of order (violates INV-4)

3. **Trace Aggregate Lifecycle**
   - Where is aggregate created?
   - What state transitions occurred?
   - Was aggregate properly cleaned up?

4. **Review Domain Events**
   - Are events being emitted?
   - Are subscribers receiving events?
   - Is event payload correct?

5. **Inspect Repository/Service Calls**
   - Is fixture loading correctly?
   - Is stream processor parsing events?

**Example Debug Session**:
```
Problem: Network Inspector not showing events

1. Identify context: Developer Tools Context
2. Check invariant: INV-9 (capture order preservation)
3. Trace NetworkCapture lifecycle:
   - Is NetworkCapture created?
   - Is captureEvent() being called?
4. Review events:
   - Is StreamEventEmitted being emitted?
   - Is NetworkCapture subscribed?
5. Inspect:
   - Check useNetworkCapture() hook
   - Verify captureEvent callback is passed to pattern
```

---

### File Organization by Context

```
src/
├── patterns/                    # Pattern Exhibition Context
│   ├── chain-of-reasoning/
│   │   ├── ChainOfReasoningDemo.tsx    # PatternDemo aggregate
│   │   ├── ReasoningBeadline.tsx       # UI components
│   │   ├── hooks.ts                    # useReasoningStream
│   │   ├── types.ts                    # Pattern-specific types
│   │   └── fixtures/                   # Pattern fixtures
│   └── ...
│
├── lib/
│   ├── streaming/               # Streaming Infrastructure Context
│   │   ├── mockSSE.ts           # StreamSession aggregate
│   │   ├── streamProcessor.ts   # Domain service
│   │   ├── fixtureGenerator.ts  # Domain service
│   │   └── eventSchema.ts       # Value objects
│   │
│   ├── hooks/                   # Cross-context hooks
│   │   ├── useNetworkCapture.ts # Developer Tools hook
│   │   └── useStreamProcessor.ts # Streaming Infrastructure hook
│   │
│   ├── repositories/            # Repositories
│   │   ├── FixtureRepository.ts
│   │   ├── PatternRegistry.ts
│   │   └── NetworkEventStore.ts
│   │
│   ├── services/                # Application Services
│   │   ├── PatternDemoOrchestrator.ts
│   │   ├── NetworkInspectorService.ts
│   │   └── AnnotatedSourceService.ts
│   │
│   └── tools/                   # Developer Tools Context (services)
│       └── eventExporter.ts
│
├── components/
│   ├── NetworkInspector/        # Developer Tools Context (UI)
│   │   ├── NetworkInspector.tsx # NetworkCapture UI
│   │   └── EventList.tsx
│   │
│   └── AnnotatedSource/         # Developer Tools Context (UI)
│       └── AnnotatedSource.tsx
│
├── fixtures/                    # StreamFlow PM Context
│   ├── projects.json
│   ├── teams.json
│   └── ...
│
└── types/                       # Shared types
    ├── events.ts                # StreamEvent definitions
    └── streamflow.ts            # StreamFlow PM types
```

---

## Summary

### Key Takeaways

1. **Four Bounded Contexts**:
   - **Pattern Exhibition**: Demo orchestration and UI
   - **Streaming Infrastructure**: Event generation and fixtures
   - **Developer Tools**: Observability (Network Inspector, Annotated Source)
   - **StreamFlow PM**: Fictional business domain for demo scenarios

2. **Aggregates**:
   - `PatternDemo`: Manages demo lifecycle (Pattern Exhibition)
   - `StreamSession`: Manages event generation (Streaming Infrastructure)
   - `NetworkCapture`: Manages event capture (Developer Tools)

3. **Invariants**:
   - Deterministic fixtures (same input → same output)
   - Event order preservation (no out-of-order events)
   - State transition validity (enforced state machines)
   - Capture completeness (all events logged)

4. **Context Relationships**:
   - Customer/Supplier: Pattern Exhibition ← Streaming Infrastructure
   - Conformist: Developer Tools ← Streaming Infrastructure
   - Shared Kernel: All contexts ← StreamFlow PM (fixture data)

5. **Implementation Principles**:
   - Education over abstraction (explicit, readable code)
   - Mock-first architecture (determinism is the product)
   - Transparency through observability (Network Inspector mandatory)
   - Context boundaries respected (no cross-context leakage)

---

### Next Steps

1. **Read Pattern Specifications**: Understand intent and UX flow for each pattern
2. **Review CLAUDE.md**: Familiarize yourself with code standards and testing strategy
3. **Explore Codebase**: Map files to bounded contexts using this document
4. **Implement Patterns**: Follow implementation guide for adding new patterns
5. **Contribute**: Respect context boundaries and invariants when making changes

---

**Document Version**: 1.0
**Last Updated**: November 9, 2024
**Maintained By**: Streaming Patterns Library Team

For questions or clarifications, please open an issue or discussion on GitHub.
