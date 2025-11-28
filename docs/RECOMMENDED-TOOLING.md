# Recommended Tooling: MCPs, Skills, and Commands

This document outlines recommended Model Context Protocol (MCP) servers, skills, and slash commands that enhance the agent-based development workflow for the Streaming Patterns Library.

---

## Model Context Protocol (MCP) Servers

MCPs provide agents with specialized capabilities for interacting with external systems. The following MCPs are recommended and have been configured in `.claude/settings.local.json`.

### 1. GitHub MCP Server (CRITICAL)
**Purpose**: Native GitHub operations for issues, PRs, and project boards

**Capabilities**:
- Query project board state
- Create, update, and move issues between columns
- Read and create pull requests
- Review and merge PRs
- Search code and issues
- Read file contents from repository

**Required Permissions** (already configured):
```json
{
  "permissions": {
    "allow": [
      "mcp__github__search_issues",
      "mcp__github__get_issue",
      "mcp__github__issue_read",
      "mcp__github__issue_write",
      "mcp__github__get_issue_comments",
      "mcp__github__add_issue_comment",
      "mcp__github__list_issues",
      "mcp__github__update_issue",
      "mcp__github__create_pull_request",
      "mcp__github__pull_request_read",
      "mcp__github__pull_request_review_write",
      "mcp__github__merge_pull_request",
      "mcp__github__update_pull_request",
      "mcp__github__get_file_contents",
      "mcp__github__list_commits",
      "mcp__github__search_pull_requests",
      "mcp__github__get_commit",
      "mcp__github__get_me"
    ]
  }
}
```

**Why Critical**:
- Agents need to move issues between board columns (Backlog → Ready → In Progress → In Review → Done)
- `github-ticket-worker` creates PRs and links them to issues
- `pr-reviewer` reviews and merges PRs
- `agile-backlog-prioritizer` manages board state

**Setup**:
Install the GitHub MCP server via Claude Code settings:
```bash
claude mcp install github
```

Authenticate with GitHub:
```bash
gh auth login
```

---

### 2. Memory MCP Server (HIGHLY RECOMMENDED)
**Purpose**: Persistent knowledge storage across agent sessions

**Capabilities**:
- Store prioritization decisions and rationale
- Remember pattern dependencies and relationships
- Track backlog health metrics over time
- Share context between agents

**Required Permissions** (already configured):
```json
{
  "permissions": {
    "allow": [
      "mcp__memory__create_entities",
      "mcp__memory__create_relations",
      "mcp__memory__search_nodes",
      "mcp__memory__open_nodes"
    ]
  }
}
```

**Use Cases**:
- **agile-backlog-prioritizer**: Store CD3 scores, remember why tickets were prioritized/deferred
- **github-ticket-worker**: Remember implementation decisions for related tickets
- **pr-reviewer**: Track common review feedback patterns

**Example Usage**:
```typescript
// Store prioritization decision
mcp__memory__create_entities({
  entities: [{
    name: "Issue #42 Prioritization",
    entityType: "decision",
    observations: [
      "CD3 score: 8/10 (high learning value / 2 day effort)",
      "Critical for MVP milestone",
      "Depends on mock streaming infrastructure (#15)",
      "Moved to Ready on Nov 10, 2024"
    ]
  }]
});

// Create relationship
mcp__memory__create_relations({
  relations: [{
    from: "Issue #42",
    to: "Issue #15",
    relationType: "depends_on"
  }]
});
```

**Setup**:
```bash
claude mcp install memory
```

---

### 3. Sequential Thinking MCP (RECOMMENDED)
**Purpose**: Enhanced reasoning for complex planning and architecture decisions

**Capabilities**:
- Break down complex problems into steps
- Reason through architectural trade-offs
- Plan implementation strategies

**Required Permissions** (already configured):
```json
{
  "permissions": {
    "allow": [
      "mcp__sequential-thinking__sequentialthinking"
    ]
  }
}
```

**Use Cases**:
- **agile-backlog-prioritizer**: Reason through complex prioritization decisions
- **github-ticket-worker**: Plan implementation approach for complex patterns
- **pr-reviewer**: Analyze architectural implications of PRs

