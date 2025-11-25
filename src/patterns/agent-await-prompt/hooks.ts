/**
 * Custom React hooks for the Agent-Await-Prompt pattern.
 *
 * This module provides the useAwaitPromptStream hook which manages the state
 * and lifecycle of a pause/resume streaming interaction. The hook encapsulates:
 * - Stream consumption and state updates
 * - Pause detection and input field presentation
 * - Resume triggering via input submission
 * - Timeout countdown and fallback behavior
 *
 * Educational Note:
 * This hook demonstrates advanced streaming state management:
 * - Multi-state lifecycle (streaming → paused → resuming)
 * - External control (resume via callback)
 * - Timeout tracking with countdowns
 * - Cleanup to prevent memory leaks
 *
 * @module patterns/agent-await-prompt/hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AwaitPromptStreamConfig,
  AwaitPromptStreamState,
  StreamState,
  StreamEvent,
  InputField,
} from './types';
import { StreamError } from './types';
import {
  createMockAwaitPromptStream,
  StreamController,
} from './mockStream';

/**
 * React hook for managing Agent-Await-Prompt stream state.
 *
 * This hook consumes an await-prompt stream (AsyncGenerator) and provides
 * reactive state updates as events arrive. It handles the full pause/resume
 * lifecycle:
 * - Starting the stream when the prompt changes
 * - Updating text as events arrive
 * - Pausing on 'await_input' events and presenting input fields
 * - Resuming when user submits input
 * - Timing out if user doesn't respond
 * - Cleaning up on unmount or prompt change
 *
 * Educational Note:
 * This pattern is more complex than simple streaming because the stream
 * state is controlled both internally (by the stream itself) and externally
 * (by user actions). The hook acts as a bridge between the async stream
 * and the synchronous React component tree.
 *
 * @param prompt - The prompt to start the stream
 * @param options - Optional configuration (speed, event capture, etc.)
 * @returns Object containing stream state and controls
 *
 * @example
 * ```tsx
 * function AwaitPromptDemo() {
 *   const {
 *     text,
 *     streamState,
 *     inputFields,
 *     inputMessage,
 *     submitInput,
 *     timeoutRemaining,
 *     error
 *   } = useAwaitPromptStream('Set up a new project');
 *
 *   if (error) {
 *     return <ErrorDisplay error={error} />;
 *   }
 *
 *   return (
 *     <div>
 *       <MessageBubble text={text} />
 *
 *       {streamState === 'awaiting_input' && inputFields && (
 *         <InlineInputFields
 *           fields={inputFields}
 *           message={inputMessage}
 *           onSubmit={submitInput}
 *           timeoutRemaining={timeoutRemaining}
 *         />
 *       )}
 *
 *       {streamState === 'streaming' && <StreamingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAwaitPromptStream(
  prompt: string,
  options?: Omit<AwaitPromptStreamConfig, 'prompt'>
): AwaitPromptStreamState {
  // State: Accumulated text content from the stream
  const [text, setText] = useState<string>('');

  // State: Current stream lifecycle state
  const [streamState, setStreamState] = useState<StreamState>('idle');

  // State: Input fields requested by the AI (when awaiting input)
  const [inputFields, setInputFields] = useState<InputField[] | null>(null);

  // State: Message accompanying the input request
  const [inputMessage, setInputMessage] = useState<string | null>(null);

  // State: Remaining time before timeout (in milliseconds)
  const [timeoutRemaining, setTimeoutRemaining] = useState<number | undefined>(
    undefined
  );

  // State: Error object if stream encounters an error
  const [error, setError] = useState<Error | undefined>(undefined);

  // Ref: Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  // Ref: Stream controller for managing pause/resume
  const controllerRef = useRef<StreamController | null>(null);

  // Ref: Timeout countdown interval ID
  // eslint-disable-next-line no-undef
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref: Timeout start time (for calculating remaining time)
  const timeoutStartRef = useRef<number | null>(null);

  // Ref: Total timeout duration
  const timeoutDurationRef = useRef<number | null>(null);

  /**
   * Submit user input and resume the stream.
   *
   * This function is exposed to components and called when the user
   * fills out the input fields and submits. It triggers the stream
   * controller to resolve its waiting promise, allowing the stream
   * to continue.
   *
   * Educational Note:
   * This is a key piece of the pause/resume pattern. The component
   * calls this function, which in turn calls the stream controller,
   * which resolves the promise that the async generator is awaiting.
   * This chain of control allows external UI actions to control
   * internal stream flow.
   */
  const submitInput = useCallback(
    (data: Record<string, string | number | Date>) => {
      if (controllerRef.current && streamState === 'awaiting_input') {
        // Clear timeout countdown
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        timeoutStartRef.current = null;
        timeoutDurationRef.current = null;
        setTimeoutRemaining(undefined);

        // Transition to resuming state
        setStreamState('resuming');

        // Clear input UI
        setInputFields(null);
        setInputMessage(null);

        // Submit input to stream controller
        controllerRef.current.submitInput(data);
      }
    },
    [streamState]
  );

  /**
   * Memoize the onEvent callback to prevent unnecessary effect re-runs.
   */
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

  /**
   * Effect: Start timeout countdown when awaiting input.
   *
   * This provides a visual countdown for users to see how long
   * they have to respond.
   */
  useEffect(() => {
    if (
      streamState === 'awaiting_input' &&
      timeoutStartRef.current !== null &&
      timeoutDurationRef.current !== null
    ) {
      // Update countdown every 100ms for smooth animation
      countdownIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          return;
        }

        const elapsed = Date.now() - (timeoutStartRef.current ?? 0);
        const remaining = Math.max(0, (timeoutDurationRef.current ?? 0) - elapsed);

        setTimeoutRemaining(remaining);

        // Stop countdown when timeout reached
        if (remaining === 0 && countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }, 100);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    }
  }, [streamState]);

  /**
   * Effect: Start the stream when prompt or options change.
   *
   * This is the main effect that consumes the async stream generator
   * and updates React state as events arrive.
   */
  useEffect(() => {
    // Skip if prompt is empty
    if (!prompt.trim()) {
      return;
    }

    // Reset state at the start of a new stream
    setText('');
    setStreamState('streaming');
    setInputFields(null);
    setInputMessage(null);
    setTimeoutRemaining(undefined);
    setError(undefined);

    // Create a new stream controller for this stream
    const controller = new StreamController();
    controllerRef.current = controller;

    // Async function to consume the stream
    (async () => {
      try {
        // Create the mock stream with configuration
        const stream = createMockAwaitPromptStream(
          {
            prompt,
            speed: options?.speed ?? 'normal',
            onEvent: handleEvent,
            defaultTimeoutMs: options?.defaultTimeoutMs,
            resumeOnTimeout: options?.resumeOnTimeout,
            simulateError: options?.simulateError,
          },
          controller
        );

        // Consume the stream event by event
        for await (const event of stream) {
          // Only update state if component is still mounted
          if (!isMountedRef.current) {
            return;
          }

          // Handle different event types
          switch (event.type) {
            case 'text': {
              // Accumulate text content
              setText((prev) => prev + event.data.text);

              // Update state if this text completes a segment
              if (event.data.isComplete && streamState !== 'streaming') {
                setStreamState('streaming');
              }
              break;
            }

            case 'await_input': {
              // Pause the stream and present input fields
              setStreamState('awaiting_input');
              setInputFields(event.data.fields);
              setInputMessage(event.data.message);

              // Start timeout countdown
              const timeoutMs = event.data.timeoutMs ?? options?.defaultTimeoutMs ?? 60000;
              timeoutStartRef.current = Date.now();
              timeoutDurationRef.current = timeoutMs;
              setTimeoutRemaining(timeoutMs);
              break;
            }

            case 'input_submission': {
              // Input was submitted - this event is for network inspector visibility
              // The stream state transition is handled in submitInput callback
              break;
            }

            case 'resume': {
              // Stream is resuming after receiving input
              setStreamState('streaming');
              setInputFields(null);
              setInputMessage(null);
              setTimeoutRemaining(undefined);
              break;
            }

            case 'timeout': {
              // Timeout occurred - stream is continuing with fallback
              setStreamState('streaming');
              setInputFields(null);
              setInputMessage(null);
              setTimeoutRemaining(undefined);

              // Add timeout message to text
              setText((prev) => prev + '\n\n' + event.data.message);
              break;
            }

            default: {
              // Exhaustiveness check
              const _exhaustive: never = event;
              console.warn('Unknown event type:', _exhaustive);
            }
          }
        }

        // Stream completed successfully
        if (isMountedRef.current) {
          setStreamState('completed');
        }
      } catch (err) {
        // Stream encountered an error
        if (isMountedRef.current) {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown streaming error';
          setError(
            err instanceof StreamError ? err : new Error(errorMessage)
          );
          setStreamState('error');

          // Clear any pending input UI
          setInputFields(null);
          setInputMessage(null);
          setTimeoutRemaining(undefined);
        }
      }
    })();

    // Cleanup function: runs when component unmounts or when prompt changes
    return () => {
      // Cancel the stream controller
      controller.cancel();

      // Clear timeout countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      timeoutStartRef.current = null;
      timeoutDurationRef.current = null;
    };
  }, [
    prompt,
    options?.speed,
    options?.defaultTimeoutMs,
    options?.resumeOnTimeout,
    options?.simulateError,
    handleEvent,
  ]);

  /**
   * Effect: Track component mount status.
   *
   * This separate effect ensures isMountedRef is set correctly on unmount.
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute isActive flag
  const isActive =
    streamState === 'streaming' ||
    streamState === 'awaiting_input' ||
    streamState === 'resuming';

  // Return the reactive state and controls
  return {
    text,
    streamState,
    inputFields,
    inputMessage,
    submitInput,
    timeoutRemaining,
    error,
    isActive,
  };
}

/**
 * Hook for streaming with a reset function.
 *
 * This variant provides a reset function that allows components to
 * restart the stream without changing the prompt.
 *
 * @param prompt - The prompt to start the stream
 * @param options - Optional configuration
 * @returns Object containing state and a reset function
 *
 * @example
 * ```tsx
 * function AwaitPromptDemo() {
 *   const { text, streamState, submitInput, reset } = useAwaitPromptStreamWithReset(
 *     'Set up a project',
 *     { speed: 'fast' }
 *   );
 *
 *   return (
 *     <div>
 *       <MessageBubble text={text} />
 *       <button onClick={reset} disabled={streamState !== 'completed'}>
 *         Restart Demo
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAwaitPromptStreamWithReset(
  prompt: string,
  options?: Omit<AwaitPromptStreamConfig, 'prompt'>
): AwaitPromptStreamState & { reset: () => void } {
  // Use a counter to force re-running the stream
  const [resetTrigger, setResetTrigger] = useState(0);

  // The reset function increments the counter
  const reset = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  // Create a modified prompt that includes the reset trigger
  const promptWithTrigger = `${prompt}__trigger_${resetTrigger}`;

  // Use the base hook - it will automatically re-run when prompt changes
  const state = useAwaitPromptStream(promptWithTrigger, options);

  return {
    ...state,
    reset,
  };
}
