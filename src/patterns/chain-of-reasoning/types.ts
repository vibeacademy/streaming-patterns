/**
 * Type definitions for the Chain-of-Reasoning pattern.
 *
 * This pattern makes AI reasoning visible and interactive by streaming
 * reasoning steps before the final answer. Each reasoning step is a
 * first-class, interactive element that users can inspect and promote.
 *
 * @module patterns/chain-of-reasoning/types
 */

/**
 * Represents a single reasoning step in the chain-of-reasoning process.
 *
 * Each step captures the AI's intermediate thinking before arriving at
 * a final answer. Steps are shown to users as "reasoning beads" in a
 * timeline interface.
 *
 * @example
 * ```typescript
 * const step: ReasoningStep = {
 *   id: '1',
 *   summary: 'Analyzing backlog priorities',
 *   confidence: 0.92,
 *   details: 'Reviewing 24 backlog items based on business value and technical complexity',
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface ReasoningStep {
  /**
   * Unique identifier for this reasoning step.
   * Used for referencing steps in the final answer and for UI interactions.
   */
  id: string;

  /**
   * Brief summary of the reasoning step (1-2 sentences).
   * This is the primary text shown in the reasoning bead.
   */
  summary: string;

  /**
   * Confidence level for this reasoning step (0-1).
   * - 0.9-1.0: High confidence (green indicator)
   * - 0.7-0.89: Medium confidence (yellow indicator)
   * - 0-0.69: Low confidence (red indicator)
   */
  confidence: number;

  /**
   * Optional detailed explanation of the reasoning process.
   * Shown when user expands the reasoning bead or opens the detail drawer.
   */
  details?: string;

  /**
   * Timestamp when this reasoning step was generated (Unix epoch milliseconds).
   * Used for sorting, replay, and performance analysis.
   */
  timestamp: number;
}

/**
 * Stream event emitted when a new reasoning step is available.
 *
 * Reasoning events must be emitted before answer events to maintain
 * the pattern's contract of showing thinking before conclusions.
 *
 * @example
 * ```typescript
 * const event: ReasoningStreamEvent = {
 *   type: 'reasoning',
 *   data: {
 *     id: '2',
 *     summary: 'Estimating team capacity',
 *     confidence: 0.85,
 *     timestamp: Date.now()
 *   }
 * };
 * ```
 */
export interface ReasoningStreamEvent {
  /**
   * Event type discriminator. Always 'reasoning' for reasoning events.
   */
  type: 'reasoning';

  /**
   * The reasoning step data payload.
   */
  data: ReasoningStep;
}

/**
 * Stream event emitted when answer text is available.
 *
 * Answer events should only be emitted after all reasoning events
 * have completed. The answer may reference reasoning step IDs to
 * provide traceability between thinking and conclusions.
 *
 * @example
 * ```typescript
 * const event: AnswerStreamEvent = {
 *   type: 'answer',
 *   data: {
 *     text: 'Sprint Plan:\n\n1. User authentication (5 pts) - Based on reasoning step 1\n...'
 *   }
 * };
 * ```
 */
export interface AnswerStreamEvent {
  /**
   * Event type discriminator. Always 'answer' for answer events.
   */
  type: 'answer';

  /**
   * The answer data payload.
   */
  data: {
    /**
     * The answer text content.
     * May be streamed incrementally in multiple events or sent as a complete text.
     * Can include references to reasoning step IDs for traceability.
     */
    text: string;
  };
}

/**
 * Union type of all possible stream events in the Chain-of-Reasoning pattern.
 *
 * This discriminated union enables type-safe event handling:
 * - TypeScript can narrow the type based on the 'type' field
 * - Exhaustiveness checking ensures all event types are handled
 *
 * @example
 * ```typescript
 * function handleEvent(event: StreamEvent): void {
 *   switch (event.type) {
 *     case 'reasoning':
 *       // event.data is ReasoningStep
 *       console.log('Reasoning:', event.data.summary);
 *       break;
 *     case 'answer':
 *       // event.data is { text: string }
 *       console.log('Answer:', event.data.text);
 *       break;
 *   }
 * }
 * ```
 */
