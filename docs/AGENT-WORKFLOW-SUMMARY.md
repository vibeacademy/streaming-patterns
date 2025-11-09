# Agent-Based Development Workflow - Complete Summary

## Overview

This document provides a complete overview of the agent-based, trunk-based development workflow for the Streaming Patterns Library. It summarizes the policies, tools, and processes that govern how work flows from idea to production.

---

## Core Principles

### 1. **Trunk-Based Development**
- Main branch is protected and always deployable
- All work happens on short-lived feature branches
- Pull requests are mandatory for all changes
- No work can be merged without review

### 2. **Agent Separation of Duties**
- **Different agents for different roles** (write ≠ review)
- `github-ticket-worker`: Implements features from Ready column
- `pr-reviewer-merger`: Reviews and merges PRs (cannot review own code)
- `agile-backlog-prioritizer`: Manages backlog and priorities

### 3. **Project Board as Source of Truth**
- **NO WORK** can begin unless it's in the Ready column
- Agents move issues between columns to reflect current state
- Board columns: Backlog → Ready → In Progress → In Review → Done (+ Icebox)

### 4. **Product Strategy Drives Everything**
- `docs/PRODUCT-REQUIREMENTS.md`: What we're building and why
- `docs/PRODUCT-ROADMAP.md`: When we're building it and in what order
- All tickets must align with product strategy

---

## The Three Agents

### Agent 1: `agile-backlog-prioritizer`
**Role**: Product Owner / Backlog Manager

**Responsibilities**:
- Read and enforce product strategy (PRD + Roadmap)
- Prioritize backlog using Cost of Delay analysis
- Ensure tickets are well-defined before moving to Ready
- Maintain 2-5 items in Ready column at all times
- Manage epics and sub-issues
- Keep board state accurate

**When to Invoke**:
```bash
/groom-backlog                    # Regular backlog grooming
/check-milestone "MVP Complete"   # Check milestone progress
```

**Key Outputs**:
- Ready column populated with well-defined, high-priority tickets
- Backlog health report (metrics, quality audit, recommendations)
- Strategic alignment check (PRD/Roadmap compliance)

**Decision Framework**:
1. Read PRODUCT-REQUIREMENTS.md and PRODUCT-ROADMAP.md
2. For each ticket, assess strategic alignment + CD3 score
3. Verify ticket quality (acceptance criteria, effort estimate, dependencies)
4. Move to Ready only if: aligned + well-defined + unblocked
5. Use Memory MCP to remember decisions across sessions

---

### Agent 2: `github-ticket-worker`
**Role**: Software Engineer / Feature Implementer

**Responsibilities**:
- Pick top ticket from Ready column (ONLY from Ready, never Backlog)
- Create feature branch: `feature/issue-{number}-description`
- Move ticket to In Progress
- Implement feature following CLAUDE.md standards
- Write tests (>80% coverage required)
- Create pull request with detailed description
- Move ticket to In Review

**When to Invoke**:
```bash
/next-ticket   # Automatically pick and start next ticket
```

**Key Outputs**:
- Feature branch with working implementation
- Comprehensive tests (unit, component, integration)
- Pull request with:
  - Clear description linking to issue
  - Test instructions
  - Checklist confirming quality standards

**Decision Framework**:
1. ONLY work on tickets in Ready column
2. Create feature branch BEFORE any work
3. Follow CLAUDE.md architecture standards religiously
4. Never commit directly to main
5. Never create PR with failing tests
6. Move ticket to In Review when PR is created

**Critical Constraints**:
- ❌ Cannot work on Backlog or Icebox tickets
- ❌ Cannot commit to main directly
- ❌ Cannot skip tests
- ❌ Cannot merge own PRs

---

### Agent 3: `pr-reviewer-merger`
**Role**: Tech Lead / Code Reviewer

**Responsibilities**:
- Review PRs in the In Review column
- Check code quality, tests, pattern implementation
- Verify alignment with CLAUDE.md standards
- Approve and merge if all standards met
- Request changes with detailed, actionable feedback
- Move ticket to Done after merging
- Close feature branch

**When to Invoke**:
```bash
/review-pr 42   # Review specific PR number
```

**Key Outputs**:
- Detailed code review with specific feedback
- Approval + merge (if standards met)
- Ticket moved to Done
- Feature branch deleted

