# Mock SSE Architecture - How Streaming Patterns Works

## Table of Contents
1. [Overview](#overview)
2. [Why Mocks Instead of Real APIs](#why-mocks-instead-of-real-apis)
3. [Real SSE vs Mock SSE Comparison](#real-sse-vs-mock-sse-comparison)
4. [Mock SSE Architecture](#mock-sse-architecture)
5. [Fixture-Based System](#fixture-based-system)
6. [How to Use the Mock System](#how-to-use-the-mock-system)
7. [Extending the Mock System](#extending-the-mock-system)
8. [Testing Strategies](#testing-strategies)
9. [Migration to Real APIs](#migration-to-real-apis)

---

## Overview

The Streaming Patterns library uses **mock Server-Sent Events (SSE)** to simulate real-time streaming from LLM APIs like OpenAI, Anthropic, or custom backends. This approach is **intentionally educational** - it allows developers to learn streaming UX patterns without requiring API keys, incurring costs, or dealing with network latency.

### Key Principle
> **Mocks are not a hack - they're the educational foundation.**
>
> Every mock stream is deterministic, reviewable, and designed to teach specific streaming behaviors.

---

## Why Mocks Instead of Real APIs

### Educational Benefits

1. **Zero Barriers to Entry**
   - No API keys required
   - No costs or rate limits
   - Works offline
   - Instant setup

2. **Deterministic Behavior**
   - Same input → same output (every time)
   - Predictable for testing and debugging
   - Reviewable in version control

3. **Speed Controls**
   - Fast mode for development (50ms delays)
   - Normal mode for realistic UX (300ms delays)
   - Slow mode for edge case testing (1000ms delays)

4. **Controlled Edge Cases**
   - Simulate network errors
   - Test timeout scenarios
   - Demonstrate partial completions
   - Show retry logic

5. **Version Control**
   - Fixtures are committed to git
   - Code reviews include stream behavior
   - Rollback to previous stream patterns

### Real-World Accuracy

Despite being mocks, our SSE implementation accurately simulates:
- Chunked data delivery
- Event types and metadata
- Network delays and jitter
- Connection lifecycle (open, message, error, close)
- Reconnection logic
- Browser EventSource API behavior

---

## Real SSE vs Mock SSE Comparison

### Real SSE (Production LLM API)

```typescript
// Real implementation (OpenAI example)
const eventSource = new EventSource('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle unpredictable, real-time response
  console.log(data);
};

eventSource.onerror = (error) => {
  // Handle network errors, rate limits, API failures
  console.error('Stream error:', error);
};
```

**Characteristics:**
- ❌ Requires API key and billing
- ❌ Non-deterministic (responses vary)
- ❌ Network-dependent (latency, failures)
- ❌ Rate-limited (costs money)
- ✅ Real-world behavior

---

### Mock SSE (Streaming Patterns Library)

```typescript
// Mock implementation (our library)
import { createMockReasoningStream } from '@/patterns/chain-of-reasoning/mockStream';

const stream = createMockReasoningStream('Plan a sprint', 'normal');

for await (const event of stream) {
  if (event.type === 'reasoning') {
    console.log('Reasoning step:', event.data);
  } else if (event.type === 'answer') {
    console.log('Final answer:', event.data);
  }
}
```

**Characteristics:**
- ✅ No API key or costs
- ✅ Deterministic (same every time)
- ✅ Works offline
- ✅ Controllable speed
- ✅ Educational focus
- ⚠️ Simulated behavior (but accurate)

---

## Mock SSE Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Component                          │
│  (ChainOfReasoningDemo, AgentAwaitPromptDemo, etc.)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Custom Hook                                │
│  (useReasoningStream, useValidationLoop, etc.)              │
│  • Manages state (reasoning, answer, isStreaming)           │
│  • Orchestrates stream lifecycle                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ creates
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Mock Stream Generator                         │
│  (createMockReasoningStream, createMockValidationStream)    │
│  • AsyncGenerator<StreamEvent>                              │
│  • Reads from fixtures                                      │
│  • Applies delays based on speed                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ reads from
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Fixture Repository                         │
│  • JSON/TypeScript files with stream events                 │
│  • Version-controlled, reviewable                           │
│  • Deterministic, reproducible                              │
└─────────────────────────────────────────────────────────────┘
```

### Stream Event Flow

```
1. User Action
   └─> Component calls useReasoningStream('Plan a sprint', 'normal')

2. Hook Initialization
   └─> Creates AsyncGenerator via createMockReasoningStream()

3. Stream Generation
   └─> Iterates through fixture events
       ├─> Applies delay (300ms for 'normal' speed)
       ├─> Yields event
       └─> Repeats until fixture exhausted

4. Event Processing
   └─> Hook receives events
       ├─> Updates state (setReasoning, setAnswer)
       └─> Triggers re-render

5. UI Update
   └─> Component displays new reasoning step or answer chunk
```

---

## Fixture-Based System

### What Are Fixtures?

Fixtures are **pre-defined stream event sequences** stored in TypeScript files. They represent the "recorded" output of a streaming LLM API.

### Example: Chain-of-Reasoning Fixture

```typescript
// src/patterns/chain-of-reasoning/fixtures.ts

export const sprintPlanningFixture: ReasoningStreamEvent[] = [
  // Reasoning Step 1
  {
    type: 'reasoning',
    data: {
      id: 'reason-1',
      summary: 'Analyzing backlog priorities',
      confidence: 0.9,
      details: 'Reviewing 24 backlog items based on business value and dependencies...',
      timestamp: 0
    }
  },

  // Reasoning Step 2
  {
    type: 'reasoning',
    data: {
      id: 'reason-2',
      summary: 'Estimating team capacity',
      confidence: 0.85,
      details: 'Team velocity: 34 points/sprint. Available: 7 developers × 8 days = 280 hours',
      timestamp: 500
    }
  },

  // ... more reasoning steps ...

  // Final Answer (streamed in chunks)
  {
    type: 'answer',
    data: { text: 'Sprint Plan:\n\n' }
  },
  {
    type: 'answer',
    data: { text: '1. User Authentication (5 pts)\n' }
  },
  {
    type: 'answer',
    data: { text: '   - OAuth integration\n   - Session management\n\n' }
  },
  // ... more answer chunks ...
];
```

### Fixture Design Principles

1. **Realistic Event Types**
   - Match real LLM API event schemas
   - Include metadata (timestamps, IDs, confidence scores)

2. **Granular Chunking**
   - Break text into small chunks (words, phrases)
   - Simulate token-by-token streaming

3. **Meaningful Delays**
   - Use relative timestamps
   - Fast steps: 50-200ms
   - Slow steps: 500-1000ms

4. **Edge Cases Included**
   - Errors (e.g., `{ type: 'error', data: { message: '...' } }`)
   - Retries
   - Partial completions

5. **Multiple Scenarios**
   - Different prompt → different fixture
   - Success paths
   - Failure paths

---

## How to Use the Mock System

### 1. Using Existing Patterns

```tsx
// In your React component
import { useReasoningStream } from '@/patterns/chain-of-reasoning/hooks';

function MyComponent() {
  const { reasoning, answer, isStreaming } = useReasoningStream(
    'Plan a 2-week sprint',
    'normal' // speed: 'fast' | 'normal' | 'slow'
  );

  return (
    <div>
      {reasoning.map(step => (
        <div key={step.id}>{step.summary}</div>
      ))}
      <div>{answer}</div>
    </div>
  );
}
```

### 2. Speed Controls

```typescript
// Fast mode - Development/testing (50ms delays)
const stream = createMockReasoningStream(prompt, 'fast');

// Normal mode - Realistic UX demo (300ms delays)
const stream = createMockReasoningStream(prompt, 'normal');

// Slow mode - Edge case testing (1000ms delays)
const stream = createMockReasoningStream(prompt, 'slow');
```

### 3. Network Inspector Integration

```tsx
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';

function ChainOfReasoningDemo() {
  const { captureEvent, events } = useNetworkCapture();

  const { reasoning, answer } = useReasoningStream('Plan sprint', {
    onEvent: captureEvent // Capture all events for debugging
  });

  return (
    <>
      {/* Your UI */}
      <NetworkInspector events={events} />
    </>
  );
}
```

---

## Extending the Mock System

### Creating a New Pattern

#### Step 1: Define Event Types

```typescript
// src/patterns/my-pattern/types.ts

export interface MyPatternEvent {
  type: 'step' | 'result' | 'error';
  data: {
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
  };
  timestamp: number;
}
```

#### Step 2: Create Fixtures

```typescript
// src/patterns/my-pattern/fixtures.ts

export const myScenarioFixture: MyPatternEvent[] = [
  {
    type: 'step',
    data: {
      id: 'step-1',
      content: 'First step content',
    },
    timestamp: 0
  },
  {
    type: 'step',
    data: {
      id: 'step-2',
      content: 'Second step content',
    },
    timestamp: 300
  },
  {
    type: 'result',
    data: {
      id: 'final',
      content: 'Final result',
    },
    timestamp: 600
  }
];
```

#### Step 3: Implement Mock Stream Generator

```typescript
// src/patterns/my-pattern/mockStream.ts

import { myScenarioFixture } from './fixtures';
import { delay } from '@/lib/utils/delay';

export async function* createMyPatternStream(
  input: string,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): AsyncGenerator<MyPatternEvent> {
  const delays = { fast: 50, normal: 300, slow: 1000 };
  const delayMs = delays[speed];

  // Select fixture based on input (or use default)
  const fixture = myScenarioFixture;

  for (const event of fixture) {
    // Apply delay
    await delay(delayMs);

    // Yield event with updated timestamp
    yield {
      ...event,
      timestamp: Date.now()
    };
  }
}
```

#### Step 4: Create Custom Hook

```typescript
// src/patterns/my-pattern/hooks.ts

import { useState, useEffect } from 'react';
import { createMyPatternStream } from './mockStream';

export function useMyPattern(input: string, speed = 'normal') {
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsStreaming(true);

    (async () => {
      const stream = createMyPatternStream(input, speed);

      for await (const event of stream) {
        if (cancelled) break;

        if (event.type === 'step') {
          setSteps(prev => [...prev, event.data]);
        } else if (event.type === 'result') {
          setResult(event.data.content);
        }
      }

      if (!cancelled) {
        setIsStreaming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [input, speed]);

  return { steps, result, isStreaming };
}
```

---

## Testing Strategies

### Unit Testing Mock Streams

```typescript
// mockStream.test.ts

import { describe, it, expect } from 'vitest';
import { createMockReasoningStream } from './mockStream';

describe('createMockReasoningStream', () => {
  it('should yield all events in order', async () => {
    const events = [];
    const stream = createMockReasoningStream('test', 'fast');

    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(8);
    expect(events[0].type).toBe('reasoning');
    expect(events[events.length - 1].type).toBe('answer');
  });

  it('should respect speed parameter', async () => {
    const start = Date.now();
    const stream = createMockReasoningStream('test', 'fast');

    for await (const event of stream) {
      // Fast mode should complete quickly
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Fast mode < 1s
  });
});
```

### Integration Testing with React

```tsx
// ChainOfReasoningDemo.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { ChainOfReasoningDemo } from './ChainOfReasoningDemo';

describe('ChainOfReasoningDemo', () => {
  it('should stream reasoning steps and answer', async () => {
    render(<ChainOfReasoningDemo />);

    // Wait for first reasoning step
    await waitFor(() => {
      expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
    });

    // Wait for final answer
    await waitFor(() => {
      expect(screen.getByText(/Sprint Plan:/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

---

## Migration to Real APIs

### When to Migrate

You should consider switching from mocks to real APIs when:
- ✅ You've learned the streaming patterns
- ✅ You need dynamic, user-specific responses
- ✅ You're deploying to production
- ✅ You have API keys and billing set up

### How to Migrate

#### Option 1: Environment-Based Switching

```typescript
// src/lib/streaming/streamFactory.ts

import { createMockReasoningStream } from '@/patterns/chain-of-reasoning/mockStream';
import { createRealReasoningStream } from '@/patterns/chain-of-reasoning/realStream';

export function createReasoningStream(
  prompt: string,
  speed?: 'fast' | 'normal' | 'slow'
) {
  // Check environment variable
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    return createRealReasoningStream(prompt);
  } else {
    return createMockReasoningStream(prompt, speed);
  }
}
```

#### Option 2: Real Stream Implementation

```typescript
// src/patterns/chain-of-reasoning/realStream.ts

export async function* createRealReasoningStream(
  prompt: string
): AsyncGenerator<ReasoningStreamEvent> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          // Transform OpenAI response to our event format
          yield {
            type: 'answer',
            data: {
              text: parsed.choices[0]?.delta?.content || ''
            },
            timestamp: Date.now()
          };
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  }
}
```

#### Option 3: Adapter Pattern

```typescript
// src/lib/streaming/adapters/openai.ts

export class OpenAIAdapter {
  async *stream(prompt: string): AsyncGenerator<ReasoningStreamEvent> {
    // OpenAI-specific implementation
  }
}

// src/lib/streaming/adapters/anthropic.ts

export class AnthropicAdapter {
  async *stream(prompt: string): AsyncGenerator<ReasoningStreamEvent> {
    // Anthropic-specific implementation
  }
}

// Usage
const adapter = new OpenAIAdapter();
const stream = adapter.stream(prompt);
```

---

## Best Practices

### Fixture Design

1. **Keep Fixtures Realistic**
   - Study real API responses
   - Match event schemas exactly
   - Include realistic metadata

2. **Version Control Everything**
   - Commit all fixtures to git
   - Review fixture changes in PRs
   - Document fixture purposes

3. **Organize by Scenario**
   - Success paths
   - Error paths
   - Edge cases
   - Different prompts

### Performance

1. **Use Fast Mode in Tests**
   ```typescript
   const stream = createMockStream(prompt, 'fast');
   ```

2. **Cleanup on Unmount**
   ```typescript
   useEffect(() => {
     let cancelled = false;
     // ... stream logic ...
     return () => { cancelled = true; };
   }, []);
   ```

3. **Avoid Blocking Renders**
   ```typescript
   // Use async generators, not sync arrays
   for await (const event of stream) { /* ... */ }
   ```

### Educational Value

1. **Explain the Mock System**
   - Document why mocks are used
   - Show fixture examples
   - Demonstrate speed controls

2. **Provide Migration Path**
   - Document how to switch to real APIs
   - Include adapter examples
   - Show environment configuration

3. **Make Mocks Inspectable**
   - Use Network Inspector component
   - Log events for debugging
   - Export fixtures for review

---

## Troubleshooting

### Common Issues

**Problem**: Stream never completes
```typescript
// ❌ BAD: Missing await
for (const event of stream) { /* ... */ }

// ✅ GOOD: Use await with AsyncGenerator
for await (const event of stream) { /* ... */ }
```

**Problem**: Memory leak (stream continues after unmount)
```typescript
// ✅ GOOD: Always cleanup
useEffect(() => {
  let cancelled = false;
  (async () => {
    for await (const event of stream) {
      if (cancelled) break; // Exit early if unmounted
      // Process event
    }
  })();
  return () => { cancelled = true; };
}, []);
```

**Problem**: Fixture not found
```typescript
// ✅ GOOD: Provide fallback
const fixture = fixtures[prompt] || fixtures.default;
```

---

## Conclusion

The mock SSE system in the Streaming Patterns library is designed to be:
- **Educational**: Teach streaming UX patterns without barriers
- **Deterministic**: Same input → same output
- **Flexible**: Speed controls, multiple scenarios
- **Realistic**: Accurate simulation of real SSE behavior
- **Migrateable**: Easy path to real APIs

By understanding how mocks work, you can:
1. Learn streaming patterns effectively
2. Build confident UX implementations
3. Test edge cases thoroughly
4. Migrate to production APIs seamlessly

---

## Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [OpenAI Streaming API](https://platform.openai.com/docs/api-reference/streaming)
- [Anthropic Streaming API](https://docs.anthropic.com/en/api/streaming)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
