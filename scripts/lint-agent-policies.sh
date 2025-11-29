#!/bin/bash
# Agent Policy Linter
# Runs in CI to prevent instruction drift and maintain safety protocols

set -e

ERRORS=0
WARNINGS=0

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=== Agent Policy Linter ==="
echo ""

# Check for prohibited merge instructions in PR reviewer files
echo "Checking pr-reviewer files for prohibited terms..."
PROHIBITED_FOUND=0

# Check for "and merge" phrase which violates the protocol
# Exclude cases where it says "human...and merge" or "approval and merge"
if grep -rn "and merge" .claude/agents/pr-reviewer*.md .claude/commands/review-pr.md 2>/dev/null | grep -v "human.*and merge\|approval and merge\|review and merge"; then
  echo -e "${RED}ERROR: Found 'and merge' instruction in PR reviewer files${NC}"
  ERRORS=$((ERRORS + 1))
  PROHIBITED_FOUND=1
fi

# Check for "move to Done" in pr-reviewer files
if grep -rn "move to Done" .claude/agents/pr-reviewer*.md .claude/commands/review-pr.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not"; then
  echo -e "${RED}ERROR: Found 'move to Done' instruction in PR reviewer files (without negation)${NC}"
  ERRORS=$((ERRORS + 1))
  PROHIBITED_FOUND=1
fi

# Check for "close the issue" in pr-reviewer files
if grep -rn "close the issue" .claude/agents/pr-reviewer*.md .claude/commands/review-pr.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not"; then
  echo -e "${RED}ERROR: Found 'close the issue' instruction in PR reviewer files (without negation)${NC}"
  ERRORS=$((ERRORS + 1))
  PROHIBITED_FOUND=1
fi

