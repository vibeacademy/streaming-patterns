/**
 * Patterns Page - List of all available streaming patterns
 *
 * Provides a directory view of all patterns with filtering and search.
 */

import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import styles from './Patterns.module.css';

interface Pattern {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  route: string;
  phase: string;
  demoScenario: string;
  techniques: string[];
  difficulty: 'foundational' | 'advanced';
  concepts: string[];
}

const patterns: Pattern[] = [
  {
    id: 'chain-of-reasoning',
    title: 'Chain-of-Reasoning Guide',
    description:
      'Expose intermediate reasoning tokens to build user trust and enable mid-stream intervention.',
    status: 'available',
    route: '/patterns/chain-of-reasoning',
    phase: 'Phase 2 - Foundational Patterns',
    demoScenario: 'AI Sprint Planning Assistant',
    difficulty: 'foundational',
    concepts: ['streaming reasoning', 'transparency', 'trust building'],
    techniques: [
      'Reasoning beads timeline',
      'Progressive disclosure',
      'Promote to plan CTA'
    ]
  },
  {
    id: 'agent-await-prompt',
    title: 'Agent-Await-Prompt',
    description:
      'Pause agent execution to request clarification or additional input from the user mid-workflow.',
    status: 'available',
    route: '/patterns/agent-await-prompt',
    phase: 'Phase 2 - Foundational Patterns',
    demoScenario: 'Dependency Resolution',
    difficulty: 'foundational',
    concepts: ['pause/resume', 'interactive streaming', 'user input collection'],
    techniques: [
      'Pause indicators',
      'Inline input forms',
      'Resume streaming'
    ]
  },
  {
    id: 'tabular-stream-view',
    title: 'Tabular Stream View',
    description:
      'Display streaming data in structured tables with progressive loading of rows and columns.',
    status: 'coming-soon',
    route: '/patterns/tabular-stream-view',
    phase: 'Phase 2 - Foundational Patterns',
    demoScenario: 'Sprint Backlog Generation',
    difficulty: 'foundational',
    concepts: ['structured data streaming', 'progressive rendering', 'tabular UX'],
    techniques: [
      'Progressive table rendering',
      'Skeleton loaders',
      'Export functionality'
    ]
  },
  {
    id: 'multi-turn-memory-timeline',
    title: 'Multi-Turn Memory Timeline',
    description:
      'Visualize conversation history with explicit memory formation and recall events.',
    status: 'coming-soon',
    route: '/patterns/multi-turn-memory-timeline',
    phase: 'Phase 3 - Advanced Patterns',
    demoScenario: 'Multi-Sprint Planning',
    difficulty: 'advanced',
    concepts: ['memory management', 'conversation context', 'state persistence'],
    techniques: [
      'Memory timeline',
      'Recall indicators',
      'Context management'
    ]
  },
  {
    id: 'turn-taking-co-creation',
    title: 'Turn-Taking Co-Creation',
    description:
      'Alternate between user and AI contributions to collaboratively build content.',
    status: 'coming-soon',
    route: '/patterns/turn-taking-co-creation',
    phase: 'Phase 3 - Advanced Patterns',
    demoScenario: 'Story Map Building',
    difficulty: 'advanced',
    concepts: ['collaborative editing', 'turn-based interaction', 'draft approval'],
    techniques: [
      'Turn indicators',
      'Draft approval',
      'Versioning'
    ]
  },
  {
    id: 'streaming-validation-loop',
    title: 'Streaming Validation Loop',
    description:
      'Validate streaming output against schema constraints and surface errors progressively.',
    status: 'coming-soon',
    route: '/patterns/streaming-validation-loop',
    phase: 'Phase 3 - Advanced Patterns',
    demoScenario: 'Task Schema Validation',
    difficulty: 'advanced',
    concepts: ['schema validation', 'error handling', 'progressive feedback'],
    techniques: [
      'Live validation',
      'Error annotations',
      'Auto-correction'
    ]
  },
  {
    id: 'schema-governed-exchange',
    title: 'Schema-Governed Exchange',
    description:
      'Ensure structured data exchange between user and AI using predefined schemas.',
    status: 'coming-soon',
    route: '/patterns/schema-governed-exchange',
    phase: 'Phase 3 - Advanced Patterns',
    demoScenario: 'Structured Task Creation',
    difficulty: 'advanced',
    concepts: ['type safety', 'schema enforcement', 'structured communication'],
    techniques: [
      'Schema enforcement',
      'Type validation',
      'Format guidance'
    ]
  }
];

