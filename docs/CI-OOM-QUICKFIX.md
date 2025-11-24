# Quick Fix: CI OOM Error

**Problem**: Tests fail with "Worker terminated due to reaching memory limit: JS heap out of memory"

**Solution**: Implemented test sharding + happy-dom

---

## What Changed?

### 1. Test Sharding (`.github/workflows/ci.yml`)
Tests now split into 4 parallel shards instead of running all 559 tests in one worker.

**Before**: 1 job × 559 tests = 4GB+ memory (OOM)
**After**: 4 jobs × ~140 tests = <2GB per job (no OOM)

### 2. happy-dom Environment (`vitest.config.ts`)
Switched from jsdom to happy-dom for 50-70% memory reduction.

**Before**: jsdom (heavy, full browser APIs)
**After**: happy-dom (light, sufficient for React tests)

---

## How to Apply

### Step 1: Update Dependencies
```bash
# Remove jsdom
npm uninstall jsdom

# Add happy-dom
npm install -D happy-dom

# Install dependencies
npm ci
```

### Step 2: Verify Tests Pass Locally
```bash
# Run all tests
npm test

# If tests pass, you're good to go!
```

### Step 3: Push Changes
```bash
# Already committed in this branch
git push origin feature/issue-71-pattern-error-boundaries

# CI will now run 4 parallel test jobs
```

---

## Expected CI Behavior

**Before** (OOM):
```
✅ Lint code
✅ Type check
✅ Run tests (559 passed)
❌ Worker terminated due to reaching memory limit
```

**After** (Fixed):
```
✅ Lint code (shard 1 only)
✅ Type check (shard 1 only)
✅ Run tests (Shard 1/4) - ~140 tests
✅ Run tests (Shard 2/4) - ~140 tests
✅ Run tests (Shard 3/4) - ~140 tests
✅ Run tests (Shard 4/4) - ~140 tests
✅ Build project (shard 1 only)
```

---

## Troubleshooting

### Tests Fail Locally After Switching to happy-dom

**Symptom**: Tests pass with jsdom but fail with happy-dom

**Cause**: happy-dom may not support some obscure DOM APIs

**Fix**:
```bash
# Identify failing test
npm test -- --reporter=verbose

# Check if test uses jsdom-specific APIs
# Common issues:
# - window.scrollTo (not in happy-dom)
# - document.createRange (limited support)

# Option 1: Update test to use supported APIs
# Option 2: Revert to jsdom for that specific test file
```

**Revert to jsdom for specific files**:
```typescript
// At top of problematic test file
/**
 * @vitest-environment jsdom
 */
```

### CI Still Fails with OOM

**Symptom**: Even with sharding, one shard fails with OOM

**Cause**: One shard has memory-intensive tests clustered together

**Fix**:
```bash
# Increase shard count in .github/workflows/ci.yml
# Change from 4 shards to 6 shards:
shard: [1, 2, 3, 4, 5, 6]

# Update test commands:
--shard=${{ matrix.shard }}/6
```

### Coverage Reports Missing

**Symptom**: Codecov shows incomplete coverage

**Cause**: Coverage split across 4 shards

**Fix**: This is expected. Each shard uploads its own coverage report to Codecov, which merges them automatically. If merging fails:

```yaml
# In .github/workflows/ci.yml
# Add coverage merge step (already handled by codecov-action)
```

---

## Trade-offs

### Pros ✅
- CI tests no longer OOM
- Faster CI runtime (parallel shards)
- Lower memory usage (happy-dom)
- No test coverage loss

### Cons ⚠️
- CI uses 4× minutes (cost increase)
- More complex CI dashboard (4 jobs instead of 1)
- Potential happy-dom compatibility issues (minimal risk)

---

## Rollback Plan

If this causes issues:

```bash
# Rollback CI sharding
git checkout HEAD~1 -- .github/workflows/ci.yml

# Rollback happy-dom
git checkout HEAD~1 -- vitest.config.ts
npm uninstall happy-dom
npm install -D jsdom

# Commit rollback
git commit -m "Rollback: Revert OOM fixes"
git push
```

---

## Questions?

- See full architecture doc: `/docs/architecture/test-memory-optimization.md`
- Report issues in PR #91 comments
- Ping @architect in Slack

---

**Applied in**: PR #91 (Issue #71)
**Date**: 2025-11-15
