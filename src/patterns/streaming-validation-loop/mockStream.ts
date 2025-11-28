/**
 * Streaming Validation Loop Pattern - Mock Stream Generator
 *
 * This file implements the mock streaming infrastructure for the validation loop pattern.
 * It demonstrates how to emit checkpoint events, pause for user input, and resume streaming.
 *
 * Educational Note: In a real implementation, the server would emit checkpoint events
 * and await client responses before continuing. This mock simulates that behavior
 * using async generators and event callbacks.
 *
 * @pattern Streaming Validation Loop
 */

import {
  budgetAllocationStreamFixture,
  getDefaultAllocation,
} from './fixtures';
import type {
  StreamEvent,
  CheckpointAction,
  BudgetAllocation,
  CheckpointResponseEvent,
  CheckpointResumeEvent,
  FinalPlanEvent,
  CheckpointEvent,
} from './types';

/**
 * Speed settings for stream delay simulation.
 */
export type StreamSpeed = 'fast' | 'normal' | 'slow';

const SPEED_DELAYS: Record<StreamSpeed, number> = {
  fast: 50, // 50ms between events (for demos/testing)
  normal: 500, // 500ms between events (realistic)
  slow: 1500, // 1.5s between events (educational/slow-motion)
};

/**
 * Checkpoint response handler type.
 *
 * Educational Note: This callback allows the UI to provide user responses
 * to checkpoints. The stream generator will pause and await this callback
 * before continuing.
 */
export type CheckpointResponseHandler = (
  checkpointId: string
) => Promise<{
  action: CheckpointAction;
  editedValue?: BudgetAllocation;
}>;

/**
 * Options for creating a validation stream.
 */
export interface ValidationStreamOptions {
  /** Speed of stream event emission */
  speed?: StreamSpeed;

  /** Handler for checkpoint responses (required for pausing) */
  onCheckpointResponse: CheckpointResponseHandler;
}

/**
 * Creates a mock validation stream with checkpoint pause/resume logic.
 *
 * Educational Note: This generator demonstrates the core mechanic of the pattern:
 * 1. Stream events normally until a checkpoint is reached
 * 2. Emit checkpoint event and PAUSE (await user response)
 * 3. User responds via the onCheckpointResponse callback
 * 4. Emit checkpoint_resume event with approved value
 * 5. Continue streaming
 *
 * The generator function allows natural async/await flow control, making the
 * pause/resume logic simple to implement and understand.
 *
 * @param options - Stream configuration options
 * @returns Async generator yielding stream events
 */
export async function* createValidationStream(
  options: ValidationStreamOptions
): AsyncGenerator<StreamEvent> {
  const { speed = 'normal', onCheckpointResponse } = options;
  const delayMs = SPEED_DELAYS[speed];

  // Process each event in the fixture
  for (const fixtureEvent of budgetAllocationStreamFixture) {
    // Add delay before each event (simulates network latency)
    await delay(delayMs);

    // Add timestamp to event
    const event: StreamEvent = {
      ...fixtureEvent,
      timestamp: Date.now(),
    } as StreamEvent;

    // Emit the event
    yield event;

    // If this is a checkpoint, PAUSE and wait for user response
    if (event.type === 'checkpoint') {
      const checkpointId = event.data.checkpointId;

      // CRITICAL: This is where the stream pauses!
      // The generator will not continue until the promise resolves.
      const response = await onCheckpointResponse(checkpointId);

      // User responded - emit the response event
      const responseEvent: CheckpointResponseEvent = {
        type: 'checkpoint_response',
        data: {
          checkpointId,
          action: response.action,
          editedValue: response.editedValue,
        },
        timestamp: Date.now(),
      };
      yield responseEvent;

      // Determine the approved value based on user action
      let approvedValue: BudgetAllocation;

      if (response.action === 'approve') {
        // User approved - use proposed value
        approvedValue = event.data.proposedValue;
      } else if (response.action === 'edit' && response.editedValue) {
        // User edited - use their modified value
        approvedValue = response.editedValue;
      } else {
        // User skipped - use default/fallback
        approvedValue = getDefaultAllocation(event.data.proposedValue.team);
      }

      // Emit resume event to signal stream is continuing
      const resumeEvent: CheckpointResumeEvent = {
        type: 'checkpoint_resume',
        data: {
          checkpointId,
          approvedValue,
          phase: 'resuming',
        },
        timestamp: Date.now(),
      };

      await delay(delayMs / 2); // Brief pause before resuming
      yield resumeEvent;

      // Update the final plan to include approved value
      // (This is a simplification - real systems would track state server-side)
      updateFinalPlanWithApprovedValue(approvedValue);
    }
  }
}

