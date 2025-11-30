/**
 * ScenarioCard Component - StreamFlow PM Design System
 *
 * A specialized card component that displays business context and scenario descriptions
 * for pattern demos. Helps users understand the real-world use case being demonstrated.
 *
 * @example
 * ```tsx
 * <ScenarioCard
 *   description="StreamFlow PM's AI assistant helps plan a 2-week sprint, showing its reasoning process before presenting the final plan."
 *   prompt="Plan a 2-week sprint for the StreamFlow PM dashboard project"
 * />
 * ```
 */

import { Card } from './Card';
import styles from './ScenarioCard.module.css';

export interface ScenarioCardProps {
  /**
   * Card title displayed in the header
   * @default "Scenario"
   */
  title?: string;

  /**
   * Business context description - explains the StreamFlow PM use case
   * This should be a clear, concise description of what the demo shows
   */
  description: string;

  /**
   * Optional user prompt shown below the description
   * Represents the actual prompt being sent to the AI
   */
  prompt?: string;

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * ScenarioCard component for displaying business context in pattern demos
 *
 * This component provides consistent scenario context across all patterns,
 * helping users understand how each pattern applies to real-world use cases
 * in the StreamFlow PM product.
 */
export function ScenarioCard({
  title = 'Scenario',
  description,
  prompt,
  className = '',
}: ScenarioCardProps): JSX.Element {
  return (
    <Card
      className={`${styles.scenarioCard} ${className}`}
      variant="outlined"
      padding="md"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.content}>
        <p className={styles.description}>{description}</p>
        {prompt && (
          <div className={styles.promptSection}>
            <span className={styles.promptLabel}>Prompt</span>
            <code className={styles.promptText}>{prompt}</code>
          </div>
        )}
      </div>
    </Card>
  );
}
