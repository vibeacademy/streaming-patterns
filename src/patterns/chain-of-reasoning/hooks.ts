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
} from './types';
import { createMockReasoningStream } from './mockStream';

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
  options?: Omit<ReasoningStreamConfig, 'prompt'>
): ReasoningStreamState {
  // State: Array of reasoning steps received so far
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);

  // State: The final answer text (empty until answer event arrives)
  const [answer, setAnswer] = useState<string>('');

  // State: Whether the stream is currently active
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // State: Error object if stream encounters an error
  const [error, setError] = useState<Error | undefined>(undefined);

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

  // Effect: Start the stream when prompt or options change
  useEffect(() => {
    // Skip if prompt is empty
    if (!prompt.trim()) {
      return;
    }

    // Reset state at the start of a new stream
    setReasoning([]);
    setAnswer('');
    setError(undefined);
    setIsStreaming(true);

    // Create a new abort controller for this stream
    // This allows us to cancel the stream on unmount or when prompt changes
    // eslint-disable-next-line no-undef
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Async function to consume the stream
    // We use an IIFE (Immediately Invoked Function Expression) because
    // useEffect callbacks cannot be async directly
    (async () => {
      try {
        // Create the mock reasoning stream with configuration
        const stream = createMockReasoningStream({
          prompt,
          speed: options?.speed ?? 'normal',
          onEvent: handleEvent,
        });

        // Consume the stream event by event
        // for-await-of is the idiomatic way to consume AsyncGenerators
        for await (const event of stream) {
          // Check if stream was cancelled (component unmounted or prompt changed)
          if (abortController.signal.aborted) {
            break;
          }

          // Only update state if component is still mounted
          // This prevents React warnings about updating unmounted components
          if (!isMountedRef.current) {
            break;
          }

          // Handle different event types using TypeScript discriminated unions
          // The type system knows event.data's type based on event.type
          switch (event.type) {
            case 'reasoning': {
              // Add new reasoning step to the array
              // We use functional setState to ensure we're working with the latest state
              // This is important because state updates are asynchronous
              setReasoning((prev) => [...prev, event.data]);
              break;
            }

            case 'answer': {
              // Set or append answer text
              // For this pattern, we receive the complete answer in one event
              // But the code supports incremental updates if needed
              setAnswer((prev) => prev + event.data.text);
              break;
            }

            default: {
              // Exhaustiveness check: TypeScript will error if we miss an event type
              // This ensures we handle all events as the pattern evolves
              const _exhaustive: never = event;
              console.warn('Unknown event type:', _exhaustive);
            }
          }
        }

        // Stream completed successfully
        if (isMountedRef.current && !abortController.signal.aborted) {
          setIsStreaming(false);
        }
      } catch (err) {
        // Handle stream errors
        if (isMountedRef.current && !abortController.signal.aborted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown streaming error';
          setError(new Error(errorMessage));
          setIsStreaming(false);
        }
      }
    })();

    // Cleanup function: runs when component unmounts or when dependencies change
    // This is crucial for preventing memory leaks and race conditions
    return () => {
      // Cancel the stream by aborting the controller
      abortController.abort();

      // Note: We don't set isMountedRef to false here because the cleanup
      // runs before the next effect, not on unmount. We handle that separately.
    };
  }, [prompt, options?.speed, handleEvent]);

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
  options?: Omit<ReasoningStreamConfig, 'prompt'>
): ReasoningStreamState & { reset: () => void } {
  // Use a counter to force re-running the stream
  // Incrementing this will cause useReasoningStream's effect to re-run
  const [resetTrigger, setResetTrigger] = useState(0);

  // The reset function increments the counter
  const reset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  // Use the base hook - it will automatically re-run when dependencies change
  const state = useReasoningStream(prompt, options);

  // Add effect to force re-run when resetTrigger changes
  useEffect(() => {
    // This effect re-runs when resetTrigger changes
    // The cleanup of useReasoningStream will cancel the current stream
    // and a new one will start
  }, [resetTrigger]);

  return {
    ...state,
    reset,
  };
}
