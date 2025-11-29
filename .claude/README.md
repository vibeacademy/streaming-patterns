# Claude Code Configuration

This directory contains agent policies and settings for the Streaming Patterns Library.

## Files

### Agent Policies
- `agents/github-ticket-worker.md` - Feature implementation agent
- `agents/pr-reviewer.md` - Code review agent
- `agents/agile-backlog-prioritizer.md` - Backlog management agent

### Slash Commands
- `commands/work-ticket.md` - Pick up next ticket from Ready column
- `commands/review-pr.md` - Review a pull request
- `commands/groom-backlog.md` - Prioritize and populate Ready column

### Settings
- `settings.local.json` - Local permissions configuration (gitignored)
- `settings.template.json` - Template showing recommended permissions

## Settings Configuration

The `settings.local.json` file controls what tools and permissions agents have access to. This file is gitignored to allow for local customization.

### Creating Your Local Settings

If you don't have a `settings.local.json` file, copy the template:

```bash
cp .claude/settings.template.json .claude/settings.local.json
```

### IMPORTANT: Security Restrictions

The template intentionally **EXCLUDES** `mcp__github__merge_pull_request` permission. This enforces our trunk-based development workflow where:

- Agents can **review** PRs (comment, approve, request changes)
- Only **humans** can **merge** PRs

This separation ensures quality control and prevents accidental merges.

### Allowed Agent Capabilities

Agents CAN:
- Create and update issues
- Move issues between project board columns
- Create pull requests
- Review pull requests (comment and approve)
- Run tests and builds
- Read repository files
- Use git for branching and committing

Agents CANNOT:
- Merge pull requests (human-only)
- Push directly to main branch (protected)
- Read secret files (.env, *.key, etc.)

### Updating Permissions

If you need to add new permissions:

1. Check if the permission is safe (doesn't bypass workflow controls)
2. Add to `settings.local.json`
3. If it's a recommended permission for all users, update `settings.template.json`
4. Document the change in this README

## Bot Accounts

This project uses dedicated bot accounts for AI-assisted development to maintain proper separation of concerns and satisfy branch protection requirements.

### va-worker

**Purpose:** Creates code changes, branches, and pull requests

**GitHub Permissions:**
- Repository access: Write
- Fine-grained PAT permissions:
  - Contents: Read-only
  - Issues: Read and write
  - Pull requests: Read and write
  - Metadata: Read-only

**What va-worker CAN do:**
- Create feature branches
- Push commits to feature branches
- Create pull requests
- Create and update issues

**What va-worker CANNOT do:**
- Push directly to main branch (blocked by branch protection)
- Merge pull requests (blocked by branch protection)
- Modify workflows
- Delete branches on main

**Verification:** All permissions verified on 2025-11-28 via PR #160

### va-reviewer

**Purpose:** Reviews pull requests and provides GO/NO-GO recommendations

**GitHub Permissions:**
- Repository access: Write (required for approvals to count)
- Fine-grained PAT permissions:
  - Contents: Read-only
  - Issues: Read and write
  - Pull requests: Read and write
  - Metadata: Read-only

**What va-reviewer CAN do:**
- Review pull requests
- Approve or request changes on PRs
- Comment on PRs and issues
- Read repository code

**What va-reviewer CANNOT do:**
- Merge pull requests (per agent policy)
- Push to any branch
- Create releases

### Human Workflow

The complete workflow:

1. **va-worker** creates feature branch and PR
2. **va-reviewer** reviews PR and provides GO/NO-GO recommendation
3. **Human** (you) makes final approval decision and merges

This ensures:
- ✅ Bots can propose and review changes
- ✅ Humans maintain final control over merges
- ✅ Branch protection requirements are satisfied (Write access required for approvals)
- ✅ Clear audit trail of who did what

### PAT Storage

Bot PATs should be stored securely:

**Local Development:**
```bash
# Configure gh CLI to use bot account
gh auth login
# Select: GitHub.com → HTTPS → Paste token
```

**Environment Variables:**
```bash
# Add to ~/.zshrc or ~/.bashrc (DO NOT commit to git)
export GITHUB_TOKEN="ghp_xxxxx"
```

**IMPORTANT:**
- ⚠️ NEVER commit PATs to git
- ⚠️ NEVER log PATs in console output
- ⚠️ Set PAT expiration and rotate regularly
- ⚠️ If compromised, revoke immediately at https://github.com/settings/tokens

### Troubleshooting

**Q: Why can't agents merge PRs?**
A: This is intentional. The workflow requires human review and approval before code reaches main branch.

**Q: My settings.local.json is missing**
A: Copy from template: `cp .claude/settings.template.json .claude/settings.local.json`

**Q: I made changes to settings.template.json but they're not working**
A: The template is just documentation. You need to copy changes to `settings.local.json` (which is the active file).

## Related Documentation

- Agent workflow overview: `../docs/AGENT-WORKFLOW-SUMMARY.md`
- Recommended tooling: `../docs/RECOMMENDED-TOOLING.md`
- Architecture standards: `../CLAUDE.md`
- Cloudflare token security: `../docs/CLOUDFLARE-TOKEN-SECURITY.md`
