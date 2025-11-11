/**
 * Annotated Source Code Viewer Component
 *
 * Displays source code with syntax highlighting, line numbers, annotations,
 * and copy-to-clipboard functionality. This component is designed for
 * educational purposes to help developers understand streaming pattern
 * implementations.
 *
 * Features:
 * - Syntax highlighting using Prism.js (TypeScript/JavaScript support)
 * - Line numbers with optional highlighting
 * - Inline markdown annotations at specific lines
 * - Copy-to-clipboard functionality
 * - Responsive design with mobile support
 * - Accessible with keyboard navigation and screen readers
 *
 * @module components/AnnotatedSource
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';
import styles from './AnnotatedSource.module.css';

/**
 * Supported programming languages for syntax highlighting
 */
export type SupportedLanguage = 'typescript' | 'tsx' | 'javascript' | 'jsx';

/**
 * Annotation type for visual styling
 */
export type AnnotationType = 'info' | 'warning' | 'tip';

/**
 * Annotation interface for inline code explanations
 */
export interface Annotation {
  /** Line number where annotation should appear (1-indexed) */
  line: number;

  /** Markdown content for the annotation */
  content: string;

  /** Visual type of annotation (affects styling) */
  type?: AnnotationType;
}

/**
 * Props for the AnnotatedSource component
 */
export interface AnnotatedSourceProps {
  /** Source code to display */
  code: string;

  /** Programming language for syntax highlighting */
  language?: SupportedLanguage;

  /** Array of inline annotations */
  annotations?: Annotation[];

  /** Line numbers to highlight (1-indexed) */
  highlightLines?: number[];

  /** Whether to show line numbers */
  showLineNumbers?: boolean;

  /** Optional file name to display in header */
  fileName?: string;

  /** Optional CSS class name for custom styling */
  className?: string;

  /** Maximum height before scrolling (e.g., '500px', '80vh') */
  maxHeight?: string;
}

/**
 * Annotated Source Code Viewer
 *
 * Educational component for displaying source code with syntax highlighting,
 * annotations, and interactive features.
 *
 * Performance Characteristics:
 * - Syntax highlighting runs once on mount and when code changes
 * - Copy operation uses modern Clipboard API with fallback
 * - Annotations are lazily rendered per line
 *
 * @example
 * ```tsx
 * <AnnotatedSource
 *   code={sourceCode}
 *   language="typescript"
 *   fileName="useReasoningStream.ts"
 *   highlightLines={[5, 12, 18]}
 *   annotations={[
 *     {
 *       line: 5,
 *       content: "This hook manages the reasoning stream state",
 *       type: "info"
 *     }
 *   ]}
 * />
 * ```
 */
export function AnnotatedSource({
  code,
  language = 'typescript',
  annotations = [],
  highlightLines = [],
  showLineNumbers = true,
  fileName,
  className = '',
  maxHeight = '600px',
}: AnnotatedSourceProps): JSX.Element {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<number>>(
    new Set()
  );

  /**
   * Apply syntax highlighting when code or language changes
   */
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      // Modern Clipboard API
      // eslint-disable-next-line no-undef
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // eslint-disable-next-line no-undef
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  /**
   * Toggle annotation expansion
   */
  const toggleAnnotation = useCallback((line: number): void => {
    setExpandedAnnotations((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  }, []);

  /**
   * Get Prism language class for syntax highlighting
   */
  const languageClass = `language-${language}`;

  /**
   * Split code into lines for rendering with line numbers
   */
  const lines = code.split('\n');

  /**
   * Create annotation lookup map for efficient access
   */
  const annotationMap = new Map<number, Annotation>();
  annotations.forEach((annotation) => {
    annotationMap.set(annotation.line, annotation);
  });

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header with filename and copy button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {fileName && (
            <span className={styles.fileName} title={fileName}>
              {fileName}
            </span>
          )}
          <span className={styles.language}>{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"
                fill="currentColor"
              />
            </svg>
          )}
          <span className={styles.copyButtonText}>
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      {/* Code display area */}
      <div className={styles.codeWrapper} style={{ maxHeight }}>
        <div className={styles.codeContainer}>
          {showLineNumbers && (
            <div className={styles.lineNumbers} aria-hidden="true">
              {lines.map((_, index) => {
                const lineNum = index + 1;
                const isHighlighted = highlightLines.includes(lineNum);
                return (
                  <div
                    key={lineNum}
                    className={`${styles.lineNumber} ${
                      isHighlighted ? styles.lineNumberHighlighted : ''
                    }`}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.codeContent}>
            {/* Syntax highlighted code */}
            <pre className={styles.pre}>
              <code ref={codeRef} className={languageClass}>
                {code}
              </code>
            </pre>

            {/* Line highlights */}
            {highlightLines.map((lineNum) => (
              <div
                key={lineNum}
                className={styles.lineHighlight}
                style={{
                  top: `${(lineNum - 1) * 1.5}rem`,
                }}
                aria-hidden="true"
              />
            ))}

            {/* Annotations */}
            {annotations.map((annotation) => {
              const isExpanded = expandedAnnotations.has(annotation.line);
              return (
                <div
                  key={annotation.line}
                  className={`${styles.annotation} ${
                    styles[`annotation--${annotation.type || 'info'}`]
                  }`}
                  style={{
                    top: `${(annotation.line - 1) * 1.5}rem`,
                  }}
                >
                  <button
                    onClick={() => toggleAnnotation(annotation.line)}
                    className={styles.annotationToggle}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} annotation for line ${annotation.line}`}
                  >
                    <span className={styles.annotationIcon}>
                      {annotation.type === 'warning' ? '⚠️' : annotation.type === 'tip' ? '💡' : 'ℹ️'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className={styles.annotationContent}>
                      {/* Simple markdown rendering - just handle bold, italic, code */}
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderSimpleMarkdown(annotation.content),
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer for annotations
 * Supports: **bold**, *italic*, `code`, and line breaks
 *
 * Note: This is intentionally simple to avoid heavy dependencies.
 * For more complex markdown, consider using a library like marked or remark.
 */
function renderSimpleMarkdown(text: string): string {
  let html = text;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code: `text`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}
