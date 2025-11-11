/**
 * Home Page - Landing page for the Streaming Patterns library
 *
 * Showcases available patterns and provides navigation to pattern demos.
 */

import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import styles from './Home.module.css';

/**
 * Home page component
 */
export function Home(): JSX.Element {
  const patterns = [
    {
      id: 'chain-of-reasoning',
      title: 'Chain-of-Reasoning Guide',
      description:
        'Expose intermediate reasoning tokens to build user trust and enable mid-stream intervention.',
      status: 'available',
      route: '/patterns/chain-of-reasoning',
      demoScenario: 'AI Sprint Planning Assistant',
      techniques: [
        'Reasoning beads timeline',
        'Progressive disclosure',
        'Promote to plan CTA'
      ]
    }
  ];

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Streaming Patterns</h1>
        <p className={styles.heroSubtitle}>
          Educational Pattern Library for Streaming AI/LLM UX
        </p>
        <p className={styles.heroDescription}>
          Learn how to build production-ready streaming interfaces for AI
          applications. Each pattern demonstrates a complete UX flow with mock
          streaming infrastructure, network inspection tools, and annotated
          source code.
        </p>
      </section>

      {/* Patterns Grid */}
      <section className={styles.patternsSection}>
        <h2 className={styles.sectionTitle}>Available Patterns</h2>

        <div className={styles.patternsGrid}>
          {patterns.map((pattern) => (
            <Link
              key={pattern.id}
              to={pattern.route}
              className={styles.patternLink}
            >
              <Card className={styles.patternCard}>
                <div className={styles.patternHeader}>
                  <h3 className={styles.patternTitle}>{pattern.title}</h3>
                  <span className={styles.patternStatus}>
                    {pattern.status === 'available' ? '✓ Available' : 'Coming Soon'}
                  </span>
                </div>

                <p className={styles.patternDescription}>
                  {pattern.description}
                </p>

                <div className={styles.patternMeta}>
                  <div className={styles.patternScenario}>
                    <strong>Demo:</strong> {pattern.demoScenario}
                  </div>

                  <div className={styles.patternTechniques}>
                    <strong>Techniques:</strong>
                    <ul className={styles.techniquesList}>
                      {pattern.techniques.map((technique) => (
                        <li key={technique}>{technique}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className={styles.patternCta}>
                  View Pattern Demo →
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className={styles.aboutSection}>
        <h2 className={styles.sectionTitle}>About This Library</h2>

        <div className={styles.aboutGrid}>
          <Card>
            <h3 className={styles.featureTitle}>Educational Focus</h3>
            <p className={styles.featureDescription}>
              Each pattern includes annotated source code, network inspection
              tools, and detailed explanations to help you understand the
              implementation.
            </p>
          </Card>

          <Card>
            <h3 className={styles.featureTitle}>Mock Streaming</h3>
            <p className={styles.featureDescription}>
              Deterministic, replayable demos using mock stream generators. No
              API keys required - focus on learning the patterns.
            </p>
          </Card>

          <Card>
            <h3 className={styles.featureTitle}>Production Ready</h3>
            <p className={styles.featureDescription}>
              Built with React, TypeScript, and modern best practices. Copy and
              adapt these patterns for your own applications.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