**Decision Framework**:
1. Read PR diff, description, linked issue
2. Check: TypeScript strict mode, no `any` types
3. Check: Tests pass with >80% coverage
4. Check: Pattern matches specification
5. Check: Mock data is deterministic
6. Check: Network inspector integration works
7. Check: Annotated source is clear
8. **Approve + Merge** OR **Request Changes**

**Critical Constraints**:
- ❌ CANNOT review code written by same agent instance (separation of duties)
- ❌ Cannot merge PRs with failing tests
- ❌ Cannot merge PRs without issue link
- ❌ Cannot skip review checklist

---

## The Workflow (Step-by-Step)

### Phase 1: Backlog Grooming (Prioritization)
**Agent**: `agile-backlog-prioritizer`

```
┌──────────────────────────────────────────────────────────┐
│ 1. Read Product Strategy                                 │
│    - docs/PRODUCT-REQUIREMENTS.md                        │
│    - docs/PRODUCT-ROADMAP.md                             │
│                                                           │
│ 2. Review Backlog Tickets                                │
│    - Check quality (acceptance criteria, estimates)      │
│    - Assess strategic alignment                          │
│    - Calculate CD3 scores                                │
│                                                           │
│ 3. Move Top Tickets to Ready                             │
│    - Criteria: aligned + well-defined + unblocked        │
│    - Maintain 2-5 tickets in Ready                       │
│                                                           │
│ 4. Generate Report                                       │
│    - Backlog health metrics                              │
│    - Strategic alignment check                           │
│    - Recommendations for product leadership              │
└──────────────────────────────────────────────────────────┘
```

**Outcome**: Ready column has 2-5 high-value, implementable tickets

---

### Phase 2: Implementation (Feature Development)
**Agent**: `github-ticket-worker`

```
┌──────────────────────────────────────────────────────────┐
│ 1. Select Ticket                                         │
│    - Top ticket from Ready column                        │
│    - Never from Backlog/Icebox                           │
│                                                           │
│ 2. Create Feature Branch                                 │
│    - git checkout -b feature/issue-42-chain-reasoning    │
│    - Move ticket to In Progress                          │
│                                                           │
│ 3. Implement Feature                                     │
│    - Follow CLAUDE.md standards                          │
│    - TypeScript strict mode, no `any`                    │
│    - Create components, hooks, fixtures, tests           │
│                                                           │
│ 4. Test Thoroughly                                       │
│    - npm test (must pass)                                │
│    - Coverage >80%                                       │
│    - Manual testing in dev mode                          │
│                                                           │
│ 5. Create Pull Request                                   │
│    - git push origin feature/issue-42-...                │
│    - gh pr create --title "[#42] Chain of Reasoning"    │
│    - Link to issue, provide detailed description         │
│    - Move ticket to In Review                            │
└──────────────────────────────────────────────────────────┘
```

**Outcome**: Feature branch with working code + tests, PR in review state

---

### Phase 3: Code Review (Quality Assurance)
**Agent**: `pr-reviewer-merger` (DIFFERENT agent instance than implementer)

```
┌──────────────────────────────────────────────────────────┐
│ 1. Fetch PR Context                                      │
│    - Read PR description, diff, linked issue             │
│    - Check CI/CD status (tests passing?)                 │
│                                                           │
│ 2. Code Review                                           │
│    - TypeScript strict mode compliance                   │
│    - Pattern implementation correctness                  │
│    - Test coverage and quality                           │
│    - Mock data determinism                               │
│    - Network inspector integration                       │
│    - Annotated source clarity                            │
│                                                           │
│ 3. Decision                                              │
│    ┌─────────────────┐         ┌──────────────────┐     │
│    │ Standards Met?  │───Yes──>│ Approve + Merge  │     │
│    └─────────────────┘         └──────────────────┘     │
│            │                                             │
│            No                                            │
│            ▼                                             │
│    ┌──────────────────┐                                 │
│    │ Request Changes  │                                 │
│    │ (detailed)       │                                 │
│    └──────────────────┘                                 │
│                                                           │
│ 4. Post-Merge                                            │
│    - Move ticket to Done                                 │
│    - Close feature branch                                │
│    - Add summary comment                                 │
└──────────────────────────────────────────────────────────┘
```

**Outcome**: PR merged to main OR changes requested with feedback

---

## Project Board Columns

```
┌──────────┐   ┌───────┐   ┌─────────────┐   ┌───────────┐   ┌──────┐
│ Backlog  │──>│ Ready │──>│ In Progress │──>│ In Review │──>│ Done │
└──────────┘   └───────┘   └─────────────┘   └───────────┘   └──────┘
     │
     │
     ▼
┌──────────┐
│ Icebox   │ (Future / Out of Scope)
└──────────┘
```

