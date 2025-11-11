/**
 * Stream Processor Hook
 *
 * Core React hook for consuming mock streams in pattern demonstrations.
 * This hook provides the foundation for all pattern implementations by managing
 * stream state, lifecycle, and integration with the Network Inspector.
 *
 * Key features:
 * - Consumes async generators from mock SSE infrastructure
 * - Manages streaming state (events, isStreaming, errors)
 * - Provides pause/resume/reset controls
 * - Integrates with Network Inspector for event capture
 * - Ensures proper cleanup to prevent memory leaks
 * - Type-safe generic interface for pattern-specific events
 *
 * @module lib/hooks/useStreamProcessor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StreamEvent } from '@/types/events';
import {
  createMockStreamWithHandle,
  type DelayProfile,
} from '@/lib/streaming/mockSSE';
import { getFixtureEvents } from '@/lib/streaming/fixtureRepository';

/**
 * Options for configuring the stream processor
 */
export interface UseStreamProcessorOptions {
  /** Fixture ID to load from repository */
  fixtureId: string;

  /** Delay profile for timing control (default: 'normal') */
  delayProfile?: DelayProfile;

  /** Optional callback for each event (e.g., network inspector capture) */
  onEvent?: (event: StreamEvent) => void;

  /** Whether to auto-start streaming (default: true) */
  autoStart?: boolean;
}

/**
 * Result returned by useStreamProcessor hook
 */
export interface UseStreamProcessorResult<T extends StreamEvent> {
  /** Array of all events received so far */
  events: T[];

  /** Whether the stream is currently active */
  isStreaming: boolean;

  /** Error if stream failed, null otherwise */
  error: Error | null;

  /** Pause event emission */
  pause: () => void;

  /** Resume event emission */
  resume: () => void;

  /** Reset stream to initial state and restart */
  reset: () => void;

  /** Current stream state ('idle', 'streaming', 'paused', 'completed', 'error', 'closed') */
  state: string;

  /** Number of events processed */
  eventCount: number;
}

