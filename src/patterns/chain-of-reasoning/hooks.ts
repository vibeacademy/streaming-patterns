/**
 * Custom React hooks for the Chain-of-Reasoning pattern.
 *
 * This module provides the useReasoningStream hook which manages the state
 * and lifecycle of a reasoning stream. The hook encapsulates all the complexity
 * of consuming an AsyncGenerator and provides a simple, reactive API for components.
 *
 * Educational Note:
 * This hook demonstrates best practices for managing async streaming state in React:
 * - Proper cleanup to prevent memory leaks
 * - Cancellation support for component unmounts
 * - Type-safe state management
 * - Integration with external event capture systems (Network Inspector)
 *
 * @module patterns/chain-of-reasoning/hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ReasoningStep,
  ReasoningStreamConfig,
  ReasoningStreamState,
  StreamEvent,
  RetryConfig,
} from './types';
import { StreamError } from './types';
import { createMockReasoningStream } from './mockStream';

/**
 * Default retry configuration.
 *
 * These defaults provide a good balance between reliability and user experience:
 * - 3 retries gives enough attempts to recover from transient failures
 * - 1s initial delay is short enough to feel responsive
 * - 2x backoff prevents hammering the (mock) server
 * - 10s max delay prevents excessively long waits
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryOnTimeout: true,
  retryOnNetwork: true,
  retryOnStream: false,
};

/**
 * Determines if an error should be retried based on configuration.
 *
 * Educational Note:
 * Not all errors are retryable. Network and timeout errors are usually transient
 * (temporary), while stream/data errors usually indicate bugs that won't be fixed
 * by retrying.
 *
 * @param error - The error that occurred
 * @param retryCount - How many times we've already retried
 * @param config - Retry configuration
 * @returns True if we should retry this error
 */
function shouldRetry(
  error: Error | unknown,
  retryCount: number,
  config: Required<RetryConfig>
): boolean {
  // Don't retry if we've exceeded max attempts
  if (retryCount >= config.maxRetries) {
    return false;
  }

  // If it's a StreamError, check the type
  if (error instanceof StreamError) {
    switch (error.type) {
      case 'timeout':
        return config.retryOnTimeout;
      case 'network':
        return config.retryOnNetwork;
      case 'stream':
        return config.retryOnStream;
      default:
        // Unknown error types are not retried by default
        return false;
    }
  }

  // Non-StreamError errors are not retried by default
  return false;
}

/**
 * Calculates the delay before the next retry using exponential backoff.
 *
 * Educational Note:
 * Exponential backoff is a standard pattern for retry logic:
 * - Retry 1: 1s delay
 * - Retry 2: 2s delay (1s * 2)
 * - Retry 3: 4s delay (2s * 2)
 * This prevents overloading the server and gives transient issues time to resolve.
 *
 * @param retryCount - Current retry attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds before next retry
 */
function calculateRetryDelay(
  retryCount: number,
  config: Required<RetryConfig>
): number {
  // Calculate exponential delay: initialDelay * (multiplier ^ retryCount)
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, retryCount);

  // Cap at maximum delay to prevent extremely long waits
  return Math.min(exponentialDelay, config.maxDelayMs);
}

/**
 * Async delay utility function with cancellation support.
 *
 * @param ms - Milliseconds to wait
 * @param signal - Optional abort signal to cancel the delay
 * @returns Promise that resolves after the delay or rejects if aborted
 */
// eslint-disable-next-line no-undef
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already aborted, reject immediately
    if (signal?.aborted) {
      reject(new Error('Delay aborted'));
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    // Listen for abort and clear timeout
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Delay aborted'));
    });
  });
}

