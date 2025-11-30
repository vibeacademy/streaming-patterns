/**
 * ValidationBadge Component
 *
 * Displays real-time validation status with color-coded indicators.
 * Shows valid (green), partial (amber), invalid (red), or pending (gray).
 */

import { useValidationStatus } from './hooks';
import type { ValidationResult } from './types';
import styles from './ValidationBadge.module.css';

export interface ValidationBadgeProps {
  validationResult: ValidationResult;
  showDescription?: boolean;
}

export function ValidationBadge({
  validationResult,
  showDescription = true,
}: ValidationBadgeProps) {
  const { label, color, description } = useValidationStatus(validationResult);

  return (
    <div
      className={`${styles.badge} ${styles[`badge--${color}`]}`}
      role="status"
      aria-label={`Validation status: ${label}`}
      title={description}
    >
      <span className={styles.label}>{label}</span>
      {showDescription && (
        <span className={styles.description}>{description}</span>
      )}
    </div>
  );
}
