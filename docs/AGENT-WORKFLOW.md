# Agent Workflow

## Three-Stage Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT BOARD COLUMNS                                │
│  Backlog → Ready → In Progress → In Review → Done                           │
└─────────────────────────────────────────────────────────────────────────────┘

Stage 1: AGILE-BACKLOG-PRIORITIZER
├── Manages Backlog and Ready columns
├── Prioritizes tickets using CD3 analysis
├── Ensures ticket quality (acceptance criteria, estimates, etc.)
├── Moves well-defined tickets to Ready column
└── CANNOT: Work on code, create PRs, merge

Stage 2: GITHUB-TICKET-WORKER (as va-worker)
├── Picks top ticket from Ready column
├── Moves ticket to In Progress
├── Creates feature branch: feature/issue-{number}-description
├── Implements the ticket following CLAUDE.md standards
├── Runs tests, ensures quality
├── Creates PR linked to issue
├── Moves ticket to In Review
└── CANNOT: Merge PRs, move to Done, push to main

Stage 3: PR-REVIEWER (as va-reviewer)
├── Reviews PRs for issues in In Review column
├── Verifies code quality, tests, TypeScript compliance
├── Posts detailed GO/NO-GO review comment
├── CANNOT: Review own code, merge PRs, move to Done

Stage 4: HUMAN
├── Reviews agent's GO/NO-GO recommendation
├── Performs final approval
├── Merges PR
├── Moves ticket to Done
└── ONLY human can merge and close issues
```

## Key Constraints

| Agent | Can Do | Cannot Do |
|-------|--------|-----------|
| **Backlog Prioritizer** | Groom backlog, move to Ready, update tickets | Write code, create PRs |
| **Ticket Worker** | Implement code, create branches, create PRs, move to In Progress/In Review | Merge, move to Done, push to main |
| **PR Reviewer** | Review PRs, post comments, approve/request changes | Review own code, merge, move to Done |
| **Human** | Everything | - |

## GitHub Account Separation

- **va-worker**: Creates PRs (ticket worker)
- **va-reviewer**: Reviews PRs (PR reviewer)
- **Human**: Merges PRs, final authority

This separation ensures audit trails and prevents self-review.

## Detailed Agent Responsibilities

### Agile Backlog Prioritizer

**Primary Role**: Product Owner and Agile Coach

**Responsibilities**:
- Cost of Delay (CD3) analysis for prioritization
- Backlog grooming and ticket quality enforcement
- Ready column management (maintain 2-5 items)
- Epic management and dependency tracking
- Strategic alignment with PRODUCT-REQUIREMENTS.md and PRODUCT-ROADMAP.md

**Definition of Ready** (tickets must have):
- Clear, specific title
- Detailed description with context
- Acceptance criteria (specific, testable)
- Effort estimate (in days)
- Priority label (P0/P1/P2/P3)
- Links to pattern specification or epic
- Technical guidance (files to modify, components to create)
- No unresolved blockers

### GitHub Ticket Worker

**Primary Role**: Senior Frontend Engineer

**GitHub Account**: `va-worker`

**Workflow**:
1. Read ticket from Ready column
2. Create feature branch: `feature/issue-{number}-short-description`
3. Move ticket to In Progress
4. Implement following CLAUDE.md standards
5. Run tests (`npm test`, `npm run lint`, `npm run build`)
6. Commit with message format: `[#issue] Short summary`
7. Push branch and create PR
8. Move ticket to In Review
9. **STOP** - Wait for PR Reviewer

**PR Description Template**:
```markdown
## Ticket
Closes #123

## Summary
[2-3 sentence summary]

## Changes Made
- [Bullet list of changes]

## Testing
- [ ] Unit tests pass
- [ ] Component tests pass
- [ ] Coverage meets threshold

## Checklist
- [ ] All tests pass
- [ ] TypeScript strict mode
- [ ] No eslint warnings
- [ ] Built successfully
```

### PR Reviewer

**Primary Role**: Staff Engineer / Tech Lead

**GitHub Account**: `va-reviewer`

**Review Checklist**:
- TypeScript strict mode compliance (no `any` types)
- All tests pass, coverage ≥ 80%
- Build succeeds
- Code follows CLAUDE.md standards
- Pattern implementation matches specification
- Educational value is clear
- No security vulnerabilities

**Output**: Detailed GO/NO-GO review comment

**GO Criteria** (ALL must be true):
- All tests pass
- No TypeScript errors
- Build succeeds
- Pattern implementation correct
- Code quality standards met
- Documentation complete

### Human Reviewer

**Final Authority**

**Responsibilities**:
- Review agent's GO/NO-GO recommendation
- Perform final code review if needed
- Click "Merge" button
- Move ticket to Done column
- Close issues

## Escalation Paths

### Ticket Worker Escalates When:
- Requirements are ambiguous
- Architectural changes needed beyond CLAUDE.md
- Tests consistently fail
- Blockers outside their control

### PR Reviewer Escalates When:
- Architectural changes affect multiple patterns
- Pattern implementation unclear
- Performance impact significant
- Breaking changes require coordination

### Backlog Prioritizer Escalates When:
- Backlog doesn't match PRD/Roadmap
- Scope creep detected
- Milestone at risk
- Product documentation outdated

## Anti-Patterns (What NOT to Do)

1. **Never** merge PRs without human approval
2. **Never** move tickets to Done (human only)
3. **Never** push directly to main branch
4. **Never** review your own code
5. **Never** work on tickets not in Ready column
6. **Never** skip tests or quality checks
7. **Never** leave tickets in In Progress without active work