### Column Definitions

**Backlog**:
- Issues that are defined but not yet prioritized
- May need refinement before moving to Ready
- Reviewed weekly by agile-backlog-prioritizer

**Ready**:
- **Well-defined**, **high-priority**, **unblocked** tickets
- Maintained at 2-5 tickets by agile-backlog-prioritizer
- **ONLY source** for github-ticket-worker to pick from
- Each ticket has: acceptance criteria, effort estimate, dependencies documented

**In Progress**:
- Ticket currently being implemented by github-ticket-worker
- Feature branch created
- Work actively happening
- Maximum 1 ticket per agent at a time (no multitasking)

**In Review**:
- PR created and linked to ticket
- Awaiting review by pr-reviewer-merger
- May have review feedback to address
- Tests must be passing

**Done**:
- PR merged to main
- Feature available in main branch
- Ticket closed
- Success!

**Icebox**:
- Out of scope for current roadmap phase
- Future enhancements
- Good ideas but not current priorities
- Revisited quarterly during roadmap planning

---

## Epic and Sub-Issue Structure

### Epic Example
```markdown
Epic #10: Foundational Patterns
├── #42: Chain-of-Reasoning Pattern
├── #43: Agent Await Prompt Pattern
└── #44: Tabular Stream View Pattern
```

### Epic Management
- **agile-backlog-prioritizer** creates and maintains epics
- Epics group related patterns or infrastructure work
- Each epic has:
  - Vision statement
  - List of sub-issues
  - Dependencies
  - Success criteria
  - Educational progression order

### Sub-Issue Requirements
- Each sub-issue can be implemented independently
- Must have: acceptance criteria, estimate, dependencies
- Linked to parent epic via GitHub relationships
- Prioritized within epic based on learning progression

---

## Quality Gates (Enforced by Agents)

### Gate 1: Ready Column Entry
**Enforced by**: `agile-backlog-prioritizer`

Ticket must have:
- [ ] Clear title and description
- [ ] Acceptance criteria (specific, testable)
- [ ] Effort estimate (in days)
- [ ] Priority label (P0/P1/P2/P3)
- [ ] Strategic alignment (maps to PRD/Roadmap phase)
- [ ] Dependencies documented (and resolved or in-progress)
- [ ] Technical guidance (files to modify, architecture notes)

### Gate 2: Pull Request Creation
**Enforced by**: `github-ticket-worker`

PR must have:
- [ ] All tests pass
- [ ] Coverage >80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Build succeeds
- [ ] Detailed PR description (summary, changes, testing)
- [ ] Linked to ticket

### Gate 3: Merge to Main
**Enforced by**: `pr-reviewer-merger`

PR must pass:
- [ ] Code quality review (readability, maintainability)
- [ ] TypeScript strict mode compliance
- [ ] Pattern implementation correctness
- [ ] Test coverage and quality
- [ ] Mock data determinism
- [ ] Network inspector integration
- [ ] Annotated source clarity
- [ ] Security (no XSS, injection vulnerabilities)
- [ ] Accessibility (keyboard nav, ARIA labels)
- [ ] No blocking review feedback

---

## Key Documents Reference

### 1. `docs/PRODUCT-REQUIREMENTS.md`
**Audience**: Product team, stakeholders, agents
**Purpose**: Define WHAT we're building and WHY
**Key Sections**:
- Product vision and goals
- Target audience and user needs
- Feature list (MVP vs. future)
- Success metrics
- Out of scope items

**Used by**:
- `agile-backlog-prioritizer`: To ensure tickets align with product goals
- `github-ticket-worker`: To understand feature context
- `pr-reviewer-merger`: To validate feature value

---

### 2. `docs/PRODUCT-ROADMAP.md`
**Audience**: Product team, engineering team, agents
**Purpose**: Define WHEN we're building it and in what ORDER
**Key Sections**:
- Strategic themes by quarter
- Phases and milestones with dates
- Epic definitions
- Critical path
- Dependencies and risks

**Used by**:
- `agile-backlog-prioritizer`: To prioritize work by roadmap phase
- All agents: To understand current phase and milestone targets

---

### 3. `CLAUDE.md`
**Audience**: Engineering team, agents
**Purpose**: Define HOW we're building it (architecture and code standards)
**Key Sections**:
- Technology stack
- Project structure
- Architecture principles
- Code standards (TypeScript, React, testing)
- Pattern implementation guide

