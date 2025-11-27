/**
 * Authorship Legend Component
 *
 * Visual legend showing color-coding for user vs agent contributions.
 * Helps users understand the authorship highlighting in the collaborative editor.
 *
 * Educational Note:
 * Clear visual legends are essential for collaborative editing UX. Users need
 * to quickly identify who wrote what without ambiguity.
 *
 * @module patterns/turn-taking-co-creation/AuthorshipLegend
 */

import type { Author } from './types';
import { Card } from '@/components/ui/Card';
import styles from './AuthorshipLegend.module.css';

/**
 * Props for AuthorshipLegend component
 */
export interface AuthorshipLegendProps {
  /** Statistics about authorship distribution */
  stats?: {
    agentCharCount: number;
    userCharCount: number;
    totalCharCount: number;
  };

  /** Optional CSS class name */
  className?: string;

  /** Whether to show statistics */
  showStats?: boolean;
}

/**
 * Props for legend item
 */
interface LegendItemProps {
  author: Author;
  label: string;
  description: string;
  charCount?: number;
  percentage?: number;
}

/**
 * Legend Item - Renders a single author color indicator with description.
 */
function LegendItem({
  author,
  label,
  description,
  charCount,
  percentage,
}: LegendItemProps): JSX.Element {
  return (
    <div className={styles.legendItem}>
      <div className={styles.legendColor}>
        <span
          className={`${styles.colorBox} ${
            author === 'agent' ? styles.agentColor : styles.userColor
          }`}
          aria-hidden="true"
        ></span>
      </div>
      <div className={styles.legendContent}>
        <div className={styles.legendLabel}>{label}</div>
        <div className={styles.legendDescription}>{description}</div>
        {charCount !== undefined && percentage !== undefined && (
          <div className={styles.legendStats}>
            {charCount.toLocaleString()} characters ({percentage.toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * AuthorshipLegend - Visual guide for collaborative editing colors
 *
 * This component provides a clear visual reference for understanding the
 * color-coding used to indicate authorship in the collaborative document.
 *
 * Features:
 * - Color swatches matching the editor highlighting
 * - Descriptive labels for each author type
 * - Optional statistics showing contribution percentages
 * - Accessible markup for screen readers
 *
 * @example
 * ```tsx
 * <AuthorshipLegend
 *   showStats
 *   stats={{
 *     agentCharCount: 1250,
 *     userCharCount: 380,
 *     totalCharCount: 1630
 *   }}
 * />
 * ```
 */
export function AuthorshipLegend({
  stats,
  className,
  showStats = false,
}: AuthorshipLegendProps): JSX.Element {
  // Calculate percentages if stats provided
  const agentPercentage = stats
    ? (stats.agentCharCount / stats.totalCharCount) * 100
    : 0;
  const userPercentage = stats
    ? (stats.userCharCount / stats.totalCharCount) * 100
    : 0;

  return (
    <Card className={`${styles.legend} ${className || ''}`}>
      <div className={styles.legendHeader}>
        <h3 className={styles.legendTitle}>Authorship Guide</h3>
      </div>

      <div className={styles.legendBody} role="list" aria-label="Authorship legend">
        <LegendItem
          author="agent"
          label="AI Agent"
          description="Content drafted by the AI assistant"
          charCount={showStats && stats ? stats.agentCharCount : undefined}
          percentage={showStats && stats ? agentPercentage : undefined}
        />
        <LegendItem
          author="user"
          label="You (User)"
          description="Content you've written or edited"
          charCount={showStats && stats ? stats.userCharCount : undefined}
          percentage={showStats && stats ? userPercentage : undefined}
        />
      </div>

      {showStats && stats && stats.totalCharCount > 0 && (
        <div className={styles.legendFooter}>
          <div className={styles.progressBar}>
            <div
              className={styles.agentProgress}
              style={{ width: `${agentPercentage}%` }}
              aria-label={`Agent contribution: ${agentPercentage.toFixed(1)}%`}
            ></div>
            <div
              className={styles.userProgress}
              style={{ width: `${userPercentage}%` }}
              aria-label={`User contribution: ${userPercentage.toFixed(1)}%`}
            ></div>
          </div>
          <div className={styles.totalStats}>
            Total: {stats.totalCharCount.toLocaleString()} characters
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className={styles.educationalNote}>
        <p className={styles.noteText}>
          <strong>Note:</strong> Colors help you see who contributed each part of the
          document. This transparency builds trust and makes collaboration clearer.
        </p>
      </div>
    </Card>
  );
}
