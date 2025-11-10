/**
 * JSON Viewer Component
 *
 * Displays JSON data with syntax highlighting and formatting.
 * Provides an accessible, readable view of stream event payloads.
 *
 * @module components/NetworkInspector/JsonViewer
 */

import React, { useMemo } from 'react';

/**
 * Props for JsonViewer component
 */
export interface JsonViewerProps {
  /** The data to display (will be JSON.stringify'd) */
  data: unknown;

  /** Whether to expand all nodes by default */
  expanded?: boolean;

  /** Optional CSS class name */
  className?: string;

  /** Maximum depth to display before truncating */
  maxDepth?: number;
}

/**
 * JSON Viewer with syntax highlighting
 *
 * This component provides a simple, lightweight JSON viewer without external dependencies.
 * It applies basic syntax highlighting using inline styles for:
 * - Keys (property names)
 * - String values
 * - Number values
 * - Boolean values
 * - Null values
 *
 * For production, you may want to integrate a library like react-json-view,
 * but this implementation keeps dependencies minimal for educational purposes.
 *
 * @example
 * ```tsx
 * <JsonViewer
 *   data={{ type: 'reasoning', id: '1', confidence: 0.9 }}
 *   expanded={true}
 * />
 * ```
 */
export function JsonViewer({
  data,
  expanded = true,
  className = '',
}: JsonViewerProps): React.ReactElement {
  /**
   * Format JSON with syntax highlighting
   * Memoized to avoid unnecessary recalculation
   */
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Error: Unable to stringify data - ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, [data]);

  /**
   * Apply syntax highlighting to JSON string
   * This is a simplified implementation - for production you might use
   * a library like Prism.js or highlight.js
   */
  const highlightedJson = useMemo(() => {
    return formattedJson
      .split('\n')
      .map((line) => {
        // Apply basic syntax highlighting using regex
        let highlightedLine = line;

        // Highlight property keys (in quotes before colon)
        highlightedLine = highlightedLine.replace(
          /"([^"]+)":/g,
          '<span style="color: #0066cc; font-weight: 500;">"$1"</span>:'
        );

        // Highlight string values
        highlightedLine = highlightedLine.replace(
          /: "([^"]*)"/g,
          ': <span style="color: #22863a;">"$1"</span>'
        );

        // Highlight numbers
        highlightedLine = highlightedLine.replace(
          /: (-?\d+\.?\d*)(,?)/g,
          ': <span style="color: #005cc5;">$1</span>$2'
        );

        // Highlight booleans
        highlightedLine = highlightedLine.replace(
          /: (true|false)(,?)/g,
          ': <span style="color: #d73a49;">$1</span>$2'
        );

        // Highlight null
        highlightedLine = highlightedLine.replace(
          /: (null)(,?)/g,
          ': <span style="color: #6f42c1;">$1</span>$2'
        );

        return highlightedLine;
      })
      .join('\n');
  }, [formattedJson]);

  return (
    <div
      className={`json-viewer ${className}`}
      style={{
        backgroundColor: '#f6f8fa',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        padding: '12px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        overflowX: 'auto',
        maxHeight: expanded ? 'none' : '200px',
        overflow: expanded ? 'auto' : 'hidden',
      }}
    >
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: highlightedJson }}
      />
    </div>
  );
}

/**
 * Compact JSON Viewer for inline display
 * Shows JSON in a single line with truncation
 */
export interface CompactJsonViewerProps {
  /** The data to display */
  data: unknown;

  /** Maximum length before truncation */
  maxLength?: number;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Compact version of JSON viewer for inline display
 *
 * @example
 * ```tsx
 * <CompactJsonViewer data={{ id: '1', name: 'Test' }} maxLength={50} />
 * ```
 */
export function CompactJsonViewer({
  data,
  maxLength = 100,
  className = '',
}: CompactJsonViewerProps): React.ReactElement {
  const compactJson = useMemo(() => {
    try {
      const json = JSON.stringify(data);
      if (json.length > maxLength) {
        return json.substring(0, maxLength) + '...';
      }
      return json;
    } catch {
      return 'Error';
    }
  }, [data, maxLength]);

  return (
    <code
      className={`compact-json-viewer ${className}`}
      style={{
        backgroundColor: '#f6f8fa',
        padding: '2px 6px',
        borderRadius: '3px',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: '11px',
        color: '#24292f',
      }}
    >
      {compactJson}
    </code>
  );
}
