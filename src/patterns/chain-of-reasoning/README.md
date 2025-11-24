# Chain-of-Reasoning Pattern

## Overview

The Chain-of-Reasoning pattern makes AI reasoning visible and interactive by streaming reasoning steps before the final answer. This builds trust and allows users to understand how the AI arrived at its conclusion.

**Demo Scenario**: StreamFlow PM's AI assistant helping a product manager plan a 2-week sprint. The AI shows its reasoning process before presenting the final sprint plan.

---

## Architecture: How the UI "Calls the Backend"

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ChainOfReasoningDemo.tsx                     │
│                                                                 │
│  const { reasoning, answer, isStreaming } =                     │
│    useReasoningStreamWithReset(DEMO_PROMPT, options)           │
│                           ↓                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ 1. Call hook with prompt & options
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                          hooks.ts                               │
│                   useReasoningStream()                          │
│                                                                 │
│  useEffect(() => {                                              │
│    const stream = createMockReasoningStream({...})             │
│                           ↓                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ 2. Create AsyncGenerator
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      mockStream.ts                              │
│              createMockReasoningStream()                        │
│                                                                 │
│  async function* createMockReasoningStream() {                  │
│    const fixture = getFixtureForPrompt(prompt)                  │
│    for (const event of fixture) {                               │
│      await delay(delayMs)        // Simulate network latency    │
│      onEvent(event)              // → Network Inspector         │
│      yield event                 // ← Send to hook              │
│    }                             ↓                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ 3. Yield events one by one
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                          hooks.ts                               │
│                   useReasoningStream()                          │
│                                                                 │
│    for await (const event of stream) {                          │
│      switch (event.type) {                                      │
│        case 'reasoning':                                        │
│          setReasoning(prev => [...prev, event.data])            │
│          break                  ↓                               │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ 4. Update state → Trigger re-render
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ChainOfReasoningDemo.tsx                     │
│                                                                 │
│  // Component re-renders with new state                         │
│  <ReasoningBeadline reasoning={reasoning} />                    │
│  <AnswerDisplay answer={answer} />                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Explanation

### Step 1: UI Component Calls the Hook

**File**: `ChainOfReasoningDemo.tsx` (lines 188-198)

```tsx
// The UI component calls useReasoningStreamWithReset with a prompt and options
const {
  reasoning,          // ← State: Array of reasoning steps
  answer,            // ← State: Final answer text
  isStreaming,       // ← State: Whether stream is active
  error,             // ← State: Any errors
  retryCount,        // ← State: Number of retries
  isRetrying,        // ← State: Whether currently retrying
  retryDelayMs,      // ← State: Delay before next retry
  reset,             // ← Function: Restart the stream
} = useReasoningStreamWithReset(DEMO_PROMPT, streamOptions);
```

**What happens**: The component declares what state it needs. React will re-render whenever any of these values change.

---

### Step 2: Hook Creates the Mock Stream

**File**: `hooks.ts` (lines 305-312)

```tsx
// Inside the useEffect, the hook creates an async generator
const stream = createMockReasoningStream({
  prompt,
  speed: options?.speed ?? 'normal',      // Fast/normal/slow
  onEvent: handleEvent,                    // Callback for network inspector
  timeoutMs: options?.timeoutMs,           // Timeout config
  simulateError: options?.simulateError,   // Error simulation
});
```

**What happens**: The hook instantiates an AsyncGenerator. This is like opening a connection to a "backend" (in this case, mock data).

---

### Step 3: Mock Stream Yields Events

**File**: `mockStream.ts` (lines 102-193)

```tsx
export async function* createMockReasoningStream(
  config: ReasoningStreamConfig
): AsyncGenerator<StreamEvent, void, undefined> {
  // Get fixture data (pre-defined events for this prompt)
  const fixture = getFixtureForPrompt(prompt);

  // Get delay based on speed (fast=50ms, normal=300ms, slow=1000ms)
  const delayMs = SPEED_DELAYS[speed];

  // Stream each event from the fixture
  for (const event of fixture) {
    // Simulate network latency
    await delay(delayMs);

    // Call the event callback (for Network Inspector)
    if (onEvent) {
      onEvent(event);  // ← This sends event to Network Inspector
    }

    // Yield the event to the consumer (the hook)
    yield event;  // ← This is where the "backend response" comes through
  }
}
```

**What happens**:
- The generator pulls events from fixture data (stored in `fixtures.ts`)
- It adds a delay to simulate network latency (50ms-1000ms)
- It calls `onEvent` to send events to the Network Inspector
- It **yields** the event back to the hook

**Key concept**: `yield` pauses execution and returns a value. The next time the consumer calls `.next()`, execution resumes after the yield.

---

### Step 4: Hook Consumes Events with for-await-of

**File**: `hooks.ts` (lines 315-343)

```tsx
// The hook uses a for-await-of loop to consume the AsyncGenerator
for await (const event of stream) {
  // Check if stream was cancelled (component unmounted)
  if (abortController.signal.aborted) {
    return;  // Stop consuming
  }

  // Check if component is still mounted
  if (!isMountedRef.current) {
    return;  // Prevent "state update on unmounted component" warning
  }

  // Handle different event types
  switch (event.type) {
    case 'reasoning': {
      // Add reasoning step to the array (this triggers re-render!)
      setReasoning((prev) => [...prev, event.data]);
      break;
    }

    case 'answer': {
      // Append answer text (this triggers re-render!)
      setAnswer((prev) => prev + event.data.text);
      break;
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = event;
      console.warn('Unknown event type:', _exhaustive);
    }
  }
}
```

**What happens**:
- The `for await` loop automatically calls `stream.next()` to get the next event
- Each `yield` from the mock becomes a value here
- The hook calls `setReasoning()` or `setAnswer()` which **triggers React to re-render the component**
- The loop continues until the generator is exhausted (or cancelled)

**Key concept**: `for await (const event of stream)` is syntactic sugar for:
```tsx
const iterator = stream[Symbol.asyncIterator]();
let result = await iterator.next();
while (!result.done) {
  const event = result.value;
  // ... process event
  result = await iterator.next();
}
```

---

### Step 5: UI Re-renders with New State

**File**: `ChainOfReasoningDemo.tsx` (lines 402-406)

```tsx
// When setReasoning() is called, React schedules a re-render
// The component function runs again with the new state values
<ReasoningBeadline
  reasoning={reasoning}  // ← New array with latest reasoning steps
  className={styles.beadline}
/>
```

**What happens**:
- Every time `setReasoning()` or `setAnswer()` is called, React re-renders
- The UI component reads the updated state and displays it
- This creates the "streaming" visual effect: new items appear one by one

---

## Key Concepts

### 1. AsyncGenerator (the "stream")

```tsx
async function* createMockReasoningStream() {
  yield event1;  // Pause here, return event1
  yield event2;  // Pause here, return event2
  yield event3;  // Pause here, return event3
}
```

- **Generator function** (`function*`) can pause/resume with `yield`
- **Async generator** (`async function*`) can also `await` (for delays)
- Each `yield` returns control to the consumer, then resumes later

### 2. for-await-of (consuming the stream)

```tsx
for await (const event of stream) {
  console.log(event);  // Logs event1, then event2, then event3
}
```

- Automatically calls `stream.next()` to get each value
- Waits for async operations (the `await delay()` inside the generator)
- Stops when the generator is exhausted (no more yields)

### 3. React State Updates (triggering UI changes)

```tsx
setReasoning((prev) => [...prev, event.data]);
```

- React batches state updates for performance
- Each `setState` schedules a re-render
- Component function runs again with new state
- UI updates to show the new reasoning step

### 4. Event Callbacks (Network Inspector)

```tsx
onEvent(event);  // Inside mock stream
```

- The mock calls `onEvent` before yielding
- This sends the event to the Network Inspector
- The Inspector is a separate component that displays events in real-time

---

## Why This Architecture?

### Benefits of AsyncGenerator:
1. **Lazy evaluation**: Events are produced on-demand (not all at once)
2. **Backpressure**: Consumer controls the pace (pause/resume)
3. **Cancellation**: Can stop early with `stream.return()`
4. **Clean syntax**: `for await` is more readable than callbacks

### Benefits of Mocks:
1. **No backend needed**: Demos work offline
2. **Deterministic**: Same prompt → same output (great for testing)
3. **Fast development**: No API key setup, no rate limits
4. **Educational**: Students can see the full flow in the codebase

### Benefits of Custom Hook:
1. **Encapsulation**: Stream logic is separate from UI
2. **Reusability**: Multiple components can use the same hook
3. **Testability**: Hook can be tested independently
4. **Cleanup**: React automatically cleans up on unmount

---

## Tracing a Single Event

Let's trace what happens when a reasoning event arrives:

### 1. Mock Stream Yields Event

**File**: `mockStream.ts:185`

```tsx
yield {
  type: 'reasoning',
  data: {
    id: '1',
    summary: 'Analyzing backlog priorities',
    confidence: 0.9,
    timestamp: Date.now()
  }
}
```

### 2. Hook Receives Event

**File**: `hooks.ts:327-330`

```tsx
case 'reasoning': {
  setReasoning((prev) => [...prev, event.data]);
  break;
}
```

### 3. React Schedules Re-render

- `reasoning` state changes from `[]` to `[{ id: '1', summary: '...' }]`
- React marks component for re-render

### 4. Component Re-renders

**File**: `ChainOfReasoningDemo.tsx:402`

```tsx
<ReasoningBeadline reasoning={reasoning} />
```

### 5. UI Updates

- `ReasoningBeadline` receives new array with 1 item
- Maps over array and renders bead component
- User sees the first reasoning step appear!

**Repeat steps 1-5 for each event until stream completes.**

---

## Stream Contract

### Event Types

```typescript
// Reasoning step event
interface ReasoningEvent {
  type: 'reasoning';
  data: {
    id: string;                    // Unique identifier (e.g., "reason-1")
    summary: string;               // Brief summary of reasoning step
    confidence: number;            // Confidence level (0-1)
    details?: string;              // Optional detailed explanation
    timestamp: number;             // When this step was generated
  };
}

// Answer event
interface AnswerEvent {
  type: 'answer';
  data: {
    text: string;                  // Answer text (streamed incrementally)
    isFinal: boolean;              // Whether this is the final chunk
  };
}

type StreamEvent = ReasoningEvent | AnswerEvent;
```

### Stream Lifecycle

```
START
  ↓
  ├─ reasoning event (step 1)
  ├─ reasoning event (step 2)
  ├─ reasoning event (step 3)
  ├─ ...
  ├─ reasoning event (step N)
  ↓
  ├─ answer event (chunk 1)
  ├─ answer event (chunk 2)
  ├─ ...
  ├─ answer event (chunk N, isFinal: true)
  ↓
END
```

---

## File Structure

```
chain-of-reasoning/
├── ChainOfReasoningDemo.tsx          # Main demo component
├── ChainOfReasoningDemo.module.css   # Component styles
├── ChainOfReasoningDemo.test.tsx     # Integration tests
├── ReasoningBeadline.tsx              # Reasoning steps UI
├── ReasoningBeadline.module.css       # Bead styles
├── StreamErrorDisplay.tsx             # Error handling UI
├── hooks.ts                           # useReasoningStream hook
├── mockStream.ts                      # AsyncGenerator mock
├── fixtures.ts                        # Mock event data
├── types.ts                           # TypeScript interfaces
└── README.md                          # This file
```

---

## Usage Example

### Basic Usage

```tsx
import { useReasoningStream } from './hooks';

function MyComponent() {
  const { reasoning, answer, isStreaming } = useReasoningStream(
    'Plan a 2-week sprint'
  );

  return (
    <div>
      {reasoning.map(step => (
        <div key={step.id}>{step.summary}</div>
      ))}
      {answer && <div>{answer}</div>}
      {isStreaming && <Spinner />}
    </div>
  );
}
```

### With Network Inspector

```tsx
import { useReasoningStream } from './hooks';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';

function MyComponent() {
  const { captureEvent } = useNetworkCapture();

  const { reasoning, answer } = useReasoningStream(
    'Plan a sprint',
    {
      speed: 'normal',
      onEvent: captureEvent  // Send events to Network Inspector
    }
  );

  return (
    <>
      <ReasoningBeadline reasoning={reasoning} />
      <NetworkInspector />
    </>
  );
}
```

### With Reset Functionality

```tsx
import { useReasoningStreamWithReset } from './hooks';

function MyComponent() {
  const { reasoning, answer, isStreaming, reset } = useReasoningStreamWithReset(
    'Plan a sprint',
    { speed: 'fast' }
  );

  return (
    <div>
      <ReasoningBeadline reasoning={reasoning} />
      <button onClick={reset} disabled={isStreaming}>
        Restart Demo
      </button>
    </div>
  );
}
```

---

## Running the Demo

```bash
# Start dev server
npm run dev

# Navigate to:
# http://localhost:5173/patterns/chain-of-reasoning

# Run tests
npm test src/patterns/chain-of-reasoning
```

---

## Design Decisions

### Why AsyncGenerator instead of callbacks?

**AsyncGenerator**:
```tsx
for await (const event of stream) {
  handleEvent(event);
}
```

**Callbacks** (alternative):
```tsx
stream.on('event', handleEvent);
stream.on('end', handleEnd);
stream.on('error', handleError);
```

We chose AsyncGenerator because:
- **Cleaner syntax**: `for await` is more readable than event listeners
- **Better cancellation**: `break` or `return` stops immediately
- **Type safety**: TypeScript understands async iterators natively
- **Backpressure**: Consumer controls pace naturally

### Why mocks instead of real API?

1. **No setup required**: Students can run demos immediately
2. **Deterministic**: Tests are reliable (same input → same output)
3. **Fast development**: No rate limits, no API keys
4. **Offline-first**: Works without internet
5. **Educational**: Shows the full flow in a single codebase

Real API integration can be added later as an optional feature.

### Why custom hook instead of inline logic?

Separating stream logic into a hook provides:
- **Reusability**: Other components can use the same hook
- **Testability**: Hook can be tested independently
- **Separation of concerns**: UI renders, hook manages state
- **Easier debugging**: Logic is in one place

---

## Error Handling

The pattern includes comprehensive error handling:

### Retry Logic with Exponential Backoff

```tsx
const { reasoning, answer, error, retryCount, isRetrying } = useReasoningStream(
  'Plan a sprint',
  {
    retryConfig: {
      maxRetries: 3,              // Try up to 3 times
      initialDelayMs: 1000,       // Start with 1s delay
      maxDelayMs: 10000,          // Cap at 10s
      backoffMultiplier: 2,       // Double delay each time
      retryOnTimeout: true,       // Retry timeouts
      retryOnNetwork: true,       // Retry network errors
      retryOnStream: false,       // Don't retry stream errors
    }
  }
);
```

### Error Types

```typescript
class StreamError extends Error {
  type: 'timeout' | 'network' | 'stream';
}
```

- **Timeout**: Request took too long (retriable)
- **Network**: Connection failed (retriable)
- **Stream**: Data parsing error (not retriable)

### Error Simulation

Test error handling with:

```tsx
const { error } = useReasoningStream('Plan a sprint', {
  simulateError: 'timeout'  // or 'network' or 'mid-stream'
});
```

---

## Performance Considerations

### Memory Management

- **Cleanup on unmount**: `abortController.abort()` stops stream
- **Mounted check**: `isMountedRef.current` prevents state updates after unmount
- **Generator cleanup**: `finally` block in generator ensures cleanup

### Optimization Tips

1. **Memoize callbacks**: Use `useCallback` for `onEvent`
2. **Batch updates**: React batches `setState` calls automatically
3. **Virtual scrolling**: For 100+ reasoning steps, use `react-virtual`
4. **Debounce rapid updates**: For high-frequency events

---

## Testing Strategy

### Unit Tests (hooks)

```tsx
describe('useReasoningStream', () => {
  it('should stream reasoning steps', async () => {
    const { result } = renderHook(() =>
      useReasoningStream('test prompt')
    );

    await waitFor(() => {
      expect(result.current.reasoning.length).toBeGreaterThan(0);
    });
  });
});
```

### Component Tests

```tsx
describe('ChainOfReasoningDemo', () => {
  it('should render reasoning steps', async () => {
    render(<ChainOfReasoningDemo />);

    await waitFor(() => {
      expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

```tsx
it('should stream full reasoning to answer', async () => {
  render(<ChainOfReasoningDemo />);

  // Wait for first reasoning step
  await waitFor(() => {
    expect(screen.getByText(/Analyzing/i)).toBeInTheDocument();
  });

  // Wait for final answer
  await waitFor(() => {
    expect(screen.getByText(/Sprint Plan:/i)).toBeInTheDocument();
  }, { timeout: 5000 });
});
```

---

## Accessibility

- **Keyboard navigation**: All controls are keyboard-accessible
- **Screen reader support**: `aria-live="polite"` for stream updates
- **Semantic HTML**: Proper heading hierarchy and landmark regions
- **Focus management**: Focus is preserved during streaming

---

## Pattern Variations

This architecture can be adapted for other streaming patterns:

### Agent-Await-Prompt
- Add `await_input` event type
- Pause stream until user provides input
- Resume with `input_submission` event

### Tabular Stream View
- Add `schema` and `row` event types
- Stream table rows incrementally
- Support sort/filter on partial data

### Multi-Turn Memory Timeline
- Add `memory.create`, `memory.update` events
- Maintain conversation state across turns
- Pin/prune memories based on user actions

---

## Related Patterns

- **Agent-Await-Prompt**: Pausing mid-stream for user input
- **Tabular Stream View**: Streaming structured data (tables)
- **Multi-Turn Memory Timeline**: Memory across conversation turns
- **Turn-Taking Co-Creation**: Collaborative editing with AI
- **Streaming Validation Loop**: Checkpoint-based validation
- **Schema-Governed Exchange**: Real-time schema validation

---

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [AsyncGenerator MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator)
- [TypeScript Generators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#generators-and-iteration-for-downlevel-targets)
- [Streaming Patterns Library Docs](../../README.md)

---

**Last Updated**: 2025-11-24
**Pattern Status**: ✅ Complete
**Test Coverage**: >80%