/**
 * Simple delay utility for simulating network latency.
 *
 * @param ms - Milliseconds to delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Updates the final plan with an approved budget allocation.
 *
 * Educational Note: This is a mock-specific helper. In a real implementation,
 * the server would maintain state and emit the final plan based on all
 * approved checkpoints.
 *
 * @param allocation - The approved allocation to include
 */
function updateFinalPlanWithApprovedValue(
  allocation: BudgetAllocation
): void {
  // Find the final_plan event in the fixture
  const foundEvent = budgetAllocationStreamFixture.find(
    (e) => e.type === 'final_plan'
  );

  if (foundEvent && foundEvent.type === 'final_plan') {
    const finalPlanEvent = foundEvent as unknown as FinalPlanEvent;

    // Update or add this allocation to the final plan
    const existingIndex = finalPlanEvent.data.allocations.findIndex(
      (a: BudgetAllocation) => a.team === allocation.team
    );

    if (existingIndex >= 0) {
      finalPlanEvent.data.allocations[existingIndex] = allocation;
    } else {
      finalPlanEvent.data.allocations.push(allocation);
    }

    // Recalculate total budget
    finalPlanEvent.data.totalBudget = finalPlanEvent.data.allocations.reduce(
      (sum: number, a: BudgetAllocation) => sum + a.budget,
      0
    );
  }
}

/**
 * Creates a validation stream with automatic approval (for testing).
 *
 * Educational Note: This variant automatically approves all checkpoints
 * after a brief delay. Useful for automated tests or demos that don't
 * require user interaction.
 *
 * @param speed - Stream speed setting
 * @param autoApproveDelayMs - Delay before auto-approving (default 100ms)
 */
export async function* createAutoApproveValidationStream(
  speed: StreamSpeed = 'fast',
  autoApproveDelayMs: number = 100
): AsyncGenerator<StreamEvent> {
  // Create a checkpoint handler that auto-approves
  const onCheckpointResponse: CheckpointResponseHandler = async () => {
    await delay(autoApproveDelayMs);
    return { action: 'approve' };
  };

  // Use the standard stream with auto-approve handler
  yield* createValidationStream({ speed, onCheckpointResponse });
}

/**
 * Creates a validation stream that times out checkpoints (for testing).
 *
 * Educational Note: This variant simulates timeout behavior where no user
 * response is received within the timeout period. In real systems, timeouts
 * typically result in auto-approval or a default action.
 *
 * @param speed - Stream speed setting
 * @param timeoutBehavior - What to do on timeout ('approve' | 'skip')
 */
export async function* createTimeoutValidationStream(
  speed: StreamSpeed = 'fast',
  timeoutBehavior: 'approve' | 'skip' = 'approve'
): AsyncGenerator<StreamEvent> {
  // Create a checkpoint handler that simulates timeout
  const onCheckpointResponse: CheckpointResponseHandler = async () => {
    // Wait for timeout duration (using fixture timeout)
    const foundEvent = budgetAllocationStreamFixture.find(
      (e) => e.type === 'checkpoint'
    );

    if (foundEvent && foundEvent.type === 'checkpoint') {
      const checkpointEvent = foundEvent as unknown as CheckpointEvent;
      await delay(checkpointEvent.data.timeoutMs);
    }

    // Return timeout action
    return { action: timeoutBehavior };
  };

  yield* createValidationStream({ speed, onCheckpointResponse });
}
