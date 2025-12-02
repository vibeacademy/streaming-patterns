# Adapting Patterns for Your Project

## Introduction

The **Streaming Patterns Library** uses mock streaming infrastructure to provide deterministic, educational demonstrations of streaming UX patterns without requiring real LLM APIs. This design decision enables:

- **Instant setup**: No API keys or backend services required
- **Reliable demos**: Same input always produces same output
- **Fast iteration**: No network latency or API costs during development
- **Educational clarity**: Focus on UX patterns without backend complexity

However, when you're ready to adapt these patterns for **production use** with real LLM APIs (OpenAI, Anthropic, Google, etc.), you'll need to replace the mock streaming layer with actual API clients.

This guide walks you through that transition, covering:

1. [Understanding the Mock Layer](#1-understanding-the-mock-layer)
2. [Replacing Mocks with Real APIs](#2-replacing-mocks-with-real-apis)
3. [OpenAI Streaming Integration](#3-openai-streaming-integration-example)
4. [Anthropic Streaming Integration](#4-anthropic-streaming-integration-example)
5. [Error Handling & Resilience](#5-error-handling--resilience)
6. [Production Considerations](#6-production-considerations)

---

## 1. Understanding the Mock Layer

### Architecture Overview

The mock streaming infrastructure in this library follows a clear layered architecture:

```
┌─────────────────────────────────────┐
│   React Components (UI Layer)      │
│   - ChainOfReasoningDemo.tsx       │
└─────────────┬───────────────────────┘
              │ uses
┌─────────────▼───────────────────────┐
│   Custom Hooks (State Layer)       │
│   - useReasoningStream()            │
└─────────────┬───────────────────────┘
              │ consumes
┌─────────────▼───────────────────────┐
│   Mock Stream Generator             │
│   - createMockReasoningStream()     │
└─────────────┬───────────────────────┘
              │ yields
┌─────────────▼───────────────────────┐
│   Stream Events (Data Layer)        │
│   - { type: 'reasoning', data: ... }│
│   - { type: 'answer', data: ... }   │
└─────────────────────────────────────┘
```

### Key Concepts

#### 1. AsyncGenerator Pattern

Mock streams use JavaScript's [AsyncGenerator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) to simulate streaming:

```typescript
// Mock stream signature
async function* createMockReasoningStream(
  config: ReasoningStreamConfig
): AsyncGenerator<StreamEvent, void, undefined> {
  for (const event of fixtureData) {
    await delay(300); // Simulate network latency
    yield event; // Emit one event at a time
  }
}
```

**Why AsyncGenerators?**
- **Lazy evaluation**: Events produced on-demand (no buffering)
- **Backpressure support**: Consumer controls pace
- **Cancellation**: Generator can be stopped via `.return()`
- **Natural streaming API**: Works with `for await...of` loops

#### 2. Stream Events Schema

All patterns use a consistent event schema:

```typescript
interface StreamEvent {
  id: string;           // Unique event identifier
  type: string;         // Event type (reasoning, answer, memory, etc.)
  timestamp: number;    // Unix timestamp (ms)
  data: unknown;        // Type-specific payload
}

// Example: Chain-of-Reasoning events
type ReasoningEvent = {
  type: 'reasoning';
  data: {
    id: string;
    summary: string;
    confidence: number;
    details?: string;
  };
};

type AnswerEvent = {
  type: 'answer';
  data: {
    text: string; // Chunk of answer text
  };
};
```

#### 3. Custom Hooks for State Management

React hooks encapsulate streaming logic:

```typescript
export function useReasoningStream(
  prompt: string,
  options?: StreamConfig
): ReasoningStreamState {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const stream = createMockReasoningStream({ prompt });

    (async () => {
      for await (const event of stream) {
        if (event.type === 'reasoning') {
          setReasoning(prev => [...prev, event.data]);
        } else if (event.type === 'answer') {
          setAnswer(prev => prev + event.data.text);
        }
      }
      setIsStreaming(false);
    })();

    return () => {
      // Cleanup: cancel stream on unmount
    };
  }, [prompt]);

  return { reasoning, answer, isStreaming, error };
}
```

### What Needs to Change for Production?

When adapting for production, you'll replace:

| Mock Component | Production Replacement |
|---------------|------------------------|
| `createMockReasoningStream()` | Real API client (e.g., `streamOpenAI()`) |
| Fixture data (JSON files) | LLM API responses |
| Deterministic delays | Real network latency |
| Static event sequences | Dynamic LLM generation |

**What stays the same:**
- ✅ Event schema (keep your types)
- ✅ Custom hooks API (same function signature)
- ✅ React components (no UI changes needed)
- ✅ AsyncGenerator pattern (swap implementation, not API)

---

## 2. Replacing Mocks with Real APIs

### Step-by-Step Adaptation Process

#### Step 1: Install API Client Library

Choose an LLM provider and install their SDK:

```bash
# OpenAI
npm install openai

# Anthropic
npm install @anthropic-ai/sdk

# Google Gemini
npm install @google/generative-ai

# Vercel AI SDK (multi-provider abstraction)
npm install ai
```

#### Step 2: Create Real Stream Generator

Replace the mock stream generator with a real API client:

**Before (Mock):**
```typescript
// patterns/chain-of-reasoning/mockStream.ts
export async function* createMockReasoningStream(
  config: ReasoningStreamConfig
): AsyncGenerator<StreamEvent> {
  const fixture = getFixtureForPrompt(config.prompt);

  for (const event of fixture) {
    await delay(300);
    yield event;
  }
}
```

**After (Real API):**
```typescript
// patterns/chain-of-reasoning/realStream.ts
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export async function* createReasoningStream(
  config: ReasoningStreamConfig
): AsyncGenerator<StreamEvent> {
  const stream = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a project planning assistant. Provide step-by-step reasoning before your final answer.',
      },
      {
        role: 'user',
        content: config.prompt,
      },
    ],
    stream: true, // Enable streaming
  });

  let reasoningSteps: ReasoningStep[] = [];
  let answerBuffer = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';

    // Parse LLM output to extract reasoning steps
    // (This parsing logic depends on your prompt structure)
    const event = parseChunkToEvent(delta, reasoningSteps, answerBuffer);

    if (event) {
      yield event;
    }
  }
}
```

#### Step 3: Update Hook to Use Real Stream

Modify the custom hook to use the real stream generator:

```typescript
// patterns/chain-of-reasoning/hooks.ts
import { createReasoningStream } from './realStream'; // Changed import

export function useReasoningStream(
  prompt: string,
  options?: StreamConfig
): ReasoningStreamState {
  // ... same state variables ...

  useEffect(() => {
    // Changed: use real stream instead of mock
    const stream = createReasoningStream({ prompt, ...options });

    (async () => {
      try {
        for await (const event of stream) {
          // Same event handling logic as before
          if (event.type === 'reasoning') {
            setReasoning(prev => [...prev, event.data]);
          } else if (event.type === 'answer') {
            setAnswer(prev => prev + event.data.text);
          }
        }
      } catch (error) {
        // Handle network errors, API rate limits, etc.
        setError(error instanceof Error ? error : new Error('Stream failed'));
      } finally {
        setIsStreaming(false);
      }
    })();

    return () => {
      // Same cleanup logic
    };
  }, [prompt, options]);

  return { reasoning, answer, isStreaming, error };
}
```

#### Step 4: Environment Configuration

Store API keys securely in environment variables:

```bash
# .env.local (not committed to git!)
VITE_OPENAI_API_KEY=sk-your-api-key-here
VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

Add to `.gitignore`:
```
.env.local
.env.*.local
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    'Missing VITE_OPENAI_API_KEY environment variable. ' +
    'See docs/ADAPTING-PATTERNS.md for setup instructions.'
  );
}
```

---

## 3. OpenAI Streaming Integration Example

### Complete Implementation

Here's a production-ready implementation for the **Chain-of-Reasoning** pattern using OpenAI's streaming API:

```typescript
// lib/streaming/openai.ts
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

// Initialize client (reuse across requests)
let clientInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Missing VITE_OPENAI_API_KEY. Set this environment variable to use OpenAI streaming.'
      );
    }

    clientInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });
  }

  return clientInstance;
}

