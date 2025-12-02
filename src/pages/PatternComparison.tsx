/**
 * Pattern Comparison Page - Interactive comparison matrix for all streaming patterns
 *
 * Helps developers choose the right pattern for their use case by comparing:
 * - Use cases and when to use each pattern
 * - Complexity and difficulty level
 * - Key features and techniques
 * - Implementation status
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import styles from './PatternComparison.module.css';

/**
 * Pattern comparison data structure
 */
interface PatternData {
  id: string;
  name: string;
  route: string;
  status: 'complete' | 'coming-soon';
  difficulty: 'foundational' | 'advanced';
  complexity: 'simple' | 'moderate' | 'complex';
  useCases: string[];
  whenToUse: string;
  keyFeatures: string[];
  streamEvents: string[];
  demoScenario: string;
  bestFor: string[];
}

/**
 * Comprehensive pattern comparison data
 */
const patternData: PatternData[] = [
  {
    id: 'chain-of-reasoning',
    name: 'Chain-of-Reasoning Guide',
    route: '/patterns/chain-of-reasoning',
    status: 'complete',
    difficulty: 'foundational',
    complexity: 'simple',
    useCases: [
      'Showing AI thinking process',
      'Building user trust',
      'Debugging AI decisions',
      'Complex planning tasks'
    ],
    whenToUse: 'When users need to understand how the AI arrived at a conclusion or decision',
    keyFeatures: [
      'Reasoning steps timeline',
      'Progressive disclosure',
      'Promote to plan CTA',
      'Trust building through transparency'
    ],
    streamEvents: ['reasoning', 'answer'],
    demoScenario: 'AI Sprint Planning Assistant',
    bestFor: ['Complex decisions', 'Planning workflows', 'Explainable AI']
  },
  {
    id: 'agent-await-prompt',
    name: 'Agent-Await-Prompt',
    route: '/patterns/agent-await-prompt',
    status: 'complete',
    difficulty: 'foundational',
    complexity: 'moderate',
    useCases: [
      'Interactive wizards',
      'Progressive form filling',
      'Conversational workflows',
      'Collecting missing information'
    ],
    whenToUse: 'When the AI needs additional input from the user to continue execution',
    keyFeatures: [
      'Pause/resume mechanics',
      'Inline input forms',
      'Timeout handling',
      'Context preservation'
    ],
    streamEvents: ['text', 'await_input', 'input_submission', 'resume', 'timeout'],
    demoScenario: 'Dependency Resolution',
    bestFor: ['Multi-step forms', 'Configuration wizards', 'Adaptive UIs']
  },
  {
    id: 'tabular-stream-view',
    name: 'Tabular Stream View',
    route: '/patterns/tabular-stream-view',
    status: 'complete',
    difficulty: 'foundational',
    complexity: 'moderate',
    useCases: [
      'Streaming structured data',
      'AI-generated reports',
      'Data analysis results',
      'Progressive table rendering'
    ],
    whenToUse: 'When displaying structured tabular data that streams in progressively',
    keyFeatures: [
      'Schema-first rendering',
      'Progressive row loading',
      'Client-side sort/filter',
      'CSV export during streaming',
      'Skeleton loaders'
    ],
    streamEvents: ['schema', 'table_row', 'table_meta'],
    demoScenario: 'Team Capacity Planning',
    bestFor: ['Reports', 'Analytics', 'Data exploration', 'Large datasets']
  },
  {
    id: 'multi-turn-memory-timeline',
    name: 'Multi-Turn Memory Timeline',
    route: '/patterns/multi-turn-memory',
    status: 'complete',
    difficulty: 'advanced',
    complexity: 'complex',
    useCases: [
      'Multi-turn conversations',
      'Memory management',
      'Context tracking',
      'Long-running sessions'
    ],
    whenToUse: 'When users need to see and control what the AI remembers across conversation turns',
    keyFeatures: [
      'Memory timeline visualization',
      'Pin/prune controls',
      'Provenance tooltips',
      'Memory lifecycle (create/update/prune)',
      'Type-based filtering'
    ],
    streamEvents: ['memory.create', 'memory.update', 'memory.prune', 'memory.pin', 'message'],
    demoScenario: 'Q4 Planning Conversation',
    bestFor: ['Chatbots', 'Planning sessions', 'Consultative workflows']
  },
  {
    id: 'turn-taking-co-creation',
    name: 'Turn-Taking Co-Creation',
    route: '/patterns/turn-taking-co-creation',
    status: 'complete',
    difficulty: 'advanced',
    complexity: 'complex',
    useCases: [
      'Collaborative document editing',
      'Co-creation workflows',
      'Draft approval',
      'Content refinement'
    ],
    whenToUse: 'When users and AI need to collaboratively build content with clear authorship',
    keyFeatures: [
      'Bidirectional streaming',
      'Authorship highlighting',
      'Patch-based editing',
      'Conflict resolution',
      'Accept/reject controls'
    ],
    streamEvents: ['agent_patch', 'user_patch', 'patch_ack', 'section_complete', 'conflict'],
    demoScenario: 'Project Charter Co-Creation',
    bestFor: ['Document editing', 'Content creation', 'Collaborative workflows']
  },
  {
    id: 'streaming-validation-loop',
    name: 'Streaming Validation Loop',
    route: '/patterns/streaming-validation-loop',
    status: 'complete',
    difficulty: 'advanced',
    complexity: 'complex',
    useCases: [
      'Approval workflows',
      'Budget allocations',
      'Human-in-the-loop systems',
      'Compliance checks'
    ],
    whenToUse: 'When critical decisions require human approval before the AI can proceed',
    keyFeatures: [
      'Checkpoint pause/resume',
      'Approve/Edit/Skip actions',
      'Timeout auto-approve',
      'Timeline audit trail',
      'Inline editing'
    ],
    streamEvents: ['budget_analysis', 'checkpoint', 'checkpoint_response', 'checkpoint_resume', 'final_plan'],
    demoScenario: 'Q1 Budget Allocation',
    bestFor: ['Financial approvals', 'Multi-step wizards', 'Compliance workflows']
  },
  {
    id: 'schema-governed-exchange',
    name: 'Schema-Governed Exchange',
    route: '/patterns/schema-governed-exchange',
    status: 'complete',
    difficulty: 'advanced',
    complexity: 'complex',
    useCases: [
      'Type-safe streaming',
      'API payload validation',
      'Structured data entry',
      'Real-time validation'
    ],
    whenToUse: 'When streaming JSON payloads need runtime validation against a schema',
    keyFeatures: [
      'Progressive Zod validation',
      'Schema HUD visualization',
      'Error highlighting',
      'Auto-fix suggestions',
      'Type safety enforcement'
    ],
    streamEvents: ['schema', 'payload', 'schema_error'],
    demoScenario: 'Project Setup Validation',
    bestFor: ['Form validation', 'API responses', 'Data quality checks']
  }
];

