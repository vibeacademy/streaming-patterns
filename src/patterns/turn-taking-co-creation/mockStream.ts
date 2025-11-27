/**
 * Turn-Taking Co-Creation Pattern - Mock Stream Generator
 *
 * This file implements deterministic mock streaming for collaborative editing.
 * The stream emits patch events from both agent and user, simulating real-time
 * collaborative document creation.
 *
 * @pattern Turn-Taking Co-Creation
 * @educational Demonstrates bidirectional streaming with patches and acknowledgments
 */

import type { StreamEvent } from './types';
import { projectCharterCollaboration, shortCollaboration, conflictScenario } from './fixtures';

/**
 * Stream speed settings for testing different scenarios.
 */
export type StreamSpeed = 'fast' | 'normal' | 'slow';

/**
 * Configuration for the mock collaboration stream.
 */
export interface StreamConfig {
  /** Which fixture to use */
  fixture: 'full' | 'short' | 'conflict';
  /** Stream speed (affects delay between events) */
  speed: StreamSpeed;
  /** Whether to simulate network variability */
  variableDelay: boolean;
}

/**
 * Get delay in milliseconds based on stream speed.
 *
 * Educational Note: Different speeds are useful for:
 * - fast: Testing and automated checks
 * - normal: Realistic demo experience
 * - slow: Educational walkthroughs and debugging
 */
function getDelay(speed: StreamSpeed, isVariableDelay: boolean): number {
  const baseDelays: Record<StreamSpeed, number> = {
    fast: 50,
    normal: 300,
    slow: 1000,
  };

  const delay = baseDelays[speed];

  if (!isVariableDelay) {
    return delay;
  }

  // Add random variance (±30%)
  const variance = delay * 0.3;
  return delay + (Math.random() * variance * 2 - variance);
}

/**
 * Create a mock collaborative editing stream.
 *
 * Educational Note: This generator yields events in timestamp order,
 * simulating real-time collaboration between agent and user.
 *
 * @param config - Stream configuration
 * @returns Async generator of stream events
 */
export async function* createMockCollaborationStream(
  config: StreamConfig = {
    fixture: 'full',
    speed: 'normal',
    variableDelay: true,
  }
): AsyncGenerator<StreamEvent> {
  // Select fixture based on config
  let fixture: StreamEvent[];
  switch (config.fixture) {
    case 'full': {
      fixture = projectCharterCollaboration;
      break;
    }
    case 'short': {
      fixture = shortCollaboration;
      break;
    }
    case 'conflict': {
      fixture = conflictScenario;
      break;
    }
    default: {
      const _exhaustive: never = config.fixture;
      throw new Error(`Unknown fixture: ${_exhaustive}`);
    }
  }

  // Stream events with delays
  for (const event of fixture) {
    const delay = getDelay(config.speed, config.variableDelay);
    await new Promise((resolve) => setTimeout(resolve, delay));
    yield event;
  }
}

/**
 * Create a stream with custom events.
 *
 * Educational Note: This allows tests to create custom collaboration scenarios
 * without modifying the fixture files.
 *
 * @param events - Custom stream events
 * @param speed - Stream speed
 * @returns Async generator of events
 */
export async function* createCustomStream(
  events: StreamEvent[],
  speed: StreamSpeed = 'fast'
): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    const delay = getDelay(speed, false);
    await new Promise((resolve) => setTimeout(resolve, delay));
    yield event;
  }
}

/**
 * Simulate user patch events for testing.
 *
 * Educational Note: In a real application, user patches would be created
 * client-side and sent to the server via WebSocket or HTTP.
 *
 * @param sectionId - Section being edited
 * @param content - User's edit content
 * @param position - Where the edit is applied
 * @param supersedes - Optional agent patch being replaced
 * @returns User patch event
 */
export function createUserPatchEvent(
  sectionId: string,
  content: string,
  position: { start: number; end: number },
  supersedes?: string
): StreamEvent {
  return {
    type: 'user_patch',
    timestamp: Date.now(),
    data: {
      patchId: `user-patch-${Date.now()}`,
      sectionId,
      operation: position.start === position.end ? 'insert' : 'replace',
      content,
      position,
      supersedes,
    },
  };
}

/**
 * Simulate agent patch acknowledgment.
 *
 * Educational Note: Acknowledgments show that the agent has processed
 * user feedback and adapted its output accordingly.
 *
 * @param patchId - User patch being acknowledged
 * @param message - Agent's response message
 * @returns Patch acknowledgment event
 */
export function createPatchAckEvent(
  patchId: string,
  message: string
): StreamEvent {
  return {
    type: 'patch_ack',
    timestamp: Date.now(),
    data: {
      patchId,
      status: 'accepted',
      message,
    },
  };
}

/**
 * Pause the stream for a specified duration.
 *
 * Educational Note: Pauses can simulate user review time or network delays.
 * Useful for testing how the UI handles gaps in the stream.
 *
 * @param ms - Milliseconds to pause
 */
export async function pauseStream(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the total expected duration of a stream.
 *
 * Educational Note: Useful for progress indicators and testing timeouts.
 *
 * @param config - Stream configuration
 * @returns Estimated duration in milliseconds
 */
export function getStreamDuration(config: StreamConfig): number {
  let eventCount: number;

  switch (config.fixture) {
    case 'full': {
      eventCount = projectCharterCollaboration.length;
      break;
    }
    case 'short': {
      eventCount = shortCollaboration.length;
      break;
    }
    case 'conflict': {
      eventCount = conflictScenario.length;
      break;
    }
    default: {
      const _exhaustive: never = config.fixture;
      throw new Error(`Unknown fixture: ${_exhaustive}`);
    }
  }

  const avgDelay = getDelay(config.speed, false);
  return eventCount * avgDelay;
}

/**
 * Count events by type in a fixture.
 *
 * Educational Note: Useful for instrumentation and verifying fixtures
 * have the expected event distribution.
 *
 * @param fixture - Fixture name
 * @returns Event count by type
 */
export function getEventCounts(fixture: 'full' | 'short' | 'conflict'): Record<string, number> {
  let events: StreamEvent[];

  switch (fixture) {
    case 'full': {
      events = projectCharterCollaboration;
      break;
    }
    case 'short': {
      events = shortCollaboration;
      break;
    }
    case 'conflict': {
      events = conflictScenario;
      break;
    }
    default: {
      const _exhaustive: never = fixture;
      throw new Error(`Unknown fixture: ${_exhaustive}`);
    }
  }

  const counts: Record<string, number> = {};

  for (const event of events) {
    counts[event.type] = (counts[event.type] || 0) + 1;
  }

  return counts;
}
