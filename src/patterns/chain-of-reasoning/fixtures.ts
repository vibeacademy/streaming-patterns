/**
 * Mock fixture data for the Chain-of-Reasoning pattern demo.
 *
 * This module provides deterministic test data for the sprint planning demo,
 * demonstrating how the Chain-of-Reasoning pattern makes AI thinking visible.
 *
 * All fixture data is:
 * - Deterministic (same input = same output)
 * - Realistic (based on actual PM workflows)
 * - Educational (clearly demonstrates the pattern)
 *
 * @module patterns/chain-of-reasoning/fixtures
 */

import type { StreamEvent, ReasoningStep } from './types';

/**
 * Sprint planning reasoning steps demonstrating AI analyzing a backlog
 * and making decisions about what to include in the next sprint.
 *
 * This scenario shows:
 * - Business value analysis
 * - Capacity estimation
 * - Dependency identification
 * - Quick wins vs. long-term goals balancing
 * - Buffer allocation for unknowns
 */
const sprintPlanningReasoningSteps: ReasoningStep[] = [
  {
    id: 'reason-1',
    summary: 'Analyzing backlog priorities and business value',
    confidence: 0.92,
    details:
      'Reviewing 24 backlog items based on customer feedback scores (avg 4.2/5), revenue impact ($50K+ for auth work), and strategic alignment with Q4 goals. Top items: authentication overhaul, dashboard performance, real-time notifications.',
    timestamp: 1699564800000,
  },
  {
    id: 'reason-2',
    summary: 'Estimating team capacity for next 2 weeks',
    confidence: 0.88,
    details:
      'Team of 6 engineers, accounting for 1 PTO day (Sarah) and Thanksgiving holiday (Nov 23), leaves ~52 engineering days. Historical velocity: 28-32 story points per sprint. Buffer recommendation: 20% for unknowns.',
    timestamp: 1699564800500,
  },
  {
    id: 'reason-3',
    summary: 'Identifying dependencies and blockers',
    confidence: 0.85,
    details:
      'Critical path identified: User authentication work (13pts) blocks payment integration (8pts planned for Sprint 25). API rate limiting issue (#847) needs resolution before dashboard work. Design review for dark mode still pending.',
    timestamp: 1699564801000,
  },
  {
    id: 'reason-4',
    summary: 'Balancing quick wins with long-term goals',
    confidence: 0.90,
    details:
      'Including 2 small bug fixes (date picker timezone, CSV export formatting) for immediate customer relief while advancing strategic dashboard redesign. This maintains team morale and customer satisfaction while progressing on big-bet features.',
    timestamp: 1699564801500,
  },
  {
    id: 'reason-5',
    summary: 'Allocating buffer for unknowns',
    confidence: 0.87,
    details:
      'Reserving 20% capacity (~6 story points) for bug fixes, code reviews, tech debt, and unexpected technical challenges. Past 3 sprints showed 15-25% unplanned work. Better to under-commit than over-commit.',
    timestamp: 1699564802000,
  },
];

/**
 * Final sprint plan answer that references the reasoning steps above.
 *
 * Note how the answer ties back to specific reasoning (e.g., "Based on reason-1")
 * to create traceability between thinking and conclusions.
 */
const sprintPlanningAnswer = `# Sprint 24 Plan (Nov 13-24)

## High Priority (Must Complete)

### 1. User Authentication Overhaul (13 points)
*Reasoning: Top business value item (reason-1), unblocks payment work (reason-3)*
- OAuth 2.0 integration with Google/GitHub
- Secure session management with refresh tokens
- Password reset flow with email verification
- **Owner:** Backend team (3 engineers)
- **Risk:** Medium - third-party API dependencies

### 2. Dashboard Performance Optimization (8 points)
*Reasoning: Second highest ROI, but needs rate limiting fix first (reason-3)*
- Implement lazy loading for dashboard widgets
- Add Redis cache for expensive queries
- Reduce initial bundle size by 40%
- **Owner:** Frontend team (2 engineers)
- **Dependency:** Fix API rate limiting issue (#847)

## Medium Priority (Should Complete)

### 3. Real-time Notifications (5 points)
*Reasoning: Quick win with high user impact (reason-4)*
- WebSocket connection for live updates
- Toast notification UI component
- Notification preferences page
- **Owner:** Full-stack engineer
- **Risk:** Low - established patterns

### 4. Critical Bug Fixes (3 points)
*Reasoning: Quick wins for customer satisfaction (reason-4)*
- Fix date picker timezone handling
- Correct CSV export formatting issues
- **Owner:** On-call rotation
- **Timeline:** Complete by mid-sprint

## Stretch Goals (If Time Permits)

### 5. Dark Mode Theme (5 points)
*Reasoning: Dependent on design review completion*
- CSS variable system for theming
- Dark mode toggle in user settings
- **Owner:** Frontend team
- **Condition:** Only start if auth work finishes early

## Sprint Metrics

**Total Committed:** 29 points
**Team Velocity Range:** 28-32 points (reason-2)
**Buffer Allocation:** ~6 points (20% for unknowns, reason-5)
**Overall Confidence:** High (88%)

## Key Dependencies & Risks
- Auth work blocks payment integration (Sprint 25)
- Dashboard work requires API rate limiting fix
- Thanksgiving holiday on Nov 23 (1 day lost)
- Sarah on PTO Nov 20 (1 day lost)

## Success Criteria
- All high-priority items deployed to production
- Zero P0 bugs introduced
- Code coverage maintained above 80%
- Team satisfaction score ≥4/5`;

/**
 * Complete fixture for sprint planning scenario.
 *
 * Combines reasoning steps and final answer into a sequence of stream events
 * that demonstrates the Chain-of-Reasoning pattern.
 */
export const sprintPlanningFixture: StreamEvent[] = [
  // Reasoning steps streamed first
  ...sprintPlanningReasoningSteps.map(
    (step): StreamEvent => ({
      type: 'reasoning',
      data: step,
    })
  ),
  // Final answer streamed after reasoning completes
  {
    type: 'answer',
    data: {
      text: sprintPlanningAnswer,
    },
  },
];

/**
 * Map of available fixtures keyed by prompt pattern.
 *
 * This allows the mock stream generator to select the appropriate fixture
 * based on the user's prompt.
 *
 * @example
 * ```typescript
 * const fixture = fixturesByPrompt['sprint'] || fixturesByPrompt['default'];
 * ```
 */
export const fixturesByPrompt: Record<string, StreamEvent[]> = {
  // Match prompts containing "sprint"
  sprint: sprintPlanningFixture,
  'sprint planning': sprintPlanningFixture,
  'plan sprint': sprintPlanningFixture,
  'plan a sprint': sprintPlanningFixture,

  // Default fallback
  default: sprintPlanningFixture,
};

/**
 * Get the appropriate fixture for a given prompt.
 *
 * Uses case-insensitive substring matching to find the best fixture.
 * Falls back to the default fixture if no match is found.
 *
 * @param prompt - The user's prompt text
 * @returns The matching fixture data
 *
 * @example
 * ```typescript
 * const fixture = getFixtureForPrompt('Plan a 2-week sprint');
 * // Returns sprintPlanningFixture
 * ```
 */
export function getFixtureForPrompt(prompt: string): StreamEvent[] {
  const normalizedPrompt = prompt.toLowerCase().trim();

  // Try to find a matching fixture by keyword
  for (const [key, fixture] of Object.entries(fixturesByPrompt)) {
    if (key !== 'default' && normalizedPrompt.includes(key)) {
      return fixture;
    }
  }

  // Fall back to default fixture
  return fixturesByPrompt.default;
}