**Used by**:
- `github-ticket-worker`: To implement features correctly
- `pr-reviewer-merger`: To review code against standards

---

### 4. `.claude/agents/`
**Audience**: Claude Code agents
**Purpose**: Define agent behaviors and policies
**Files**:
- `github-ticket-worker.md`: Implementation agent
- `pr-reviewer-merger.md`: Review agent
- `agile-backlog-prioritizer.md`: Backlog management agent

**Used by**: Claude Code to instantiate agents with correct policies

---

### 5. `.claude/settings.local.json`
**Audience**: Claude Code
**Purpose**: Define permissions for agents
**Key Sections**:
- Allowed bash commands (npm, git, gh)
- MCP permissions (GitHub, Memory, Sequential Thinking)
- WebFetch domains
- File read permissions

---

## MCP Servers (Critical Infrastructure)

### 1. GitHub MCP (CRITICAL)
**Why**: Agents need native GitHub operations
**Capabilities**:
- Move issues between board columns
- Create and update PRs
- Review and merge code
- Search issues and code

**Setup**:
```bash
claude mcp install github
gh auth login
```

---

### 2. Memory MCP (HIGHLY RECOMMENDED)
**Why**: Persist decisions and context across sessions
**Capabilities**:
- Store prioritization rationale
- Remember pattern dependencies
- Track backlog health over time
- Share context between agents

**Setup**:
```bash
claude mcp install memory
```

**Example Use**:
```typescript
// Store CD3 analysis for Issue #42
mcp__memory__create_entities({
  entities: [{
    name: "Issue #42 Priority Analysis",
    observations: [
      "CD3: 8/10 (high learning value / 2 days)",
      "Critical for MVP milestone",
      "Moved to Ready on 2024-11-09"
    ]
  }]
});
```

---

### 3. Sequential Thinking MCP (RECOMMENDED)
**Why**: Enhanced reasoning for complex decisions
**Capabilities**:
- Break down complex problems
- Reason through trade-offs
- Plan implementation strategies

**Setup**:
```bash
claude mcp install sequential-thinking
```

---

## Recommended Slash Commands (To Create)

### `/groom-backlog`
**Purpose**: Run backlog grooming session
**Agent**: `agile-backlog-prioritizer`
**Output**: Ready column populated, backlog health report

---

### `/next-ticket`
**Purpose**: Pick and start next ticket from Ready
**Agent**: `github-ticket-worker`
**Output**: Feature branch created, ticket in In Progress

---

### `/review-pr <number>`
**Purpose**: Review and potentially merge a PR
**Agent**: `pr-reviewer-merger`
**Output**: PR approved + merged OR changes requested

---

### `/check-milestone <name>`
**Purpose**: Check progress toward milestone
**Agent**: `agile-backlog-prioritizer`
**Output**: Completion %, blockers, ETA

---

### `/create-pattern <name>`
**Purpose**: Scaffold a new pattern
**Output**: Directory structure + boilerplate files

---

## Complete Workflow Example

### Scenario: Implement "Chain of Reasoning" Pattern

#### Step 1: Groom Backlog
```bash
> /groom-backlog

[agile-backlog-prioritizer agent]
✓ Read PRODUCT-REQUIREMENTS.md
✓ Read PRODUCT-ROADMAP.md
✓ Current phase: Foundation (MVP Core)
✓ Analyzed 12 backlog tickets
✓ Moved to Ready:
  - #42: Chain-of-Reasoning Pattern (P0, 4 days, CD3: 8/10)
  - #43: Agent Await Prompt (P0, 4 days, CD3: 7/10)
  - #15: Mock Streaming Infrastructure (P0, 4 days, CD3: 9/10)

Ready column now has 3 tickets. Board is healthy.
```

---

#### Step 2: Start Work
```bash
> /next-ticket

[github-ticket-worker agent]
✓ Selected ticket: #42 Chain-of-Reasoning Pattern
✓ Created branch: feature/issue-42-chain-of-reasoning
✓ Moved ticket to In Progress
✓ Reading pattern spec: /patterns/chain-of-reasoning-guide/README.md

Starting implementation...
```

---

#### Step 3: Implementation
```
[github-ticket-worker agent]
✓ Created src/patterns/chain-of-reasoning/
✓ Implemented components: ChainOfReasoningDemo.tsx, ReasoningBeadline.tsx
✓ Created mockStream.ts with sprint planning fixture
✓ Built useReasoningStream hook
✓ Added network inspector integration
✓ Wrote 12 tests (coverage: 87%)
✓ All tests pass

Ready to create PR...
```

