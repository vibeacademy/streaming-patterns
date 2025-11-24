/**
 * Input Component - StreamFlow PM Design System
 *
 * A text input component with label, error states, and accessibility support.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Sprint Name"
 *   placeholder="Enter sprint name"
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   error="Sprint name is required"
 * />
 * ```
 */

import { InputHTMLAttributes, ReactNode, useId } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label
   */
  label?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text displayed below the input
   */
  helperText?: string;

  /**
   * Input size
   */
  inputSize?: 'sm' | 'md' | 'lg';

  /**
   * Whether the input should take full width
   */
  fullWidth?: boolean;

  /**
   * Icon to display at the start of the input
   */
  startIcon?: ReactNode;

  /**
   * Icon to display at the end of the input
   */
  endIcon?: ReactNode;

  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Input component with label and error handling
 */
export function Input({
  label,
  error,
  helperText,
  inputSize = 'md',
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  id,
  required = false,
  disabled = false,
  ...props
}: InputProps): JSX.Element {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperTextId = `${inputId}-helper`;

  const containerClassNames = [
    styles.inputContainer,
    fullWidth ? styles['inputContainer--full-width'] : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClassNames = [
    styles.inputWrapper,
    styles[`inputWrapper--${inputSize}`],
    error ? styles['inputWrapper--error'] : '',
    disabled ? styles['inputWrapper--disabled'] : '',
    startIcon ? styles['inputWrapper--with-start-icon'] : '',
    endIcon ? styles['inputWrapper--with-end-icon'] : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassNames}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-label="required">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <div className={wrapperClassNames}>
        {startIcon && (
          <span className={styles.startIcon} aria-hidden="true">
            {startIcon}
          </span>
        )}

        <input
          id={inputId}
          className={styles.input}
          disabled={disabled}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? errorId : helperText ? helperTextId : undefined
          }
          {...props}
        />

        {endIcon && (
          <span className={styles.endIcon} aria-hidden="true">
            {endIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={helperTextId} className={styles.helperText}>
          {helperText}
        </p>
      )}
    </div>
  );
}