**Setup**:
```bash
claude mcp install sequential-thinking
```

---

## Recommended Skills

Skills are reusable agent capabilities. The following skills would enhance this project (to be created as custom skills):

### 1. `pattern-implementer` Skill (TO CREATE)
**Purpose**: Guided walkthrough for implementing a new streaming pattern

**Workflow**:
1. Read pattern specification from `/patterns/{name}/README.md`
2. Generate file structure (types, fixtures, hooks, components, tests)
3. Scaffold TypeScript interfaces from pattern spec
4. Create fixture data from demo scenario
5. Generate test cases from acceptance criteria

**Usage**:
```bash
/pattern-implementer chain-of-reasoning
```

**Benefits**:
- Reduces boilerplate for new patterns
- Ensures consistency across patterns
- Educational for new contributors

---

### 2. `pr-checklist` Skill (TO CREATE)
**Purpose**: Automated PR review checklist

**Workflow**:
1. Read PR diff and linked issue
2. Check TypeScript strict mode compliance
3. Verify test coverage >80%
4. Confirm pattern matches specification
5. Check network inspector integration
6. Generate review report

**Usage**:
```bash
/pr-checklist 123
```

**Benefits**:
- Consistent review standards
- Faster reviews
- Educational feedback

---

### 3. `demo-validator` Skill (TO CREATE)
**Purpose**: Validate pattern demo completeness

**Workflow**:
1. Check fixture data is deterministic
2. Verify network inspector captures all events
3. Test annotated source viewer
4. Validate accessibility (keyboard nav, ARIA labels)
5. Performance check (no jank, <16ms renders)

**Usage**:
```bash
/demo-validator patterns/chain-of-reasoning
```

---

## Recommended Slash Commands

Slash commands provide quick access to common workflows. The following commands should be created in `.claude/commands/`.

### 1. `/work-ticket` Command
**Purpose**: Automatically pick the next ticket from Ready column and start work

**File**: `.claude/commands/work-ticket.md`
```markdown
---
description: Pick the next ticket from the Ready column and start implementing it
---

Use the Task tool to launch the github-ticket-worker agent to select the top ticket from the Ready column on the project board at https://github.com/orgs/vibeacademy/projects/3 and begin implementation.

Before starting, verify:
1. The ticket is in the Ready column (not Backlog or In Progress)
2. The ticket has complete acceptance criteria
3. All dependencies are resolved

Then:
1. Create a feature branch
2. Move the ticket to In Progress
3. Begin implementation
```

**Usage**:
```bash
/work-ticket
```

---

### 2. `/review-pr` Command
**Purpose**: Review a pull request and merge if approved

**File**: `.claude/commands/review-pr.md`
```markdown
---
description: Review a pull request and merge if it meets quality standards
---

Use the Task tool to launch the pr-reviewer agent to review the specified pull request.

The agent will:
1. Read the PR diff and linked issue
2. Check code quality and TypeScript compliance
3. Verify tests pass with >80% coverage
4. Validate pattern implementation
5. Approve and merge if standards are met, or request changes with detailed feedback
6. Move the linked issue to Done if merged

Usage: /review-pr <PR number>
```

**Usage**:
```bash
/review-pr 42
```

---

### 3. `/groom-backlog` Command
**Purpose**: Run a backlog grooming session

**File**: `.claude/commands/groom-backlog.md`
```markdown
---
description: Perform a comprehensive backlog grooming session
---

Use the Task tool to launch the agile-backlog-prioritizer agent to perform a backlog grooming session.

The agent will:
1. Read PRODUCT-REQUIREMENTS.md and PRODUCT-ROADMAP.md for strategic alignment
2. Review all tickets in Backlog for quality and relevance
3. Apply CD3 (Cost of Delay / Duration) analysis
4. Move top-priority, well-defined tickets to Ready
5. Flag tickets needing refinement
6. Close or move stale tickets to Icebox
7. Generate backlog health report

The Ready column will be populated with 2-5 high-value, unblocked tickets.
```

