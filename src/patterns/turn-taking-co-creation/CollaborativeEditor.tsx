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

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { SectionWithAuthorship, AuthorshipSpan, DeletionSpan, Patch } from './types';
import { Card } from '@/components/ui/Card';
import styles from './CollaborativeEditor.module.css';

/**
 * Find the minimal diff between original and edited text.
 *
 * Educational Note: This implements a simple but effective diff algorithm that finds
 * the longest common prefix and suffix, then determines the changed region in between.
 * This allows us to create granular patches that only cover what the user actually changed,
 * preserving authorship of unchanged text.
 *
 * @param original - Original text before editing
 * @param edited - Text after user's edit
 * @returns Patch data describing the minimal change, or null if no change
 */
function findMinimalDiff(
  original: string,
  edited: string
): { operation: 'insert' | 'replace' | 'delete'; content: string; start: number; end: number } | null {
  // No change
  if (original === edited) return null;

  // Find longest common prefix
  let prefixLen = 0;
  const minLen = Math.min(original.length, edited.length);
  while (prefixLen < minLen && original[prefixLen] === edited[prefixLen]) {
    prefixLen++;
  }

  // Find longest common suffix (but don't overlap with prefix)
  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    original[original.length - 1 - suffixLen] === edited[edited.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  // Calculate the changed region
  const originalStart = prefixLen;
  const originalEnd = original.length - suffixLen;
  const editedStart = prefixLen;
  const editedEnd = edited.length - suffixLen;

  const deletedContent = original.substring(originalStart, originalEnd);
  const insertedContent = edited.substring(editedStart, editedEnd);

  // Determine operation type
  if (deletedContent.length === 0 && insertedContent.length > 0) {
    // Pure insert
    return {
      operation: 'insert',
      content: insertedContent,
      start: originalStart,
      end: originalStart,
    };
  } else if (deletedContent.length > 0 && insertedContent.length === 0) {
    // Pure delete
    return {
      operation: 'delete',
      content: '',
      start: originalStart,
      end: originalEnd,
    };
  } else if (deletedContent.length > 0 && insertedContent.length > 0) {
    // Replace
    return {
      operation: 'replace',
      content: insertedContent,
      start: originalStart,
      end: originalEnd,
    };
  }

  return null;
}

/**
 * Props for CollaborativeEditor component
 */
export interface CollaborativeEditorProps {
  /** Sections with authorship information */
  sections: SectionWithAuthorship[];

  /** Whether any section is currently streaming */
  isStreaming: boolean;

  /** Callback when user applies an edit to a section */
  onUserEdit?: (
    sectionId: string,
    patchData: Omit<Patch, 'id' | 'author' | 'timestamp'>
  ) => void;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for individual section rendering
 */
interface SectionEditorProps {
  section: SectionWithAuthorship;
  onUserEdit?: (
    sectionId: string,
    patchData: Omit<Patch, 'id' | 'author' | 'timestamp'>
  ) => void;
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
 * Renders deleted text with strikethrough styling.
 *
 * Educational Note: Like GitHub diffs, deleted text is shown with strikethrough
 * to help users understand what was removed. The original authorship color is
 * preserved so users can see "I deleted agent text" vs "I deleted my own text".
 */
const DeletedTextSpan = memo(function DeletedTextSpan({
  text,
  originalAuthor,
}: {
  text: string;
  originalAuthor: 'user' | 'agent';
}): JSX.Element {
  return (
    <span
      className={`${styles.deletedText} ${
        originalAuthor === 'agent' ? styles.deletedAgentText : styles.deletedUserText
      }`}
      data-deleted="true"
      data-original-author={originalAuthor}
      title={`Deleted ${originalAuthor} text`}
    >
      {text}
    </span>
  );
});

/**
 * Renders text content with authorship highlighting and deletion indicators.
 *
 * Educational Note: This function demonstrates how to split document text into
 * authorship spans and render each with appropriate styling. The algorithm:
 * 1. Sort authorship spans by start position
 * 2. For each authorship span, check if any deletion markers fall INSIDE it
 * 3. Split authorship spans around deletion markers as needed
 * 4. Handle gaps between spans (unattributed text)
 *
 * Key insight: Deletion markers can appear INSIDE an authorship span (e.g., when
 * user deletes part of agent-authored text). We must split the authorship span
 * around the deletion marker.
 */
function renderTextWithAuthorship(
  content: string,
  authorshipSpans: AuthorshipSpan[],
  deletionSpans: DeletionSpan[] = []
): JSX.Element[] {
  // Handle empty content
  if (!content || content.length === 0) {
    // If there are deletions but no content, show the deletions
    if (deletionSpans.length > 0) {
      return deletionSpans.map((del, index) => (
        <DeletedTextSpan
          key={`del-${del.patchId}-${index}`}
          text={del.deletedContent}
          originalAuthor={del.originalAuthor}
        />
      ));
    }
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

  // Sort deletions by position
  const sortedDeletions = [...deletionSpans].sort((a, b) => a.position - b.position);

  const elements: JSX.Element[] = [];
  let currentPos = 0;
  let deletionIndex = 0;

  // Helper to render a piece of text with authorship
  const renderTextPiece = (
    text: string,
    author: AuthorshipSpan['author'],
    _patchId: string,
    keyPrefix: string
  ): void => {
    if (text.length > 0) {
      elements.push(
        <AuthorshipTextSpan key={keyPrefix} text={text} author={author} />
      );
    }
  };

  // Helper to render a deletion marker
  const renderDeletion = (del: DeletionSpan, keyIndex: number): void => {
    elements.push(
      <DeletedTextSpan
        key={`del-${del.patchId}-${keyIndex}`}
        text={del.deletedContent}
        originalAuthor={del.originalAuthor}
      />
    );
  };

  // Render each authorship span, checking for deletions inside
  sortedSpans.forEach((span, spanIndex) => {
    // Render any deletions that occur BEFORE this span starts
    while (
      deletionIndex < sortedDeletions.length &&
      sortedDeletions[deletionIndex].position < span.start
    ) {
      const del = sortedDeletions[deletionIndex];
      // Render any gap before the deletion
      if (currentPos < del.position) {
        const gapText = content.substring(currentPos, del.position);
        elements.push(
          <span key={`gap-before-del-${spanIndex}-${deletionIndex}`} className={styles.textSpan}>
            {gapText}
          </span>
        );
        currentPos = del.position;
      }
      renderDeletion(del, deletionIndex);
      deletionIndex++;
    }

    // Render gap before this span (if any)
    if (currentPos < span.start) {
      const gapText = content.substring(currentPos, span.start);
      elements.push(
        <span key={`gap-${spanIndex}`} className={styles.textSpan}>
          {gapText}
        </span>
      );
      currentPos = span.start;
    }

    // Now render this authorship span, splitting around any deletions INSIDE it
    let spanPos = span.start;
    let pieceIndex = 0;

    while (spanPos < span.end) {
      // Check if there's a deletion at or after spanPos but before span.end
      if (
        deletionIndex < sortedDeletions.length &&
        sortedDeletions[deletionIndex].position >= spanPos &&
        sortedDeletions[deletionIndex].position < span.end
      ) {
        const del = sortedDeletions[deletionIndex];

        // Render text from spanPos to deletion position
        if (spanPos < del.position) {
          const textBefore = content.substring(spanPos, del.position);
          renderTextPiece(
            textBefore,
            span.author,
            span.patchId,
            `span-${span.patchId}-${spanIndex}-piece-${pieceIndex}`
          );
          pieceIndex++;
        }

        // Render the deletion marker
        renderDeletion(del, deletionIndex);
        deletionIndex++;

        // Continue from the deletion position
        spanPos = del.position;
      } else {
        // No more deletions inside this span, render the rest
        const remainingText = content.substring(spanPos, span.end);
        renderTextPiece(
          remainingText,
          span.author,
          span.patchId,
          `span-${span.patchId}-${spanIndex}-piece-${pieceIndex}`
        );
        spanPos = span.end;
      }
    }

    currentPos = span.end;
  });

  // Render any remaining deletions after all authorship spans
  while (deletionIndex < sortedDeletions.length) {
    const del = sortedDeletions[deletionIndex];
    // Render any gap before the deletion
    if (currentPos < del.position) {
      const gapText = content.substring(currentPos, del.position);
      elements.push(
        <span key={`gap-after-spans-${deletionIndex}`} className={styles.textSpan}>
          {gapText}
        </span>
      );
      currentPos = del.position;
    }
    renderDeletion(del, deletionIndex);
    deletionIndex++;
  }

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
 * Users can click to edit completed sections - their additions appear in green.
 */
const SectionEditor = memo(function SectionEditor({
  section,
  onUserEdit,
}: SectionEditorProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  // eslint-disable-next-line no-undef
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Let the browser handle cursor position naturally
      // Don't force cursor to end - user expects cursor where they clicked
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (section.isComplete && !section.isStreaming) {
      setEditText(section.content);
      setIsEditing(true);
    }
  }, [section.isComplete, section.isStreaming, section.content]);

  const handleSaveEdit = useCallback(() => {
    if (onUserEdit && editText !== section.content) {
      // Use minimal diff to find exactly what the user changed
      // This preserves authorship of unchanged text
      const diff = findMinimalDiff(section.content, editText);

      if (diff) {
        onUserEdit(section.id, {
          sectionId: section.id,
          operation: diff.operation,
          content: diff.content,
          position: { start: diff.start, end: diff.end },
        });
      }
    }
    setIsEditing(false);
  }, [editText, section.content, section.id, onUserEdit]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText('');
  }, []);

  const handleKeyDown = useCallback(
    // eslint-disable-next-line no-undef
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        handleCancelEdit();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSaveEdit();
      }
    },
    [handleCancelEdit, handleSaveEdit]
  );

  return (
    <div
      className={`${styles.section} ${
        section.isStreaming ? styles.sectionStreaming : ''
      } ${section.isComplete ? styles.sectionComplete : ''} ${
        isEditing ? styles.sectionEditing : ''
      }`}
      data-section-id={section.id}
      data-streaming={section.isStreaming}
      data-complete={section.isComplete}
      data-editing={isEditing}
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
        {section.isComplete && !section.isStreaming && !isEditing && (
          <button
            className={styles.editButton}
            onClick={handleStartEdit}
            aria-label={`Edit ${section.title}`}
          >
            Click to Edit
          </button>
        )}
        {isEditing && (
          <div className={styles.editActions}>
            <button
              className={styles.saveButton}
              onClick={handleSaveEdit}
              aria-label="Save changes"
            >
              Save (⌘+Enter)
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
            >
              Cancel (Esc)
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          className={styles.editTextarea}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your content here..."
          aria-label={`Edit ${section.title}`}
        />
      ) : (
        <div
          className={`${styles.sectionContent} ${
            section.isComplete && !section.isStreaming ? styles.clickableContent : ''
          }`}
          role="textbox"
          aria-multiline="true"
          aria-readonly={!section.isComplete}
          aria-label={`${section.title} content`}
          onClick={handleStartEdit}
          tabIndex={section.isComplete && !section.isStreaming ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && section.isComplete && !section.isStreaming) {
              handleStartEdit();
            }
          }}
        >
          {renderTextWithAuthorship(section.content, section.authorshipSpans, section.deletionSpans)}
          {section.isComplete && !section.isStreaming && section.content.length > 0 && (
            <span className={styles.editHint}> (click to edit)</span>
          )}
        </div>
      )}

      {/* Patch count for debugging/educational purposes */}
      {section.patches.length > 0 && !isEditing && (
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
 *   onUserEdit={(sectionId, patch) => applyUserEdit(sectionId, patch)}
 * />
 * ```
 */
export function CollaborativeEditor({
  sections,
  isStreaming,
  onUserEdit,
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
              Draft complete - click any section to edit
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
              onUserEdit={onUserEdit}
            />
          ))
        )}
      </div>

      {/* Educational note */}
      <div className={styles.editorFooter}>
        <p className={styles.footerNote}>
          <strong>Authorship:</strong> Text highlighted in{' '}
          <span className={styles.agentExample}>blue</span> was drafted by the agent,{' '}
          <span className={styles.userExample}>green</span> indicates your edits.{' '}
          <span className={styles.deletedExample}>Strikethrough</span> shows deleted text.
          <br />
          <strong>Tip:</strong> Click on any completed section to add your own text!
        </p>
      </div>
    </Card>
  );
}
