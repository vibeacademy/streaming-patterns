# Cloudflare API Token Security

This document describes the security configuration for Cloudflare API tokens used by MCP servers and agents in the Streaming Patterns project.

## Overview

The project uses **read-only** Cloudflare API tokens for MCP server integration to prevent agents from accidentally or maliciously deploying to production infrastructure.

## Token Configuration

### Read-Only MCP Server Token

**Token Name:** `mcp-server-readonly`

**Purpose:** Allows MCP servers and AI agents to query Cloudflare Workers deployment information without the ability to modify or deploy infrastructure.

**Permissions:**

| Resource | Permission | Scope | Reason |
|----------|-----------|-------|--------|
| **Workers Scripts** | **Read** | Account: Feature X | Query deployed workers, view configurations |
| **Workers Tail** | **Read** | Account: Feature X | Read worker logs for debugging |

**Explicitly NOT granted:**
- ❌ Workers Scripts: **Edit** (prevents modifications)
- ❌ Workers Scripts: **Write** (prevents deployments)
- ❌ Workers Routes: **Write** (prevents route changes)
- ❌ Account Settings: **Write** (prevents account modifications)

### Verification

The read-only token has been verified on 2025-11-29:

```bash
# ✅ Read operations work
$ wrangler whoami
Account Name: Feature X
Account ID: 7452f3c4529113d7668c83fb7e693f8a

$ wrangler deployments list
# Successfully lists deployment history

# ❌ Write operations blocked
# Any attempt to deploy would fail with:
# "Error: API call failed: Insufficient permissions"
```

## Token Storage

### Environment Variable

The read-only token is stored as an environment variable:

```bash
# In ~/.zshrc or ~/.bashrc
export CLOUDFLARE_API_TOKEN="<read-only-token-here>"
```

**Security Requirements:**
- ⚠️ NEVER commit tokens to git
- ⚠️ NEVER log tokens in console output
- ⚠️ Set token expiration (90 days recommended)
- ⚠️ Rotate tokens regularly
- ⚠️ If compromised, revoke immediately at https://dash.cloudflare.com/profile/api-tokens

### MCP Server Configuration

MCP servers read the token from the environment variable automatically. No additional configuration needed beyond setting the `CLOUDFLARE_API_TOKEN` environment variable.

## What Agents CAN Do

With the read-only token, MCP servers and agents can:

✅ **Query Workers:**
- List deployed workers
- View worker configurations
- Read deployment history
- Access worker logs (via tail permission)

✅ **Monitoring:**
- Check deployment status
- View worker metrics
- Read error logs
- Monitor uptime

✅ **Debugging:**
- Inspect worker code (read-only)
- View environment variables (read-only)
- Check routing configuration

## What Agents CANNOT Do

With the read-only token, agents are **blocked** from:

❌ **Deployments:**
- Cannot deploy new workers
- Cannot update existing workers
- Cannot delete workers
- Cannot modify worker code

❌ **Configuration Changes:**
- Cannot change routes
- Cannot modify environment variables
- Cannot update secrets
- Cannot change worker settings

❌ **Account Modifications:**
- Cannot change account settings
- Cannot create new workers
- Cannot modify billing
- Cannot manage team members

## Deployment Workflow

Since agents cannot deploy, all deployments must go through the CI/CD pipeline:

```
Agent proposes code change
        ↓
    Create PR
        ↓
    CI tests pass
        ↓
    Human approves
        ↓
    Merge to main
        ↓
    Staging deployed (automatic)
        ↓
    Staging validated
        ↓
[MANUAL APPROVAL GATE]
        ↓
Production deployed (via CI token with write access)
```

**CI/CD Token (Separate from MCP):**
- Stored in GitHub Secrets as `CLOUDFLARE_API_TOKEN`
- Has **Write** permissions for deployment
- Used only by GitHub Actions workflows
- Never exposed to local development or MCP servers

## Token Rotation

Tokens should be rotated regularly for security:

**Rotation Schedule:** Every 90 days (or when tokens expire)

**Rotation Process:**
1. Log into Cloudflare Dashboard → API Tokens
2. Create new token with same read-only permissions
3. Update `~/.zshrc` with new token: `export CLOUDFLARE_API_TOKEN="new-token"`
4. Reload shell: `source ~/.zshrc`
5. Verify: `wrangler whoami`
6. Delete old token in Cloudflare Dashboard

## Incident Response

If a token is compromised:

1. **Immediate:** Revoke token at https://dash.cloudflare.com/profile/api-tokens
2. **Generate:** Create new token with same permissions
3. **Update:** Replace token in `~/.zshrc`
4. **Verify:** Test new token works
5. **Document:** Record incident and response

**Note:** Since the token is read-only, compromise risk is low. Attackers could only:
- View deployment information (already public via streamingpatterns.com)
- Read worker logs (contains no secrets)
- Query worker configurations (no sensitive data exposed)

They **cannot** deploy malicious code or modify infrastructure.

## Related Documentation

- **GitHub Bot Tokens:** `.claude/README.md` (va-worker and va-reviewer setup)
- **Deployment Pipeline:** `.github/workflows/deploy-production.yml`
- **Issue Tracking:** #150 - Restrict Cloudflare MCP Token to Read-Only

## Compliance

This security configuration satisfies:
- ✅ **Principle of Least Privilege:** Tokens have minimum required permissions
- ✅ **Defense in Depth:** Multiple layers prevent unauthorized deployments
- ✅ **Separation of Duties:** Agents propose, humans approve, CI deploys
- ✅ **Audit Trail:** All deployments logged via GitHub Actions

---

**Last Updated:** 2025-11-29
**Token Version:** mcp-server-readonly (read-only permissions)
**Verified By:** va-worker agent automation