export type StreamEvent = ReasoningStreamEvent | AnswerStreamEvent;

/**
 * Types of errors that can occur during streaming.
 *
 * Used to provide specific error handling and user feedback
 * for different failure modes.
 */
export type StreamErrorType = 'timeout' | 'network' | 'stream' | 'unknown';

/**
 * Error class for stream-related failures.
 *
 * Extends Error with a type field to enable different handling
 * strategies for different error types.
 *
 * @example
 * ```typescript
 * throw new StreamError('Stream timeout after 10000ms', 'timeout');
 * ```
 */
export class StreamError extends Error {
  constructor(
    message: string,
    public readonly type: StreamErrorType
  ) {
    super(message);
    this.name = 'StreamError';
  }
}

/**
 * Configuration options for streaming reasoning events.
 *
 * Used to control the behavior of the reasoning stream generator
 * and support different demo speeds for educational purposes.
 */
export interface ReasoningStreamConfig {
  /**
   * The prompt that triggered the reasoning stream.
   * Used to select the appropriate fixture data.
   */
  prompt: string;

  /**
   * Stream speed control for educational demos.
   * - 'fast': 50ms delay between events (for quick demos)
   * - 'normal': 300ms delay between events (realistic timing)
   * - 'slow': 1000ms delay between events (for detailed observation)
   * @default 'normal'
   */
  speed?: 'fast' | 'normal' | 'slow';

  /**
   * Optional callback invoked when each event is emitted.
   * Useful for network capture, logging, and debugging.
   */
  onEvent?: (event: StreamEvent) => void;

  /**
   * Maximum time (in milliseconds) to wait for the stream to complete.
   * If the stream takes longer, a timeout error will be thrown.
   * @default 10000 (10 seconds)
   */
  timeoutMs?: number;

  /**
   * Error simulation mode for testing error handling.
   * - 'none': No errors (default)
   * - 'timeout': Simulate a timeout error
   * - 'network': Simulate a network failure
   * - 'mid-stream': Simulate an error halfway through the stream
   * @default 'none'
   */
  simulateError?: 'none' | 'timeout' | 'network' | 'mid-stream';
}

/**
 * Retry configuration for handling transient failures.
 *
 * Controls how the stream hook retries failed stream attempts.
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay between retries in milliseconds.
   * Subsequent delays use exponential backoff.
   * @default 1000 (1 second)
   */
  initialDelayMs?: number;

  /**
   * Maximum delay between retries in milliseconds.
   * Prevents exponential backoff from growing too large.
   * @default 10000 (10 seconds)
   */
  maxDelayMs?: number;

  /**
   * Multiplier for exponential backoff.
   * Each retry delay = previous delay * backoffMultiplier
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Whether to retry on timeout errors.
   * @default true
   */
  retryOnTimeout?: boolean;

  /**
   * Whether to retry on network errors.
   * @default true
   */
  retryOnNetwork?: boolean;

  /**
   * Whether to retry on stream errors.
   * @default false (stream errors usually indicate data issues, not transient failures)
   */
  retryOnStream?: boolean;
}

/**
 * Return type for the useReasoningStream hook.
 *
 * Provides reactive state and metadata about the reasoning stream.
 */
export interface ReasoningStreamState {
  /**
   * Array of reasoning steps received so far.
   * Updates incrementally as new reasoning events arrive.
   */
  reasoning: ReasoningStep[];

  /**
   * The final answer text (empty string until answer event arrives).
   * May be updated incrementally if answer is streamed in chunks.
   */
  answer: string;

  /**
   * True if the stream is currently active and emitting events.
   */
  isStreaming: boolean;

  /**
   * Error object if the stream encountered an error.
   * Undefined if no error has occurred.
   */
  error?: Error;

  /**
   * Number of retry attempts made for the current stream.
   * 0 if no retries have been attempted.
   */
  retryCount?: number;

  /**
   * True if the stream is currently in a retry delay period.
   * Useful for showing "Retrying in X seconds..." messages.
   */
  isRetrying?: boolean;

  /**
   * Time in milliseconds until next retry attempt.
   * Undefined if not currently retrying.
   */
  retryDelayMs?: number;
}