type SortField = 'name' | 'difficulty' | 'complexity' | 'status';
type SortDirection = 'asc' | 'desc';

/**
 * Pattern Comparison Page Component
 */
export function PatternComparison(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'foundational' | 'advanced'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'coming-soon'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  /**
   * Filter and sort patterns based on current state
   */
  const filteredPatterns = useMemo(() => {
    let result = [...patternData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(query) ||
          pattern.useCases.some((uc) => uc.toLowerCase().includes(query)) ||
          pattern.whenToUse.toLowerCase().includes(query) ||
          pattern.keyFeatures.some((kf) => kf.toLowerCase().includes(query))
      );
    }

    // Apply difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter((pattern) => pattern.difficulty === difficultyFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((pattern) => pattern.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          compareValue = a.difficulty.localeCompare(b.difficulty);
          break;
        case 'complexity': {
          const complexityOrder = { simple: 1, moderate: 2, complex: 3 };
          compareValue = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        }
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [searchQuery, difficultyFilter, statusFilter, sortField, sortDirection]);

  /**
   * Handle sort column change
   */
  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Get sort indicator for column header
   */
  const getSortIndicator = (field: SortField): string => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <main className={styles.comparison} role="main">
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Pattern Comparison Matrix</h1>
        <p className={styles.description}>
          Compare all 7 streaming patterns to choose the right one for your use case.
          Filter by difficulty, status, or search for specific features.
        </p>
      </header>

      {/* Decision Tree Helper */}
      <Card className={styles.decisionTree}>
        <h2 className={styles.decisionTreeTitle}>Quick Pattern Selector</h2>
        <div className={styles.decisionTreeFlow}>
          <div className={styles.decisionStep}>
            <strong>Need to show AI thinking?</strong>
            <p>→ <Link to="/patterns/chain-of-reasoning">Chain-of-Reasoning Guide</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>Need user input mid-stream?</strong>
            <p>→ <Link to="/patterns/agent-await-prompt">Agent-Await-Prompt</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>Streaming structured data?</strong>
            <p>→ <Link to="/patterns/tabular-stream-view">Tabular Stream View</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>Multi-turn conversation?</strong>
            <p>→ <Link to="/patterns/multi-turn-memory">Multi-Turn Memory Timeline</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>Collaborative editing?</strong>
            <p>→ <Link to="/patterns/turn-taking-co-creation">Turn-Taking Co-Creation</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>Approval workflow?</strong>
            <p>→ <Link to="/patterns/streaming-validation-loop">Streaming Validation Loop</Link></p>
          </div>
          <div className={styles.decisionStep}>
            <strong>JSON validation?</strong>
            <p>→ <Link to="/patterns/schema-governed-exchange">Schema-Governed Exchange</Link></p>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <label htmlFor="pattern-search" className="sr-only">
            Search patterns
          </label>
          <input
            id="pattern-search"
            type="text"
            placeholder="Search patterns, use cases, features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="difficulty-filter">Difficulty:</label>
            <select
              id="difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
              className={styles.select}
            >
              <option value="all">All Levels</option>
              <option value="foundational">Foundational</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className={styles.select}
            >
              <option value="all">All Status</option>
              <option value="complete">Complete</option>
              <option value="coming-soon">Coming Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className={styles.resultsCount}>
        Showing {filteredPatterns.length} of {patternData.length} patterns
      </p>

      {/* Comparison Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>
                <button
                  onClick={() => handleSort('name')}
                  className={styles.sortButton}
                  aria-label="Sort by pattern name"
                >
                  Pattern {getSortIndicator('name')}
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('status')}
                  className={styles.sortButton}
                  aria-label="Sort by status"
                >
                  Status {getSortIndicator('status')}
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('difficulty')}
                  className={styles.sortButton}
                  aria-label="Sort by difficulty"
                >
                  Difficulty {getSortIndicator('difficulty')}
                </button>
              </th>
              <th>
                <button
                  onClick={() => handleSort('complexity')}
                  className={styles.sortButton}
                  aria-label="Sort by complexity"
                >
                  Complexity {getSortIndicator('complexity')}
                </button>
              </th>
              <th>When to Use</th>
              <th>Key Features</th>
              <th>Demo Scenario</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatterns.map((pattern) => (
              <tr key={pattern.id} className={styles.patternRow}>
                <td className={styles.patternName}>
                  <strong>{pattern.name}</strong>
                </td>
                <td>
                  <span
                    className={
                      pattern.status === 'complete'
                        ? styles.statusComplete
                        : styles.statusComingSoon
                    }
                  >
                    {pattern.status === 'complete' ? '✓ Complete' : 'Coming Soon'}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      pattern.difficulty === 'foundational'
                        ? styles.difficultyFoundational
                        : styles.difficultyAdvanced
                    }
                  >
                    {pattern.difficulty === 'foundational' ? 'Foundational' : 'Advanced'}
                  </span>
                </td>
                <td>
                  <span className={styles[`complexity${pattern.complexity.charAt(0).toUpperCase()}${pattern.complexity.slice(1)}`]}>
                    {pattern.complexity.charAt(0).toUpperCase() + pattern.complexity.slice(1)}
                  </span>
                </td>
                <td className={styles.whenToUse}>{pattern.whenToUse}</td>
                <td>
                  <ul className={styles.featureList}>
                    {pattern.keyFeatures.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </td>
                <td>{pattern.demoScenario}</td>
                <td>
                  {pattern.status === 'complete' ? (
                    <Link to={pattern.route} className={styles.viewDemoButton}>
                      View Demo
                    </Link>
                  ) : (
                    <span className={styles.comingSoonText}>Coming Soon</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredPatterns.length === 0 && (
        <div className={styles.emptyState}>
          <p>No patterns found matching your filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setDifficultyFilter('all');
              setStatusFilter('all');
            }}
            className={styles.clearFiltersButton}
          >
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );
}
