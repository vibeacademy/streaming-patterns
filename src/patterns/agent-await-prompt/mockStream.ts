/**
 * Mock stream generator for the Agent-Await-Prompt pattern.
 *
 * This module provides an AsyncGenerator that simulates streaming with
 * pause/resume mechanics. The stream can pause mid-execution to request
 * user input, then resume once the input is provided.
 *
 * Key Features:
 * - Deterministic, replayable streams (same prompt = same output)
 * - Pause on 'await_input' events
 * - Resume via external trigger (input submission)
 * - Timeout handling for unresponsive users
 * - Configurable speed for demos
 *
 * Educational Note:
 * This demonstrates a more complex streaming pattern than simple
 * request-response. The stream maintains state across pauses and
 * can be externally controlled (resumed by user action).
 *
 * @module patterns/agent-await-prompt/mockStream
 */

import type {
  StreamEvent,
  AwaitPromptStreamConfig,
  InputSubmissionEvent,
} from './types';
import { StreamError } from './types';
import { getFixtureForPrompt } from './fixtures';

/**
 * Delay configuration for different stream speeds.
 */
const SPEED_DELAYS = {
  fast: 50,
  normal: 300,
  slow: 1000,
} as const;

/**
 * Controller for managing stream pause/resume state.
 *
 * This class encapsulates the logic for pausing and resuming the stream
 * based on external events (user input submission).
 *
 * Educational Note:
 * This is a key piece of the pause/resume pattern. The stream generator
 * can await on this controller's promise, and external code can resolve
 * that promise to resume the stream.
 */
export class StreamController {
  private resolveInput: ((data: Record<string, string | number | Date>) => void) | null =
    null;
  private rejectInput: ((error: Error) => void) | null = null;
  private inputPromise: Promise<Record<string, string | number | Date>> | null = null;
  // eslint-disable-next-line no-undef
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * Creates a promise that will be resolved when input is submitted.
   *
   * This method is called by the stream generator when it encounters
   * an 'await_input' event. The generator then awaits this promise,
   * effectively pausing until the user submits input.
   *
   * @param timeoutMs - Maximum time to wait for input before timing out
   * @returns Promise that resolves with the submitted input data
   */
  waitForInput(timeoutMs: number): Promise<Record<string, string | number | Date>> {
    // Create a new promise that external code can resolve
    this.inputPromise = new Promise((resolve, reject) => {
      this.resolveInput = resolve;
      this.rejectInput = reject;

      // Set up timeout
      this.timeoutId = setTimeout(() => {
        this.rejectInput?.(
          new StreamError(
            `Input timeout after ${timeoutMs}ms`,
            'timeout'
          )
        );
        this.cleanup();
      }, timeoutMs);
    });

    return this.inputPromise;
  }

  /**
   * Submits user input and resolves the waiting promise.
   *
   * This method is called from external code (typically a React component)
   * when the user submits input. It resolves the promise that the stream
   * generator is awaiting, allowing the stream to continue.
   *
   * @param data - The submitted input data
   */
  submitInput(data: Record<string, string | number | Date>): void {
    if (this.resolveInput) {
      this.resolveInput(data);
      this.cleanup();
    }
  }

  /**
   * Cancels the input wait and cleans up resources.
   */
  cancel(): void {
    if (this.rejectInput) {
      this.rejectInput(new StreamError('Input cancelled', 'stream'));
      this.cleanup();
    }
  }

  /**
   * Cleans up the controller state.
   */
  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.resolveInput = null;
    this.rejectInput = null;
    this.inputPromise = null;
  }
}

/**
 * Creates an async generator that streams mock Agent-Await-Prompt events.
 *
 * This generator simulates an AI streaming response that can pause mid-stream
 * to request user input, then resume once the input is provided.
 *
 * The generator yields events from fixture data, but pauses when it encounters
 * an 'await_input' event. It only continues once the controller's submitInput()
 * method is called or the timeout expires.
 *
 * Educational Note:
 * This is a more advanced streaming pattern than simple AsyncGenerators.
 * The pause/resume mechanism requires coordination between:
 * - The generator (yields events, awaits on controller)
 * - The controller (manages pause state, provides resume trigger)
 * - External code (calls submitInput to resume)
 *
 * @param config - Configuration for the stream
 * @param controller - Controller for managing pause/resume
 * @returns AsyncGenerator that yields StreamEvent objects
 *
 * @example
 * ```typescript
 * const controller = new StreamController();
 * const stream = createMockAwaitPromptStream(
 *   { prompt: 'Set up a project' },
 *   controller
 * );
 *
 * // Start consuming the stream
 * for await (const event of stream) {
 *   if (event.type === 'await_input') {
 *     // Stream is paused, waiting for input
 *     // Later, when user submits:
 *     controller.submitInput({ projectName: 'My Project', ... });
 *     // Stream will resume
 *   }
 * }
 * ```
 */
