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
