/**
 * MemoryFilters - Filter controls for memory timeline
 */

import type { MemoryType, MemoryFilters as FiltersType } from './types';
import styles from './MemoryFilters.module.css';

export interface MemoryFiltersProps {
  filters: FiltersType;
  memoryCount: number;
  onFiltersChange: (filters: Partial<FiltersType>) => void;
  className?: string;
}

const MEMORY_TYPES: Array<{ value: MemoryType; label: string; icon: string }> = [
  { value: 'fact', label: 'Facts', icon: '📊' },
  { value: 'decision', label: 'Decisions', icon: '✅' },
  { value: 'task', label: 'Tasks', icon: '📝' },
  { value: 'risk', label: 'Risks', icon: '⚠️' },
];

export function MemoryFilters({
  filters,
  memoryCount,
  onFiltersChange,
  className = '',
}: MemoryFiltersProps): JSX.Element {
  const handleTypeToggle = (type: MemoryType): void => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ types: newTypes });
  };

  const handleSearchChange = (query: string): void => {
    onFiltersChange({ searchQuery: query });
  };

  const handlePinnedToggle = (): void => {
    onFiltersChange({ pinnedOnly: !filters.pinnedOnly });
  };

  const handleClearAll = (): void => {
    onFiltersChange({
      types: [],
      searchQuery: '',
      pinnedOnly: false,
    });
  };

  const hasActiveFilters =
    filters.types.length > 0 || filters.searchQuery.trim() !== '' || filters.pinnedOnly;

  return (
    <div className={`${styles.filters} ${className}`}>
      <div className={styles.section}>
        <label className={styles.label}>Type Filters</label>
        <div className={styles.typeButtons}>
          {MEMORY_TYPES.map(({ value, label, icon }) => {
            const isActive = filters.types.includes(value);
            return (
              <button
                key={value}
                className={`${styles.typeButton} ${isActive ? styles.active : ''} ${styles[`type-${value}`]}`}
                onClick={() => handleTypeToggle(value)}
                aria-pressed={isActive}
              >
                <span className={styles.typeIcon}>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="memory-search">
          Search
        </label>
        <input
          id="memory-search"
          type="text"
          className={styles.searchInput}
          placeholder="Search memories..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={filters.pinnedOnly}
            onChange={handlePinnedToggle}
          />
          <span>Show pinned only</span>
        </label>
      </div>

      <div className={styles.footer}>
        <div className={styles.count}>{memoryCount} memories</div>
        {hasActiveFilters && (
          <button className={styles.clearButton} onClick={handleClearAll}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