---

#### Step 4: Create Pull Request
```
[github-ticket-worker agent]
✓ git add .
✓ git commit -m "[#42] Implement chain-of-reasoning pattern with sprint planning demo"
✓ git push origin feature/issue-42-chain-of-reasoning
✓ gh pr create --title "[#42] Chain-of-Reasoning Pattern"

PR #123 created: https://github.com/vibeacademy/streaming-patterns/pull/123
✓ Moved ticket #42 to In Review
```

---

#### Step 5: Code Review
```bash
> /review-pr 123

[pr-reviewer-merger agent - DIFFERENT instance]
✓ Fetched PR #123 and linked issue #42
✓ Read diff: 8 files changed, +847 -0

Code Review Checklist:
✓ TypeScript strict mode compliance
✓ No `any` types
✓ Tests pass (87% coverage)
✓ Pattern matches spec from README.md
✓ Mock data is deterministic
✓ Network inspector shows reasoning + answer events
✓ Annotated source explains useReasoningStream
✓ No security issues
✓ Accessibility: keyboard nav works

✅ APPROVED

✓ Merged PR #123 to main
✓ Closed branch feature/issue-42-chain-of-reasoning
✓ Moved ticket #42 to Done

Great work! Pattern implementation is excellent. Particularly impressed with the educational annotations in the source code.
```

---

## Monitoring and Metrics

### Backlog Health Metrics
(Tracked by `agile-backlog-prioritizer`)

- Total tickets by status
- % tickets with complete acceptance criteria
- % tickets mapped to roadmap phases
- Average ticket age
- CD3 score distribution

### Development Velocity
(Tracked manually or via GitHub Insights)

- Tickets completed per week
- Average time in each column
- PR merge rate
- Test coverage trend

### Quality Metrics
(Tracked by `pr-reviewer-merger`)

- % PRs approved on first review
- Average PR feedback items
- Test coverage by pattern
- Build failures per week

---

## Troubleshooting

### Problem: Ready Column is Empty
**Solution**: Run `/groom-backlog` to populate it

---

### Problem: Agent Picked Ticket from Backlog
**Error**: This violates agent policy
**Solution**: Ticket must be in Ready before work can begin. Move it to Ready via agile-backlog-prioritizer.

---

### Problem: PR Blocked Because Tests Fail
**Solution**: Fix tests locally, push updated code, review will re-run

---

### Problem: Agent Merged Own PR
**Error**: This violates separation of duties
**Solution**: Use different agent instance for review. Never review code you wrote.

---

### Problem: Ticket Missing Acceptance Criteria
**Solution**: Move back to Backlog, add criteria, then agile-backlog-prioritizer will reassess for Ready

---

## Next Steps

### Immediate (Phase 0: Setup)
1. ✅ Agent policies created
2. ✅ Product documents created (PRD, Roadmap, CLAUDE.md)
3. ⏳ Install critical MCPs (GitHub, Memory, Sequential Thinking)
4. ⏳ Create slash commands (/groom-backlog, /next-ticket, /review-pr)
5. ⏳ Populate project board with initial tickets

### Short-Term (Phase 1: Foundation)
1. Implement mock streaming infrastructure
2. Build network inspector
3. Create base UI components
4. Set up CI/CD (GitHub Actions)

### Long-Term (Phases 2-4)
1. Implement all 7 patterns
2. Polish UX and accessibility
3. Complete documentation
4. Public launch

---

## Resources

- GitHub Project Board: https://github.com/orgs/vibeacademy/projects/3
- Repository: https://github.com/vibeacademy/streaming-patterns
- Product Requirements: `docs/PRODUCT-REQUIREMENTS.md`
- Product Roadmap: `docs/PRODUCT-ROADMAP.md`
- Architecture Standards: `CLAUDE.md`
- Recommended Tooling: `docs/RECOMMENDED-TOOLING.md`

---

## Questions?

For questions about:
- **Product strategy**: See `docs/PRODUCT-REQUIREMENTS.md` and `docs/PRODUCT-ROADMAP.md`
- **Technical standards**: See `CLAUDE.md`
- **Agent workflow**: This document
- **Tooling**: See `docs/RECOMMENDED-TOOLING.md`

---

**Last Updated**: Nov 9, 2024