/**
 * OpenAI-specific configuration for reasoning streams
 */
interface OpenAIReasoningConfig {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Creates a reasoning stream using OpenAI's Chat API.
 *
 * This implementation uses a structured prompt to encourage the model to:
 * 1. Emit reasoning steps wrapped in <reasoning> tags
 * 2. Emit the final answer after reasoning
 *
 * The parser extracts these structured outputs and converts them to
 * our event schema for consumption by React hooks.
 */
export async function* streamOpenAIReasoning(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  const {
    prompt,
    model = 'gpt-4o',
    temperature = 0.7,
    maxTokens = 2000,
    systemPrompt = `You are a project planning assistant. When analyzing tasks:

1. First, provide your reasoning steps. Wrap each step in XML tags like this:
   <reasoning summary="Brief step description">
   Detailed explanation of this reasoning step.
   </reasoning>

2. After all reasoning, provide your final answer.

Be concise but thorough. Aim for 3-5 reasoning steps.`,
  } = config;

  const client = getOpenAIClient();

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let buffer = ''; // Accumulate partial chunks
    let reasoningCount = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      buffer += delta;

      // Parse complete reasoning blocks from buffer
      const reasoningRegex = /<reasoning summary="([^"]+)">\s*([\s\S]*?)\s*<\/reasoning>/g;
      let match: RegExpExecArray | null;

      while ((match = reasoningRegex.exec(buffer)) !== null) {
        const [fullMatch, summary, details] = match;

        // Emit reasoning event
        yield {
          id: `reasoning-${++reasoningCount}`,
          type: 'reasoning',
          timestamp: Date.now(),
          data: {
            id: `reasoning-${reasoningCount}`,
            summary: summary.trim(),
            details: details.trim(),
            confidence: 0.9, // OpenAI doesn't provide confidence scores
          },
        } satisfies StreamEvent;

        // Remove parsed content from buffer
        buffer = buffer.replace(fullMatch, '');
      }

      // Check if we're past reasoning (answer phase)
      // This heuristic assumes reasoning blocks come first
      const hasFinishedReasoning = reasoningCount > 0 && buffer.length > 50;

      if (hasFinishedReasoning) {
        // Stream remaining content as answer chunks
        if (delta) {
          yield {
            id: `answer-${Date.now()}`,
            type: 'answer',
            timestamp: Date.now(),
            data: { text: delta },
          } satisfies StreamEvent;
        }
      }
    }

    // Emit any remaining buffered content as answer
    if (buffer.trim()) {
      yield {
        id: `answer-final`,
        type: 'answer',
        timestamp: Date.now(),
        data: { text: buffer },
      } satisfies StreamEvent;
    }

  } catch (error) {
    // Re-throw with more context
    if (error instanceof OpenAI.APIError) {
      throw new Error(
        `OpenAI API error (${error.status}): ${error.message}`
      );
    }
    throw error;
  }
}
```

### Usage in Hooks

Replace the mock stream with the OpenAI stream:

```typescript
// patterns/chain-of-reasoning/hooks.ts
import { streamOpenAIReasoning } from '@/lib/streaming/openai';

