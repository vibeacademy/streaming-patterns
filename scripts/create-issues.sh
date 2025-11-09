#!/bin/bash

# Create all 12 GitHub issues for streaming-patterns project
# Usage: ./scripts/create-issues.sh

REPO="vibeacademy/streaming-patterns"

echo "Creating 12 GitHub issues for $REPO..."
echo ""

# Issue #1: Initialize Vite + React + TypeScript
echo "Creating issue #1: Initialize Vite + React + TypeScript..."
gh issue create \
  --repo "$REPO" \
  --title "Initialize Vite + React + TypeScript Project" \
  --label "infrastructure,phase-0,P0" \
  --body "## Overview
Set up the foundational React application using Vite as the build tool and TypeScript for type safety.

## Strategic Alignment
- **Phase**: Phase 0 - Setup & Planning
- **Milestone**: Foundation Complete (Dec 1, 2024)

## Acceptance Criteria
- [ ] \`npm run dev\` starts development server on localhost:5173
- [ ] \`npm run build\` produces optimized production bundle
- [ ] TypeScript strict mode enabled
- [ ] React 18+ installed and configured

## Dependencies
None (foundational task)

## Effort Estimate
1 day"

# Issue #2: Configure Vitest Testing
echo "Creating issue #2: Configure Vitest Testing Infrastructure..."
gh issue create \
  --repo "$REPO" \
  --title "Configure Vitest Testing Infrastructure" \
  --label "testing,infrastructure,phase-0,P0" \
  --body "## Overview
Set up Vitest as the test runner with Testing Library for React component testing.

## Strategic Alignment
- **Phase**: Phase 0
- **Milestone**: Foundation Complete (Dec 1, 2024)

## Acceptance Criteria
- [ ] \`npm test\` runs all tests successfully
- [ ] \`npm run test:coverage\` generates coverage report
- [ ] Coverage thresholds set to 80%
- [ ] Testing Library configured

## Dependencies
Depends on #1

## Effort Estimate
1.5 days"

# Issue #3: GitHub Actions CI/CD
echo "Creating issue #3: Set up GitHub Actions CI/CD..."
gh issue create \
  --repo "$REPO" \
  --title "Set up GitHub Actions CI/CD Pipeline" \
  --label "infrastructure,ci-cd,phase-0,P0" \
  --body "## Overview
Configure GitHub Actions workflows for CI on all pull requests.

## Strategic Alignment
- **Phase**: Phase 0
- **Milestone**: Foundation Complete (Dec 1, 2024)

## Acceptance Criteria
- [ ] CI runs automatically on all PRs
- [ ] Workflow includes: lint, test, build
- [ ] Tests must pass before merge

## Dependencies
Depends on #1, #2

## Effort Estimate
1 day"

# Issue #4: Stream Event Schema
echo "Creating issue #4: Design Stream Event Schema..."
gh issue create \
  --repo "$REPO" \
  --title "Design Stream Event Schema" \
  --label "streaming-infrastructure,phase-1,P0,foundational" \
  --body "## Overview
Define core event schema and TypeScript interfaces for all streaming patterns.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 34 (highest - unblocks all patterns)

## Acceptance Criteria
- [ ] Core event types defined for all 7 patterns
- [ ] TypeScript interfaces in \`src/types/events.ts\`
- [ ] Event types: reasoning, answer, memory, validation, table_row, etc.
- [ ] Type guards for runtime checking

## Dependencies
Depends on #1

## Effort Estimate
1 day"

# Issue #5: Mock SSE Generator
echo "Creating issue #5: Implement Mock SSE Generator..."
gh issue create \
  --repo "$REPO" \
  --title "Implement Mock SSE Generator" \
  --label "streaming-infrastructure,phase-1,P1,foundational" \
  --body "## Overview
Build the mock Server-Sent Events generator for deterministic streaming.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 18

## Acceptance Criteria
- [ ] Mock SSE generator in \`src/lib/streaming/mockSSE.ts\`
- [ ] Supports delay profiles: fast, normal, slow
- [ ] Loads events from fixture files
- [ ] Deterministic replay (INV-13)

## Dependencies
Depends on #4

## Effort Estimate
2 days"

# Issue #6: useStreamProcessor Hook
echo "Creating issue #6: Build useStreamProcessor Hook..."
gh issue create \
  --repo "$REPO" \
  --title "Build useStreamProcessor React Hook" \
  --label "streaming-infrastructure,react-hooks,phase-1,P1,foundational" \
  --body "## Overview
Create the core React hook for consuming mock streams.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 22 (high reusability)

## Acceptance Criteria
- [ ] Hook in \`src/lib/hooks/useStreamProcessor.ts\`
- [ ] Returns: events, isStreaming, error, pause, resume, reset
- [ ] Integrates with network inspector
- [ ] Unit tests >80% coverage

## Dependencies
Depends on #4, #5

## Effort Estimate
2 days"

# Issue #7: Fixture Repository
echo "Creating issue #7: Create Fixture Repository System..."
gh issue create \
  --repo "$REPO" \
  --title "Create Fixture Repository System" \
  --label "streaming-infrastructure,fixtures,phase-1,P1,foundational" \
  --body "## Overview
Design and implement fixture repository for deterministic mock data.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 16

## Acceptance Criteria
- [ ] Fixture format defined and documented
- [ ] Fixture loader in \`src/lib/streaming/fixtureRepository.ts\`
- [ ] Sample fixtures for each pattern
- [ ] Fixtures are deterministic (INV-13)

## Dependencies
Depends on #4

## Effort Estimate
2 days"

# Issue #8: Network Inspector
echo "Creating issue #8: Implement Network Inspector Component..."
gh issue create \
  --repo "$REPO" \
  --title "Implement Network Inspector Component" \
  --label "developer-tools,ui-components,phase-1,P1" \
  --body "## Overview
Build Network Inspector panel for real-time stream event visualization.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 14

## Acceptance Criteria
- [ ] Component in \`src/components/NetworkInspector/\`
- [ ] Real-time event capture (<50ms)
- [ ] Event filtering by type
- [ ] JSON payload inspector
- [ ] Export to JSON
- [ ] BDD specs pass (20 scenarios)

## Dependencies
Depends on #1, #4

## Effort Estimate
3 days"

# Issue #9: Annotated Source Viewer
echo "Creating issue #9: Build Annotated Source Viewer..."
gh issue create \
  --repo "$REPO" \
  --title "Build Annotated Source Viewer Component" \
  --label "developer-tools,ui-components,phase-1,P1" \
  --body "## Overview
Create Annotated Source code viewer with syntax highlighting.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 12

## Acceptance Criteria
- [ ] Component in \`src/components/AnnotatedSource/\`
- [ ] Syntax highlighting for TypeScript/TSX
- [ ] Inline annotations (markdown)
- [ ] Copy-to-clipboard

## Dependencies
Depends on #1

## Effort Estimate
2 days"

# Issue #10: Chain-of-Reasoning Pattern
echo "Creating issue #10: Implement Chain-of-Reasoning Pattern..."
gh issue create \
  --repo "$REPO" \
  --title "Implement Chain-of-Reasoning Pattern" \
  --label "pattern,chain-of-reasoning,phase-2,P1" \
  --body "## Overview
Implement the first complete streaming pattern: Chain-of-Reasoning.

## Strategic Alignment
- **Phase**: Phase 2
- **CD3 Score**: 20

## Acceptance Criteria
- [ ] Files in \`src/patterns/chain-of-reasoning/\`
- [ ] ReasoningBeadline component
- [ ] \"Promote to Plan\" CTA
- [ ] StreamFlow PM sprint planning demo
- [ ] BDD specs pass (18 scenarios)
- [ ] Tests >80% coverage

## Dependencies
Depends on #4, #5, #6, #7, #8

## Effort Estimate
4 days"

# Issue #11: Base UI Components
echo "Creating issue #11: Create Base UI Component Library..."
gh issue create \
  --repo "$REPO" \
  --title "Create Base UI Component Library" \
  --label "ui-components,phase-1,P1,foundational" \
  --body "## Overview
Build reusable base UI components with StreamFlow PM theming.

## Strategic Alignment
- **Phase**: Phase 1
- **CD3 Score**: 15

## Acceptance Criteria
- [ ] Components in \`src/components/ui/\`
- [ ] Base components: Button, Card, Input, Table, Badge
- [ ] Layout components: AppShell, PatternPage
- [ ] Consistent styling
- [ ] TypeScript prop types
- [ ] Unit tests

## Dependencies
Depends on #1

## Effort Estimate
3 days"

# Issue #12: Dark Mode & Theming
echo "Creating issue #12: Add Dark Mode and Theming..."
gh issue create \
  --repo "$REPO" \
  --title "Add Dark Mode and StreamFlow PM Theming" \
  --label "ui-components,theming,phase-1,P1" \
  --body "## Overview
Implement dark mode toggle and StreamFlow PM visual identity.

## Strategic Alignment
- **Phase**: Phase 1

## Acceptance Criteria
- [ ] Dark mode toggle component
- [ ] Theme persists in localStorage
- [ ] All components support light/dark modes
- [ ] StreamFlow PM logo (SVG)
- [ ] Design tokens defined

## Dependencies
Depends on #11

## Effort Estimate
2 days"

echo ""
echo "✅ All 12 issues created successfully!"
echo ""
echo "View them at: https://github.com/$REPO/issues"
