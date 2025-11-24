/**
 * ReasoningBeadline Component - Chain-of-Reasoning Pattern
 *
 * A vertical timeline component that displays AI reasoning steps as interactive "beads".
 * Each bead shows:
 * - Numbered position in the reasoning chain
 * - Summary of the reasoning step
 * - Confidence indicator (color-coded)
 * - Expandable details section
 * - "Promote to Plan" action button
 *
 * Accessibility Features:
 * - Full keyboard navigation
 * - ARIA labels and roles for screen readers
 * - Native <details> element for expandable content
 * - High contrast confidence indicators
 * - Semantic HTML structure
 *
 * @example
 * ```tsx
 * <ReasoningBeadline
 *   reasoning={reasoningSteps}
 *   onPromote={(step) => console.log('Promoted:', step.id)}
 * />
 * ```
 */

import { Button } from '@/components/ui/Button';
import type { ReasoningStep } from './types';
import styles from './ReasoningBeadline.module.css';

export interface ReasoningBeadlineProps {
  /**
   * Array of reasoning steps to display in the timeline.
   * Steps are rendered in array order (typically chronological).
   */
  reasoning: ReasoningStep[];

  /**
   * Optional callback invoked when user clicks "Promote to Plan" for a step.
   * Use this to allow users to extract specific reasoning into their final plan.
   */
  onPromote?: (step: ReasoningStep) => void;

  /**
   * Optional className for additional styling or layout customization.
   */
  className?: string;
}

/**
 * Get CSS class name for confidence indicator based on confidence level.
 *
 * Confidence levels:
 * - High (0.9-1.0): Green indicator
 * - Medium (0.7-0.89): Yellow indicator
 * - Low (0-0.69): Red indicator
 */
function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.9) {
    return styles.confidenceHigh;
  } else if (confidence >= 0.7) {
    return styles.confidenceMedium;
  } else {
    return styles.confidenceLow;
  }
}

/**
 * Get human-readable confidence label for screen readers and tooltips.
 */
function getConfidenceLabel(confidence: number): string {
  const percentage = Math.round(confidence * 100);
  if (confidence >= 0.9) {
    return `High confidence (${percentage}%)`;
  } else if (confidence >= 0.7) {
    return `Medium confidence (${percentage}%)`;
  } else {
    return `Low confidence (${percentage}%)`;
  }
}

/**
 * ReasoningBeadline component displays a vertical timeline of reasoning steps.
 */
export function ReasoningBeadline({
  reasoning,
  onPromote,
  className = '',
}: ReasoningBeadlineProps): JSX.Element {
  // Handle empty state
  if (reasoning.length === 0) {
    return (
      <div className={`${styles.beadline} ${className}`}>
        <p className={styles.emptyState}>
          No reasoning steps yet. Waiting for AI to think...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.beadline} ${className}`}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-label="AI reasoning steps"
    >
      {reasoning.map((step, index) => {
        const isFirstStep = index === 0;
        const isLastStep = index === reasoning.length - 1;

        return (
          <article
            key={step.id}
            className={styles.bead}
            role="listitem"
            // Animation delay based on index for staggered entrance
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Timeline connector line (hidden for first step) */}
            {!isFirstStep && (
              <div className={styles.connector} aria-hidden="true" />
            )}

            {/* Bead number and confidence indicator */}
            <div className={styles.beadHeader}>
              <div
                className={`${styles.beadNumber} ${getConfidenceClass(step.confidence)}`}
                aria-label={`Step ${index + 1}, ${getConfidenceLabel(step.confidence)}`}
                title={getConfidenceLabel(step.confidence)}
              >
                {index + 1}
              </div>
            </div>

            {/* Bead content */}
            <div className={styles.beadContent}>
              {/* Summary - always visible */}
              <h3 className={styles.summary}>{step.summary}</h3>

              {/* Confidence indicator - visible text for accessibility */}
              <div className={styles.confidenceBadge}>
                <span
                  className={`${styles.confidenceDot} ${getConfidenceClass(step.confidence)}`}
                  aria-hidden="true"
                />
                <span className={styles.confidenceText}>
                  {getConfidenceLabel(step.confidence)}
                </span>
              </div>

              {/* Expandable details section (if details are provided) */}
              {step.details && (
                <details className={styles.details}>
                  <summary className={styles.detailsSummary}>
                    View detailed reasoning
                  </summary>
                  <div className={styles.detailsContent}>
                    <p>{step.details}</p>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className={styles.actions}>
                {onPromote && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onPromote(step)}
                    aria-label={`Promote step ${index + 1} to plan: ${step.summary}`}
                  >
                    Promote to Plan
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline connector continues to next step (hidden for last step) */}
            {!isLastStep && (
              <div className={styles.connectorNext} aria-hidden="true" />
            )}
          </article>
        );
      })}
    </div>
  );
}