/**
 * React hook for managing Chain-of-Reasoning stream state.
 *
 * This hook consumes a reasoning stream (AsyncGenerator) and provides reactive
 * state updates as events arrive. It handles the full lifecycle:
 * - Starting the stream when the prompt changes
 * - Updating state as events arrive
 * - Cleaning up on unmount or prompt change
 * - Error handling
 *
 * Educational Note:
 * This is a "custom hook" - a React pattern for extracting component logic
 * into reusable functions. Custom hooks:
 * - Must start with "use" (React convention)
 * - Can call other hooks (useState, useEffect, etc.)
 * - Are called at the top level of components
 * - Provide a clean API for complex stateful logic
 *
 * @param prompt - The prompt to generate reasoning for
 * @param options - Optional configuration (speed, event capture)
 * @returns Object containing reasoning steps, answer, and stream status
 *
 * @example
 * ```tsx
 * function ReasoningDemo() {
 *   const { reasoning, answer, isStreaming, error } = useReasoningStream(
 *     'Plan a 2-week sprint for the dashboard project',
 *     {
 *       speed: 'normal',
 *       onEvent: (event) => networkInspector.capture(event)
 *     }
 *   );
 *
 *   if (error) {
 *     return <ErrorDisplay error={error} />;
 *   }
 *
 *   return (
 *     <div>
 *       <ReasoningBeadline reasoning={reasoning} />
 *       {answer && <AnswerDisplay answer={answer} />}
 *       {isStreaming && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With Network Inspector integration
 * function ReasoningDemo() {
 *   const { captureEvent } = useNetworkCapture();
 *
 *   const { reasoning, answer } = useReasoningStream(
 *     'Plan a sprint',
 *     { onEvent: captureEvent }
 *   );
 *
 *   return (
 *     <>
 *       <ReasoningBeadline reasoning={reasoning} />
 *       <NetworkInspector />
 *     </>
 *   );
 * }
 * ```
 */
