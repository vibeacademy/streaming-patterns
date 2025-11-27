/**
 * Streaming Validation Loop Pattern - React Hooks
 *
 * This file implements the useValidationStream hook that manages checkpoint state,
 * pause/resume logic, and user actions.
 *
 * Educational Note: This hook encapsulates all the complexity of checkpoint management,
 * making it easy to integrate the pattern into any React component. The hook handles:
 * - Stream event processing
 * - Checkpoint lifecycle management
 * - User action responses
 * - Timeline generation
 * - Timeout handling
 *
 * @pattern Streaming Validation Loop
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createValidationStream, type StreamSpeed } from './mockStream';
import type {
  Checkpoint,
  BudgetAllocation,
  StreamEvent,
  TimelineEntry,
  UseValidationStreamReturn,
  CheckpointAction,
} from './types';

/**
 * Options for useValidationStream hook.
 */
export interface UseValidationStreamOptions {
  /** Stream speed (fast/normal/slow) */
  speed?: StreamSpeed;

  /** Auto-start the stream (default: true) */
  autoStart?: boolean;

  /** Callback when stream completes */
  onComplete?: () => void;

  /** Callback for each stream event (for network inspector) */
  onEvent?: (event: StreamEvent) => void;
}

/**
 * Custom hook for managing validation stream with checkpoint logic.
 *
 * Educational Note: This hook demonstrates the complete state management
 * pattern for checkpoint-based validation. Key concepts:
 *
 * 1. Checkpoint Queue: We use a promise-based queue to pause the stream
 *    until user responds. Each checkpoint creates a promise that resolves
 *    when the user takes an action.
 *
 * 2. Active Checkpoint: Only one checkpoint is active at a time. The stream
 *    pauses until that checkpoint is resolved.
 *
 * 3. Timeline Generation: We track all checkpoints and their resolution
 *    times to build a retrospective timeline view.
 *
 * @param options - Hook configuration options
 * @returns Validation stream state and actions
 */
