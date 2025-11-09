# Agent-Driven Development Workflow Setup Guide

**Last Updated**: November 9, 2025
**Author**: Teddy Kim
**Project**: Streaming Patterns Library

This document explains the complete agent-driven development workflow that automates issue management, development, code review, and deployment using Claude Code agents and GitHub MCP (Model Context Protocol).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Agent Configuration](#agent-configuration)
6. [Workflow Components](#workflow-components)
7. [Complete Workflow Cycle](#complete-workflow-cycle)
8. [Commands Reference](#commands-reference)
9. [Initializing in a New Project](#initializing-in-a-new-project)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Agent-Driven Development?

Agent-driven development uses AI agents to automate the entire software development lifecycle:

- **Backlog Management**: Agents prioritize and organize work
- **Development**: Agents implement features from specifications
- **Code Review**: Agents review code against project standards
- **Deployment**: Agents merge and deploy approved changes

### Why This Approach?

**Benefits**:
- **Consistent Quality**: Automated enforcement of coding standards
- **Velocity**: Parallel agent execution speeds up development
- **Documentation**: All decisions and changes are tracked
- **Scalability**: Add more agents as project complexity grows
- **Reproducibility**: Same workflow across all projects

**Key Principle**: The project board is the **single source of truth** for work status.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  - Source Code                                               │
│  - Issues (#22, #23, etc.)                                   │
│  - Pull Requests                                             │
│  - Project Board (vibeacademy/projects/3)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              GitHub MCP (Model Context Protocol)             │
│  - mcp__github__create_issue                                 │
│  - mcp__github__update_issue                                 │
│  - mcp__github__create_pull_request                         │
│  - mcp__github__merge_pull_request                          │
│  - mcp__github__get_pull_request                            │
│  - Project board operations                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code CLI                           │
│  - Task tool (launches agents)                               │
│  - Slash commands (/work-ticket, /review-pr, etc.)          │
│  - File operations (Read, Write, Edit)                       │
│  - Git operations (Bash tool)                                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Specialized Agents                         │
│  1. agile-backlog-prioritizer                               │
│  2. github-ticket-worker                                     │
│  3. pr-reviewer-merger                                       │
└─────────────────────────────────────────────────────────────┘
```

### The Three Core Agents

#### 1. **agile-backlog-prioritizer**
- **Role**: Product Owner / Scrum Master
- **Responsibilities**:
  - Analyze and prioritize backlog tickets
  - Move tickets to Ready column
  - Ensure tickets meet Definition of Ready
  - Identify dependencies and blockers
  - Apply CD3 scoring (Confidence, Dependency, Deliverability)

#### 2. **github-ticket-worker**
- **Role**: Software Developer
- **Responsibilities**:
  - Pick tickets ONLY from Ready column
  - Move ticket to In Progress
  - Create feature branch
  - Implement feature per acceptance criteria
  - Write tests (>80% coverage)
  - Create pull request
  - Move ticket to In Review

#### 3. **pr-reviewer-merger**
- **Role**: Code Reviewer / Tech Lead
- **Responsibilities**:
  - Review PRs linked to In Review tickets
  - Verify code quality and standards
  - Approve or request changes
  - Merge approved PRs
  - Move completed tickets to Done

---

## Prerequisites

### Required Tools

1. **Claude Code CLI** (Anthropic)
   ```bash
   # Install via npm
   npm install -g @anthropic-ai/claude-code

   # Or use the desktop app
   ```

2. **GitHub CLI** (`gh`)
   ```bash
   # macOS
   brew install gh

   # Authenticate
   gh auth login
   ```

3. **Node.js & npm** (v20+)
   ```bash
   node --version  # Should be v20 or higher
   npm --version
   ```

4. **Git**
   ```bash
   git --version
   ```

### Required Permissions

- **GitHub**:
  - Repository admin access (for creating issues, PRs, merging)
  - Organization project board access
  - Personal access token with `repo`, `project`, `workflow` scopes

- **Claude Code**:
  - API key from Anthropic
  - MCP server access to GitHub

---

## Initial Setup

### Step 1: Create GitHub Repository

```bash
# Create new repository
gh repo create vibeacademy/streaming-patterns --public

# Clone repository
git clone https://github.com/vibeacademy/streaming-patterns.git
cd streaming-patterns
```

### Step 2: Create GitHub Project Board

1. Navigate to: `https://github.com/orgs/vibeacademy/projects`
2. Click "New project"
3. Choose "Board" template
4. Name it: "Streaming Patterns"
5. Configure columns:
   - **Backlog** - New issues start here
   - **Ready** - Groomed, ready for development
   - **In Progress** - Active development
   - **In Review** - PR created, awaiting review
   - **Done** - Merged and closed

**Important**: Enable automation to move issues between columns based on status.

### Step 3: Set Up MCP for GitHub

Create or update `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Generate GitHub Token**:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `project`, `workflow`, `read:org`
4. Copy token and add to `mcp.json`

### Step 4: Initialize Project Documentation

Create foundational documents:

```bash
# Project instructions for Claude
touch CLAUDE.md

# Product requirements
mkdir -p docs
touch docs/PRODUCT-REQUIREMENTS.md
touch docs/PRODUCT-ROADMAP.md

# Agent configurations
mkdir -p .claude/agents
mkdir -p .claude/commands
```

---

## Agent Configuration

### Step 5: Create Agent Policy Files

Create `.claude/agents/` directory with agent policy files:

#### `.claude/agents/agile-backlog-prioritizer.md`

```markdown
# Agile Backlog Prioritizer Agent

## Role
You are the Product Owner and Scrum Master for this project.

## Responsibilities
1. Analyze backlog tickets for quality and completeness
2. Prioritize tickets using CD3 methodology (Confidence, Dependency, Deliverability)
3. Move top-priority tickets to Ready column
4. Ensure tickets meet Definition of Ready:
   - Clear description
   - Acceptance criteria defined
   - Dependencies documented
   - Effort estimate included
   - Proper labels applied

## Authority
- Can modify ticket priority
- Can move tickets between Backlog and Ready
- Can request ticket refinement
- CANNOT move tickets to In Progress, In Review, or Done

## Tools Available
- mcp__github__list_issues
- mcp__github__update_issue
- mcp__github__search_issues
- GitHub project board operations

## Workflow
1. Review all Backlog tickets
2. Apply CD3 scoring
3. Move 3-5 highest priority tickets to Ready
4. Document decisions and reasoning
```

#### `.claude/agents/github-ticket-worker.md`

```markdown
# GitHub Ticket Worker Agent

## Role
You are a Software Developer implementing features from specifications.

## Responsibilities
1. Pick ONLY tickets from Ready column (STRICT RULE)
2. Move ticket to In Progress when starting
3. Create feature branch: `feature/issue-{number}-short-description`
4. Implement feature per acceptance criteria
5. Write tests with >80% coverage
6. Create pull request
7. Move ticket to In Review

## Authority
- Can move tickets from Ready → In Progress → In Review
- Can create branches and commits
- Can create pull requests
- CANNOT merge PRs or move tickets to Done

## Tools Available
- Read, Write, Edit (file operations)
- Bash (git commands)
- mcp__github__create_pull_request
- mcp__github__update_issue
- GitHub project board operations

## Workflow
1. Check Ready column for tickets
2. Select top priority ticket
3. Move to In Progress
4. Create branch: `feature/issue-{N}-description`
5. Implement according to CLAUDE.md standards
6. Run tests and verify coverage
7. Create PR with detailed description
8. Move ticket to In Review
```

#### `.claude/agents/pr-reviewer-merger.md`

```markdown
# PR Reviewer and Merger Agent

## Role
You are the Code Reviewer and Tech Lead responsible for quality assurance.

## Responsibilities
1. Review PRs linked to tickets in In Review column
2. Verify code quality against project standards (CLAUDE.md)
3. Check test coverage (must be >80%)
4. Approve or request changes
5. Merge approved PRs
6. Move completed tickets to Done

## Authority
- Can approve or reject PRs
- Can merge approved PRs
- Can move tickets from In Review → Done
- CANNOT review code you wrote (separation of duties)

## Review Checklist
- [ ] All acceptance criteria met
- [ ] TypeScript strict mode compliance (no `any`)
- [ ] Test coverage >80%
- [ ] No security vulnerabilities
- [ ] Code follows CLAUDE.md standards
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)

## Tools Available
- mcp__github__get_pull_request
- mcp__github__get_pull_request_files
- mcp__github__create_pull_request_review
- mcp__github__merge_pull_request
- GitHub project board operations

## Workflow
1. Find PRs in In Review column
2. Retrieve PR details and files changed
3. Conduct thorough code review
4. If approved: merge PR, move ticket to Done
5. If changes needed: add review comments, keep in In Review
```

### Step 6: Create Slash Commands

Create `.claude/commands/` directory with command files:

#### `.claude/commands/groom-backlog.md`

```markdown
Launch the agile-backlog-prioritizer agent to:
- Review the project board at https://github.com/orgs/vibeacademy/projects/3
- Analyze and prioritize tickets in the backlog
- Ensure tickets meet quality standards (clear descriptions, acceptance criteria, effort estimates)
- Move top-priority, well-defined tickets to the Ready column
- Identify gaps, dependencies, and blockers
- Ensure alignment with product roadmap and requirements
```

#### `.claude/commands/work-ticket.md`

```markdown
Launch the github-ticket-worker agent to:
- Select the top priority ticket from the Ready column on https://github.com/orgs/vibeacademy/projects/3
- Create a feature branch for the ticket
- Move the ticket to In Progress
- Implement the feature following project standards
- Write tests and ensure coverage > 80%
- Create a pull request
- Move the ticket to In Review
```

#### `.claude/commands/review-pr.md`

```markdown
Launch the pr-reviewer-merger agent to:
- Find pull requests linked to tickets in the In Review column on https://github.com/orgs/vibeacademy/projects/3
- Conduct thorough code review against project standards
- Verify tests pass, TypeScript compliance, and pattern implementation correctness
- Approve and merge PRs that meet quality standards
- Request changes for PRs that need improvement
- Move merged tickets to Done column
```

---

## Workflow Components

### Project Board Columns

| Column | Purpose | Who Moves Tickets Here |
|--------|---------|------------------------|
| **Backlog** | Ungroomed issues | Manual or automation |
| **Ready** | Groomed, ready to work | agile-backlog-prioritizer |
| **In Progress** | Active development | github-ticket-worker |
| **In Review** | PR created, awaiting review | github-ticket-worker |
| **Done** | Merged and closed | pr-reviewer-merger |

### Ticket Lifecycle

```
┌─────────┐
│ Created │ (Issue created manually or via script)
└────┬────┘
     │
     ▼
┌─────────┐
│ Backlog │ (Ungroomed issues)
└────┬────┘
     │ /groom-backlog
     │ (agile-backlog-prioritizer moves ticket)
     ▼
┌─────────┐
│  Ready  │ (Groomed, actionable tickets)
└────┬────┘
     │ /work-ticket
     │ (github-ticket-worker picks up ticket)
     ▼
┌──────────────┐
│ In Progress  │ (Development happening)
└──────┬───────┘
       │ (Worker creates PR)
       ▼
┌──────────────┐
│  In Review   │ (PR awaiting review)
└──────┬───────┘
       │ /review-pr
       │ (pr-reviewer-merger merges PR)
       ▼
┌─────────┐
│  Done   │ (Completed and merged)
└─────────┘
```

---

## Complete Workflow Cycle

### Example: Implementing Issue #22

Here's the actual workflow that was executed for this project:

#### 1. **Create Issues** (Manual or Scripted)

```bash
# Option A: Manual creation via GitHub UI
# Option B: Via MCP tools in Claude Code

# We created 12 issues (#22-#33) using MCP:
```

In Claude Code:
```
User: use the mcp to create the 12 issues. do not use the gh client