**Usage**:
```bash
/groom-backlog
```

---

### 4. `/create-pattern` Command
**Purpose**: Initialize a new pattern with scaffolding

**File**: `.claude/commands/create-pattern.md`
```markdown
---
description: Create scaffolding for a new streaming pattern
---

Create a new streaming pattern directory structure with all necessary files.

Usage: /create-pattern <pattern-name>

This command will:
1. Create directory: src/patterns/<pattern-name>/
2. Generate files:
   - <Pattern>Demo.tsx (main demo component)
   - mockStream.ts (stream generator)
   - fixtures.ts (demo data)
   - hooks.ts (custom hook)
   - types.ts (TypeScript interfaces)
   - README.md (pattern documentation from /patterns/<pattern-name>/README.md)
   - <Pattern>Demo.test.tsx (test file)
3. Update routing to include new pattern
4. Add pattern to home page list

Example:
/create-pattern chain-of-reasoning
```

**Usage**:
```bash
/create-pattern multi-turn-memory-timeline
```

---

### 5. `/check-milestone` Command
**Purpose**: Check progress toward a roadmap milestone

**File**: `.claude/commands/check-milestone.md`
```markdown
---
description: Check progress toward a roadmap milestone
---

Use the agile-backlog-prioritizer agent to assess progress toward a specific milestone defined in docs/PRODUCT-ROADMAP.md.

The agent will:
1. List all issues associated with the milestone
2. Calculate completion percentage
3. Identify blockers and risks
4. Estimate completion date based on velocity
5. Recommend actions to get back on track if behind

Usage: /check-milestone <milestone-name>

Example:
/check-milestone "Foundation Complete"
```

**Usage**:
```bash
/check-milestone "Foundation Complete"
```

---

## Additional Bash Permissions

The following bash commands are pre-approved in `.claude/settings.local.json`:

### Development Commands
```bash
npm install        # Install dependencies
npm run dev        # Start dev server
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Lint code
npx <command>      # Run npm packages
```

### Git Commands
```bash
git status
git checkout -b feature/issue-123-description
git add .
git commit -m "[#123] Description"
git push origin feature/issue-123-description
```

### GitHub CLI Commands
```bash
gh issue list
gh issue view 123
gh pr create
gh pr view 123
gh pr review 123
gh pr merge 123
gh project view 3 --owner vibeacademy
```

### Utility Commands
```bash
ls, pwd, cat, echo, grep, jq
mkdir, rm, mv, cp, chmod
find, curl
open http://localhost:*
```

---

## Recommended Additional MCPs (Optional)

### 1. Filesystem MCP
**Purpose**: Advanced file operations

**Use Cases**:
- Bulk file operations
- Pattern scaffolding
- Code generation

**Setup**:
```bash
claude mcp install filesystem
```

---

### 2. Browserbase MCP
**Purpose**: Automated browser testing for pattern demos

**Use Cases**:
- Visual regression testing
- Accessibility audits
- Screenshot generation for documentation

**Setup**:
```bash
claude mcp install browserbase
```

---

### 3. Linear MCP (if migrating from GitHub Projects)
**Purpose**: Alternative project management

**Note**: Currently using GitHub Projects, but Linear MCP could be useful if the team prefers Linear for project management.

---

## WebFetch Domains (Allowed)

