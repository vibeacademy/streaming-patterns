/**
 * Inline input fields component for the Agent-Await-Prompt pattern.
 *
 * This component renders input fields inline within the streaming message,
 * allowing users to provide missing information without leaving the conversation context.
 *
 * Key Features:
 * - Dynamic field types (text, number, date, email, url)
 * - Required field validation
 * - Help text and placeholders
 * - Timeout countdown display
 * - Listening animation while paused
 *
 * @module patterns/agent-await-prompt/InlineInputFields
 */

import { useState, useCallback, FormEvent } from 'react';
import type { InputField } from './types';
import styles from './InlineInputFields.module.css';

interface InlineInputFieldsProps {
  /**
   * The input fields to render.
   */
  fields: InputField[];

  /**
   * Message explaining why input is needed.
   */
  message?: string | null;

  /**
   * Callback invoked when user submits valid input.
   */
  onSubmit: (data: Record<string, string | number | Date>) => void;

  /**
   * Remaining time before timeout (in milliseconds).
   * Used to display countdown to user.
   */
  timeoutRemaining?: number;

  /**
   * Optional class name for styling.
   */
  className?: string;
}

/**
 * Validates a single field value.
 *
 * @param value - The value to validate
 * @param field - The field definition
 * @returns Error message if invalid, undefined if valid
 */
function validateField(
  value: string | number | Date | undefined,
  field: InputField
): string | undefined {
  // Required field validation
  if (field.required) {
    if (value === undefined || value === '' || value === null) {
      return `${field.label} is required`;
    }
  }

  // Type-specific validation
  if (value !== undefined && value !== '' && value !== null) {
    switch (field.type) {
      case 'number': {
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(numValue)) {
          return `${field.label} must be a valid number`;
        }
        break;
      }

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return `${field.label} must be a valid email address`;
        }
        break;
      }

      case 'url': {
        try {
          // eslint-disable-next-line no-undef
          new URL(String(value));
        } catch {
          return `${field.label} must be a valid URL`;
        }
        break;
      }

      case 'date': {
        if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            return `${field.label} must be a valid date`;
          }
        } else {
          const dateValue = new Date(String(value));
          if (isNaN(dateValue.getTime())) {
            return `${field.label} must be a valid date`;
          }
        }
        break;
      }
    }
  }

  return undefined;
}

/**
 * Format timeout remaining for display.
 *
 * @param ms - Milliseconds remaining
 * @returns Formatted string (e.g., "1:30" for 90 seconds)
 */
function formatTimeout(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${seconds}s`;
}

/**
 * Inline input fields component.
 *
 * Renders a form with dynamic input fields embedded in the stream.
 * Users can fill out required and optional fields, then submit to
 * resume the stream.
 *
 * Educational Note:
 * This component demonstrates inline UI patterns for streaming:
 * - Fields appear embedded in the conversation flow
 * - Visual feedback for required vs. optional fields
 * - Timeout countdown creates urgency
 * - Listening animation shows the AI is paused and waiting
 */
export function InlineInputFields({
  fields,
  message,
  onSubmit,
  timeoutRemaining,
  className,
}: InlineInputFieldsProps): JSX.Element {
  // State: Field values (keyed by field name)
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    // Initialize with default values from field definitions
    const initial: Record<string, string | number> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else {
        initial[field.name] = '';
      }
    });
    return initial;
  });

  // State: Validation errors (keyed by field name)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State: Whether form has been submitted (for showing validation errors)
  const [attempted, setAttempted] = useState(false);

  /**
   * Handle input value change.
   */
  const handleChange = useCallback(
    (fieldName: string, value: string | number) => {
      setValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      // Clear error for this field when user types
      if (errors[fieldName]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    },
    [errors]
  );

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setAttempted(true);

      // Validate all fields
      const newErrors: Record<string, string> = {};
      const submissionData: Record<string, string | number | Date> = {};

      fields.forEach((field) => {
        const value = values[field.name];
        const error = validateField(value, field);

        if (error) {
          newErrors[field.name] = error;
        } else {
          // Convert value to appropriate type for submission
          if (field.type === 'date' && value) {
            submissionData[field.name] = new Date(value);
          } else if (field.type === 'number' && value !== '') {
            submissionData[field.name] = typeof value === 'number'
              ? value
              : parseFloat(String(value));
          } else if (value !== '') {
            submissionData[field.name] = value;
          }
        }
      });

      // If there are errors, update state and don't submit
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Clear errors and submit
      setErrors({});
      onSubmit(submissionData);
    },
    [fields, values, onSubmit]
  );

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Listening animation indicator */}
      <div className={styles.listeningIndicator}>
        <div className={styles.listeningDot} />
        <div className={styles.listeningDot} />
        <div className={styles.listeningDot} />
        <span className={styles.listeningText}>Listening for your response...</span>
      </div>

      {/* Message explaining why input is needed */}
      {message && <p className={styles.message}>{message}</p>}

      {/* Timeout countdown */}
      {timeoutRemaining !== undefined && timeoutRemaining > 0 && (
        <div className={styles.timeout}>
          <svg className={styles.timeoutIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Respond within {formatTimeout(timeoutRemaining)}</span>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {fields.map((field) => (
          <div key={field.name} className={styles.field}>
            <label htmlFor={field.name} className={styles.label}>
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
              {!field.required && <span className={styles.optional}>(optional)</span>}
            </label>

            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={values[field.name] ?? ''}
              onChange={(e) => {
                const value =
                  field.type === 'number'
                    ? e.target.value === ''
                      ? ''
                      : parseFloat(e.target.value)
                    : e.target.value;
                handleChange(field.name, value);
              }}
              placeholder={field.placeholder}
              className={`${styles.input} ${
                attempted && errors[field.name] ? styles.inputError : ''
              }`}
              aria-describedby={
                field.helpText ? `${field.name}-help` : undefined
              }
              aria-invalid={attempted && errors[field.name] ? true : undefined}
              aria-required={field.required}
            />

            {/* Help text */}
            {field.helpText && (
              <p id={`${field.name}-help`} className={styles.helpText}>
                {field.helpText}
              </p>
            )}

            {/* Validation error */}
            {attempted && errors[field.name] && (
              <p className={styles.error} role="alert">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}

        {/* Submit button */}
        <button type="submit" className={styles.submitButton}>
          Continue
        </button>
      </form>
    </div>
  );
}
