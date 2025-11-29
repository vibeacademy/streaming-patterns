#!/bin/bash
# Agent Restriction Verification Tests
# Run after any changes to agent policies or permissions
#
# Purpose: Verify that agents cannot perform restricted actions like:
# - Merging pull requests
# - Pushing directly to main branch
# - Moving issues to Done column
# - Deploying to production
#
# Usage:
#   ./scripts/verify-agent-restrictions.sh [--verbose] [--test TEST_NAME]
#
# Options:
#   --verbose       Show detailed output for each test
#   --test NAME     Run only specific test (protocol, permissions, cloudflare, all)
#
# Exit codes:
#   0 = All tests passed
#   1 = One or more tests failed
#   2 = Script error (missing dependencies, etc.)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Configuration
VERBOSE=false
SPECIFIC_TEST=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --test)
      SPECIFIC_TEST="$2"
      shift 2
      ;;
    --help)
      head -n 20 "$0" | tail -n 18
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 2
      ;;
  esac
done

# Helper functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_failure() {
  echo -e "${RED}[FAIL]${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_skip() {
  echo -e "${YELLOW}[SKIP]${NC} $1"
  TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

verbose_log() {
  if [ "$VERBOSE" = true ]; then
    echo "  $1"
  fi
}

# Check if running specific test or all tests
should_run_test() {
  local test_name=$1
  if [ -z "$SPECIFIC_TEST" ] || [ "$SPECIFIC_TEST" = "all" ] || [ "$SPECIFIC_TEST" = "$test_name" ]; then
    return 0
  else
    return 1
  fi
}

# Test suite header
echo ""
echo "========================================"
echo "  Agent Restriction Verification Suite"
echo "========================================"
echo ""
echo "Date: $(date)"
echo "Repository: $(git remote get-url origin 2>/dev/null || echo 'Unknown')"
echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
echo ""

# Prerequisite checks
log_info "Checking prerequisites..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  log_warning "gh CLI not found. Some tests will be skipped."
  log_warning "Install from: https://cli.github.com/"
fi

# Check if in git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
  echo -e "${RED}ERROR:${NC} Not in a git repository"
  exit 2
fi

echo ""
log_info "Starting test suite..."
echo ""

# =============================================================================
# TEST CATEGORY 1: Protocol Compliance Tests
# =============================================================================

