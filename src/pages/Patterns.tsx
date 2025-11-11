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
    status: 'coming-soon',
    route: '/patterns/agent-await-prompt',
    phase: 'Phase 2 - Foundational Patterns',
    demoScenario: 'Dependency Resolution',
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
    techniques: [
      'Schema enforcement',
      'Type validation',
      'Format guidance'
    ]
  }
];

/**
 * Patterns page component
 */
export function Patterns(): JSX.Element {
  const availablePatterns = patterns.filter((p) => p.status === 'available');
  const comingSoonPatterns = patterns.filter((p) => p.status === 'coming-soon');

  return (
    <div className={styles.patterns}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Streaming Patterns</h1>
        <p className={styles.description}>
          A comprehensive catalog of UX patterns for streaming AI interfaces.
          Each pattern includes a working demo, annotated source code, and
          network inspection tools.
        </p>
      </header>

      {/* Available Patterns */}
      {availablePatterns.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Available Patterns ({availablePatterns.length})
          </h2>

          <div className={styles.patternGrid}>
            {availablePatterns.map((pattern) => (
              <Link
                key={pattern.id}
                to={pattern.route}
                className={styles.patternLink}
              >
                <Card className={styles.patternCard}>
                  <div className={styles.patternHeader}>
                    <h3 className={styles.patternTitle}>{pattern.title}</h3>
                    <span className={styles.statusBadge}>✓ Available</span>
                  </div>

                  <p className={styles.patternDescription}>
                    {pattern.description}
                  </p>

                  <div className={styles.patternMeta}>
                    <div className={styles.metaItem}>
                      <strong>Demo:</strong> {pattern.demoScenario}
                    </div>
                    <div className={styles.metaItem}>
                      <strong>Phase:</strong> {pattern.phase}
                    </div>
                  </div>

                  <div className={styles.patternCta}>View Demo →</div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon Patterns */}
      {comingSoonPatterns.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Coming Soon ({comingSoonPatterns.length})
          </h2>

          <div className={styles.patternGrid}>
            {comingSoonPatterns.map((pattern) => (
              <div key={pattern.id} className={styles.patternCard}>
                <Card className={styles.comingSoonCard}>
                  <div className={styles.patternHeader}>
                    <h3 className={styles.patternTitle}>{pattern.title}</h3>
                    <span className={styles.comingSoonBadge}>Coming Soon</span>
                  </div>

                  <p className={styles.patternDescription}>
                    {pattern.description}
                  </p>

                  <div className={styles.patternMeta}>
                    <div className={styles.metaItem}>
                      <strong>Demo:</strong> {pattern.demoScenario}
                    </div>
                    <div className={styles.metaItem}>
                      <strong>Phase:</strong> {pattern.phase}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