/**
 * Hook for processing mock streams in pattern demonstrations
 *
 * This hook is the core streaming infrastructure used by all pattern implementations.
 * It consumes async generators from the mock SSE system, manages state, and provides
 * control over stream playback.
 *
 * The hook ensures:
 * - Proper cleanup on component unmount (no memory leaks)
 * - Type-safe event handling with generics
 * - Integration with Network Inspector via onEvent callback
 * - Stable references for callbacks (useCallback)
 * - Error boundary compatible error handling
 *
 * @template T - The specific StreamEvent type for this pattern
 * @param options - Configuration options
 * @returns Stream processor result with events and control functions
 *
 * @example Basic usage
 * ```tsx
 * function ChainOfReasoningDemo() {
 *   const { events, isStreaming, pause, resume } = useStreamProcessor<
 *     ReasoningEvent | AnswerEvent
 *   >({
 *     fixtureId: 'chain-of-reasoning-sprint-planning',
 *     delayProfile: 'normal'
 *   });
 *
 *   return (
 *     <div>
 *       {isStreaming && <Spinner />}
 *       {events.map(event => (
 *         <EventDisplay key={event.id} event={event} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With Network Inspector integration
 * ```tsx
 * function ChainOfReasoningDemo() {
 *   const { captureEvent } = useNetworkCapture();
 *
 *   const { events, isStreaming } = useStreamProcessor({
 *     fixtureId: 'chain-of-reasoning-sprint-planning',
 *     delayProfile: 'normal',
 *     onEvent: captureEvent  // Capture events for Network Inspector
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example With manual control
 * ```tsx
 * function ChainOfReasoningDemo() {
 *   const { events, pause, resume, reset, state } = useStreamProcessor({
 *     fixtureId: 'chain-of-reasoning-sprint-planning',
 *     delayProfile: 'normal',
 *     autoStart: false  // Don't auto-start
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={pause}>Pause</button>
 *       <button onClick={resume}>Resume</button>
 *       <button onClick={reset}>Restart</button>
 *       <p>State: {state}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreamProcessor<T extends StreamEvent = StreamEvent>(
  options: UseStreamProcessorOptions
): UseStreamProcessorResult<T> {
  const { fixtureId, delayProfile = 'normal', onEvent, autoStart = true } = options;

  // State management
  const [events, setEvents] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [state, setState] = useState<string>('idle');

  // Refs for stream control and cleanup
  const streamHandleRef = useRef<ReturnType<typeof createMockStreamWithHandle>['handle'] | null>(
    null
  );
  const consumptionCancelledRef = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Start or restart the stream
   * Loads fixture events and begins streaming
   */
  const startStream = useCallback(() => {
    // Reset state
    setEvents([]);
    setError(null);
    setIsStreaming(true);
    setState('active');
    consumptionCancelledRef.current = false;

    // Async stream consumption
    (async () => {
      try {
        // Load fixture events from repository
        const fixtureEvents = getFixtureEvents(fixtureId);

        // Create mock stream with control handle
        const { stream, handle } = createMockStreamWithHandle({
          events: fixtureEvents,
          delayProfile,
        });

        // Store handle for external control
        streamHandleRef.current = handle;

        // Consume stream events
        for await (const enrichedEvent of stream) {
          // Check if consumption was cancelled
          if (consumptionCancelledRef.current || !mountedRef.current) {
            handle.close();
            break;
          }

          // Extract original event from enriched event
          const originalEvent = enrichedEvent as unknown as T;

          // Update events array
          setEvents((prev) => [...prev, originalEvent]);

          // Call onEvent callback if provided (for Network Inspector)
          if (onEvent) {
            onEvent(originalEvent);
          }

          // Update state based on stream state
          const currentState = handle.getState();
          setState(currentState);
        }

        // Stream completed successfully
        if (!consumptionCancelledRef.current && mountedRef.current) {
          setIsStreaming(false);
          setState('closed');
        }
      } catch (err) {
        // Handle stream errors
        if (mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsStreaming(false);
          setState('error');
        }
      }
    })();
  }, [fixtureId, delayProfile, onEvent]);

  /**
   * Pause the stream
   * Stream can be resumed later from the same position
   */
  const pause = useCallback((): void => {
    if (streamHandleRef.current) {
      streamHandleRef.current.pause();
      setIsStreaming(false);
      setState('paused');
    }
  }, []);

  /**
   * Resume a paused stream
   * Continues from where it was paused
   */
  const resume = useCallback((): void => {
    if (streamHandleRef.current) {
      streamHandleRef.current.resume();
      setIsStreaming(true);
      setState('active');
    }
  }, []);

  /**
   * Reset the stream and restart from beginning
   * Clears all events and reloads fixture
   */
  const reset = useCallback((): void => {
    // Close current stream if active
    if (streamHandleRef.current) {
      streamHandleRef.current.close();
      consumptionCancelledRef.current = true;
    }

    // Restart stream after a brief delay to ensure cleanup
    setTimeout(() => {
      if (mountedRef.current) {
        startStream();
      }
    }, 0);
  }, [startStream]);

  /**
   * Effect: Auto-start stream on mount (if autoStart is true)
   */
  useEffect(() => {
    if (autoStart) {
      startStream();
    }

    return () => {
      // Cleanup on unmount
      mountedRef.current = false;
      consumptionCancelledRef.current = true;

      if (streamHandleRef.current) {
        streamHandleRef.current.close();
      }
    };
  }, [autoStart, startStream]);

  /**
   * Effect: Handle fixture ID or delay profile changes
   * Restart stream with new configuration
   */
  useEffect(() => {
    // Only restart if stream is currently active
    if (isStreaming) {
      reset();
    }
    // Intentionally not including 'reset' in deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId, delayProfile]);

  return {
    events,
    isStreaming,
    error,
    pause,
    resume,
    reset,
    state,
    eventCount: events.length,
  };
}