if should_run_test "protocol"; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Category 1: Agent Protocol Compliance"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Test 1.1: Check for NON-NEGOTIABLE PROTOCOL blocks
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking for NON-NEGOTIABLE PROTOCOL blocks in agent files..."

  MISSING_PROTOCOL=0
  for agent_file in .claude/agents/*.md; do
    if [ -f "$agent_file" ]; then
      if ! grep -q "NON-NEGOTIABLE PROTOCOL" "$agent_file"; then
        log_failure "Missing NON-NEGOTIABLE PROTOCOL in $(basename "$agent_file")"
        MISSING_PROTOCOL=1
      else
        verbose_log "  ✓ $(basename "$agent_file") has NON-NEGOTIABLE PROTOCOL"
      fi
    fi
  done

  if [ $MISSING_PROTOCOL -eq 0 ]; then
    log_success "All agent files contain NON-NEGOTIABLE PROTOCOL blocks"
  fi

  # Test 1.2: Check pr-reviewer does NOT have merge instructions
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking pr-reviewer agent for prohibited merge instructions..."

  if [ -f ".claude/agents/pr-reviewer.md" ]; then
    if grep -i "you.*merge" .claude/agents/pr-reviewer.md | grep -v "NEVER merge" | grep -v "cannot merge" | grep -v "don't merge" &> /dev/null; then
      log_failure "pr-reviewer.md contains merge instructions (should only say NEVER merge)"
    else
      log_success "pr-reviewer.md correctly prohibits merging"
    fi
  else
    log_skip "pr-reviewer.md not found"
  fi

  # Test 1.3: Check review-pr command does NOT instruct to merge
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking review-pr command for prohibited instructions..."

  if [ -f ".claude/commands/review-pr.md" ]; then
    if grep -i "merge.*PR" .claude/commands/review-pr.md | grep -v "do not merge" | grep -v "NOT merge" | grep -v "never merge" &> /dev/null; then
      log_failure "review-pr.md instructs agent to merge (should only review)"
    else
      log_success "review-pr.md correctly instructs review-only behavior"
    fi
  else
    log_skip "review-pr.md not found"
  fi

  # Test 1.4: Check for "Done column" prohibition in ticket worker
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking github-ticket-worker for Done column prohibition..."

  if [ -f ".claude/agents/github-ticket-worker.md" ]; then
    if grep -i "NEVER move.*Done" .claude/agents/github-ticket-worker.md &> /dev/null; then
      log_success "github-ticket-worker.md correctly prohibits moving to Done"
    else
      log_failure "github-ticket-worker.md missing Done column prohibition"
    fi
  else
    log_skip "github-ticket-worker.md not found"
  fi

  # Test 1.5: Check cloudflare agent for production deploy prohibition
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking cloudflare agent for production deploy prohibition..."

  if [ -f ".claude/agents/cloudflare-devops-engineer.md" ]; then
    if grep -i "NEVER.*production" .claude/agents/cloudflare-devops-engineer.md &> /dev/null; then
      log_success "cloudflare-devops-engineer.md correctly prohibits production deploys"
    else
      log_failure "cloudflare-devops-engineer.md missing production deploy prohibition"
    fi
  else
    log_skip "cloudflare-devops-engineer.md not found"
  fi

  echo ""
fi

# =============================================================================
# TEST CATEGORY 2: Permission Enforcement Tests
# =============================================================================

if should_run_test "permissions"; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Category 2: Permission Enforcement"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Test 2.1: Verify branch protection on main
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking branch protection rules on main..."

  if command -v gh &> /dev/null; then
    # Extract repo from git remote
    REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
    if [[ $REPO_URL =~ github.com[:/](.+)/(.+)\.git ]]; then
      OWNER="${BASH_REMATCH[1]}"
      REPO="${BASH_REMATCH[2]}"

      # Check if main branch is protected
      if gh api "repos/$OWNER/$REPO/branches/main/protection" &> /dev/null; then
        log_success "Branch protection enabled on main"

        if [ "$VERBOSE" = true ]; then
          verbose_log "Protection rules:"
          gh api "repos/$OWNER/$REPO/branches/main/protection" --jq '.required_pull_request_reviews, .enforce_admins, .required_status_checks' 2>/dev/null || true
        fi
      else
        log_failure "Branch protection NOT enabled on main"
      fi
    else
      log_skip "Could not parse repository from git remote"
    fi
  else
    log_skip "gh CLI not available"
  fi

  # Test 2.2: Check if GitHub Actions production environment exists
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking for production environment with manual approval..."

  if command -v gh &> /dev/null && [ -n "$OWNER" ] && [ -n "$REPO" ]; then
    if gh api "repos/$OWNER/$REPO/environments" --jq '.environments[] | select(.name=="production")' &> /dev/null; then
      log_success "Production environment exists (manual approval gate)"
    else
      log_warning "Production environment not found (may not be configured yet)"
      TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
    fi
  else
    log_skip "gh CLI not available or repo not identified"
  fi

  echo ""
fi

# =============================================================================
# TEST CATEGORY 3: Cloudflare Token Restrictions
# =============================================================================

if should_run_test "cloudflare"; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Category 3: Cloudflare Token Restrictions"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Test 3.1: Verify Cloudflare agent token is read-only
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking Cloudflare token restrictions..."

  # Note: This test requires the agent token to be set
  # In practice, this would need to be tested separately with actual tokens

  if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    log_warning "CLOUDFLARE_API_TOKEN is set, but actual permission test requires wrangler"
    log_warning "Manual test: Try 'wrangler deploy --dry-run' with agent token (should fail)"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
  else
    log_skip "CLOUDFLARE_API_TOKEN not set (manual verification required)"
  fi

  echo ""
fi

# =============================================================================
# TEST CATEGORY 4: Documentation Verification
# =============================================================================

if should_run_test "docs"; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Category 4: Documentation Verification"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Test 4.1: Check if agent workflow hardening plan exists
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking for agent workflow hardening documentation..."

  if [ -f "plans/agent-workflow-hardening.md" ]; then
    log_success "Agent workflow hardening plan exists"
  else
    log_warning "plans/agent-workflow-hardening.md not found"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
  fi

  # Test 4.2: Check if test scenario documentation exists
  TESTS_RUN=$((TESTS_RUN + 1))
  verbose_log "Checking for test scenario documentation..."

  if [ -f "docs/testing/agent-restriction-tests.md" ]; then
    log_success "Agent restriction test documentation exists"
  elif grep -q "Test Scenarios" plans/agent-workflow-hardening.md 2>/dev/null; then
    log_success "Test scenarios documented in hardening plan"
  else
    log_warning "Test scenario documentation not found"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
  fi

  echo ""
fi

# =============================================================================
# Summary Report
# =============================================================================

echo ""
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo ""
echo "Total tests run:    $TESTS_RUN"
echo -e "${GREEN}Tests passed:       $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed:       $TESTS_FAILED${NC}"
echo -e "${YELLOW}Tests skipped:      $TESTS_SKIPPED${NC}"
echo ""

# Calculate pass rate
if [ $TESTS_RUN -gt 0 ]; then
  PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TESTS_PASSED / $TESTS_RUN) * 100}")
  echo "Pass rate: $PASS_RATE%"
  echo ""
fi

# Final verdict
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}FAILED: $TESTS_FAILED test(s) failed${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Review the failures above and ensure agent restrictions are properly configured."
  echo ""
  exit 1
else
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}PASSED: All tests passed!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [ $TESTS_SKIPPED -gt 0 ]; then
    echo -e "${YELLOW}Note: $TESTS_SKIPPED test(s) were skipped.${NC}"
    echo "This may be due to missing dependencies or manual verification requirements."
    echo ""
  fi

  exit 0
fi