export function useReasoningStream(
  prompt: string,
  options?: StreamConfig
): ReasoningStreamState {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!prompt.trim()) return;

    setIsStreaming(true);
    setError(undefined);

    (async () => {
      try {
        // Use real OpenAI stream instead of mock
        const stream = streamOpenAIReasoning({
          prompt,
          model: options?.model || 'gpt-4o',
        });

        for await (const event of stream) {
          if (event.type === 'reasoning') {
            setReasoning(prev => [...prev, event.data]);
            options?.onEvent?.(event); // Network inspector
          } else if (event.type === 'answer') {
            setAnswer(prev => prev + event.data.text);
            options?.onEvent?.(event);
          }
        }

        setIsStreaming(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsStreaming(false);
      }
    })();

    return () => {
      // OpenAI SDK handles cleanup automatically
    };
  }, [prompt, options?.model]);

  return { reasoning, answer, isStreaming, error };
}
```

### Prompt Engineering Tips

To get structured outputs from OpenAI:

1. **Use XML tags** in your system prompt to define output format
2. **Provide examples** using few-shot prompting
3. **Use JSON mode** for stricter parsing (GPT-4 and later):

```typescript
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages,
  response_format: { type: 'json_object' }, // JSON mode
  stream: true,
});
```

4. **Test with different temperatures**:
   - `0.2` - More focused, deterministic
   - `0.7` - Balanced creativity
   - `1.0+` - More creative, varied outputs

---

## 4. Anthropic Streaming Integration Example

### Complete Implementation

Anthropic's API has a different structure than OpenAI. Here's how to adapt the Chain-of-Reasoning pattern:

```typescript
// lib/streaming/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

