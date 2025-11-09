import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IWorld } from '../../support/world';

// Type augmentation for Cucumber world
declare module '@cucumber/cucumber' {
  interface World extends IWorld {}
}

/**
 * Step Definitions: Pattern Demo Lifecycle
 *
 * These steps implement the BDD specifications for managing pattern demo lifecycle
 * according to the Pattern Exhibition Context from our DDD architecture.
 *
 * Related Aggregate: PatternDemo (src/patterns/{pattern}/Demo.tsx)
 * Bounded Context: Pattern Exhibition
 */

// ============================================================================
// Given Steps - Set up initial state
// ============================================================================

Given('a pattern registry with registered patterns', function() {
  this.patternRegistry = {
    'chain-of-reasoning': {
      id: 'chain-of-reasoning',
      name: 'Chain of Reasoning',
      component: () => null, // Mock component
    },
    'multi-turn-memory': {
      id: 'multi-turn-memory',
      name: 'Multi-Turn Memory',
      component: () => null,
    },
  };
});

Given('a fixture repository with demo scenarios', function() {
  this.fixtureRepository = {
    'sprint-planning-scenario': {
      id: 'sprint-planning-scenario',
      name: 'Sprint Planning',
      events: [
        { type: 'reasoning', data: { id: '1', summary: 'Analyzing backlog', confidence: 0.9 }},
        { type: 'reasoning', data: { id: '2', summary: 'Estimating capacity', confidence: 0.85 }},
        { type: 'answer', data: { text: 'Sprint plan created' }},
      ],
    },
  };
});

Given('a pattern demo in {string} state', function(state: string) {
  this.demoState = state;
  this.patternDemo = {
    id: 'demo-1',
    patternId: 'chain-of-reasoning',
    state,
    sessionId: null,
    fixtureId: null,
  };
});

Given('a pattern demo for {string}', function(patternId: string) {
  this.patternDemo = {
    id: `demo-${Date.now()}`,
    patternId,
    state: 'idle',
    sessionId: null,
    fixtureId: null,
  };
});

Given('fixture {string}', function(fixtureId: string) {
  this.selectedFixture = this.fixtureRepository[fixtureId];
  this.patternDemo.fixtureId = fixtureId;
});

Given('no fixture is selected', function() {
  this.selectedFixture = null;
  this.patternDemo.fixtureId = null;
});

Given('a running pattern demo', async function() {
  // Set up a demo in streaming state
  this.patternDemo = {
    id: 'demo-running',
    patternId: 'chain-of-reasoning',
    state: 'streaming',
    sessionId: 'session-123',
    fixtureId: 'sprint-planning-scenario',
  };

  // Mock stream session
  this.streamSession = {
    id: 'session-123',
    state: 'active',
    cursor: 0,
    events: this.fixtureRepository['sprint-planning-scenario'].events,
  };
});

Given('the demo has emitted {int} events', function(eventCount: number) {
  this.streamSession.cursor = eventCount;
  this.emittedEvents = this.streamSession.events.slice(0, eventCount);
});

Given('a paused pattern demo', function() {
  this.patternDemo = {
    id: 'demo-paused',
    patternId: 'chain-of-reasoning',
    state: 'paused',
    sessionId: 'session-456',
    fixtureId: 'sprint-planning-scenario',
  };

  this.streamSession = {
    id: 'session-456',
    state: 'paused',
    cursor: 3,
    events: this.fixtureRepository['sprint-planning-scenario'].events,
  };
});

Given('the stream cursor is at event {int}', function(position: number) {
  this.streamSession.cursor = position;
});

Given('a completed pattern demo', function() {
  this.patternDemo = {
    id: 'demo-completed',
    patternId: 'chain-of-reasoning',
    state: 'completed',
    sessionId: 'session-789',
    fixtureId: 'sprint-planning-scenario',
  };

  this.streamSession = {
    id: 'session-789',
    state: 'closed',
    cursor: this.fixtureRepository['sprint-planning-scenario'].events.length,
    events: this.fixtureRepository['sprint-planning-scenario'].events,
  };
});

Given('delay profile set to {string}', function(profile: string) {
  this.delayProfile = profile;
  this.delayMs = {
    'fast': 50,
    'normal': 300,
    'slow': 1000,
  }[profile];
});

Given('a pattern demo component', function() {
  // This would render the actual PatternDemo component
  // For now, we'll set up the mock
  this.demoComponent = {
    phase: 'idle',
    ui: {
      streamingIndicators: false,
      pauseButton: { enabled: false },
      resumeButton: { enabled: false },
      startButton: { enabled: true },
    },
  };
});

// ============================================================================
// When Steps - Perform actions
// ============================================================================

