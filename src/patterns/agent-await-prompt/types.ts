/**
 * Type definitions for the Agent-Await-Prompt pattern.
 *
 * This pattern demonstrates pause/resume mechanics in streaming AI interactions.
 * The AI can pause mid-stream to request missing information from the user,
 * then resume once the input is provided.
 *
 * Key Concepts:
 * - State machine: streaming → awaiting_input → resuming → streaming
 * - Inline input fields embedded in the stream
 * - Required vs. optional field handling
 * - Timeout fallback for unresponsive users
 *
 * @module patterns/agent-await-prompt/types
 */

/**
 * Supported input field types for user prompts.
 *
 * These types map to HTML input types and enable appropriate
 * UI controls and validation.
 */
export type InputFieldType = 'text' | 'number' | 'date' | 'email' | 'url';

/**
 * Definition of a single input field that the AI requests from the user.
 *
 * Input fields can be required or optional, and include metadata for
 * rendering appropriate UI controls and validation.
 *
 * @example
 * ```typescript
 * const projectNameField: InputField = {
 *   name: 'projectName',
 *   type: 'text',
 *   label: 'Project Name',
 *   required: true,
 *   placeholder: 'Enter project name...',
 *   helpText: 'A descriptive name for your project'
 * };
 * ```
 */
export interface InputField {
  /**
   * Unique identifier for this field.
   * Used as the key in the submitted data object.
   */
  name: string;

  /**
   * Input field type (text, number, date, etc.).
   * Determines the UI control and validation rules.
   */
  type: InputFieldType;

  /**
   * Human-readable label shown to the user.
   */
  label: string;

  /**
   * Whether this field must be filled before submission.
   * Required fields are visually indicated with an asterisk.
   */
  required: boolean;

  /**
   * Optional placeholder text shown in the input field.
   */
  placeholder?: string;

  /**
   * Optional help text explaining what to enter.
   * Shown below the input field or in a tooltip.
   */
  helpText?: string;

  /**
   * Default value for the field (optional).
   * Can be used for intelligent pre-filling based on context.
   */
  defaultValue?: string | number;
}

/**
 * Stream event emitted when the AI needs input from the user.
 *
 * This event pauses the stream and displays inline input fields
 * for the user to fill out. The stream remains paused until the
 * user submits the input or the timeout expires.
 *
 * @example
 * ```typescript
 * const event: AwaitInputStreamEvent = {
 *   type: 'await_input',
 *   data: {
 *     message: 'I need some information to continue setting up your project.',
 *     fields: [
 *       { name: 'projectName', type: 'text', label: 'Project Name', required: true },
 *       { name: 'budget', type: 'number', label: 'Budget (USD)', required: false }
 *     ],
 *     timeoutMs: 60000
 *   }
 * };
 * ```
 */
export interface AwaitInputStreamEvent {
  /**
   * Event type discriminator. Always 'await_input' for input request events.
   */
  type: 'await_input';

  /**
   * The await input request payload.
   */
  data: {
    /**
     * Message to display when requesting input.
     * Explains why the AI needs this information.
     */
    message: string;

    /**
     * Array of input fields to present to the user.
     * Can include both required and optional fields.
     */
    fields: InputField[];

    /**
     * Optional timeout in milliseconds.
     * If user doesn't respond within this time, stream continues with fallback behavior.
     * @default 60000 (60 seconds)
     */
    timeoutMs?: number;
  };
}

/**
 * Stream event emitted when streaming text content.
 *
 * Text events are used for both the initial message before pausing
 * and the resumed message after receiving input.
 *
 * @example
 * ```typescript
 * const event: TextStreamEvent = {
 *   type: 'text',
 *   data: {
 *     text: 'Let me help you set up a new project. ',
 *     isComplete: false
 *   }
 * };
 * ```
 */
export interface TextStreamEvent {
  /**
   * Event type discriminator. Always 'text' for text content events.
   */
  type: 'text';

  /**
   * The text content payload.
   */
  data: {
    /**
     * The text content to display.
     * May be a complete message or an incremental chunk.
     */
    text: string;

    /**
     * Whether this text completes a logical message segment.
     * Useful for knowing when to finalize UI states.
     */
    isComplete?: boolean;
  };
}

/**
 * Stream event emitted when the user submits input.
 *
 * This is a client-side event (not from the server) that signals
 * the stream should resume with the provided input data.
 *
 * @example
 * ```typescript
 * const event: InputSubmissionEvent = {
 *   type: 'input_submission',
 *   data: {
 *     projectName: 'StreamFlow PM Dashboard',
 *     budget: 50000,
 *     deadline: '2025-12-31'
 *   }
 * };
 * ```
 */
export interface InputSubmissionEvent {
  /**
   * Event type discriminator. Always 'input_submission' for user input events.
   */
  type: 'input_submission';

  /**
   * The submitted input data as a key-value map.
   * Keys correspond to InputField.name values.
   */
  data: Record<string, string | number | Date>;
}

/**
 * Stream event emitted when the stream resumes after receiving input.
 *
 * This event signals that the AI has received the user's input and
 * is continuing with the original task.
 *
 * @example
 * ```typescript
 * const event: ResumeStreamEvent = {
 *   type: 'resume',
 *   data: {
 *     message: 'Great! Continuing with project setup...',
 *     receivedFields: ['projectName', 'budget']
 *   }
 * };
 * ```
 */
export interface ResumeStreamEvent {
  /**
   * Event type discriminator. Always 'resume' for resume events.
   */
  type: 'resume';

