/**
 * Cucumber Hooks
 *
 * Hooks run before/after scenarios, features, and steps.
 * Use them for setup, teardown, and debugging.
 */

import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { cleanup } from '@testing-library/react';
import type { IWorld } from './world';

/**
 * BeforeAll - Runs once before all scenarios
 */
BeforeAll(async function() {
  console.log('🥒 Starting BDD test suite');
  console.log('📦 Test environment: Node.js with Vitest + Cucumber');
  console.log('🎯 Domain: Streaming Patterns Library');
  console.log('');
});

/**
 * AfterAll - Runs once after all scenarios
 */
AfterAll(async function() {
  console.log('');
  console.log('✅ BDD test suite complete');
});

/**
 * Before - Runs before each scenario
 */
Before(async function(this: IWorld, { pickle }) {
  // Log scenario start
  console.log(`\n🧪 Scenario: ${pickle.name}`);

  // Reset world state
  if (typeof (this as any).reset === 'function') {
    (this as any).reset();
  }

  // Initialize test utilities
  this.test = {
    error: undefined,
    component: undefined,
  };

  // Set up user event for Testing Library
  const userEvent = await import('@testing-library/user-event');
  this.test.user = userEvent.default.setup();
});

/**
 * After - Runs after each scenario
 */
After(async function(this: IWorld, { result, pickle }) {
  // Clean up React components
  cleanup();

  // Log scenario result
  if (result?.status === Status.PASSED) {
    console.log(`✅ ${pickle.name} - PASSED`);
  } else if (result?.status === Status.FAILED) {
    console.log(`❌ ${pickle.name} - FAILED`);
    if (result?.message) {
      console.error(`   Error: ${result.message}`);
    }
  } else if (result?.status === Status.SKIPPED) {
    console.log(`⏭️  ${pickle.name} - SKIPPED`);
  }

  // Clean up any test artifacts
  if (this.test?.component) {
    this.test.component.unmount?.();
  }

  // Clear timers to prevent leaks
  if (typeof vi !== 'undefined') {
    vi.clearAllTimers();
  }
});

/**
 * Tagged Hooks - Run only for scenarios with specific tags
 */

// @slow - Add extra timeout for slow scenarios
Before({ tags: '@slow' }, async function() {
  this.test.timeout = 10000; // 10 seconds
});

// @future - Skip future features not yet implemented
Before({ tags: '@future' }, async function({ pickle }) {
  console.log(`⏭️  Skipping future feature: ${pickle.name}`);
  return 'skipped';
});

// @debug - Enable verbose logging
Before({ tags: '@debug' }, async function() {
  this.test.debug = true;
  console.log('🐛 Debug mode enabled for this scenario');
});

// @visual - Take screenshots for visual scenarios
After({ tags: '@visual' }, async function({ result }) {
  if (result?.status === Status.FAILED && this.test?.component) {
    // Could integrate with Playwright or similar for screenshots
    console.log('📸 Screenshot would be captured here');
  }
});

/**
 * Pattern-specific hooks
 */

// Chain-of-Reasoning pattern setup
Before({ tags: '@chain-of-reasoning' }, async function() {
  this.patternRegistry = {
    'chain-of-reasoning': {
      id: 'chain-of-reasoning',
      name: 'Chain of Reasoning',
      component: () => null,
    },
  };

  this.fixtureRepository = {
    'sprint-planning-reasoning': {
      id: 'sprint-planning-reasoning',
      name: 'Sprint Planning with Reasoning',
      events: [
        { type: 'reasoning', data: { id: '1', summary: 'Analyzing backlog priorities', confidence: 0.92 }},
        { type: 'reasoning', data: { id: '2', summary: 'Estimating team capacity', confidence: 0.85 }},
        { type: 'reasoning', data: { id: '3', summary: 'Identifying task dependencies', confidence: 0.78 }},
        { type: 'reasoning', data: { id: '4', summary: 'Allocating tasks to team members', confidence: 0.88 }},
        { type: 'reasoning', data: { id: '5', summary: 'Calculating sprint velocity', confidence: 0.90 }},
        { type: 'answer', data: { text: 'Sprint Plan:\n\n1. Setup (5pts)\n2. Feature A (8pts)\n3. Feature B (13pts)' }},
      ],
    },
  };
});

// Multi-Turn Memory pattern setup
Before({ tags: '@multi-turn-memory' }, async function() {
  this.patternRegistry = {
    'multi-turn-memory': {
      id: 'multi-turn-memory',
      name: 'Multi-Turn Memory Timeline',
      component: () => null,
    },
  };

  this.fixtureRepository = {
    'memory-timeline-scenario': {
      id: 'memory-timeline-scenario',
      name: 'Q4 Planning Memory Timeline',
      events: [
        { type: 'message', data: { text: 'Let\'s plan Q4 goals' }},
        { type: 'memory', data: { id: 'mem-1', type: 'fact', summary: 'Team size is 8 developers', ttl: null }},
        { type: 'memory', data: { id: 'mem-2', type: 'decision', summary: 'Focus on mobile app first', ttl: null }},
        { type: 'memory', data: { id: 'mem-3', type: 'task', summary: 'Draft technical spec by Nov 15', ttl: null }},
        { type: 'memory', data: { id: 'mem-4', type: 'risk', summary: 'Tight timeline for Q4 launch', ttl: null }},
      ],
    },
  };
});

/**
 * StreamFlow PM Context setup
 */
Before({ tags: '@streamflow-pm' }, async function() {
  this.project = {
    id: 'proj-1',
    name: 'Dashboard Redesign',
    description: 'Modernize analytics dashboard with real-time data',
    budget: 500000,
    deadline: '2024-12-31',
  };

  this.tasks = [
    { id: 'task-1', title: 'Design wireframes', status: 'done', assignee: 'Alice', estimatedHours: 8 },
    { id: 'task-2', title: 'Implement charts', status: 'in-progress', assignee: 'Bob', estimatedHours: 16 },
    { id: 'task-3', title: 'Write tests', status: 'todo', estimatedHours: 12 },
  ];
});

/**
 * Error handling hooks
 */

// Capture errors for debugging
After(async function(this: IWorld, { result }) {
  if (result?.status === Status.FAILED) {
    // Store error for potential retry or debugging
    if (result.message) {
      this.test.error = new Error(result.message);
    }

    // Log world state for debugging
    if (this.test?.debug) {
      console.log('\n🔍 World state at failure:');
      console.log('  Pattern Demo:', this.patternDemo);
      console.log('  Stream Session:', this.streamSession);
      console.log('  Network Inspector:', this.networkInspector);
    }
  }
});

/**
 * Performance hooks
 */

// Measure scenario execution time
Before(async function() {
  this.test.startTime = Date.now();
});

After(async function({ pickle }) {
  if (this.test?.startTime) {
    const duration = Date.now() - this.test.startTime;
    if (duration > 1000) {
      console.log(`⏱️  ${pickle.name} took ${duration}ms`);
    }
  }
});

/**
 * Network Inspector hooks
 */

Before({ tags: '@network-inspector' }, async function() {
  this.networkInspector = {
    capturing: false,
    events: [],
  };
});

After({ tags: '@network-inspector' }, async function() {
  if (this.test?.debug && this.networkInspector) {
    console.log(`📡 Captured ${this.networkInspector.events.length} events`);
  }
});
