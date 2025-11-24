# Next Steps: Apply OOM Fix to PR #91

**Current Status**: Architecture changes implemented, dependencies not yet updated

---

## Quick Start (Recommended)

Run the automated script:

```bash
# This script will:
# 1. Remove jsdom, install happy-dom
# 2. Run all tests to verify they pass
# 3. Show next steps

./APPLY-OOM-FIX.sh
```

If successful, proceed to **Step 3** below.

---

## Manual Steps (Alternative)

### Step 1: Update Dependencies (2 minutes)

```bash
# Remove jsdom
npm uninstall jsdom

# Add happy-dom
npm install -D happy-dom

# Verify installation
npm list happy-dom
# Should show: happy-dom@X.X.X
```

---

### Step 2: Verify Tests Pass Locally (3-5 minutes)

```bash
# Run all tests with happy-dom
npm test

# Expected output:
# Test Files  27 passed (28)
# Tests       559 passed | 6 skipped (591)
# ✓ All tests should pass!
```

**If tests fail**:
1. Check error message for happy-dom compatibility issues
2. See troubleshooting in `/docs/CI-OOM-QUICKFIX.md`
3. Consider rollback (see below)

---

### Step 3: Commit Changes (1 minute)

```bash
# Stage all changes
git add .github/workflows/ci.yml
git add vitest.config.ts
git add package.json
git add package-lock.json
git add docs/
git add APPLY-OOM-FIX.sh
git add PR-91-OOM-FIX-DESCRIPTION.md

# Commit with clear message
git commit -m "$(cat <<'EOF'
[#71] Fix CI OOM with test sharding + happy-dom

Problem:
- CI tests OOM during Vitest worker cleanup/teardown
- All 559 tests pass, but worker runs out of memory
- Issue occurs in CI only (GitHub Actions memory constraints)

Solution:
1. Shard tests into 4 parallel jobs (~140 tests each)
2. Switch from jsdom to happy-dom (50-70% memory reduction)
3. Reduce heap to 2048MB per shard (from 4096MB monolithic)

Changes:
- .github/workflows/ci.yml: Add test sharding matrix
- vitest.config.ts: Switch to happy-dom environment
- package.json: jsdom → happy-dom dependency

Expected Result:
- CI tests complete in <5 min per shard
- Memory usage <2GB per shard
- No OOM errors

Docs:
- Architecture: docs/architecture/test-memory-optimization.md
- Quick Fix: docs/CI-OOM-QUICKFIX.md
- PR Description: PR-91-OOM-FIX-DESCRIPTION.md
EOF
)"
```

---

### Step 4: Push to PR Branch (1 minute)

```bash
# Push to PR #91 branch
git push origin feature/issue-71-pattern-error-boundaries

# Monitor CI status
# GitHub Actions: https://github.com/YOUR_ORG/streaming-patterns/actions
```

---

### Step 5: Update PR Description (2 minutes)

1. Go to PR #91: https://github.com/YOUR_ORG/streaming-patterns/pull/91
2. Click "Edit" on PR description
3. Copy content from `/PR-91-OOM-FIX-DESCRIPTION.md`
4. Paste into PR description
5. Save changes

---

### Step 6: Monitor CI (5-10 minutes)

Watch for these indicators:

**Success Criteria**:
- ✅ All 4 shard jobs complete (ci / Continuous Integration (20.x, 1-4))
- ✅ Each shard passes ~140 tests
- ✅ Total tests = 559 across all shards
- ✅ No OOM errors
- ✅ Memory usage <2GB per shard (check logs)

**Expected CI Output (per shard)**:
```
Test Files  6-7 passed
Tests       ~140 passed
Duration    ~60-120s
Memory      <2GB
```

**If CI Fails**:
- Check which shard failed
- Review error logs
- See troubleshooting guide: `/docs/CI-OOM-QUICKFIX.md`
- Consider rollback (see below)

---

## Rollback Plan

If tests fail locally or CI still OOMs:

```bash
# Rollback all changes
git reset --hard HEAD~1

# Or rollback selectively:

# Rollback CI sharding only
git checkout HEAD~1 -- .github/workflows/ci.yml

# Rollback happy-dom only
git checkout HEAD~1 -- vitest.config.ts
npm uninstall happy-dom
npm install -D jsdom

# Commit rollback
git add .
git commit -m "[#71] Rollback: Revert OOM fixes (issues found)"
git push origin feature/issue-71-pattern-error-boundaries
```

---

## Files Modified

### Production Changes
- `.github/workflows/ci.yml` - Test sharding matrix
- `vitest.config.ts` - happy-dom environment
- `package.json` - Dependency change (jsdom → happy-dom)
- `package-lock.json` - Dependency lock update

### Documentation (Reference)
- `docs/architecture/test-memory-optimization.md` - Full architecture analysis
- `docs/CI-OOM-QUICKFIX.md` - Quick troubleshooting guide
- `APPLY-OOM-FIX.sh` - Automated fix script
- `PR-91-OOM-FIX-DESCRIPTION.md` - PR description template
- `NEXT-STEPS.md` - This file

---

## Expected Timeline

| Step | Duration | Total |
|------|----------|-------|
| Update dependencies | 2 min | 2 min |
| Run tests locally | 3-5 min | 7 min |
| Commit changes | 1 min | 8 min |
| Push to GitHub | 1 min | 9 min |
| Update PR description | 2 min | 11 min |
| Monitor CI | 5-10 min | 16-21 min |

**Total Time**: ~15-20 minutes

---

## Questions?

**Architecture Details**:
- See `/docs/architecture/test-memory-optimization.md`

**Troubleshooting**:
- See `/docs/CI-OOM-QUICKFIX.md`

**happy-dom Compatibility**:
- GitHub: https://github.com/capricorn86/happy-dom
- Vitest Docs: https://vitest.dev/config/#environment

**Vitest Sharding**:
- Docs: https://vitest.dev/guide/features.html#sharding

---

## Success Indicators

You'll know it's working when:

1. **Locally**: `npm test` passes with happy-dom
2. **CI**: 4 parallel shard jobs all pass
3. **Memory**: CI logs show <2GB usage per shard
4. **Coverage**: Codecov merges 4 coverage reports correctly
5. **PR**: All status checks green ✅

---

**Ready to Apply?**

```bash
# Quick start (recommended)
./APPLY-OOM-FIX.sh

# Or follow manual steps above
```

Good luck! 🚀