  /**
   * The resume metadata.
   */
  data: {
    /**
     * Optional message acknowledging the received input.
     */
    message?: string;

    /**
     * Names of fields that were successfully received.
     * Useful for debugging and logging.
     */
    receivedFields?: string[];
  };
}

/**
 * Stream event emitted when the input timeout expires.
 *
 * If the user doesn't provide input within the specified timeout,
 * the stream continues with fallback behavior (e.g., using defaults,
 * skipping optional setup, or asking again later).
 *
 * @example
 * ```typescript
 * const event: TimeoutStreamEvent = {
 *   type: 'timeout',
 *   data: {
 *     message: 'No response received. Continuing with default settings...',
 *     expiredFields: ['budget', 'deadline']
 *   }
 * };
 * ```
 */
export interface TimeoutStreamEvent {
  /**
   * Event type discriminator. Always 'timeout' for timeout events.
   */
  type: 'timeout';

  /**
   * The timeout metadata.
   */
  data: {
    /**
     * Message explaining the timeout behavior.
     */
    message: string;

    /**
     * Names of fields that weren't provided due to timeout.
     */
    expiredFields?: string[];
  };
}

/**
 * Union type of all possible stream events in the Agent-Await-Prompt pattern.
 *
 * This discriminated union enables type-safe event handling with exhaustiveness checking.
 *
 * @example
 * ```typescript
 * function handleEvent(event: StreamEvent): void {
 *   switch (event.type) {
 *     case 'text':
 *       console.log('Text:', event.data.text);
 *       break;
 *     case 'await_input':
 *       console.log('Awaiting input:', event.data.fields);
 *       break;
 *     case 'input_submission':
 *       console.log('Input received:', event.data);
 *       break;
 *     case 'resume':
 *       console.log('Resuming stream');
 *       break;
 *     case 'timeout':
 *       console.log('Timeout:', event.data.message);
 *       break;
 *   }
 * }
 * ```
 */
export type StreamEvent =
  | TextStreamEvent
  | AwaitInputStreamEvent
  | InputSubmissionEvent
  | ResumeStreamEvent
  | TimeoutStreamEvent;

/**
 * Stream state in the pause/resume lifecycle.
 *
 * The state machine transitions:
 * - idle: No stream active
 * - streaming: Stream is actively emitting events
 * - awaiting_input: Stream paused, waiting for user input
 * - resuming: Transitioning from paused back to streaming
 * - completed: Stream has finished successfully
 * - error: Stream encountered an error
 */
export type StreamState =
  | 'idle'
  | 'streaming'
  | 'awaiting_input'
  | 'resuming'
  | 'completed'
  | 'error';

/**
 * Types of errors that can occur during streaming.
 */
export type StreamErrorType = 'timeout' | 'network' | 'validation' | 'stream' | 'unknown';

/**
 * Error class for stream-related failures.
 *
 * @example
 * ```typescript
 * throw new StreamError('Required field missing: projectName', 'validation');
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
 * Configuration options for the Agent-Await-Prompt stream.
 */
export interface AwaitPromptStreamConfig {
  /**
   * The initial prompt that triggers the stream.
   */
  prompt: string;

  /**
   * Stream speed control for demos.
   * - 'fast': 50ms delay between events
   * - 'normal': 300ms delay between events (default)
   * - 'slow': 1000ms delay between events
   * @default 'normal'
   */
  speed?: 'fast' | 'normal' | 'slow';

  /**
   * Optional callback invoked when each event is emitted.
   * Useful for network capture, logging, and debugging.
   */
  onEvent?: (event: StreamEvent) => void;

  /**
   * Default timeout for input requests (in milliseconds).
   * Can be overridden per await_input event.
   * @default 60000 (60 seconds)
   */
  defaultTimeoutMs?: number;

  /**
   * Whether to automatically resume on timeout.
   * If false, stream ends on timeout.
   * @default true
   */
  resumeOnTimeout?: boolean;

  /**
   * Error simulation mode for testing.
   * - 'none': No errors (default)
   * - 'timeout': Simulate a timeout error
   * - 'network': Simulate a network failure
   * - 'validation': Simulate a validation error
   * @default 'none'
   */
  simulateError?: 'none' | 'timeout' | 'network' | 'validation';
}

/**
 * Return type for the useAwaitPromptStream hook.
 *
 * Provides reactive state and controls for the await-prompt stream.
 */
export interface AwaitPromptStreamState {
  /**
   * The accumulated text content from the stream.
   */
  text: string;

  /**
   * Current state of the stream lifecycle.
   */
  streamState: StreamState;

  /**
   * Input fields requested by the AI (if in awaiting_input state).
   */
  inputFields: InputField[] | null;

  /**
   * Message accompanying the input request.
   */
  inputMessage: string | null;

  /**
   * Function to submit user input and resume the stream.
   * Only available when streamState is 'awaiting_input'.
   */
  submitInput: (data: Record<string, string | number | Date>) => void;

  /**
   * Remaining time in milliseconds before timeout.
   * Only available when streamState is 'awaiting_input'.
   */
  timeoutRemaining?: number;

  /**
   * Error object if the stream encountered an error.
   */
  error?: Error;

  /**
   * True if the stream is currently active (streaming, awaiting_input, or resuming).
   */
  isActive: boolean;
}

/**
 * Validation result for input field values.
 */
export interface ValidationResult {
  /**
   * Whether the validation passed.
   */
  isValid: boolean;

  /**
   * Error message if validation failed.
   */
  errorMessage?: string;
}

/**
 * Validator function for input fields.
 *
 * @param value - The value to validate
 * @param field - The field definition
 * @returns Validation result
 */
export type InputValidator = (
  value: string | number | Date | undefined,
  field: InputField
) => ValidationResult;
