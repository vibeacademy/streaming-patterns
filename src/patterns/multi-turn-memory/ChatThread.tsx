/**
 * ChatThread - Conversation UI component
 */

import type { Message } from './types';
import styles from './ChatThread.module.css';

export interface ChatThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  className?: string;
}

export function ChatThread({
  messages,
  isStreaming = false,
  className = '',
}: ChatThreadProps): JSX.Element {
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className={`${styles.thread} ${className}`}>
        <div className={styles.empty}>No messages yet</div>
      </div>
    );
  }

  return (
    <div className={`${styles.thread} ${className}`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${styles[message.role]}`}
        >
          <div className={styles.messageHeader}>
            <span className={styles.role}>
              {message.role === 'user' ? 'You' : 'Agent'}
            </span>
            <span className={styles.turn}>Turn {message.turnNumber}</span>
          </div>
          <div className={styles.messageContent}>{message.content}</div>
        </div>
      ))}
      {isStreaming && (
        <div className={styles.streamingIndicator}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      )}
    </div>
  );
}