export async function* createMockAwaitPromptStream(
  config: AwaitPromptStreamConfig,
  controller: StreamController
): AsyncGenerator<StreamEvent, void, undefined> {
  const {
    prompt,
    speed = 'normal',
    onEvent,
    defaultTimeoutMs = 60000,
    resumeOnTimeout = true,
    simulateError = 'none',
  } = config;

  // Get the fixture data for this prompt
  const fixture = getFixtureForPrompt(prompt);

  // Get the delay duration based on speed setting
  const delayMs = SPEED_DELAYS[speed];

  // Track if stream was cancelled for cleanup
  let cancelled = false;

  try {
    // Simulate network error if configured (before any events)
    if (simulateError === 'network') {
      await delay(delayMs);
      throw new StreamError(
        'Network connection failed (simulated)',
        'network'
      );
    }

    // Track whether we're currently in an await_input pause
    let currentAwaitInputEvent: StreamEvent | null = null;
    let receivedInput: Record<string, string | number | Date> | null = null;

    // Stream each event from the fixture
    for (let i = 0; i < fixture.length; i++) {
      // Check for cancellation before each event
      if (cancelled) {
        break;
      }

      const event = fixture[i];

      // Simulate validation error if configured (on first await_input)
      if (
        simulateError === 'validation' &&
        event.type === 'await_input' &&
        !currentAwaitInputEvent
      ) {
        await delay(delayMs);
        throw new StreamError(
          'Invalid input field configuration (simulated)',
          'validation'
        );
      }

      // Handle await_input events - pause the stream
      if (event.type === 'await_input') {
        currentAwaitInputEvent = event;

        // Yield the await_input event to notify consumer
        await delay(delayMs);
        if (onEvent) {
          try {
            onEvent(event);
          } catch (error) {
            console.error('Error in stream event callback:', error);
          }
        }
        yield event;

        // Pause the stream and wait for input
        const timeoutMs = event.data.timeoutMs ?? defaultTimeoutMs;

        try {
          // Wait for user to submit input (or timeout)
          receivedInput = await controller.waitForInput(timeoutMs);

          // Input received! Create and yield an input_submission event
          const submissionEvent: InputSubmissionEvent = {
            type: 'input_submission',
            data: receivedInput,
          };

          if (onEvent) {
            try {
              onEvent(submissionEvent);
            } catch (error) {
              console.error('Error in stream event callback:', error);
            }
          }

          // Note: We yield the submission event for visibility in network inspector
          // but it's not part of the fixture (it's client-generated)
          yield submissionEvent;

          currentAwaitInputEvent = null;

        } catch (error) {
          // Timeout or cancellation occurred
          if (error instanceof StreamError && error.type === 'timeout') {
            // Handle timeout based on configuration
            if (!resumeOnTimeout) {
              // Don't resume - end the stream
              throw error;
            }

            // Resume with timeout behavior
            // Look ahead in fixture for a 'timeout' event, or create one
            const nextEvent = fixture[i + 1];
            if (nextEvent && nextEvent.type === 'timeout') {
              // Fixture includes explicit timeout handling
              // Let the loop continue to yield it
            } else {
              // No explicit timeout event - throw the error
              throw error;
            }
          } else {
            // Other error (cancellation, etc.) - rethrow
            throw error;
          }
        }

        continue; // Skip the normal event yield (we already yielded await_input)
      }

      // For all other events, yield normally with delay
      await delay(delayMs);

      if (onEvent) {
        try {
          onEvent(event);
        } catch (error) {
          console.error('Error in stream event callback:', error);
        }
      }

      yield event;
    }

  } finally {
    // Cleanup: runs when generator is closed (via return() or completion)
    cancelled = true;
    controller.cancel(); // Ensure any pending input wait is cancelled
  }
}

/**
 * Utility function to delay execution.
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock stream with default configuration.
 *
 * Convenience function for common use case.
 *
 * @param prompt - The prompt to generate response for
 * @param controller - Controller for managing pause/resume
 * @returns AsyncGenerator that yields StreamEvent objects
 */
export function createDefaultAwaitPromptStream(
  prompt: string,
  controller: StreamController
): AsyncGenerator<StreamEvent, void, undefined> {
  return createMockAwaitPromptStream({ prompt, speed: 'normal' }, controller);
}