// Initialize client (reuse across requests)
let clientInstance: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!clientInstance) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Missing VITE_ANTHROPIC_API_KEY. Set this environment variable to use Anthropic streaming.'
      );
    }

    clientInstance = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });
  }

  return clientInstance;
}

/**
 * Anthropic-specific configuration for reasoning streams
 */
interface AnthropicReasoningConfig {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Creates a reasoning stream using Anthropic's Messages API.
 *
 * Anthropic's Claude models excel at following structured instructions.
 * This implementation uses the Messages API with streaming enabled.
 */
export async function* streamAnthropicReasoning(
  config: AnthropicReasoningConfig
): AsyncGenerator<StreamEvent> {
  const {
    prompt,
    model = 'claude-3-5-sonnet-20241022',
    temperature = 1,
    maxTokens = 4096,
    systemPrompt = `You are a project planning assistant. When analyzing tasks:

1. First, provide your reasoning steps. For each step, output:
   <reasoning summary="Brief step description">
   Detailed explanation of this reasoning step.
   </reasoning>

2. After all reasoning, provide your final answer.

Be concise but thorough. Aim for 3-5 reasoning steps.`,
  } = config;

  const client = getAnthropicClient();

  try {
    // Anthropic uses a different API structure (messages vs. chat.completions)
    const stream = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true, // Enable streaming
    });

    let buffer = '';
    let reasoningCount = 0;

    // Anthropic streams different event types
    for await (const event of stream) {
      // Handle different event types
      if (event.type === 'content_block_start') {
        // New content block starting
        continue;
      }

      if (event.type === 'content_block_delta') {
        // Incremental content update
        const delta = event.delta;

        if (delta.type === 'text_delta') {
          const text = delta.text;
          buffer += text;

          // Parse reasoning blocks from buffer
          const reasoningRegex = /<reasoning summary="([^"]+)">\s*([\s\S]*?)\s*<\/reasoning>/g;
          let match: RegExpExecArray | null;

          while ((match = reasoningRegex.exec(buffer)) !== null) {
            const [fullMatch, summary, details] = match;

            // Emit reasoning event
            yield {
              id: `reasoning-${++reasoningCount}`,
              type: 'reasoning',
              timestamp: Date.now(),
              data: {
                id: `reasoning-${reasoningCount}`,
                summary: summary.trim(),
                details: details.trim(),
                confidence: 0.9,
              },
            } satisfies StreamEvent;

            // Remove parsed content from buffer
            buffer = buffer.replace(fullMatch, '');
          }

          // Check if we're past reasoning phase
          const hasFinishedReasoning = reasoningCount > 0 && buffer.length > 50;

          if (hasFinishedReasoning && text) {
            // Stream remaining content as answer chunks
            yield {
              id: `answer-${Date.now()}`,
              type: 'answer',
              timestamp: Date.now(),
              data: { text },
            } satisfies StreamEvent;
          }
        }
      }

      if (event.type === 'message_stop') {
        // Stream complete
        break;
      }
    }

    // Emit any remaining buffered content as answer
    if (buffer.trim()) {
      yield {
        id: `answer-final`,
        type: 'answer',
        timestamp: Date.now(),
        data: { text: buffer },
      } satisfies StreamEvent;
    }

  } catch (error) {
    // Re-throw with more context
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `Anthropic API error (${error.status}): ${error.message}`
      );
    }
    throw error;
  }
}
```

### Usage in Hooks

```typescript
// patterns/chain-of-reasoning/hooks.ts
import { streamAnthropicReasoning } from '@/lib/streaming/anthropic';