/**
 * Pattern Card Component
 * Displays a single pattern with all metadata
 */
interface PatternCardProps {
  pattern: Pattern;
}

function PatternCard({ pattern }: PatternCardProps): JSX.Element {
  const isAvailable = pattern.status === 'available';
  const cardContent = (
    <Card className={isAvailable ? styles.patternCard : styles.comingSoonCard}>
      <div className={styles.patternHeader}>
        <h3 className={styles.patternTitle}>{pattern.title}</h3>
        <span
          className={
            isAvailable ? styles.statusBadge : styles.comingSoonBadge
          }
          aria-label={isAvailable ? 'Available now' : 'Coming soon'}
        >
          {isAvailable ? '✓ Available' : 'Coming Soon'}
        </span>
      </div>

      <p className={styles.patternDescription}>{pattern.description}</p>

      <div className={styles.patternMeta}>
        <div className={styles.metaItem}>
          <strong>Demo:</strong> {pattern.demoScenario}
        </div>
        <div className={styles.metaItem}>
          <strong>Difficulty:</strong>{' '}
          <span className={styles.difficultyBadge}>
            {pattern.difficulty === 'foundational' ? 'Foundational' : 'Advanced'}
          </span>
        </div>
        <div className={styles.metaItem}>
          <strong>Key Concepts:</strong>{' '}
          <span className={styles.conceptsList}>
            {pattern.concepts.join(', ')}
          </span>
        </div>
      </div>

      {isAvailable && (
        <div className={styles.patternCta} aria-hidden="true">
          View Demo →
        </div>
      )}
    </Card>
  );

  if (isAvailable) {
    return (
      <Link
        to={pattern.route}
        className={styles.patternLink}
        aria-label={`View ${pattern.title} demo`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={styles.patternCard} aria-disabled="true">
      {cardContent}
    </div>
  );
}

/**
 * Patterns page component
 * Displays catalog of all streaming patterns grouped by difficulty level
 */
export function Patterns(): JSX.Element {
  const foundationalPatterns = patterns.filter(
    (p) => p.difficulty === 'foundational'
  );
  const advancedPatterns = patterns.filter((p) => p.difficulty === 'advanced');
  const implementedCount = patterns.filter((p) => p.status === 'available').length;
  const totalCount = patterns.length;

  return (
    <main className={styles.patterns} role="main">
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Streaming Patterns Catalog</h1>
        <p className={styles.description}>
          Educational patterns for building modern streaming AI interfaces.
          Each pattern demonstrates key UX techniques for handling real-time
          LLM responses in the StreamFlow PM product.
        </p>
        <p className={styles.progressIndicator}>
          <strong>{implementedCount} of {totalCount} patterns implemented</strong>
        </p>
      </header>

      {/* Foundational Patterns Section */}
      <section
        className={styles.section}
        aria-labelledby="foundational-heading"
      >
        <h2 id="foundational-heading" className={styles.sectionTitle}>
          Foundational Patterns
        </h2>
        <p className={styles.sectionDescription}>
          Core patterns that establish the basics of streaming UX. Start here
          to learn essential techniques for progressive rendering, user
          interaction, and transparency.
        </p>

        <div className={styles.patternGrid} role="list">
          {foundationalPatterns.map((pattern) => (
            <div key={pattern.id} role="listitem">
              <PatternCard pattern={pattern} />
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Patterns Section */}
      <section className={styles.section} aria-labelledby="advanced-heading">
        <h2 id="advanced-heading" className={styles.sectionTitle}>
          Advanced Patterns
        </h2>
        <p className={styles.sectionDescription}>
          Complex patterns for stateful interactions, validation, and
          collaborative workflows. Build on foundational knowledge to handle
          sophisticated use cases.
        </p>

        <div className={styles.patternGrid} role="list">
          {advancedPatterns.map((pattern) => (
            <div key={pattern.id} role="listitem">
              <PatternCard pattern={pattern} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