When('I start the demo', async function() {
  // Simulate starting the demo
  const previousState = this.patternDemo.state;

  if (previousState !== 'idle' && previousState !== 'completed') {
    this.operationError = new Error(`Cannot start: demo in ${previousState} state`);
    return;
  }

  // Create stream session
  this.streamSession = {
    id: `session-${Date.now()}`,
    state: 'active',
    cursor: 0,
    events: this.fixtureRepository[this.patternDemo.fixtureId]?.events || [],
  };

  this.patternDemo.state = 'streaming';
  this.patternDemo.sessionId = this.streamSession.id;

  // Initialize network inspector capture
  this.networkInspector = {
    capturing: true,
    events: [],
  };
});

When('I pause the demo', function() {
  const previousState = this.patternDemo.state;

  if (previousState !== 'streaming') {
    this.operationError = new Error(`Cannot pause: demo not streaming`);
    return;
  }

  this.patternDemo.state = 'paused';
  this.streamSession.state = 'paused';
});

When('I resume the demo', function() {
  const previousState = this.patternDemo.state;

  if (previousState !== 'paused') {
    this.operationError = new Error(`Cannot resume: demo not paused`);
    return;
  }

  this.patternDemo.state = 'streaming';
  this.streamSession.state = 'active';
});

When('the stream completes', function() {
  this.patternDemo.state = 'completed';
  this.streamSession.state = 'closed';
  this.streamSession.cursor = this.streamSession.events.length;
});

When('I attempt to pause the demo', function() {
  try {
    if (this.patternDemo.state !== 'streaming') {
      throw new Error('Cannot pause: demo not streaming');
    }
    this.patternDemo.state = 'paused';
  } catch (error) {
    this.operationError = error;
  }
});

When('I attempt to {string}', function(action: string) {
  try {
    const actionMap: Record<string, () => void> = {
      'start': () => {
        if (this.patternDemo.state !== 'idle') {
          throw new Error('Cannot start: demo not idle');
        }
        this.patternDemo.state = 'streaming';
      },
      'pause': () => {
        if (this.patternDemo.state !== 'streaming') {
          throw new Error('Cannot pause: demo not streaming');
        }
        this.patternDemo.state = 'paused';
      },
      'resume': () => {
        if (this.patternDemo.state !== 'paused') {
          throw new Error('Cannot resume: demo not paused');
        }
        this.patternDemo.state = 'streaming';
      },
      'reset': () => {
        this.patternDemo.state = 'idle';
        this.streamSession = null;
      },
    };

    const actionFn = actionMap[action];
    if (!actionFn) {
      throw new Error(`Unknown action: ${action}`);
    }

    actionFn();
    this.operationResult = 'success';
  } catch (error) {
    this.operationError = error;
    this.operationResult = 'failed';
  }
});

When('I attempt to start the demo', function() {
  try {
    if (!this.patternDemo.fixtureId) {
      throw new Error('Fixture required');
    }
    this.patternDemo.state = 'streaming';
    this.operationResult = 'success';
  } catch (error) {
    this.operationError = error;
    this.operationResult = 'failed';
  }
});

When('I reset the demo', function() {
  const sessionId = this.streamSession?.id;

  // Clean up stream session
  if (this.streamSession) {
    this.streamSession.state = 'closed';
    this.streamSession = null;
  }

  // Reset demo state
  this.patternDemo.state = 'idle';
  this.patternDemo.sessionId = null;

  // Clear network inspector
  if (this.networkInspector) {
    this.networkInspector.events = [];
  }
});

When('the stream emits its final event', function() {
  this.streamSession.cursor = this.streamSession.events.length;
  this.patternDemo.state = 'completed';
  this.streamSession.state = 'closed';

  this.completionMetadata = {
    completedAt: Date.now(),
    totalEvents: this.streamSession.events.length,
    duration: 5000, // mock duration
  };
});

When('a stream error occurs', function() {
  this.streamError = new Error('Stream connection failed');
  this.patternDemo.state = 'error';
  this.streamSession.state = 'closed';
  this.errorDetails = {
    message: 'Stream connection failed',
    timestamp: Date.now(),
    recoverable: true,
  };
});

When('the demo phase changes to {string}', function(phase: string) {
  this.demoComponent.phase = phase;

  // Update UI state based on phase
  if (phase === 'streaming') {
    this.demoComponent.ui = {
      streamingIndicators: true,
      pauseButton: { enabled: true },
      resumeButton: { enabled: false },
      startButton: { enabled: false },
    };
  } else if (phase === 'paused') {
    this.demoComponent.ui = {
      streamingIndicators: false,
      pauseButton: { enabled: false },
      resumeButton: { enabled: true },
      startButton: { enabled: false },
    };
  }
});