export function useReasoningStream(
  prompt: string,
  options?: StreamConfig & { provider?: 'openai' | 'anthropic' }
): ReasoningStreamState {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!prompt.trim()) return;

    setIsStreaming(true);
    setError(undefined);

    (async () => {
      try {
        // Choose provider based on option
        const stream = options?.provider === 'anthropic'
          ? streamAnthropicReasoning({ prompt })
          : streamOpenAIReasoning({ prompt });

        for await (const event of stream) {
          if (event.type === 'reasoning') {
            setReasoning(prev => [...prev, event.data]);
            options?.onEvent?.(event);
          } else if (event.type === 'answer') {
            setAnswer(prev => prev + event.data.text);
            options?.onEvent?.(event);
          }
        }

        setIsStreaming(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsStreaming(false);
      }
    })();

    return () => {
      // Cleanup handled by SDK
    };
  }, [prompt, options?.provider]);

  return { reasoning, answer, isStreaming, error };
}
```

### Anthropic-Specific Features

Claude models have unique capabilities:

1. **Extended Context Windows**:
   - Claude 3.5 Sonnet: 200K tokens
   - Perfect for patterns like **Multi-Turn Memory Timeline**

```typescript
const stream = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  system: systemPrompt,
  messages: conversationHistory, // Can include entire conversation
  stream: true,
});
```

2. **Structured Thinking**:
   - Claude excels at thinking tags (`<thinking>...</thinking>`)
   - Useful for showing internal reasoning before answers

3. **Tool Use (Function Calling)**:
   - Great for **Schema-Governed Exchange** pattern
   - Define tools/functions the model can call

```typescript
const stream = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  tools: [
    {
      name: 'validate_budget',
      description: 'Validates a project budget against constraints',
      input_schema: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
        },
        required: ['amount'],
      },
    },
  ],
  messages: [{ role: 'user', content: prompt }],
  stream: true,
});
```

---

## 5. Error Handling & Resilience

Production streaming requires robust error handling. Here's a comprehensive approach:

### Error Types

```typescript
/**
 * Typed errors for different failure modes
 */
export class StreamingError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'timeout' | 'api' | 'parse' | 'auth' | 'rate-limit',
    public readonly retryable: boolean = false,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'StreamingError';
  }
}

/**
 * Network connectivity issues (DNS, connection refused)
 */
export class NetworkError extends StreamingError {
  constructor(message: string) {
    super(message, 'network', true /* retryable */);
    this.name = 'NetworkError';
  }
}

/**
 * Request took too long
 */
export class TimeoutError extends StreamingError {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message, 'timeout', true /* retryable */);
    this.name = 'TimeoutError';
  }
}

/**
 * API returned error status (4xx, 5xx)
 */
export class APIError extends StreamingError {
  constructor(message: string, statusCode: number) {
    // 5xx errors are retryable, 4xx are not
    const retryable = statusCode >= 500;
    super(message, 'api', retryable, statusCode);
    this.name = 'APIError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends StreamingError {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number
  ) {
    super(message, 'rate-limit', true /* retryable */);
    this.name = 'RateLimitError';
  }
}

/**
 * Authentication/authorization failed
 */
export class AuthError extends StreamingError {
  constructor(message: string) {
    super(message, 'auth', false /* not retryable */);
    this.name = 'AuthError';
  }
}

/**
 * Failed to parse LLM response
 */
export class ParseError extends StreamingError {
  constructor(message: string, public readonly chunk: string) {
    super(message, 'parse', false /* not retryable */);
    this.name = 'ParseError';
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Wraps a stream generator with automatic retry logic
 */
export async function* withRetry<T>(
  createStream: () => AsyncGenerator<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): AsyncGenerator<T> {
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    try {
      // Try to consume the stream
      const stream = createStream();
      yield* stream; // Delegate all events
      return; // Success - exit retry loop

    } catch (error) {
      const streamingError =
        error instanceof StreamingError
          ? error
          : new StreamingError(
              error instanceof Error ? error.message : 'Unknown error',
              'network',
              false
            );

      // Check if error is retryable
      if (!streamingError.retryable || attempt >= config.maxRetries) {
        throw streamingError; // Give up
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
      );

      console.warn(
        `Stream failed (attempt ${attempt + 1}/${config.maxRetries}). ` +
        `Retrying in ${delayMs}ms...`,
        streamingError
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));

      attempt++;
    }
  }
}
```

### Usage in Stream Generators

```typescript
export async function* streamOpenAIReasoningWithRetry(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  // Wrap the base stream with retry logic
  yield* withRetry(() => streamOpenAIReasoning(config));
}
```

### Timeout Handling

Add timeouts to prevent hanging requests:

```typescript
/**
 * Wraps a stream generator with timeout detection
 */
