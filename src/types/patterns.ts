/**
 * Pattern Metadata Types
 *
 * This module defines TypeScript interfaces for pattern metadata, configuration,
 * and catalog information. These types support the pattern exhibition and
 * navigation features of the streaming-patterns library.
 *
 * @module types/patterns
 */

/**
 * Pattern identifiers - canonical names for each pattern
 */
export type PatternId =
  | 'chain-of-reasoning'
  | 'multi-turn-memory-timeline'
  | 'agent-await-prompt'
  | 'streaming-validation-loop'
  | 'tabular-stream-view'
  | 'turn-taking-co-creation'
  | 'schema-governed-exchange';

/**
 * Pattern complexity levels
 */
export type PatternComplexity = 'beginner' | 'intermediate' | 'advanced';

/**
 * Pattern categories for organization
 */
export type PatternCategory =
  | 'reasoning'
  | 'interaction'
  | 'validation'
  | 'data-streaming'
  | 'collaboration'
  | 'schema-validation';

/**
 * Pattern metadata - descriptive information about a pattern
 */
export interface PatternMetadata {
  /** Canonical pattern identifier */
  id: PatternId;

  /** Display name */
  name: string;

  /** Short description (1-2 sentences) */
  description: string;

  /** Pattern category */
  category: PatternCategory;

  /** Complexity level */
  complexity: PatternComplexity;

  /** Estimated time to understand (minutes) */
  estimatedMinutes: number;

  /** Tags for search and filtering */
  tags: string[];

  /** Related pattern IDs */
  relatedPatterns: PatternId[];

  /** URL to pattern specification */
  specUrl?: string;

  /** Whether pattern is production-ready */
  isStable: boolean;
}

/**
 * Demo scenario metadata - describes a specific demo implementation
 */
export interface DemoScenario {
  /** Scenario identifier */
  id: string;

  /** Display name */
  name: string;

  /** Description of what the demo shows */
  description: string;

  /** StreamFlow PM business context */
  businessContext: string;

  /** Fixture ID used for this demo */
  fixtureId: string;

  /** Estimated demo duration (seconds) */
  durationSeconds: number;

  /** Key learning points */
  learningPoints: string[];
}

/**
 * Pattern implementation status
 */
export interface PatternStatus {
  /** Pattern ID */
  patternId: PatternId;

  /** Whether pattern is implemented */
  isImplemented: boolean;

  /** Whether tests are complete */
  testsComplete: boolean;

  /** Whether documentation is complete */
  docsComplete: boolean;

  /** Test coverage percentage */
  testCoverage?: number;

  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Pattern catalog entry - complete information for pattern listing
 */
export interface PatternCatalogEntry {
  /** Pattern metadata */
  metadata: PatternMetadata;

  /** Implementation status */
  status: PatternStatus;

  /** Available demo scenarios */
  scenarios: DemoScenario[];

  /** URL to pattern demo page */
  demoUrl: string;

  /** URL to source code */
  sourceUrl: string;
}

/**
 * Pattern catalog - collection of all patterns
 */
export interface PatternCatalog {
  /** All pattern entries */
  patterns: PatternCatalogEntry[];

  /** Total pattern count */
  totalCount: number;

  /** Patterns by category */
  byCategory: Record<PatternCategory, PatternCatalogEntry[]>;

  /** Patterns by complexity */
  byComplexity: Record<PatternComplexity, PatternCatalogEntry[]>;
}

/**
 * Delay profile for stream timing
 */
export type DelayProfile = 'fast' | 'normal' | 'slow';

/**
 * Delay configuration (milliseconds)
 */
export interface DelayConfig {
  /** Delay between events (ms) */
  betweenEvents: number;

  /** Delay between chunks (ms) */
  betweenChunks: number;

  /** Initial delay before first event (ms) */
  initialDelay: number;
}

/**
 * Delay profiles mapped to configurations
 */
export const DELAY_PROFILES: Record<DelayProfile, DelayConfig> = {
  fast: {
    betweenEvents: 50,
    betweenChunks: 20,
    initialDelay: 100,
  },
  normal: {
    betweenEvents: 300,
    betweenChunks: 100,
    initialDelay: 500,
  },
  slow: {
    betweenEvents: 1000,
    betweenChunks: 400,
    initialDelay: 1000,
  },
};

/**
 * Stream session configuration
 */
export interface StreamConfig {
  /** Fixture ID to load */
  fixtureId: string;

  /** Delay profile to use */
  delayProfile: DelayProfile;

  /** Whether to auto-start stream */
  autoStart: boolean;

  /** Whether to loop stream */
  loop: boolean;

  /** Custom delay override */
  customDelay?: Partial<DelayConfig>;
}

/**
 * Pattern demo configuration
 */
export interface PatternDemoConfig {
  /** Pattern being demonstrated */
  patternId: PatternId;

  /** Selected scenario */
  scenarioId: string;

  /** Stream configuration */
  streamConfig: StreamConfig;

  /** Whether to show network inspector */
  showNetworkInspector: boolean;

  /** Whether to show annotated source */
  showAnnotatedSource: boolean;

  /** Whether to enable controls */
  enableControls: boolean;
}

/**
 * Pattern demo state
 */
export interface PatternDemoState {
  /** Current configuration */
  config: PatternDemoConfig;

  /** Whether stream is active */
  isStreaming: boolean;

  /** Whether stream is paused */
  isPaused: boolean;

  /** Current error, if any */
  error?: Error;

  /** Events captured so far */
  eventCount: number;

  /** Stream start time */
  startTime?: number;

  /** Stream end time */
  endTime?: number;
}

/**
 * Annotated source section
 */
export interface AnnotatedSection {
  /** Section identifier */
  id: string;

  /** Display title */
  title: string;

  /** File path relative to src/ */
  filePath: string;

  /** Starting line number */
  startLine: number;

  /** Ending line number */
  endLine: number;

  /** Lines to highlight */
  highlightLines?: number[];

  /** Explanation in markdown */
  explanation: string;
}

/**
 * Pattern source annotations
 */
export interface PatternSourceAnnotations {
  /** Pattern ID */
  patternId: PatternId;

  /** Annotated sections */
  sections: AnnotatedSection[];

  /** Overall learning objectives */
  learningObjectives: string[];
}
