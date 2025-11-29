/**
 * SchemaHUD Component
 *
 * Displays schema structure, required fields, types, and examples.
 * Provides visual reference for expected payload structure.
 */

import type { SchemaHUDState } from './types';
import styles from './SchemaHUD.module.css';

export interface SchemaHUDProps {
  schema: Record<string, unknown> | null;
  state: SchemaHUDState;
  onToggleCollapse: () => void;
}

export function SchemaHUD({ schema, state, onToggleCollapse }: SchemaHUDProps) {
  if (!state.visible || !schema) {
    return null;
  }

  const properties = (schema.properties as Record<string, unknown>) || {};
  const required = (schema.required as string[]) || [];

  return (
    <div className={styles.hud}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon} aria-hidden="true">
            📋
          </span>
          <h3 className={styles.titleText}>Schema</h3>
        </div>
        <button
          className={styles.collapseButton}
          onClick={onToggleCollapse}
          aria-expanded={!state.collapsed}
          aria-label={state.collapsed ? 'Expand schema' : 'Collapse schema'}
        >
          {state.collapsed ? '▸' : '▾'}
        </button>
      </div>

      {!state.collapsed && (
        <div className={styles.content}>
          <div className={styles.fields}>
            {Object.entries(properties).map(([fieldName, fieldDef]) => {
              const def = fieldDef as Record<string, unknown>;
              const isRequired = required.includes(fieldName);
              const isHighlighted = state.highlightField === fieldName;

              return (
                <div
                  key={fieldName}
                  className={`${styles.field} ${isHighlighted ? styles.fieldHighlighted : ''}`}
                >
                  <div className={styles.fieldHeader}>
                    <code className={styles.fieldName}>{fieldName}</code>
                    {isRequired && (
                      <span className={styles.requiredBadge} title="Required field">
                        *
                      </span>
                    )}
                    <span className={styles.fieldType}>
                      {getFieldType(def)}
                    </span>
                  </div>

                  {typeof def.description === 'string' && (
                    <p className={styles.fieldDescription}>
                      {def.description}
                    </p>
                  )}

                  {def.example !== undefined && (
                    <div className={styles.fieldExample}>
                      <span className={styles.exampleLabel}>Example:</span>
                      <code className={styles.exampleValue}>
                        {String(formatExample(def.example))}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Extract field type from schema definition
 */
function getFieldType(def: Record<string, unknown>): string {
  const type = def.type as string;

  if (type === 'array') {
    const items = def.items as Record<string, unknown>;
    const itemType = items?.type || 'unknown';
    return `${itemType}[]`;
  }

  if (type === 'object') {
    return 'object';
  }

  if (def.enum) {
    return 'enum';
  }

  if (def.format) {
    return `${type} (${def.format})`;
  }

  return type || 'unknown';
}

/**
 * Format example value for display
 */
function formatExample(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
}