export async function* withTimeout<T>(
  createStream: () => AsyncGenerator<T>,
  timeoutMs: number = 30000
): AsyncGenerator<T> {
  const stream = createStream();
  let lastEventTime = Date.now();

  try {
    for await (const event of stream) {
      lastEventTime = Date.now();
      yield event;
    }
  } finally {
    // Check if we timed out
    const elapsed = Date.now() - lastEventTime;
    if (elapsed > timeoutMs) {
      throw new TimeoutError(
        `Stream timeout: no events received for ${elapsed}ms`,
        timeoutMs
      );
    }
  }
}
```

### Graceful Degradation

Provide fallbacks when streaming fails:

```typescript
export function useReasoningStream(
  prompt: string,
  options?: StreamConfig
): ReasoningStreamState {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);

  useEffect(() => {
    if (!prompt.trim()) return;

    setIsStreaming(true);
    setError(undefined);

    (async () => {
      try {
        const stream = streamOpenAIReasoningWithRetry({ prompt });

        for await (const event of stream) {
          if (event.type === 'reasoning') {
            setReasoning(prev => [...prev, event.data]);
          } else if (event.type === 'answer') {
            setAnswer(prev => prev + event.data.text);
          }
        }

        setIsStreaming(false);
      } catch (err) {
        // If streaming fails completely, fall back to non-streaming
        console.warn('Streaming failed, falling back to non-streaming mode', err);

        setFallbackMode(true);
        setError(err instanceof Error ? err : new Error('Unknown error'));

        try {
          // Make a single non-streaming request
          const response = await fetchReasoningNonStreaming({ prompt });
          setReasoning(response.reasoning);
          setAnswer(response.answer);
        } catch (fallbackErr) {
          // Both streaming and fallback failed
          setError(
            fallbackErr instanceof Error
              ? fallbackErr
              : new Error('All request methods failed')
          );
        } finally {
          setIsStreaming(false);
        }
      }
    })();

    return () => {
      // Cleanup
    };
  }, [prompt]);

  return { reasoning, answer, isStreaming, error, fallbackMode };
}
```

### Error UI Components

Show helpful error messages to users:

```tsx
interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export function StreamingErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  if (error instanceof RateLimitError) {
    return (
      <div className="error-card rate-limit">
        <h3>Rate Limit Exceeded</h3>
        <p>
          Too many requests. Please wait {error.retryAfterSeconds || 60} seconds
          before trying again.
        </p>
        {onRetry && (
          <button onClick={onRetry} disabled>
            Retry in {error.retryAfterSeconds || 60}s
          </button>
        )}
      </div>
    );
  }

  if (error instanceof AuthError) {
    return (
      <div className="error-card auth-error">
        <h3>Authentication Failed</h3>
        <p>{error.message}</p>
        <p>Please check your API key configuration.</p>
      </div>
    );
  }

  if (error instanceof TimeoutError) {
    return (
      <div className="error-card timeout">
        <h3>Request Timeout</h3>
        <p>The request took longer than {error.timeoutMs}ms.</p>
        {onRetry && (
          <button onClick={onRetry}>Try Again</button>
        )}
      </div>
    );
  }

  // Generic error fallback
  return (
    <div className="error-card">
      <h3>Something Went Wrong</h3>
      <p>{error.message}</p>
      {onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}
```

---

## 6. Production Considerations

### Security

#### 1. API Key Management

**Never expose API keys in client-side code:**

```typescript
// ❌ BAD: Hardcoded key
const apiKey = 'sk-1234567890abcdef';

// ❌ BAD: Committed to git
const apiKey = process.env.OPENAI_API_KEY; // In client bundle!

// ✅ GOOD: Proxy through your backend
const response = await fetch('/api/streaming/reasoning', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});
```

**Best practice**: Run LLM API calls through your backend:

```typescript
// Backend route (Next.js API route, Express, etc.)
// app/api/streaming/reasoning/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Server-side only
});

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Validate input
  if (!prompt || prompt.length > 5000) {
    return NextResponse.json(
      { error: 'Invalid prompt' },
      { status: 400 }
    );
  }

  // Create streaming response
  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  // Forward stream to client
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### 2. Input Validation

