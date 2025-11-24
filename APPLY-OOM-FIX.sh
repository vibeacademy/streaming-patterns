#!/bin/bash
# Apply OOM Fix - Update Dependencies and Verify Tests
# Usage: ./APPLY-OOM-FIX.sh

set -e  # Exit on error

echo "=========================================="
echo "Applying CI OOM Fix"
echo "=========================================="
echo ""

# Step 1: Update dependencies
echo "Step 1/3: Updating dependencies..."
echo "  - Removing jsdom"
npm uninstall jsdom

echo "  - Installing happy-dom"
npm install -D happy-dom

echo "  ✓ Dependencies updated"
echo ""

# Step 2: Verify tests pass locally
echo "Step 2/3: Running tests locally with happy-dom..."
echo "  (This may take a few minutes)"
echo ""

if npm test; then
  echo "  ✓ All tests passed locally!"
else
  echo "  ✗ Tests failed. Please review errors above."
  echo ""
  echo "Rollback instructions:"
  echo "  npm uninstall happy-dom"
  echo "  npm install -D jsdom"
  echo "  git checkout vitest.config.ts"
  exit 1
fi

echo ""

# Step 3: Show next steps
echo "Step 3/3: Next steps"
echo "=========================================="
echo ""
echo "✓ Changes applied successfully!"
echo ""
echo "Modified files:"
echo "  - .github/workflows/ci.yml (test sharding)"
echo "  - vitest.config.ts (happy-dom environment)"
echo "  - package.json (jsdom → happy-dom)"
echo "  - package-lock.json (dependency lock)"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit: git add ."
echo "  3. Commit: git commit -m '[#71] Fix CI OOM with test sharding + happy-dom'"
echo "  4. Push: git push origin feature/issue-71-pattern-error-boundaries"
echo "  5. Monitor CI: https://github.com/YOUR_ORG/streaming-patterns/actions"
echo ""
echo "Expected CI behavior:"
echo "  - 4 parallel test jobs (shards)"
echo "  - ~140 tests per shard"
echo "  - <2GB memory per shard"
echo "  - Total runtime: ~3-5 minutes"
echo ""
echo "=========================================="