export function useReasoningStream(
  prompt: string,
  options?: Omit<ReasoningStreamConfig, 'prompt'> & { retryConfig?: RetryConfig }
): ReasoningStreamState {
  // State: Array of reasoning steps received so far
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);

  // State: The final answer text (empty until answer event arrives)
  const [answer, setAnswer] = useState<string>('');

  // State: Whether the stream is currently active
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // State: Error object if stream encounters an error
  const [error, setError] = useState<Error | undefined>(undefined);

  // State: Number of retry attempts made
  const [retryCount, setRetryCount] = useState<number>(0);

  // State: Whether currently in retry delay period
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // State: Time until next retry (for UI countdown)
  const [retryDelayMs, setRetryDelayMs] = useState<number | undefined>(
    undefined
  );

  // Ref: Track if component is mounted to prevent state updates after unmount
  // This is a common React pattern to avoid "Can't perform a React state update
  // on an unmounted component" warnings
  const isMountedRef = useRef<boolean>(true);

  // Ref: Store the abort controller for stream cancellation
  // Using a ref instead of state because we don't need re-renders when it changes
  // eslint-disable-next-line no-undef
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize the onEvent callback to prevent unnecessary effect re-runs
  // useCallback ensures the function reference stays stable unless dependencies change
  const handleEvent = useCallback(
    (event: StreamEvent) => {
      if (options?.onEvent) {
        try {
          options.onEvent(event);
        } catch (err) {
          console.error('Error in onEvent callback:', err);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options?.onEvent]
  );

  // Effect: Start the stream when prompt or options change, with retry logic
  useEffect(() => {
    // Skip if prompt is empty
    if (!prompt.trim()) {
      return;
    }

    // Merge retry config with defaults
    const retryConfig: Required<RetryConfig> = {
      ...DEFAULT_RETRY_CONFIG,
      ...options?.retryConfig,
    };

    // Reset state at the start of a new stream attempt
    setReasoning([]);
    setAnswer('');
    setError(undefined);
    setIsStreaming(true);
    setRetryCount(0);
    setIsRetrying(false);
    setRetryDelayMs(undefined);

    // Create a new abort controller for this stream
    // This allows us to cancel the stream on unmount or when prompt changes
    // eslint-disable-next-line no-undef
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Async function to consume the stream with retry logic
    // Educational Note:
    // This retry loop implements exponential backoff - a best practice for
    // handling transient failures without overwhelming the server.
    (async () => {
      let currentRetry = 0;

      // Retry loop: continue until success or max retries exceeded
      while (currentRetry <= retryConfig.maxRetries) {
        try {
          // Create the mock reasoning stream with configuration
          const stream = createMockReasoningStream({
            prompt,
            speed: options?.speed ?? 'normal',
            onEvent: handleEvent,
            timeoutMs: options?.timeoutMs,
            simulateError: options?.simulateError,
          });

          // Consume the stream event by event
          for await (const event of stream) {
            // Check if stream was cancelled
            if (abortController.signal.aborted) {
              return; // Exit completely on cancel
            }

            // Only update state if component is still mounted
            if (!isMountedRef.current) {
              return; // Exit completely if unmounted
            }

            // Handle different event types
            switch (event.type) {
              case 'reasoning': {
                setReasoning((prev) => [...prev, event.data]);
                break;
              }

              case 'answer': {
                setAnswer((prev) => prev + event.data.text);
                break;
              }

              default: {
                const _exhaustive: never = event;
                console.warn('Unknown event type:', _exhaustive);
              }
            }
          }

          // Stream completed successfully - exit retry loop
          if (isMountedRef.current && !abortController.signal.aborted) {
            setIsStreaming(false);
            setIsRetrying(false);
            setRetryDelayMs(undefined);
          }
          return; // Success - exit retry loop

        } catch (err) {
          // Check if we should retry this error
          const canRetry = shouldRetry(err, currentRetry, retryConfig);

          if (!canRetry || abortController.signal.aborted || !isMountedRef.current) {
            // Don't retry - set final error state
            if (isMountedRef.current && !abortController.signal.aborted) {
              const errorMessage =
                err instanceof Error ? err.message : 'Unknown streaming error';
              setError(
                err instanceof StreamError
                  ? err
                  : new Error(errorMessage)
              );
              setIsStreaming(false);
              setIsRetrying(false);
              setRetryDelayMs(undefined);
            }
            return; // Exit retry loop
          }

          // Retry is possible - prepare for next attempt
          currentRetry++;

          if (isMountedRef.current && !abortController.signal.aborted) {
            // Update retry state
            setRetryCount(currentRetry);
            setIsRetrying(true);
            setError(
              err instanceof StreamError
                ? err
                : new Error(err instanceof Error ? err.message : 'Unknown error')
            );

            // Calculate retry delay with exponential backoff
            const delayMs = calculateRetryDelay(currentRetry - 1, retryConfig);
            setRetryDelayMs(delayMs);

            // Log retry attempt for debugging
            console.warn(
              `Stream failed (attempt ${currentRetry}/${retryConfig.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              err
            );

            // Wait before retrying (with exponential backoff)
            // Pass abort signal to ensure timeout is cancelled on unmount
            try {
              await delay(delayMs, abortController.signal);
            } catch (delayErr) {
              // Delay was aborted - exit retry loop
              if (delayErr instanceof Error && delayErr.message === 'Delay aborted') {
                return;
              }
              throw delayErr;
            }

            // Check again before retrying (component might have unmounted during delay)
            if (abortController.signal.aborted || !isMountedRef.current) {
              return;
            }

            // Reset some state for retry, but keep error visible
            setIsRetrying(false);
            setRetryDelayMs(undefined);
            setReasoning([]); // Clear partial results from failed attempt
            setAnswer('');
          }
        }
      }
    })();

    // Cleanup function: runs when component unmounts or when dependencies change
    return () => {
      // Cancel the stream by aborting the controller
      abortController.abort();
    };
  }, [prompt, options?.speed, options?.timeoutMs, options?.simulateError, options?.retryConfig, handleEvent]);

  // Effect: Track component mount status
  // This separate effect ensures isMountedRef is set correctly on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Return the reactive state
  // Components can destructure only the values they need
  return {
    reasoning,
    answer,
    isStreaming,
    error,
    retryCount,
    isRetrying,
    retryDelayMs,
  };
}

/**
 * Hook for streaming reasoning with a reset function.
 *
 * This variant of useReasoningStream provides a reset function that allows
 * components to restart the stream without changing the prompt. Useful for
 * demo controls and "try again" functionality.
 *
 * @param prompt - The prompt to generate reasoning for
 * @param options - Optional configuration (speed, event capture)
 * @returns Object containing state and a reset function
 *
 * @example
 * ```tsx
 * function ReasoningDemo() {
 *   const { reasoning, answer, isStreaming, reset } = useReasoningStreamWithReset(
 *     'Plan a sprint',
 *     { speed: 'fast' }
 *   );
 *
 *   return (
 *     <div>
 *       <ReasoningBeadline reasoning={reasoning} />
 *       <button onClick={reset} disabled={isStreaming}>
 *         Restart Demo
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useReasoningStreamWithReset(
  prompt: string,
  options?: Omit<ReasoningStreamConfig, 'prompt'> & { retryConfig?: RetryConfig }
): ReasoningStreamState & { reset: () => void } {
  // Use a counter to force re-running the stream
  // Incrementing this will cause useReasoningStream's effect to re-run
  const [resetTrigger, setResetTrigger] = useState(0);

  // The reset function increments the counter
  const reset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  // Create a modified prompt that includes the reset trigger
  // This ensures the effect re-runs when reset is called
  const promptWithTrigger = `${prompt}__trigger_${resetTrigger}`;

  // Use the base hook - it will automatically re-run when prompt changes
  const state = useReasoningStream(promptWithTrigger, options);

  return {
    ...state,
    reset,
  };
}