Always validate and sanitize user input:

```typescript
/**
 * Validates and sanitizes a prompt before sending to LLM
 */
function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  // Check length
  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 10000) {
    return { valid: false, error: 'Prompt too long (max 10,000 characters)' };
  }

  // Check for injection attempts
  const dangerousPatterns = [
    /ignore previous instructions/i,
    /system:\s*/i,
    /<\|im_start\|>/i, // ChatML injection
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      return { valid: false, error: 'Prompt contains invalid content' };
    }
  }

  return { valid: true };
}

// Usage
export async function* streamOpenAIReasoning(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  const validation = validatePrompt(config.prompt);
  if (!validation.valid) {
    throw new Error(`Invalid prompt: ${validation.error}`);
  }

  // Proceed with API call...
}
```

#### 3. Rate Limiting (Backend)

Implement rate limiting to prevent abuse:

```typescript
// Using upstash/ratelimit or similar
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  const { success, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': remaining.toString() },
      }
    );
  }

  // Proceed with streaming...
}
```

### Performance

#### 1. Debouncing Rapid Requests

Prevent unnecessary API calls:

```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

export function useReasoningStream(
  prompt: string,
  options?: StreamConfig
): ReasoningStreamState {
  // Debounce prompt changes to avoid rapid-fire requests
  const debouncedPrompt = useMemo(
    () => debounce((value: string) => value, 500),
    []
  );

  const [actualPrompt, setActualPrompt] = useState(prompt);

  useEffect(() => {
    const debounced = debouncedPrompt(prompt);
    if (debounced) {
      setActualPrompt(debounced);
    }
  }, [prompt, debouncedPrompt]);

  // Use actualPrompt for streaming
  // ... rest of hook
}
```

#### 2. Caching Responses

Cache expensive LLM calls:

```typescript
// Simple in-memory cache (use Redis for production)
const responseCache = new Map<string, StreamEvent[]>();

export async function* streamOpenAIReasoningCached(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  // Generate cache key
  const cacheKey = JSON.stringify({
    prompt: config.prompt,
    model: config.model,
  });

  // Check cache
  if (responseCache.has(cacheKey)) {
    console.log('Cache hit for prompt:', config.prompt);
    const cachedEvents = responseCache.get(cacheKey)!;

    // Replay cached events with small delays
    for (const event of cachedEvents) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield event;
    }
    return;
  }

  // Cache miss - fetch from API
  const events: StreamEvent[] = [];
  const stream = streamOpenAIReasoning(config);

  for await (const event of stream) {
    events.push(event);
    yield event;
  }

  // Store in cache
  responseCache.set(cacheKey, events);
}
```

#### 3. Connection Pooling

Reuse HTTP connections:

```typescript
// OpenAI client with custom agent for connection pooling
import https from 'https';

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: agent,
});
```

### Monitoring & Observability

#### 1. Logging Events

Track streaming behavior in production:

```typescript
interface StreamingMetrics {
  sessionId: string;
  promptLength: number;
  eventCount: number;
  durationMs: number;
  model: string;
  error?: string;
}

export async function* streamWithMetrics(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  const sessionId = crypto.randomUUID();
  const startTime = Date.now();
  let eventCount = 0;

  try {
    const stream = streamOpenAIReasoning(config);

    for await (const event of stream) {
      eventCount++;
      yield event;
    }

    // Log success
    const metrics: StreamingMetrics = {
      sessionId,
      promptLength: config.prompt.length,
      eventCount,
      durationMs: Date.now() - startTime,
      model: config.model || 'gpt-4o',
    };

    console.log('Streaming session completed', metrics);
    // Send to analytics service (Mixpanel, Amplitude, etc.)

  } catch (error) {
    // Log error
    const metrics: StreamingMetrics = {
      sessionId,
      promptLength: config.prompt.length,
      eventCount,
      durationMs: Date.now() - startTime,
      model: config.model || 'gpt-4o',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error('Streaming session failed', metrics);
    // Send to error tracking (Sentry, Rollbar, etc.)

    throw error;
  }
}
```

