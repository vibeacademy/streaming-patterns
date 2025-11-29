# Agent Policy Linter

## Overview

The agent policy linter (`lint-agent-policies.sh`) is a safety tool that prevents instruction drift in agent policy files. It runs in CI to catch conflicting instructions before they reach production.

## Purpose

This linter ensures that agent policies maintain strict separation of duties and safety protocols:

- **pr-reviewer** can review code but cannot merge PRs
- **github-ticket-worker** can implement features but cannot merge or deploy
- **cloudflare-devops-engineer** can deploy to staging but requires human approval for production

By catching policy violations early, we prevent agents from receiving conflicting instructions that could bypass safety protocols.

## What It Checks

### Prohibited Terms by Context

#### In `pr-reviewer*.md` and `review-pr.md`:
- **"and merge"** (when instructing the agent to merge) - ❌ Blocked
  - Exception: "human...and merge" - ✅ Allowed
  - Exception: "approval and merge" - ✅ Allowed
- **"move to Done"** (when not negated) - ❌ Blocked
  - Exception: "NEVER move to Done" - ✅ Allowed
  - Exception: "human will move to Done" - ✅ Allowed
- **"close the issue"** (when not negated) - ❌ Blocked
  - Exception: "do NOT close the issue" - ✅ Allowed

#### In `github-ticket-worker*.md` and `work-ticket.md`:
- **"merge"** (as an action the agent takes) - ❌ Blocked
  - Exception: "human will merge" - ✅ Allowed
  - Exception: "after merge" - ✅ Allowed
  - Exception: "asked to merge" (in refusal context) - ✅ Allowed
- **"push to main"** (when not negated) - ❌ Blocked
  - Exception: "NEVER push to main" - ✅ Allowed
  - Exception: "asked to push to main" (in refusal context) - ✅ Allowed
- **"move to Done"** (when not negated) - ❌ Blocked
  - Exception: "NEVER move to Done" - ✅ Allowed

#### In `cloudflare*.md` files:
- **"wrangler deploy --env production"** (without human approval context) - ❌ Blocked
  - Exception: "with human approval" nearby - ✅ Allowed
- **"deploy to production directly"** (when not negated) - ❌ Blocked
  - Exception: "NEVER deploy to production directly" - ✅ Allowed

### Required Terms

#### In All Workflow-Critical Agent Files:

The following agents **must** contain these sections:

**Critical Agents:** `pr-reviewer`, `github-ticket-worker`, `cloudflare-devops-engineer`

1. **"NON-NEGOTIABLE PROTOCOL"** section
   - Must appear as a top-level heading
   - Contains the immutable safety rules

2. **"You NEVER merge"** statement (for pr-reviewer and github-ticket-worker)
   - Explicit statement that agent never merges PRs
   - Cloudflare agent has equivalent "NEVER deploy" statement

3. **"human"** in context of final approval
   - Warning: if file mentions "merge" or "approval" but no "human", it's flagged
   - Ensures human oversight is mentioned in workflow

### Deprecated Language

The linter warns about outdated phrasing:

- ❌ "enabling velocity" → should be "quality and protocol"
- ❌ "velocity over" → should be "protocol over speed"

This ensures consistent messaging about priorities.

## How to Run

### Locally (during development):

```bash
./scripts/lint-agent-policies.sh
```

### In CI (automatic):

The linter runs automatically on all PRs and pushes to main via the `lint-agent-policies` job in `.github/workflows/ci.yml`.

## Exit Codes

- **0**: All checks passed (or passed with warnings)
- **1**: One or more errors found (CI will fail)

Warnings do not cause CI failure but should be addressed.

## Output Format

The linter provides color-coded output:

- 🟢 **Green**: Check passed
- 🟡 **Yellow**: Warning (non-blocking)
- 🔴 **Red**: Error (blocking)

Example output:

```
=== Agent Policy Linter ===

Checking pr-reviewer files for prohibited terms...
✓ No prohibited merge/done/close instructions found in PR reviewer files

Checking github-ticket-worker files for prohibited terms...
✓ No prohibited merge/main/done instructions found in worker files

Checking cloudflare files for prohibited deployment terms...
✓ No prohibited production deployment instructions found

Checking for NON-NEGOTIABLE PROTOCOL blocks in workflow agents...
✓ All workflow-critical agent files contain NON-NEGOTIABLE PROTOCOL block

Checking for 'You NEVER merge' statements...
✓ Required 'NEVER merge' statements found in relevant agent files

Checking for 'human' in context of final approval...
⚠ WARNING: File .claude/agents/quality-engineer.md mentions merge/approval but may lack 'human' context

Checking for deprecated 'velocity' language...
✓ No deprecated 'velocity' language found

Checking for three-stage workflow consistency...
✓ Three-stage workflow descriptions are consistent

=== Lint Summary ===
Errors: 0
Warnings: 1

PASSED with warnings: 1 warning(s) found
```

## How to Update Linter Rules

To add new checks or modify existing ones:

1. Edit `scripts/lint-agent-policies.sh`
2. Add your check in the appropriate section
3. Use grep with appropriate exclusion patterns for negations
4. Test locally: `./scripts/lint-agent-policies.sh`
5. Verify CI runs correctly on a test PR
6. Update this README with new rules

### Adding a New Prohibited Term

```bash
# Template for adding a new check
if grep -rn "PROHIBITED_PHRASE" .claude/agents/AGENT_FILE.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot"; then
  echo -e "${RED}ERROR: Found 'PROHIBITED_PHRASE' instruction${NC}"
  ERRORS=$((ERRORS + 1))
fi
```

### Adding a New Required Term

```bash
# Template for adding a required term check
if ! grep -q "REQUIRED_PHRASE" .claude/agents/AGENT_FILE.md; then
  echo -e "${RED}ERROR: Missing 'REQUIRED_PHRASE' in AGENT_FILE.md${NC}"
  ERRORS=$((ERRORS + 1))
fi
```

## Common False Positives

The linter uses exclusion patterns to avoid false positives:

### Example 1: Instructing agents to refuse
```markdown
5. If asked to merge, move to Done, or push to main, you MUST refuse...
```
✅ **Allowed** - "asked to merge" is excluded because it's in a refusal context

### Example 2: Describing the human's role
```markdown
3. **Human reviewer** performs final review and merge
```
✅ **Allowed** - "human...merge" pattern is excluded

### Example 3: Describing workflow stages
```markdown
10. **Your work is done**: pr-reviewer agent will review, then human will merge
```
✅ **Allowed** - "human will merge" is excluded

### Example 4: Negations
```markdown
1. You NEVER merge pull requests.
```
✅ **Allowed** - "NEVER merge" is excluded (it's a prohibition, not an instruction)

## Troubleshooting

### Linter fails with false positive

1. Review the grep exclusion patterns in the script
2. Add appropriate exceptions (e.g., `asked to X`, `human will X`)
3. Ensure negations are excluded (`NEVER|NOT|cannot|don't|do not`)

### Linter passes but should fail

1. Check if the prohibited term uses different wording
2. Add variations to the grep pattern
3. Consider adding a new check for that specific case

### CI job fails but local test passes

1. Ensure script has execute permissions: `chmod +x scripts/lint-agent-policies.sh`
2. Verify script is checked into git: `git add scripts/lint-agent-policies.sh`
3. Check CI logs for specific error messages

## Related Documentation

- **Agent Policies**: `.claude/agents/` - The files being linted
- **CI Workflow**: `.github/workflows/ci.yml` - Where the linter runs
- **Agent Workflow Hardening**: `plans/agent-workflow-hardening.md` - Context for why this exists

## History

- **2025-11-29**: Initial implementation (Issue #153)
  - Checks for prohibited merge/done/deploy instructions
  - Verifies NON-NEGOTIABLE PROTOCOL blocks
  - Validates three-stage workflow consistency
  - Integrated into CI pipeline

## Maintenance

This linter should be updated whenever:

1. New agents are added to `.claude/agents/`
2. New prohibited actions are identified
3. Agent workflow protocols change
4. False positives are discovered

Always test changes locally before committing.
