/**
 * Collaborative Editor Component
 *
 * Main editor component that displays the document with authorship highlighting.
 * Shows user and agent contributions in different colors, enabling users to see
 * who wrote what in real-time as the document is co-created.
 *
 * Educational Note:
 * This component demonstrates how to visualize collaborative editing by breaking
 * document text into authorship spans and rendering them with appropriate styling.
 * The technique is similar to collaborative editors like Google Docs or Notion.
 *
 * @module patterns/turn-taking-co-creation/CollaborativeEditor
 */

import { memo } from 'react';
import type { SectionWithAuthorship, AuthorshipSpan } from './types';
import { Card } from '@/components/ui/Card';
import styles from './CollaborativeEditor.module.css';

/**
 * Props for CollaborativeEditor component
 */
export interface CollaborativeEditorProps {
  /** Sections with authorship information */
  sections: SectionWithAuthorship[];

  /** Whether any section is currently streaming */
  isStreaming: boolean;

  /** Callback when user clicks on a section to edit */
  onSectionClick?: (sectionId: string) => void;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for individual section rendering
 */
interface SectionEditorProps {
  section: SectionWithAuthorship;
  onClick?: () => void;
}

/**
 * Renders a single text span with authorship styling.
 *
 * Educational Note: Each span represents a contiguous piece of text authored
 * by either the user or agent. Spans are color-coded to show authorship clearly.
 */
const AuthorshipTextSpan = memo(function AuthorshipTextSpan({
  text,
  author,
}: {
  text: string;
  author: 'user' | 'agent';
}): JSX.Element {
  return (
    <span
      className={`${styles.textSpan} ${
        author === 'agent' ? styles.agentText : styles.userText
      }`}
      data-author={author}
    >
      {text}
    </span>
  );
});

/**
 * Renders text content with authorship highlighting.
 *
 * Educational Note: This function demonstrates how to split document text into
 * authorship spans and render each with appropriate styling. The algorithm:
 * 1. Sort spans by start position
 * 2. Iterate through text, creating span elements for each authorship region
 * 3. Handle gaps between spans (unattributed text)
 */
function renderTextWithAuthorship(
  content: string,
  authorshipSpans: AuthorshipSpan[]
): JSX.Element[] {
  // Handle empty content
  if (!content || content.length === 0) {
    return [
      <span key="empty" className={styles.emptyContent}>
        (Empty section - agent will draft content)
      </span>,
    ];
  }

  // Handle no authorship spans (initial state)
  if (!authorshipSpans || authorshipSpans.length === 0) {
    return [
      <span key="0" className={styles.textSpan}>
        {content}
      </span>,
    ];
  }

  // Sort spans by start position
  const sortedSpans = [...authorshipSpans].sort((a, b) => a.start - b.start);

  const elements: JSX.Element[] = [];
  let currentPos = 0;

  // Render each authorship span
  sortedSpans.forEach((span, index) => {
    // Render gap before this span (if any)
    if (currentPos < span.start) {
      const gapText = content.substring(currentPos, span.start);
      elements.push(
        <span key={`gap-${index}`} className={styles.textSpan}>
          {gapText}
        </span>
      );
    }

    // Render the authorship span
    const spanText = content.substring(span.start, span.end);
    elements.push(
      <AuthorshipTextSpan
        key={`span-${span.patchId}-${index}`}
        text={spanText}
        author={span.author}
      />
    );

    currentPos = span.end;
  });

  // Render trailing text after last span (if any)
  if (currentPos < content.length) {
    const trailingText = content.substring(currentPos);
    elements.push(
      <span key="trailing" className={styles.textSpan}>
        {trailingText}
      </span>
    );
  }

  return elements;
}

/**
 * Section Editor - Renders a single document section with authorship highlighting.
 *
 * Educational Note: Each section is independently editable and shows streaming state.
 * When the agent is drafting a section, we show a streaming indicator.
 */
const SectionEditor = memo(function SectionEditor({
  section,
  onClick,
}: SectionEditorProps): JSX.Element {
  return (
    <div
      className={`${styles.section} ${
        section.isStreaming ? styles.sectionStreaming : ''
      } ${section.isComplete ? styles.sectionComplete : ''}`}
      data-section-id={section.id}
      data-streaming={section.isStreaming}
      data-complete={section.isComplete}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{section.title}</h3>
        {section.isStreaming && (
          <div className={styles.streamingIndicator}>
            <span className={styles.streamingDot} aria-hidden="true"></span>
            <span className={styles.streamingText}>Agent is drafting...</span>
            <span className="sr-only" aria-live="polite">
              Agent is currently drafting this section
            </span>
          </div>
        )}
        {section.isComplete && !section.isStreaming && (
          <button
            className={styles.editButton}
            onClick={onClick}
            aria-label={`Edit ${section.title}`}
          >
            Edit
          </button>
        )}
      </div>

      <div
        className={styles.sectionContent}
        role="textbox"
        aria-multiline="true"
        aria-readonly={!section.isComplete}
        aria-label={`${section.title} content`}
      >
        {renderTextWithAuthorship(section.content, section.authorshipSpans)}
      </div>

      {/* Patch count for debugging/educational purposes */}
      {section.patches.length > 0 && (
        <div className={styles.patchCount}>
          {section.patches.length} {section.patches.length === 1 ? 'edit' : 'edits'}
        </div>
      )}
    </div>
  );
});

/**
 * CollaborativeEditor - Main editor component
 *
 * Renders the complete collaborative document with all sections and authorship highlighting.
 *
 * Features:
 * - Real-time authorship highlighting (user vs agent text)
 * - Streaming indicators for sections being drafted
 * - Click-to-edit for completed sections
 * - Visual distinction between active and complete sections
 * - Accessible markup for screen readers
 *
 * @example
 * ```tsx
 * <CollaborativeEditor
 *   sections={sectionsWithAuthorship}
 *   isStreaming={isAgentDrafting}
 *   onSectionClick={(sectionId) => console.log('Edit section:', sectionId)}
 * />
 * ```
 */
export function CollaborativeEditor({
  sections,
  isStreaming,
  onSectionClick,
  className,
}: CollaborativeEditorProps): JSX.Element {
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Card className={`${styles.editor} ${className || ''}`}>
      <div className={styles.editorHeader}>
        <h2 className={styles.editorTitle}>Project Charter</h2>
        <div className={styles.editorStatus}>
          {isStreaming ? (
            <span className={styles.statusStreaming}>
              <span className={styles.statusDot} aria-hidden="true"></span>
              Co-creating...
            </span>
          ) : (
            <span className={styles.statusComplete}>
              <span className={styles.statusIcon} aria-hidden="true">
                ✓
              </span>
              Draft complete
            </span>
          )}
        </div>
      </div>

      <div
        className={styles.editorContent}
        role="article"
        aria-label="Collaborative document editor"
      >
        {sortedSections.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No sections yet. Start collaborating to create content.</p>
          </div>
        ) : (
          sortedSections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onClick={
                onSectionClick ? () => onSectionClick(section.id) : undefined
              }
            />
          ))
        )}
      </div>

      {/* Educational note */}
      <div className={styles.editorFooter}>
        <p className={styles.footerNote}>
          <strong>Authorship:</strong> Text highlighted in{' '}
          <span className={styles.agentExample}>blue</span> was drafted by the agent,{' '}
          <span className={styles.userExample}>green</span> indicates your edits.
        </p>
      </div>
    </Card>
  );
}