#### 2. Cost Tracking

Monitor API costs:

```typescript
const TOKEN_COSTS = {
  'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
};

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export async function* streamWithCostTracking(
  config: OpenAIReasoningConfig
): AsyncGenerator<StreamEvent> {
  const inputTokens = estimateTokens(config.prompt);
  let outputTokens = 0;

  const stream = streamOpenAIReasoning(config);

  for await (const event of stream) {
    if (event.type === 'answer') {
      outputTokens += estimateTokens(event.data.text);
    }
    yield event;
  }

  // Calculate cost
  const model = config.model || 'gpt-4o';
  const costs = TOKEN_COSTS[model];
  const estimatedCost =
    (inputTokens / 1000) * costs.input +
    (outputTokens / 1000) * costs.output;

  console.log(`Estimated cost: $${estimatedCost.toFixed(4)} (${inputTokens} input + ${outputTokens} output tokens)`);
}
```

### Testing Real Streams

#### Unit Tests with Mocks

Continue using mock streams for fast unit tests:

```typescript
// tests/patterns/reasoning.test.ts
import { render, waitFor } from '@testing-library/react';
import { ChainOfReasoningDemo } from '@/patterns/chain-of-reasoning';

// Mock the real stream generator
vi.mock('@/lib/streaming/openai', () => ({
  streamOpenAIReasoning: vi.fn(async function* () {
    yield { type: 'reasoning', data: { summary: 'Test step' } };
    yield { type: 'answer', data: { text: 'Test answer' } };
  }),
}));

test('renders reasoning steps', async () => {
  render(<ChainOfReasoningDemo />);

  await waitFor(() => {
    expect(screen.getByText('Test step')).toBeInTheDocument();
  });
});
```

#### Integration Tests with Real APIs

Test against actual APIs in CI:

```typescript
// tests/integration/openai.test.ts
import { streamOpenAIReasoning } from '@/lib/streaming/openai';

describe('OpenAI Integration', () => {
  it('streams reasoning events', async () => {
    // Skip if no API key (for local development)
    if (!process.env.OPENAI_API_KEY) {
      console.warn('Skipping integration test: no API key');
      return;
    }

    const events: StreamEvent[] = [];
    const stream = streamOpenAIReasoning({
      prompt: 'Count to 3',
      model: 'gpt-4o',
    });

    for await (const event of stream) {
      events.push(event);
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events.some(e => e.type === 'answer')).toBe(true);
  }, 30000); // 30s timeout
});
```

---

## Summary

Adapting streaming patterns from mocks to production involves:

1. **Understand the Architecture**: Know what mock components do
2. **Install API Client**: Choose provider (OpenAI, Anthropic, etc.)
3. **Replace Stream Generator**: Swap mock with real API calls
4. **Handle Errors**: Implement retries, timeouts, and fallbacks
5. **Secure Your App**: Proxy through backend, validate input, rate limit
6. **Optimize Performance**: Cache responses, debounce requests
7. **Monitor in Production**: Log metrics, track costs, detect errors

The beauty of this library's architecture is that **most of your code stays the same**. The event schema, custom hooks, and UI components are provider-agnostic. You only swap out the stream generator implementation.

**Key Takeaway**: The patterns you learned with mocks translate directly to production streaming. The UX patterns (reasoning beadlines, memory timelines, validation loops) work identically with real LLMs.

---

## Additional Resources

- [OpenAI Streaming Guide](https://platform.openai.com/docs/api-reference/streaming)
- [Anthropic Streaming API](https://docs.anthropic.com/en/api/messages-streaming)
- [Vercel AI SDK](https://sdk.vercel.ai/docs) (multi-provider abstraction)
- [MDN: AsyncGenerator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Questions or Issues?**

- Open a [GitHub Discussion](https://github.com/vibeacademy/streaming-patterns/discussions)
- Report bugs via [GitHub Issues](https://github.com/vibeacademy/streaming-patterns/issues)
- Contribute improvements via [Pull Requests](https://github.com/vibeacademy/streaming-patterns/pulls)
