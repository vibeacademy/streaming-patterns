# CI/CD Operations Guide - Streaming Patterns Library

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [Workflow Overview](#workflow-overview)
3. [Testing & Validation](#testing--validation)
4. [Troubleshooting](#troubleshooting)
5. [Operational Runbook](#operational-runbook)

---

## Quick Reference

### Deployment Status
- **Production**: Automated on merge to `main` → https://streamingpatterns.com
- **Preview**: Automated on PR open/update → https://pr-{number}.streamingpatterns.com
- **Cleanup**: Automated on PR close → Worker deleted

### GitHub Actions Workflows
- **Production Deployment**: `.github/workflows/deploy-production.yml`
- **Preview Deployment**: `.github/workflows/deploy-preview.yml`
- **Preview Cleanup**: `.github/workflows/cleanup-preview.yml`
- **CI Tests**: `.github/workflows/ci.yml`
- **Secrets Verification**: `.github/workflows/verify-secrets.yml`

### Essential Commands
```bash
# View workflow runs
gh run list --repo vibeacademy/streaming-patterns

# View specific workflow run logs
gh run view RUN_ID --log --repo vibeacademy/streaming-patterns

# Trigger manual workflow (if configured)
gh workflow run "workflow-name.yml" --repo vibeacademy/streaming-patterns

# View Worker logs in real-time
wrangler tail --name streaming-patterns-production

# List all Workers
wrangler list
```

---

## Workflow Overview

### 1. Production Deployment Workflow

**File**: `.github/workflows/deploy-production.yml`

**Trigger**: Push to `main` branch

**Steps**:
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies (`npm ci`)
4. Run linter (`npm run lint`)
5. Run type checking (`npm run type-check`)
6. Run test suite with coverage (`npm run test:coverage`)
7. Build production bundle (`npm run build`)
8. Verify build output exists
9. Deploy to Cloudflare Workers (production)
10. Upload build artifacts
11. Upload coverage reports

**Expected Duration**: 2-5 minutes

**Success Criteria**:
- All tests pass (>80% coverage)
- Lint and type-check pass
- Build completes successfully
- Deployment succeeds
- Production URL accessible

**Failure Points**:
- Test failures → Deployment blocked ✅
- Lint errors → Deployment blocked ✅
- Type errors → Deployment blocked ✅
- Build failures → Deployment blocked ✅
- Cloudflare API errors → Deployment fails, needs investigation

---

### 2. Preview Deployment Workflow

**File**: `.github/workflows/deploy-preview.yml`

**Trigger**: PR opened, synchronized, or reopened

**Steps**:
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies (`npm ci`)
4. Run linter (`npm run lint`)
5. Run type checking (`npm run type-check`)
6. Run test suite with coverage (`npm run test:coverage`)
7. Build production bundle (`npm run build`)
8. Verify build output exists
9. Generate preview wrangler.toml (dynamic Worker name)
10. Deploy to Cloudflare Workers (preview environment)
11. Get preview URL from deployment output
12. Calculate build metrics (size, duration)
13. Find or create PR comment with preview URL
14. Upload build artifacts
15. Upload coverage reports

**Expected Duration**: 2-5 minutes

**Success Criteria**:
- All quality checks pass
- Preview Worker deployed with unique name
- PR comment posted/updated with preview URL
- Preview URL accessible and functional
- Multiple concurrent PRs supported

**Special Features**:
- **Concurrency**: Uses `cancel-in-progress: true` per PR (new commits cancel old deployments)
- **Comment Updates**: Updates existing comment instead of creating duplicates
- **Workers.dev Deployment**: Uses `workers_dev = true` for preview environments

---

### 3. Preview Cleanup Workflow

**File**: `.github/workflows/cleanup-preview.yml`

**Trigger**: PR closed (merged or cancelled)

**Steps**:
1. Extract PR number from event
2. Construct Worker name (`streaming-patterns-pr-{number}`)
3. Setup Node.js and install wrangler
4. Delete Cloudflare Worker (`wrangler delete --force`)
5. Find existing preview comment
6. Update comment with cleanup status
7. Post cleanup notification

**Expected Duration**: 30-60 seconds

**Success Criteria**:
- Worker deleted successfully (or gracefully handles non-existent Worker)
- PR comment updated with cleanup status
- Preview URL no longer accessible

**Error Handling**:
- Continues on error if Worker doesn't exist
- Logs cleanup status regardless of outcome
- Never fails the workflow (cleanup is best-effort)

---

## Testing & Validation

### Phase 5: End-to-End Testing Checklist

This section documents the final phase of Epic #70: comprehensive testing and validation of all CI/CD workflows.

#### Test Scenario 1: Production Deployment

**Objective**: Verify production deployment workflow works end-to-end

**Pre-requisites**:
- [x] GitHub Secrets configured (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- [x] Main branch protection enabled
- [x] Production workflow file exists

**Test Steps**:
1. Create test branch from main
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/production-deployment
   ```

2. Make trivial change (e.g., update README or add comment)
   ```bash
   echo "# Test production deployment" >> TESTING.md
   git add TESTING.md
   git commit -m "[test] Verify production deployment workflow"
   ```

3. Push to test branch and create PR
   ```bash
   git push origin test/production-deployment
   gh pr create --title "[Test] Production Deployment" --body "Testing Epic #70 production workflow"
   ```

4. Wait for PR checks to pass

5. Merge PR to main
   ```bash
   gh pr merge --merge
   ```

6. Monitor deployment workflow
   ```bash
   gh run watch
   ```

7. Verify production deployment
   - Visit https://streamingpatterns.com
   - Check that site loads correctly
   - Verify latest commit is deployed

8. Check Worker in Cloudflare Dashboard
   - Navigate to Workers & Pages
   - Verify `streaming-patterns-production` Worker exists
   - Check deployment timestamp

**Expected Results**:
- ✅ Workflow completes successfully in <5 minutes
- ✅ All quality checks pass (lint, type-check, tests)
- ✅ Build succeeds
- ✅ Deployment succeeds
- ✅ Production URL accessible
- ✅ Site functionality intact

**Actual Results**: _(To be filled during testing)_

---

#### Test Scenario 2: Preview Deployment (Single PR)

**Objective**: Verify preview environment deployment for a single PR

**Test Steps**:
1. Create test branch
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/preview-deployment-single
   ```

2. Make test change
   ```bash
   echo "// Test preview deployment" >> src/App.tsx
   git add src/App.tsx
   git commit -m "[test] Verify preview deployment workflow"
   git push origin test/preview-deployment-single
   ```

3. Create PR
   ```bash
   gh pr create --title "[Test] Preview Deployment Single" --body "Testing Epic #70 preview workflow"
   ```

4. Wait for preview deployment workflow to complete
   ```bash
   gh run watch
   ```

5. Check PR comment for preview URL
   ```bash
   gh pr view --comments
   ```

6. Visit preview URL (from PR comment)
   - Verify site loads
   - Check for preview banner (if implemented)
   - Verify functionality

7. Make additional commit to same PR
   ```bash
   echo "// Test preview update" >> src/App.tsx
   git add src/App.tsx
   git commit -m "[test] Update preview deployment"
   git push origin test/preview-deployment-single
   ```

8. Verify PR comment is UPDATED (not duplicated)
   ```bash
   gh pr view --comments
   ```

9. Verify new preview deployment
   - Visit preview URL again
   - Verify latest changes are deployed

**Expected Results**:
- ✅ Preview workflow triggers on PR creation
- ✅ Preview Worker deployed with name `streaming-patterns-pr-{number}`
- ✅ PR comment posted with preview URL
- ✅ Preview URL accessible at workers.dev subdomain
- ✅ Site functionality works in preview
- ✅ On update, PR comment updated (not duplicated)
- ✅ Preview reflects latest changes

**Actual Results**: _(To be filled during testing)_

---

#### Test Scenario 3: Preview Deployment (Concurrent PRs)

**Objective**: Verify multiple preview environments can coexist

**Test Steps**:
1. Create first test PR (if not already exists from Test 2)

2. Create second test branch
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/preview-deployment-concurrent
   ```

3. Make different test change
   ```bash
   echo "// Test concurrent preview deployment" >> src/main.tsx
   git add src/main.tsx
   git commit -m "[test] Verify concurrent preview deployments"
   git push origin test/preview-deployment-concurrent
   ```

4. Create second PR
   ```bash
   gh pr create --title "[Test] Preview Deployment Concurrent" --body "Testing Epic #70 concurrent preview workflow"
   ```

5. Wait for both preview deployments to complete

6. Verify both PRs have unique preview URLs
   ```bash
   gh pr list --json number,title,url
   # Check comments on both PRs
   ```

7. Visit both preview URLs
   - Verify both are accessible
   - Verify they show different changes
   - Verify they are isolated from each other

8. Check Cloudflare Workers dashboard
   - Verify two Workers exist: `streaming-patterns-pr-{N1}` and `streaming-patterns-pr-{N2}`

**Expected Results**:
- ✅ Both PRs get unique preview Workers
- ✅ Both preview URLs are accessible simultaneously
- ✅ Each preview reflects its respective PR's changes
- ✅ Previews are completely isolated (no interference)
- ✅ Workflows run concurrently without conflicts

**Actual Results**: _(To be filled during testing)_

---

#### Test Scenario 4: Preview Cleanup (Merged PR)

**Objective**: Verify preview environment is cleaned up when PR is merged

**Test Steps**:
1. Use one of the test PRs from previous scenarios

2. Merge the PR
   ```bash
   gh pr merge {PR_NUMBER} --merge
   ```

3. Wait for cleanup workflow to complete
   ```bash
   gh run watch
   ```

4. Check PR comment for cleanup confirmation
   ```bash
   gh pr view {PR_NUMBER} --comments
   ```

5. Verify preview URL is no longer accessible
   - Try visiting the preview URL
   - Should return 404 or error

6. Check Cloudflare Workers dashboard
   - Verify preview Worker is deleted
   - Should no longer appear in Workers list

**Expected Results**:
- ✅ Cleanup workflow triggers on PR merge
- ✅ Worker deleted successfully
- ✅ PR comment updated with cleanup status
- ✅ Preview URL no longer accessible
- ✅ Worker removed from Cloudflare dashboard

**Actual Results**: _(To be filled during testing)_

---

#### Test Scenario 5: Preview Cleanup (Closed PR)

**Objective**: Verify preview environment is cleaned up when PR is closed without merging

**Test Steps**:
1. Use the remaining test PR from concurrent test

2. Close the PR without merging
   ```bash
   gh pr close {PR_NUMBER}
   ```

3. Wait for cleanup workflow to complete
   ```bash
   gh run watch
   ```

4. Check PR comment for cleanup confirmation
   ```bash
   gh pr view {PR_NUMBER} --comments
   ```

5. Verify preview URL is no longer accessible

6. Check Cloudflare Workers dashboard
   - Verify preview Worker is deleted

**Expected Results**:
- ✅ Cleanup workflow triggers on PR close
- ✅ Worker deleted successfully
- ✅ PR comment updated with cleanup status
- ✅ Preview URL no longer accessible
- ✅ Worker removed from Cloudflare dashboard

**Actual Results**: _(To be filled during testing)_

---

#### Test Scenario 6: Quality Gate Enforcement

**Objective**: Verify that failing quality checks block deployment

**Test 6a: Lint Failure**

1. Create test branch with intentional lint error
   ```bash
   git checkout -b test/lint-failure
   echo "const unused = 'test';" >> src/App.tsx
   git add src/App.tsx
   git commit -m "[test] Intentional lint error"
   git push origin test/lint-failure
   ```

2. Create PR and wait for workflow

3. Verify workflow fails at lint step

4. Verify deployment did NOT occur

**Expected Results**:
- ✅ Workflow fails at lint step
- ✅ Deployment does not occur
- ✅ PR marked as failing checks
- ✅ Clear error message in logs

**Test 6b: Test Failure**

1. Create test branch with failing test
   ```bash
   git checkout -b test/test-failure
   # Add a failing test or break existing test
   ```

2. Create PR and wait for workflow

3. Verify workflow fails at test step

4. Verify deployment did NOT occur

**Expected Results**:
- ✅ Workflow fails at test step
- ✅ Deployment does not occur
- ✅ PR marked as failing checks
- ✅ Test failure details visible in logs

---

### Validation Summary

After completing all test scenarios, verify:

**Production Workflow**:
- [x] Workflow file exists and is syntactically correct
- [ ] Triggers on push to main
- [ ] All quality checks run (lint, type-check, tests)
- [ ] Build succeeds
- [ ] Deployment succeeds
- [ ] Production URL accessible
- [ ] Workflow completes in <5 minutes

**Preview Workflow**:
- [x] Workflow file exists and is syntactically correct
- [ ] Triggers on PR opened/synchronized/reopened
- [ ] All quality checks run
- [ ] Preview Worker deployed with unique name
- [ ] PR comment posted with preview URL
- [ ] Preview URL accessible
- [ ] Multiple concurrent previews supported
- [ ] PR comment updates (doesn't duplicate)
- [ ] Workflow completes in <5 minutes

**Cleanup Workflow**:
- [x] Workflow file exists and is syntactically correct
- [ ] Triggers on PR closed
- [ ] Worker deleted successfully
- [ ] PR comment updated with cleanup status
- [ ] Preview URL no longer accessible
- [ ] Handles non-existent Workers gracefully

**Quality Gates**:
- [ ] Lint failures block deployment
- [ ] Type check failures block deployment
- [ ] Test failures block deployment
- [ ] Build failures block deployment

---

## Troubleshooting

### Common Issues

#### Issue 1: Deployment Fails with "Authentication Error"

**Symptom**: Workflow fails with message like "Error: Authentication failed"

**Cause**: GitHub Secrets not configured or invalid

**Solution**:
1. Verify secrets exist:
   ```bash
   gh secret list --repo vibeacademy/streaming-patterns
   ```

2. Check if secrets are correct:
   - `CLOUDFLARE_API_TOKEN` should be a valid Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` should be a 32-character hex string

3. Test token validity:
   ```bash
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. If token is invalid, regenerate:
   - Cloudflare Dashboard → My Profile → API Tokens
   - Create new token with "Edit Cloudflare Workers" permissions
   - Update GitHub Secret

---

#### Issue 2: Preview Deployment Succeeds but URL Returns 404

**Symptom**: Preview workflow succeeds, but preview URL shows 404

**Cause**: Worker deployed but not bound to routes correctly

**Solution**:
1. Check if Worker exists:
   ```bash
   wrangler list | grep streaming-patterns-pr
   ```

2. Verify Worker is deployed to workers.dev:
   - Preview workers use `workers_dev = true`
   - URL should be: `https://streaming-patterns-pr-{N}.{subdomain}.workers.dev`

3. Check deployment logs in GitHub Actions:
   - Look for actual deployment URL in wrangler output

4. Verify wrangler-preview.toml generation:
   - Check workflow logs for generated config
   - Ensure `workers_dev = true` is set

---

#### Issue 3: Cleanup Workflow Fails

**Symptom**: Cleanup workflow fails with error "Worker not found"

**Cause**: Worker may have been manually deleted or never existed

**Solution**:
This is expected behavior! The workflow uses `continue-on-error: true` for the delete step.

**Verification**:
1. Check workflow logs - should show "Worker deletion failed" but workflow succeeds
2. Check PR comment - should indicate cleanup status
3. Verify Worker is indeed gone from Cloudflare dashboard

**If cleanup truly failed**:
1. Manually delete Worker:
   ```bash
   wrangler delete streaming-patterns-pr-{NUMBER} --force
   ```

2. Create cleanup script (docs/scripts/cleanup-orphaned-workers.sh):
   ```bash
   #!/bin/bash
   # List all preview Workers
   wrangler list | grep "streaming-patterns-pr-"
   ```

---

#### Issue 4: Concurrent Previews Overwrite Each Other

**Symptom**: Multiple PRs seem to share the same preview environment

**Cause**: Worker naming collision or route conflict

**Solution**:
1. Verify each PR has unique Worker name:
   ```bash
   wrangler list | grep streaming-patterns-pr
   ```

2. Check GitHub Actions logs for Worker names:
   - Each should be `streaming-patterns-pr-{UNIQUE_PR_NUMBER}`

3. Verify wrangler-preview.toml generation in logs:
   - Each should have unique name

4. If collision detected, manually delete conflicting Workers:
   ```bash
   wrangler delete streaming-patterns-pr-{NUMBER} --force
   ```

---

#### Issue 5: Workflow Takes Too Long (>5 minutes)

**Symptom**: Workflow exceeds expected 5-minute duration

**Cause**: Slow tests, network issues, or inefficient steps

**Solution**:
1. Profile workflow steps in GitHub Actions UI:
   - Identify which step is slow

2. Common slow steps:
   - **npm ci**: Check if `node_modules` caching is working
   - **npm run test:coverage**: Tests may be slow
   - **npm run build**: Build may need optimization

3. Optimize caching:
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # Ensure this is set
   ```

4. Run tests without UI (CI mode):
   - Vitest should already run in CI mode via `vitest run`

5. Consider test parallelization or splitting

---

#### Issue 6: PR Comment Not Posted

**Symptom**: Preview deploys successfully but PR comment is missing

**Cause**: Missing permissions or GitHub API issues

**Solution**:
1. Verify workflow permissions:
   ```yaml
   permissions:
     contents: read
     pull-requests: write  # Required for comments
   ```

2. Check GitHub Actions logs for API errors

3. Verify PR number is correct:
   - Should be `${{ github.event.pull_request.number }}`

4. Test GitHub API access:
   ```bash
   gh pr comment {PR_NUMBER} --body "Test comment"
   ```

---

## Operational Runbook

### Daily Operations

**Morning Checklist**:
- [ ] Check GitHub Actions dashboard for failed workflows
- [ ] Review Cloudflare Workers dashboard for quota usage
- [ ] Check production site accessibility
- [ ] Review any error notifications

**Weekly Checklist**:
- [ ] Review workflow performance (duration trends)
- [ ] Check for orphaned preview Workers (cleanup failures)
- [ ] Review GitHub Actions usage (ensure within free tier)
- [ ] Update Cloudflare API token if expiring soon

---

### Incident Response

#### Scenario: Production Deployment Failed

**Severity**: HIGH

**Response**:
1. Check GitHub Actions logs for failure reason
2. If tests/lint failed: Normal behavior, fix issue in code
3. If deployment failed:
   - Check Cloudflare status: https://www.cloudflarestatus.com
   - Verify API token validity
   - Check Workers quota limits

4. If production site is down:
   - Check Cloudflare Workers dashboard
   - Verify Worker is deployed
   - Check Worker logs: `wrangler tail --name streaming-patterns-production`

5. **Rollback** (if needed):
   - Revert main branch to last working commit:
     ```bash
     git revert {BAD_COMMIT_SHA}
     git push origin main
     ```
   - Workflow will automatically deploy previous version

**Communication**:
- Update team in Slack/Discord
- Post issue in GitHub repository
- Update status page (if applicable)

---

#### Scenario: Multiple Preview Deployments Failing

**Severity**: MEDIUM

**Response**:
1. Check if issue is systemic (all PRs) or isolated (one PR)
2. Review Cloudflare Workers quota:
   - Free tier: 100,000 requests/day
   - Check if limit reached

3. Check for API token issues:
   - May have expired or been revoked
   - Regenerate and update GitHub Secret

4. Review recent workflow changes:
   - Check if `.github/workflows/*.yml` files were modified
   - Revert if necessary

**Workaround**:
- Temporarily use manual deployments:
  ```bash
  wrangler deploy --config wrangler-preview.toml
  ```

---

#### Scenario: Orphaned Preview Workers

**Symptom**: Many preview Workers remain after PRs are closed

**Severity**: LOW

**Response**:
1. List all Workers:
   ```bash
   wrangler list | grep streaming-patterns-pr
   ```

2. Identify orphaned Workers:
   - Cross-reference with open PRs:
     ```bash
     gh pr list --json number
     ```

3. Delete orphaned Workers:
   ```bash
   for worker in $(wrangler list | grep streaming-patterns-pr | awk '{print $1}'); do
     wrangler delete "$worker" --force
   done
   ```

4. Investigate cleanup workflow:
   - Check why cleanup failed for those PRs
   - Review cleanup-preview.yml logs

**Prevention**:
- Monitor cleanup workflow success rate
- Add manual cleanup task to weekly checklist

---

### Maintenance Procedures

#### Rotating Cloudflare API Token

**Frequency**: Every 90 days (recommended)

**Procedure**:
1. Create new Cloudflare API token:
   - Dashboard → My Profile → API Tokens → Create Token
   - Use "Edit Cloudflare Workers" template
   - Copy token immediately

2. Update GitHub Secret:
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --body "NEW_TOKEN" --repo vibeacademy/streaming-patterns
   ```

3. Test new token:
   - Trigger a test workflow
   - Verify deployment succeeds

4. Revoke old token:
   - Cloudflare Dashboard → API Tokens → Revoke old token

---

#### Updating Workflow Dependencies

**When**: Monthly or when security updates available

**Procedure**:
1. Review workflow action versions:
   - `actions/checkout`
   - `actions/setup-node`
   - `actions/upload-artifact`
   - `cloudflare/wrangler-action`
   - `peter-evans/create-or-update-comment`
   - `peter-evans/find-comment`

2. Check for updates:
   - Visit each action's GitHub repository
   - Review changelogs

3. Update versions in workflow files:
   ```yaml
   - uses: actions/checkout@v4  # Update to v5 if available
   ```

4. Test in test PR before merging to main

---

### Monitoring & Alerts

**Key Metrics to Monitor**:
- Workflow success rate (target: >95%)
- Workflow duration (target: <5 minutes)
- Preview deployment success rate
- Cleanup success rate
- Cloudflare Workers quota usage

**Alert Conditions**:
- Production deployment fails
- Preview deployment fails for >3 consecutive PRs
- Workflow duration exceeds 10 minutes
- Cloudflare Workers quota >80%

**Alert Channels**:
- GitHub Actions UI (built-in)
- Email notifications (GitHub settings)
- Slack/Discord (optional, via webhook)

---

## Success Metrics

### Epic #70 Completion Criteria

**All workflows operational**:
- [x] Production deployment workflow created
- [x] Preview deployment workflow created
- [x] Preview cleanup workflow created
- [ ] All workflows tested end-to-end
- [ ] All acceptance criteria met

**Automation goals achieved**:
- [ ] 100% automated deployments (zero manual deploys)
- [ ] Production deployments complete in <5 minutes
- [ ] Preview environments ready <5 minutes after PR creation
- [ ] Zero failed deployments due to workflow issues
- [ ] PR preview comments include working URLs 100% of the time

**Quality gates enforced**:
- [x] Lint failures block deployment
- [x] Type check failures block deployment
- [x] Test failures block deployment
- [x] Build failures block deployment

---

## References

- **Epic #70**: GitHub Actions CI/CD Pipeline
- **docs/CLOUDFLARE-DEPLOYMENT.md**: Deployment architecture
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Cloudflare Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Wrangler Action**: https://github.com/cloudflare/wrangler-action

---

**Document Version**: 1.0.0
**Last Updated**: November 12, 2024
**Author**: github-ticket-worker agent
**Status**: Ready for Testing