The following domains are pre-approved for WebFetch operations:

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:github.com)",
      "WebFetch(domain:docs.claude.com)",
      "WebFetch(domain:react.dev)",
      "WebFetch(domain:vitejs.dev)",
      "WebFetch(domain:vitest.dev)",
      "WebFetch(domain:typescript-eslint.io)",
      "WebFetch(domain:npmjs.com)"
    ]
  }
}
```

**Use Cases**:
- Fetch documentation when implementing patterns
- Look up library APIs
- Research React/TypeScript best practices

---

## WebSearch (Enabled)

WebSearch is enabled for agents to research:
- Latest React patterns and best practices
- TypeScript type definitions
- UI/UX patterns for streaming interfaces
- Accessibility guidelines
- Performance optimization techniques

---

## Summary of Critical Tooling

### Must Have (Already Configured)
- ✅ **GitHub MCP**: For issue/PR management and board operations
- ✅ **Memory MCP**: For cross-session knowledge persistence
- ✅ **Sequential Thinking MCP**: For complex reasoning
- ✅ **Bash permissions**: For npm, git, gh CLI
- ✅ **WebFetch domains**: For documentation lookup

### Recommended to Create
- ✅ `/work-ticket` command: Quick access to next work item (implemented)
- ✅ `/review-pr` command: Streamlined PR review process (implemented)
- ✅ `/groom-backlog` command: Regular backlog maintenance (implemented)
- 🔨 `/create-pattern` command: Pattern scaffolding
- 🔨 `/check-milestone` command: Check milestone progress
- 🔨 `pattern-implementer` skill: Guided pattern implementation
- 🔨 `pr-checklist` skill: Automated review checklist
- 🔨 `demo-validator` skill: Demo completeness verification

### Nice to Have (Optional)
- ⭐ Filesystem MCP: Advanced file operations
- ⭐ Browserbase MCP: Automated browser testing
- ⭐ Custom GitHub Actions: CI/CD automation

---

## Getting Started Checklist

To set up the full tooling environment:

### 1. Install MCP Servers
```bash
# GitHub MCP (CRITICAL)
claude mcp install github
gh auth login

# Memory MCP (HIGHLY RECOMMENDED)
claude mcp install memory

# Sequential Thinking MCP (RECOMMENDED)
claude mcp install sequential-thinking
```

### 2. Verify Permissions
Check that `.claude/settings.local.json` has all required permissions (already configured in this project).

### 3. Create Slash Commands
Create the recommended commands in `.claude/commands/`:
- ✅ `work-ticket.md` (implemented)
- ✅ `review-pr.md` (implemented)
- ✅ `groom-backlog.md` (implemented)
- 🔨 `create-pattern.md` (to be implemented)
- 🔨 `check-milestone.md` (to be implemented)

### 4. Test Workflow
```bash
# Test the full workflow
/groom-backlog              # Populate Ready column
/work-ticket                # Pick a ticket and start work
# ... implement feature ...
# ... create PR ...
/review-pr                  # Review and merge
```

### 5. Monitor and Improve
- Track which MCPs/commands are most used
- Identify bottlenecks in the workflow
- Create additional skills/commands as needed

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  agile-backlog-prioritizer (via /groom-backlog)             │
│  - Reads PRODUCT-REQUIREMENTS.md & PRODUCT-ROADMAP.md       │
│  - Applies CD3 analysis to Backlog tickets                  │
│  - Moves top tickets to Ready column                        │
│  - Uses Memory MCP to store decisions                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  github-ticket-worker (via /work-ticket)                    │
│  - Uses GitHub MCP to get top ticket from Ready             │
│  - Creates feature branch (git)                             │
│  - Moves ticket to In Progress (GitHub MCP)                 │
│  - Implements pattern (follows CLAUDE.md standards)         │
│  - Runs tests (npm test)                                    │
│  - Creates PR (gh pr create)                                │
│  - Moves ticket to In Review (GitHub MCP)                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  pr-reviewer (via /review-pr)                        │
│  - Uses GitHub MCP to read PR and linked issue              │
│  - Reviews code quality, tests, pattern implementation      │
│  - Approves and merges if standards met                     │
│  - Moves ticket to Done (GitHub MCP)                        │
│  - Uses Memory MCP to track review patterns                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ **Install Critical MCPs**: GitHub, Memory, Sequential Thinking (configured)
2. ✅ **Core Slash Commands Created**: `/work-ticket`, `/review-pr`, `/groom-backlog` (implemented)
3. 🔨 **Create Additional Commands**: `/create-pattern`, `/check-milestone`
4. **Run First Workflow**: Groom backlog → Pick ticket → Implement → Review → Merge
5. **Iterate**: Add more skills/commands as patterns emerge

---

**Last Updated**: Nov 9, 2024