if [ $PROHIBITED_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No prohibited merge/done/close instructions found in PR reviewer files${NC}"
fi

echo ""

# Check for prohibited instructions in github-ticket-worker files
echo "Checking github-ticket-worker files for prohibited terms..."
WORKER_PROHIBITED=0

# Check for "merge" (as an action the agent takes)
# Exclude: negations, "human will merge", "after merge", "asked to merge", "to merge"
if grep -rn "\bmerge\b" .claude/agents/github-ticket-worker*.md .claude/commands/work-ticket.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not\|after merge\|human.*merge\|for merge\|to merge\|asked to merge\|will merge\|does.*merge\|performs.*merge"; then
  echo -e "${RED}ERROR: Found 'merge' as an agent action in worker files (without negation)${NC}"
  ERRORS=$((ERRORS + 1))
  WORKER_PROHIBITED=1
fi

# Check for "push to main"
# Exclude negations and "asked to...push to main"
if grep -rn "push to main" .claude/agents/github-ticket-worker*.md .claude/commands/work-ticket.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not\|asked to.*push to main\|to.*push to main"; then
  echo -e "${RED}ERROR: Found 'push to main' instruction in worker files (without negation)${NC}"
  ERRORS=$((ERRORS + 1))
  WORKER_PROHIBITED=1
fi

# Check for "move to Done"
# Exclude negations and "asked to move to Done"
if grep -rn "move to Done" .claude/agents/github-ticket-worker*.md .claude/commands/work-ticket.md 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not\|asked to.*move to Done\|human.*move"; then
  echo -e "${RED}ERROR: Found 'move to Done' instruction in worker files (without negation)${NC}"
  ERRORS=$((ERRORS + 1))
  WORKER_PROHIBITED=1
fi

if [ $WORKER_PROHIBITED -eq 0 ]; then
  echo -e "${GREEN}✓ No prohibited merge/main/done instructions found in worker files${NC}"
fi

echo ""

# Check for prohibited Cloudflare deployment instructions
echo "Checking cloudflare files for prohibited deployment terms..."
CLOUDFLARE_FILES=$(find .claude -name "*cloudflare*.md" -o -name "*devops*.md" 2>/dev/null)
if [ -n "$CLOUDFLARE_FILES" ]; then
  CLOUDFLARE_PROHIBITED=0

  # Check for production deployment without approval context
  if echo "$CLOUDFLARE_FILES" | xargs grep -rn "wrangler deploy --env production" 2>/dev/null | grep -v "human approval\|with approval\|after approval\|request approval"; then
    echo -e "${RED}ERROR: Found 'wrangler deploy --env production' without human approval context${NC}"
    ERRORS=$((ERRORS + 1))
    CLOUDFLARE_PROHIBITED=1
  fi

  # Check for direct production deployment
  # Exclude negations and "asked to deploy to production directly"
  if echo "$CLOUDFLARE_FILES" | xargs grep -rn "deploy to production directly" 2>/dev/null | grep -v "NEVER\|NOT\|cannot\|don't\|do not\|asked to.*deploy to production directly\|to.*deploy to production directly"; then
    echo -e "${RED}ERROR: Found 'deploy to production directly' instruction (without negation)${NC}"
    ERRORS=$((ERRORS + 1))
    CLOUDFLARE_PROHIBITED=1
  fi

  if [ $CLOUDFLARE_PROHIBITED -eq 0 ]; then
    echo -e "${GREEN}✓ No prohibited production deployment instructions found${NC}"
  fi
else
  echo -e "${YELLOW}⚠ No Cloudflare/DevOps files found to check${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check for required protocol blocks in workflow-critical agent files
echo "Checking for NON-NEGOTIABLE PROTOCOL blocks in workflow agents..."
MISSING_PROTOCOL=0

# Only check agents that are part of the critical workflow
CRITICAL_AGENTS=("pr-reviewer" "github-ticket-worker" "cloudflare")

for file in .claude/agents/*.md; do
  if [ -f "$file" ]; then
    # Check if this is a critical agent
    is_critical=0
    for agent in "${CRITICAL_AGENTS[@]}"; do
      if [[ "$file" == *"$agent"* ]]; then
        is_critical=1
        break
      fi
    done

    # Only require NON-NEGOTIABLE PROTOCOL in critical agents
    if [ $is_critical -eq 1 ]; then
      if ! grep -q "NON-NEGOTIABLE PROTOCOL" "$file"; then
        echo -e "${RED}ERROR: Missing NON-NEGOTIABLE PROTOCOL in $file${NC}"
        ERRORS=$((ERRORS + 1))
        MISSING_PROTOCOL=1
      fi
    fi
  fi
done

if [ $MISSING_PROTOCOL -eq 0 ]; then
  echo -e "${GREEN}✓ All workflow-critical agent files contain NON-NEGOTIABLE PROTOCOL block${NC}"
fi

echo ""

# Check for required "You NEVER merge" statement
echo "Checking for 'You NEVER merge' statements..."
MISSING_NEVER_MERGE=0

for file in .claude/agents/*.md; do
  if [ -f "$file" ]; then
    # Only check pr-reviewer and github-ticket-worker for "NEVER merge"
    # Cloudflare has "NEVER deploy" which is appropriate for its context
    if [[ "$file" == *"pr-reviewer"* ]] || [[ "$file" == *"github-ticket-worker"* ]]; then
      if ! grep -q "You NEVER merge" "$file" && ! grep -q "NEVER merge" "$file"; then
        echo -e "${RED}ERROR: Missing 'You NEVER merge' statement in $file${NC}"
        ERRORS=$((ERRORS + 1))
        MISSING_NEVER_MERGE=1
      fi
    fi
  fi
done

if [ $MISSING_NEVER_MERGE -eq 0 ]; then
  echo -e "${GREEN}✓ Required 'NEVER merge' statements found in relevant agent files${NC}"
fi

echo ""

# Check for required "human" context in final approval
echo "Checking for 'human' in context of final approval..."
MISSING_HUMAN_CONTEXT=0

for file in .claude/agents/*.md; do
  if [ -f "$file" ]; then
    # Check if file mentions merge/approval but doesn't mention human
    if grep -q "merge\|approval" "$file" && ! grep -qi "human" "$file"; then
      echo -e "${YELLOW}WARNING: File $file mentions merge/approval but may lack 'human' context${NC}"
      WARNINGS=$((WARNINGS + 1))
      MISSING_HUMAN_CONTEXT=1
    fi
  fi
done

if [ $MISSING_HUMAN_CONTEXT -eq 0 ]; then
  echo -e "${GREEN}✓ All agent files with merge/approval context mention 'human' reviewer${NC}"
fi

echo ""

# Check for deprecated "velocity" language (should be "quality and protocol")
echo "Checking for deprecated 'velocity' language..."
VELOCITY_FOUND=0

if grep -rn "enabling velocity" .claude/agents/*.md 2>/dev/null; then
  echo -e "${YELLOW}WARNING: Found 'enabling velocity' language (should be 'quality and protocol')${NC}"
  WARNINGS=$((WARNINGS + 1))
  VELOCITY_FOUND=1
fi

if grep -rn "velocity over" .claude/agents/*.md 2>/dev/null; then
  echo -e "${YELLOW}WARNING: Found 'velocity over' language (should be 'quality and protocol')${NC}"
  WARNINGS=$((WARNINGS + 1))
  VELOCITY_FOUND=1
fi

if [ $VELOCITY_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ No deprecated 'velocity' language found${NC}"
fi

echo ""

# Check for consistent three-stage workflow description
echo "Checking for three-stage workflow consistency..."
WORKFLOW_INCONSISTENT=0

for file in .claude/agents/pr-reviewer*.md .claude/agents/github-ticket-worker*.md; do
  if [ -f "$file" ]; then
    if grep -q "THREE-STAGE WORKFLOW" "$file"; then
      # Check if all three stages are mentioned
      if ! grep -q "github-ticket-worker" "$file" || ! grep -q "pr-reviewer" "$file" || ! grep -q "Human" "$file"; then
        echo -e "${YELLOW}WARNING: THREE-STAGE WORKFLOW in $file may be incomplete${NC}"
        WARNINGS=$((WARNINGS + 1))
        WORKFLOW_INCONSISTENT=1
      fi
    fi
  fi
done

if [ $WORKFLOW_INCONSISTENT -eq 0 ]; then
  echo -e "${GREEN}✓ Three-stage workflow descriptions are consistent${NC}"
fi

echo ""
echo "=== Lint Summary ==="
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}FAILED: $ERRORS error(s) found${NC}"
  echo ""
  echo "Agent policies contain instructions that violate safety protocols."
  echo "Please review and fix the issues listed above."
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}PASSED with warnings: $WARNINGS warning(s) found${NC}"
  echo ""
  echo "Agent policies pass all critical checks but have some warnings."
  echo "Consider addressing the warnings to maintain consistency."
else
  echo -e "${GREEN}PASSED: All agent policies conform to safety standards${NC}"
  echo ""
  echo "No errors or warnings found. Agent policies are compliant."
fi

exit 0
