#!/bin/bash

#############################
# Fresh Clone Verification Script
#
# Purpose: Simulates a new developer cloning and setting up the project
# Tests all steps from README.md to ensure zero-friction onboarding
#############################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="fresh-clone-verification-$(date +%Y%m%d-%H%M%S).log"

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}========================================${NC}\n" | tee -a "$LOG_FILE"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

# Function to print info
print_info() {
  echo -e "${YELLOW}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

# Track timing
START_TIME=$(date +%s)

print_header "Fresh Clone Verification Started"
print_info "Log file: $LOG_FILE"
print_info "Testing repository: https://github.com/vibeacademy/streaming-patterns.git"

# Check prerequisites
print_header "Step 0: Prerequisites Check"

# Check Node version
print_info "Checking Node.js version..."
NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" =~ ^v([0-9]+) ]]; then
  NODE_MAJOR="${BASH_REMATCH[1]}"
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    print_success "Node.js version meets requirement (>=18.0.0)"
  else
    print_error "Node.js version $NODE_VERSION is below required 18.0.0"
    exit 1
  fi
else
  print_error "Could not parse Node.js version"
  exit 1
fi

# Check npm
print_info "Checking npm..."
NPM_VERSION=$(npm --version)
print_success "npm version: $NPM_VERSION"

# Check git
print_info "Checking git..."
GIT_VERSION=$(git --version)
print_success "git version: $GIT_VERSION"

# Step 1: Clone repository
print_header "Step 1: Clone Repository"

# Create temporary directory for fresh clone
TEMP_DIR=$(mktemp -d)
print_info "Creating temporary directory: $TEMP_DIR"

CLONE_START=$(date +%s)
print_info "Cloning repository..."

if git clone https://github.com/vibeacademy/streaming-patterns.git "$TEMP_DIR/streaming-patterns" >> "$LOG_FILE" 2>&1; then
  CLONE_END=$(date +%s)
  CLONE_TIME=$((CLONE_END - CLONE_START))
  print_success "Repository cloned successfully (${CLONE_TIME}s)"
else
  print_error "Failed to clone repository"
  exit 1
fi

# Navigate to cloned directory
cd "$TEMP_DIR/streaming-patterns"
print_success "Changed directory to: $(pwd)"

# Step 2: Install dependencies
print_header "Step 2: Install Dependencies (npm install)"

INSTALL_START=$(date +%s)
print_info "Running npm install..."

if npm install >> "$LOG_FILE" 2>&1; then
  INSTALL_END=$(date +%s)
  INSTALL_TIME=$((INSTALL_END - INSTALL_START))
  print_success "Dependencies installed successfully (${INSTALL_TIME}s)"
else
  print_error "Failed to install dependencies"
  print_error "Check $LOG_FILE for details"
  exit 1
fi

# Verify node_modules exists
if [ -d "node_modules" ]; then
  NODE_MODULES_SIZE=$(du -sh node_modules | cut -f1)
  print_success "node_modules directory created (size: $NODE_MODULES_SIZE)"
else
  print_error "node_modules directory not found"
  exit 1
fi

# Verify package-lock.json was created
if [ -f "package-lock.json" ]; then
  print_success "package-lock.json created"
else
  print_error "package-lock.json not found"
  exit 1
fi

# Step 3: Type Check
print_header "Step 3: TypeScript Type Check"

TYPE_CHECK_START=$(date +%s)
print_info "Running npm run type-check..."

if npm run type-check >> "$LOG_FILE" 2>&1; then
  TYPE_CHECK_END=$(date +%s)
  TYPE_CHECK_TIME=$((TYPE_CHECK_END - TYPE_CHECK_START))
  print_success "Type check passed (${TYPE_CHECK_TIME}s)"
else
  print_error "Type check failed"
  print_error "Check $LOG_FILE for details"
  exit 1
fi

# Step 4: Linting
print_header "Step 4: Linting"

LINT_START=$(date +%s)
print_info "Running npm run lint..."

if npm run lint >> "$LOG_FILE" 2>&1; then
  LINT_END=$(date +%s)
  LINT_TIME=$((LINT_END - LINT_START))
  print_success "Linting passed (${LINT_TIME}s)"
else
  print_error "Linting failed"
  print_error "Check $LOG_FILE for details"
  exit 1
fi

# Step 5: Run Tests
print_header "Step 5: Run Tests (npm test)"

TEST_START=$(date +%s)
print_info "Running npm run test:run..."

if npm run test:run >> "$LOG_FILE" 2>&1; then
  TEST_END=$(date +%s)
  TEST_TIME=$((TEST_END - TEST_START))
  print_success "All tests passed (${TEST_TIME}s)"
else
  print_error "Tests failed"
  print_error "Check $LOG_FILE for details"
  exit 1
fi

# Step 6: Build for Production
print_header "Step 6: Build for Production (npm run build)"

BUILD_START=$(date +%s)
print_info "Running npm run build..."

if npm run build >> "$LOG_FILE" 2>&1; then
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))
  print_success "Build completed successfully (${BUILD_TIME}s)"
else
  print_error "Build failed"
  print_error "Check $LOG_FILE for details"
  exit 1
fi

# Verify dist directory exists
if [ -d "dist" ]; then
  DIST_SIZE=$(du -sh dist | cut -f1)
  print_success "dist directory created (size: $DIST_SIZE)"

  # List key files in dist
  print_info "Build artifacts:"
  ls -lh dist/ | grep -E '\.(html|js|css)$' | awk '{print "  - " $9 " (" $5 ")"}' | tee -a "$LOG_FILE"
else
  print_error "dist directory not found"
  exit 1
fi

# Step 7: Verify Key Files Exist
print_header "Step 7: Verify Project Structure"

KEY_FILES=(
  "package.json"
  "vite.config.ts"
  "tsconfig.json"
  "README.md"
  "CLAUDE.md"
  "src/main.tsx"
  "src/App.tsx"
  "src/patterns/chain-of-reasoning/ChainOfReasoningDemo.tsx"
)

for file in "${KEY_FILES[@]}"; do
  if [ -f "$file" ]; then
    print_success "File exists: $file"
  else
    print_error "File missing: $file"
    exit 1
  fi
done

# Step 8: Calculate Total Time
print_header "Verification Summary"

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_MINUTES=$((TOTAL_TIME / 60))
TOTAL_SECONDS=$((TOTAL_TIME % 60))

print_success "All verification steps passed!"
print_info "Total time: ${TOTAL_MINUTES}m ${TOTAL_SECONDS}s"
print_info ""
print_info "Breakdown:"
print_info "  - Clone:       ${CLONE_TIME}s"
print_info "  - Install:     ${INSTALL_TIME}s"
print_info "  - Type Check:  ${TYPE_CHECK_TIME}s"
print_info "  - Lint:        ${LINT_TIME}s"
print_info "  - Tests:       ${TEST_TIME}s"
print_info "  - Build:       ${BUILD_TIME}s"

# Check if under 3 minutes
TARGET_TIME=180  # 3 minutes in seconds
if [ "$TOTAL_TIME" -lt "$TARGET_TIME" ]; then
  print_success "✓ Meets <3 minute target for setup!"
else
  print_error "✗ Exceeds 3 minute target (${TOTAL_TIME}s vs ${TARGET_TIME}s target)"
fi

# Step 9: Cleanup
print_header "Cleanup"

print_info "Temporary directory: $TEMP_DIR"
print_info "To manually inspect, run: cd $TEMP_DIR/streaming-patterns"
print_info "To cleanup, run: rm -rf $TEMP_DIR"

print_header "Verification Complete!"
print_success "Log saved to: $LOG_FILE"