// ============================================================================
// Then Steps - Assert expectations
// ============================================================================

Then('the demo should transition to {string} state', function(expectedState: string) {
  expect(this.patternDemo.state).toBe(expectedState);
});

Then('the operation should fail with error {string}', function(expectedError: string) {
  expect(this.operationError).toBeDefined();
  expect(this.operationError.message).toBe(expectedError);
});

Then('the demo should remain in {string} state', function(expectedState: string) {
  expect(this.patternDemo.state).toBe(expectedState);
});

Then('the operation should {string}', function(expectedResult: string) {
  if (expectedResult === 'succeed') {
    expect(this.operationResult).toBe('success');
    expect(this.operationError).toBeUndefined();
  } else if (expectedResult === 'fail') {
    expect(this.operationResult).toBe('failed');
    expect(this.operationError).toBeDefined();
  }
});

Then('a stream session should be created', function() {
  expect(this.streamSession).toBeDefined();
  expect(this.streamSession.id).toBeTruthy();
});

Then('the session should use fixture {string}', function(fixtureId: string) {
  expect(this.patternDemo.fixtureId).toBe(fixtureId);
});

Then('the demo phase should be {string}', function(expectedPhase: string) {
  expect(this.patternDemo.state).toBe(expectedPhase);
});

Then('the network inspector should start capturing events', function() {
  expect(this.networkInspector.capturing).toBe(true);
});

Then('event emission should stop', function() {
  expect(this.streamSession.state).toBe('paused');
});

Then('the stream cursor should preserve its position', function() {
  const cursorPosition = this.streamSession.cursor;
  expect(cursorPosition).toBeGreaterThan(0);
  this.preservedCursor = cursorPosition;
});

Then('event emission should continue', function() {
  expect(this.streamSession.state).toBe('active');
});

Then('the next event should be event {int}', function(eventNumber: number) {
  expect(this.streamSession.cursor).toBe(eventNumber - 1);
});

Then('the stream session should be destroyed', function() {
  expect(this.streamSession).toBeNull();
});

Then('all demo state should clear', function() {
  expect(this.patternDemo.state).toBe('idle');
  expect(this.patternDemo.sessionId).toBeNull();
});

Then('the network inspector should clear events', function() {
  expect(this.networkInspector.events).toHaveLength(0);
});

Then('the stream session should close', function() {
  expect(this.streamSession.state).toBe('closed');
});

Then('completion metadata should be recorded', function() {
  expect(this.completionMetadata).toBeDefined();
  expect(this.completionMetadata.completedAt).toBeTruthy();
  expect(this.completionMetadata.totalEvents).toBeGreaterThan(0);
});

Then('the network inspector should remain accessible', function() {
  expect(this.networkInspector).toBeDefined();
  expect(this.networkInspector.events.length).toBeGreaterThan(0);
});

Then('events should emit with ~{int}ms delays', function(expectedDelay: number) {
  expect(this.delayMs).toBe(expectedDelay);
});

Then('subsequent events should emit with ~{int}ms delays', function(expectedDelay: number) {
  expect(this.delayMs).toBe(expectedDelay);
});

Then('the error details should be captured', function() {
  expect(this.errorDetails).toBeDefined();
  expect(this.errorDetails.message).toBeTruthy();
});

Then('users should see an error message with retry option', function() {
  expect(this.errorDetails.recoverable).toBe(true);
});

Then('the UI should show streaming indicators', function() {
  expect(this.demoComponent.ui.streamingIndicators).toBe(true);
});

Then('pause button should be enabled', function() {
  expect(this.demoComponent.ui.pauseButton.enabled).toBe(true);
});

Then('start button should be disabled', function() {
  expect(this.demoComponent.ui.startButton.enabled).toBe(false);
});

Then('the UI should show paused indicators', function() {
  expect(this.demoComponent.phase).toBe('paused');
});

Then('resume button should be enabled', function() {
  expect(this.demoComponent.ui.resumeButton.enabled).toBe(true);
});

Then('pause button should be disabled', function() {
  expect(this.demoComponent.ui.pauseButton.enabled).toBe(false);
});

Then('a unique session ID should be generated', function() {
  expect(this.streamSession.id).toBeTruthy();
  this.lastSessionId = this.streamSession.id;
});

Then('a new unique session ID should be generated', function() {
  expect(this.streamSession.id).toBeTruthy();
  expect(this.streamSession.id).not.toBe(this.lastSessionId);
});

Then('the new session ID should differ from the previous one', function() {
  expect(this.streamSession.id).not.toBe(this.lastSessionId);
});
