/**
 * Cucumber World
 *
 * The World is a shared context that persists across all steps in a scenario.
 * It provides a place to store state between Given/When/Then steps.
 *
 * TypeScript types ensure step definitions have proper type safety.
 */

import { World, IWorldOptions } from '@cucumber/cucumber';
import type { RenderResult } from '@testing-library/react';

/**
 * Pattern Exhibition Context state
 */
export interface PatternDemo {
  id: string;
  patternId: string;
  state: 'idle' | 'streaming' | 'paused' | 'completed' | 'error';
  sessionId: string | null;
  fixtureId: string | null;
}

export interface PatternRegistry {
  [key: string]: {
    id: string;
    name: string;
    component: React.ComponentType<any>;
  };
}

/**
 * Streaming Infrastructure Context state
 */
export interface StreamSession {
  id: string;
  state: 'active' | 'paused' | 'closed';
  cursor: number;
  events: StreamEvent[];
}

export interface StreamEvent {
  type: string;
  data: any;
  timestamp?: number;
  sessionId?: string;
}

export interface FixtureRepository {
  [key: string]: {
    id: string;
    name: string;
    events: StreamEvent[];
  };
}

/**
 * Developer Tools Context state
 */
export interface NetworkInspector {
  capturing: boolean;
  events: CapturedEvent[];
}

export interface CapturedEvent extends StreamEvent {
  captureTime: number;
  sequenceNumber: number;
}

/**
 * StreamFlow PM Business Context state
 */
export interface StreamFlowProject {
  id: string;
  name: string;
  description: string;
  budget: number;
  deadline: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: string;
  estimatedHours: number;
}

/**
 * Pattern-specific state
 */
export interface ReasoningBead {
  id: string;
  summary: string;
  confidence: number;
  details?: string;
  timestamp: number;
}

export interface MemoryCard {
  id: string;
  type: 'fact' | 'decision' | 'task' | 'risk';
  summary: string;
  timestamp: number;
  pinned: boolean;
  ttl?: number;
}

export interface ValidationCheckpoint {
  id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  timeout?: number;
}

/**
 * Test utilities
 */
export interface TestContext {
  component?: RenderResult;
  error?: Error;
  user?: ReturnType<typeof import('@testing-library/user-event').setup>;
}

/**
 * Main World interface
 *
 * This interface defines all state available across step definitions.
 * Organized by bounded context for clarity.
 */
export interface IWorld {
  // Pattern Exhibition Context
  patternDemo: PatternDemo | null;
  patternRegistry: PatternRegistry;
  demoState: string;
  demoComponent: any;

  // Streaming Infrastructure Context
  streamSession: StreamSession | null;
  fixtureRepository: FixtureRepository;
  selectedFixture: any;
  delayProfile: string;
  delayMs: number;
  emittedEvents: StreamEvent[];
  preservedCursor: number;

  // Developer Tools Context
  networkInspector: NetworkInspector | null;
  annotatedSource: any;

  // StreamFlow PM Context
  project: StreamFlowProject | null;
  sprint: Sprint | null;
  tasks: Task[];

  // Pattern-specific state
  reasoningBeads: ReasoningBead[];
  memoryCards: MemoryCard[];
  checkpoints: ValidationCheckpoint[];

  // Operation results
  operationResult: string;
  operationError: Error | null;

  // Metadata
  completionMetadata: any;
  errorDetails: any;
  streamError: Error | null;

  // Test context
  test: TestContext;

  // Session tracking
  lastSessionId: string | null;
}

/**
 * Custom World class
 *
 * Extends Cucumber's World with our IWorld interface.
 */
export class CustomWorld extends World implements IWorld {
  // Pattern Exhibition Context
  patternDemo: PatternDemo | null = null;
  patternRegistry: PatternRegistry = {};
  demoState: string = 'idle';
  demoComponent: any = null;

  // Streaming Infrastructure Context
  streamSession: StreamSession | null = null;
  fixtureRepository: FixtureRepository = {};
  selectedFixture: any = null;
  delayProfile: string = 'normal';
  delayMs: number = 300;
  emittedEvents: StreamEvent[] = [];
  preservedCursor: number = 0;

  // Developer Tools Context
  networkInspector: NetworkInspector | null = null;
  annotatedSource: any = null;

  // StreamFlow PM Context
  project: StreamFlowProject | null = null;
  sprint: Sprint | null = null;
  tasks: Task[] = [];

  // Pattern-specific state
  reasoningBeads: ReasoningBead[] = [];
  memoryCards: MemoryCard[] = [];
  checkpoints: ValidationCheckpoint[] = [];

  // Operation results
  operationResult: string = '';
  operationError: Error | null = null;

  // Metadata
  completionMetadata: any = null;
  errorDetails: any = null;
  streamError: Error | null = null;

  // Test context
  test: TestContext = {};

  // Session tracking
  lastSessionId: string | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * Reset world state between scenarios
   */
  reset(): void {
    this.patternDemo = null;
    this.patternRegistry = {};
    this.demoState = 'idle';
    this.demoComponent = null;

    this.streamSession = null;
    this.fixtureRepository = {};
    this.selectedFixture = null;
    this.delayProfile = 'normal';
    this.delayMs = 300;
    this.emittedEvents = [];
    this.preservedCursor = 0;

    this.networkInspector = null;
    this.annotatedSource = null;

    this.project = null;
    this.sprint = null;
    this.tasks = [];

    this.reasoningBeads = [];
    this.memoryCards = [];
    this.checkpoints = [];

    this.operationResult = '';
    this.operationError = null;

    this.completionMetadata = null;
    this.errorDetails = null;
    this.streamError = null;

    this.test = {};
    this.lastSessionId = null;
  }
}

/**
 * Helper functions for world state
 */

export function createMockPatternDemo(overrides?: Partial<PatternDemo>): PatternDemo {
  return {
    id: `demo-${Date.now()}`,
    patternId: 'chain-of-reasoning',
    state: 'idle',
    sessionId: null,
    fixtureId: null,
    ...overrides,
  };
}

export function createMockStreamSession(overrides?: Partial<StreamSession>): StreamSession {
  return {
    id: `session-${Date.now()}`,
    state: 'active',
    cursor: 0,
    events: [],
    ...overrides,
  };
}

export function createMockStreamEvent(type: string, data: any): StreamEvent {
  return {
    type,
    data,
    timestamp: Date.now(),
  };
}

export function createMockReasoningBead(overrides?: Partial<ReasoningBead>): ReasoningBead {
  return {
    id: `bead-${Date.now()}`,
    summary: 'Analyzing data',
    confidence: 0.85,
    timestamp: Date.now(),
    ...overrides,
  };
}

export function createMockMemoryCard(overrides?: Partial<MemoryCard>): MemoryCard {
  return {
    id: `mem-${Date.now()}`,
    type: 'fact',
    summary: 'Important fact',
    timestamp: Date.now(),
    pinned: false,
    ...overrides,
  };
}

export function createMockProject(overrides?: Partial<StreamFlowProject>): StreamFlowProject {
  return {
    id: `proj-${Date.now()}`,
    name: 'Dashboard Redesign',
    description: 'Modernize the analytics dashboard',
    budget: 500000,
    deadline: '2024-12-31',
    ...overrides,
  };
}