export function useValidationStream(
  options: UseValidationStreamOptions = {}
): UseValidationStreamReturn {
  const { speed = 'normal', autoStart = true, onComplete, onEvent } = options;

  // State: All checkpoints
  const [checkpoints, setCheckpoints] = useState<Map<string, Checkpoint>>(
    new Map()
  );

  // State: Currently active checkpoint
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(
    null
  );

  // State: Budget analyses for each team
  const [analyses, setAnalyses] = useState<Map<string, string>>(new Map());

  // State: Final approved allocations
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);

  // State: Final plan summary
  const [planSummary, setPlanSummary] = useState<string>('');

  // State: Streaming status
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // State: Waiting for approval status
  const [isWaitingForApproval, setIsWaitingForApproval] =
    useState<boolean>(false);

  // State: Timeline entries
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  // Ref: Checkpoint response resolvers
  // This is the key to pausing the stream - we store promise resolvers
  // and call them when the user responds to a checkpoint.
  const checkpointResolvers = useRef<
    Map<
      string,
      (response: { action: CheckpointAction; editedValue?: BudgetAllocation }) => void
    >
  >(new Map());

  // Ref: Track if stream should be cancelled
  const isCancelled = useRef<boolean>(false);

  /**
   * Approve a checkpoint with the proposed value.
   *
   * Educational Note: This action resolves the checkpoint promise with
   * an 'approve' action, allowing the stream to resume.
   */
  const approve = useCallback((checkpointId: string) => {
    const resolver = checkpointResolvers.current.get(checkpointId);
    if (resolver) {
      resolver({ action: 'approve' });
      checkpointResolvers.current.delete(checkpointId);
    }
  }, []);

  /**
   * Edit a checkpoint with a modified value.
   *
   * Educational Note: This action resolves the checkpoint promise with
   * an 'edit' action and the user's modified value.
   */
  const edit = useCallback(
    (checkpointId: string, editedValue: BudgetAllocation) => {
      const resolver = checkpointResolvers.current.get(checkpointId);
      if (resolver) {
        resolver({ action: 'edit', editedValue });
        checkpointResolvers.current.delete(checkpointId);
      }
    },
    []
  );

  /**
   * Skip a checkpoint (use default/fallback value).
   *
   * Educational Note: This action resolves the checkpoint promise with
   * a 'skip' action, causing the stream to use a default value.
   */
  const skip = useCallback((checkpointId: string) => {
    const resolver = checkpointResolvers.current.get(checkpointId);
    if (resolver) {
      resolver({ action: 'skip' });
      checkpointResolvers.current.delete(checkpointId);
    }
  }, []);

  /**
   * Reset the demo to initial state.
   */
  const reset = useCallback(() => {
    isCancelled.current = true;
    setCheckpoints(new Map());
    setActiveCheckpoint(null);
    setAnalyses(new Map());
    setAllocations([]);
    setPlanSummary('');
    setIsStreaming(false);
    setIsWaitingForApproval(false);
    setTimeline([]);
    checkpointResolvers.current.clear();

    // Restart stream after brief delay
    setTimeout(() => {
      isCancelled.current = false;
      startStream();
    }, 100);
  }, []);

  /**
   * Process a stream event.
   *
   * Educational Note: This function handles each event type and updates
   * state accordingly. Checkpoint events are special - they trigger the
   * pause mechanism.
   */
  const processEvent = useCallback(
    (event: StreamEvent) => {
      // Call event callback for network inspector
      if (onEvent) {
        onEvent(event);
      }

      switch (event.type) {
        case 'budget_analysis':
          // Store analysis text for this team
          setAnalyses((prev) =>
            new Map(prev).set(event.data.team, event.data.analysis)
          );
          break;

        case 'checkpoint': {
          // Create checkpoint object
          const checkpoint: Checkpoint = {
            id: event.data.checkpointId,
            phase: 'waiting_for_approval',
            question: event.data.question,
            proposedValue: event.data.proposedValue,
            actions: event.data.actions,
            timeoutMs: event.data.timeoutMs,
            timestamp: event.timestamp,
          };

          // Store checkpoint
          setCheckpoints((prev) => new Map(prev).set(checkpoint.id, checkpoint));

          // Set as active checkpoint
          setActiveCheckpoint(checkpoint);
          setIsWaitingForApproval(true);
          break;
        }

        case 'checkpoint_response':
          // Update checkpoint with user's action
          setCheckpoints((prev) => {
            const updated = new Map(prev);
            const checkpoint = updated.get(event.data.checkpointId);
            if (checkpoint) {
              checkpoint.actionTaken = event.data.action;
            }
            return updated;
          });
          break;

        case 'checkpoint_resume': {
          // Update checkpoint as resolved
          setCheckpoints((prev) => {
            const updated = new Map(prev);
            const checkpoint = updated.get(event.data.checkpointId);
            if (checkpoint) {
              checkpoint.phase = 'resuming';
              checkpoint.approvedValue = event.data.approvedValue;
              checkpoint.resolvedAt = event.timestamp;

              // Create timeline entry
              const entry: TimelineEntry = {
                checkpointId: checkpoint.id,
                team: event.data.approvedValue.team,
                createdAt: checkpoint.timestamp,
                resolvedAt: event.timestamp,
                durationMs: event.timestamp - checkpoint.timestamp,
                action: checkpoint.actionTaken || 'approve',
                proposedValue: checkpoint.proposedValue,
                approvedValue: event.data.approvedValue,
                wasEdited:
                  JSON.stringify(checkpoint.proposedValue) !==
                  JSON.stringify(event.data.approvedValue),
                wasTimedOut: false, // Timeout detection would be handled differently in real impl
              };

              setTimeline((prev) => [...prev, entry]);
            }
            return updated;
          });

          // Clear active checkpoint
          setActiveCheckpoint(null);
          setIsWaitingForApproval(false);

          // Add allocation to final allocations (check if not skipped)
          if (event.data.approvedValue.budget > 0) {
            setAllocations((prev) => [...prev, event.data.approvedValue]);
          }
          break;
        }

        case 'final_plan':
          // Store final plan
          setPlanSummary(event.data.summary);
          break;
      }
    },
    [onEvent]
  );

  /**
   * Start the validation stream.
   *
   * Educational Note: This function initializes the stream generator and
   * processes events. The checkpoint response handler is key - it creates
   * a promise for each checkpoint and stores the resolver. When the user
   * responds, we call the resolver to unblock the stream.
   */
  const startStream = useCallback(async () => {
    setIsStreaming(true);
    isCancelled.current = false;

    try {
      // Create stream with checkpoint response handler
      const stream = createValidationStream({
        speed,
        onCheckpointResponse: async (checkpointId: string) => {
          // Create a promise that will be resolved when user responds
          return new Promise((resolve) => {
            // Store the resolver so we can call it later
            checkpointResolvers.current.set(checkpointId, resolve);
          });
        },
      });

      // Process each event from the stream
      for await (const event of stream) {
        if (isCancelled.current) {
          break;
        }
        processEvent(event);
      }

      // Stream complete
      setIsStreaming(false);
      if (onComplete && !isCancelled.current) {
        onComplete();
      }
    } catch (error) {
      console.error('Stream error:', error);
      setIsStreaming(false);
    }
  }, [speed, processEvent, onComplete]);

  // Auto-start stream on mount
  useEffect(() => {
    if (autoStart) {
      startStream();
    }

    return () => {
      isCancelled.current = true;
    };
  }, [autoStart, startStream]);

  return {
    checkpoints,
    activeCheckpoint,
    analyses,
    allocations,
    planSummary,
    isStreaming,
    isWaitingForApproval,
    timeline,
    actions: {
      approve,
      edit,
      skip,
      reset,
    },
  };
}
