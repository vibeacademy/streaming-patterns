/**
 * Multi-Turn Memory Timeline - Horizontal timeline displaying memory cards
 */

import type { Memory } from './types';
import { MemoryCard } from './MemoryCard';
import styles from './MemoryTimeline.module.css';

export interface MemoryTimelineProps {
  memories: Memory[];
  onTogglePin: (memoryId: string) => void;
  onPrune: (memoryId: string, reason: string) => void;
  className?: string;
}

export function MemoryTimeline({
  memories,
  onTogglePin,
  onPrune,
  className = '',
}: MemoryTimelineProps): JSX.Element {
  if (memories.length === 0) {
    return (
      <div className={`${styles.timeline} ${className}`}>
        <div className={styles.empty}>
          No memories yet. Start a conversation to see the agent build its memory.
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.timeline} ${className}`}>
      <div className={styles.scrollContainer}>
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onTogglePin={onTogglePin}
            onPrune={onPrune}
          />
        ))}
      </div>
    </div>
  );
}
