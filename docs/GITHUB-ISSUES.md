# GitHub Issues for Streaming Patterns Library

This file contains all 12 issues ready to be created on the GitHub repository.

You can create them via:
1. GitHub CLI: `gh issue create --repo vibeacademy/streaming-patterns --title "..." --body "..." --label "..."`
2. GitHub Web UI: Copy-paste each issue
3. GitHub API/Script

---

## Issue #1: Initialize Vite + React + TypeScript Project

**Labels**: `infrastructure`, `phase-0`, `P0`

### Body

```markdown
## Overview
Set up the foundational React application using Vite as the build tool and TypeScript for type safety.

## Strategic Alignment
- **Phase**: Phase 0 - Setup & Planning
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.1
- **Architecture**: Follows CLAUDE.md standards

## Description
Initialize the Vite + React + TypeScript project structure with proper configuration for development and production builds.

## Acceptance Criteria
- [ ] `npm run dev` starts development server on localhost:5173
- [ ] `npm run build` produces optimized production bundle
- [ ] `npm run preview` serves production build
- [ ] Hot Module Replacement (HMR) works
- [ ] TypeScript strict mode enabled
- [ ] React 18+ installed and configured
- [ ] Project structure follows CLAUDE.md conventions

## Technical Implementation

### Files to Create
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript strict mode config
- `tsconfig.node.json` - Node-specific TS config
- `index.html` - App entry point
- `src/main.tsx` - React app entry
- `src/App.tsx` - Root component
- `src/vite-env.d.ts` - Vite types

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

## Dependencies
None (foundational task)

## Effort Estimate
1 day

## References
- [PRODUCT-ROADMAP.md](docs/PRODUCT-ROADMAP.md)
- [CLAUDE.md](CLAUDE.md)
- [Vite Documentation](https://vitejs.dev)
```

---

## Issue #2: Configure Vitest Testing Infrastructure

**Labels**: `testing`, `infrastructure`, `phase-0`, `P0`

### Body

```markdown
## Overview
Set up Vitest as the test runner with Testing Library for React component testing and coverage reporting.

## Strategic Alignment
- **Phase**: Phase 0 - Setup & Planning
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.1
- **Architecture**: Enables TDD workflow per CLAUDE.md

## Description
Configure comprehensive testing infrastructure to support unit tests, integration tests, and coverage reporting with >80% threshold.

## Acceptance Criteria
- [ ] `npm test` runs all tests successfully
- [ ] `npm run test:ui` launches Vitest UI
- [ ] `npm run test:coverage` generates coverage report
- [ ] Coverage thresholds set to 80% (lines, functions, branches, statements)
- [ ] Testing Library configured for React components
- [ ] jsdom environment configured
- [ ] Test utilities and setup files in place

## Technical Implementation

### Files to Create
- `vitest.config.ts` - Vitest configuration
- `tests/setup.ts` - Global test setup
- `tests/mocks/` - Global mocks directory

### Dependencies
```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "vitest": "^1.0.4"
  }
}
```

## Dependencies
- **Depends on**: #1 (Vite project must exist)

## Effort Estimate
1.5 days

## References
- [CLAUDE.md](CLAUDE.md) - Testing standards (80% coverage)
- [specs/vitest.config.ts](specs/vitest.config.ts) - BDD config reference
- [Vitest Documentation](https://vitest.dev)
```

---

## Issue #3: Set up GitHub Actions CI/CD Pipeline

**Labels**: `infrastructure`, `ci-cd`, `phase-0`, `P0`

### Body

```markdown
## Overview
Configure GitHub Actions workflows for continuous integration: linting, testing, and build verification on all pull requests.

## Strategic Alignment
- **Phase**: Phase 0 - Setup & Planning
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1
- **Architecture**: Ensures code quality per CLAUDE.md

## Description
Create GitHub Actions workflow that runs on every PR to ensure code quality, test coverage, and successful builds.

## Acceptance Criteria
- [ ] CI runs automatically on all pull requests
- [ ] Workflow includes: lint, test, build steps
- [ ] Tests must pass before PR can be merged
- [ ] Coverage reports uploaded to codecov (optional)
- [ ] Build artifacts cached for faster runs
- [ ] Workflow runs on Node.js 20
- [ ] Clear status checks visible on PRs

## Technical Implementation

### Files to Create
- `.github/workflows/ci.yml` - Main CI workflow

### Workflow Steps
1. Checkout code
2. Setup Node.js 20 with dependency caching
3. Install dependencies: `npm ci`
4. Lint: `npm run lint`
5. Type check: `tsc --noEmit`
6. Run tests: `npm run test:coverage`
7. Build: `npm run build`
8. Upload coverage (optional)

## Dependencies
- **Depends on**: #1 (Vite project), #2 (Testing infrastructure)

## Effort Estimate
1 day

## References
- [CLAUDE.md](CLAUDE.md) - Quality standards
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
```

---

## Issue #4: Design Stream Event Schema

**Labels**: `streaming-infrastructure`, `phase-1`, `P0`, `foundational`

### Body

```markdown
## Overview
Define the core event schema and TypeScript interfaces for all streaming patterns based on DDD architecture.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.2
- **Architecture**: DDD-WORKUP.md Streaming Infrastructure Context
- **CD3 Score**: 34 (highest priority - unblocks all patterns)

## Description
Create comprehensive TypeScript type definitions for all stream events used across the 7 streaming patterns. This is foundational infrastructure that every pattern depends on.

## Acceptance Criteria
- [ ] Core event types defined for all 7 patterns
- [ ] TypeScript interfaces exported from `src/types/events.ts`
- [ ] Event types include: reasoning, answer, memory, validation, table_row, await_input, schema_error, patches
- [ ] Base StreamEvent interface with common fields
- [ ] Pattern-specific event schemas documented
- [ ] Type guards implemented for runtime type checking
- [ ] All events documented with JSDoc comments

## Technical Implementation

### Files to Create
- `src/types/events.ts` - Core event type definitions
- `src/types/patterns.ts` - Pattern metadata types
- `src/types/streamflow.ts` - StreamFlow PM business types
- `src/lib/streaming/eventSchema.ts` - Event validation utilities

### Event Types Needed
- Chain-of-Reasoning: `ReasoningEvent`, `AnswerEvent`
- Multi-Turn Memory: `MemoryEvent` (create/update/prune)
- Agent Await Prompt: `AwaitInputEvent`, `InputSubmissionEvent`
- Streaming Validation Loop: `CheckpointEvent`, `ValidationEvent`
- Tabular Stream View: `SchemaEvent`, `RowEvent`, `MetaEvent`
- Turn-Taking Co-Creation: `AgentPatchEvent`, `UserPatchEvent`
- Schema-Governed Exchange: `SchemaEvent`, `PayloadEvent`, `SchemaErrorEvent`

## Dependencies
- **Depends on**: #1 (Vite project must exist)
- **Blocks**: #5, #6, #7, all pattern implementations

## Effort Estimate
1 day

## References
- [DDD-WORKUP.md](docs/architecture/DDD-WORKUP.md) - Streaming Infrastructure Context
- [BDD Stream Generation Spec](specs/streaming-infrastructure/stream-generation.feature)
```

---

## Issue #5: Implement Mock SSE Generator

**Labels**: `streaming-infrastructure`, `phase-1`, `P1`, `foundational`

### Body

```markdown
## Overview
Build the mock Server-Sent Events (SSE) generator that simulates streaming from fixtures without real APIs.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.2
- **Architecture**: DDD-WORKUP.md Streaming Infrastructure Context
- **CD3 Score**: 18

## Description
Create a deterministic mock streaming infrastructure that generates SSE events from fixture files, supporting configurable delays and pause/resume mechanics.

## Acceptance Criteria
- [ ] Mock SSE generator implemented in `src/lib/streaming/mockSSE.ts`
- [ ] Async generator function returns StreamEvents
- [ ] Supports delay profiles: fast (50ms), normal (300ms), slow (1000ms)
- [ ] Loads events from fixture files
- [ ] Supports pause/resume functionality
- [ ] Events emitted in fixture order (INV-4)
- [ ] Timestamps monotonically increasing (INV-5)
- [ ] Session closes cleanly (INV-7)
- [ ] Deterministic replay (INV-13)
- [ ] BDD specs pass: `specs/streaming-infrastructure/stream-generation.feature`

## Technical Implementation

### Files to Create
- `src/lib/streaming/mockSSE.ts` - Main generator implementation
- `src/lib/streaming/streamSession.ts` - Session management
- `src/lib/streaming/streamCursor.ts` - Event cursor tracking

## Dependencies
- **Depends on**: #4 (Stream Event Schema must be defined)
- **Blocks**: #6, all pattern implementations

## Effort Estimate
2 days

## References
- [DDD-WORKUP.md](docs/architecture/DDD-WORKUP.md) - StreamSession Aggregate
- [BDD Stream Generation](specs/streaming-infrastructure/stream-generation.feature)
- [BDD Deterministic Replay](specs/streaming-infrastructure/deterministic-replay.feature)
```

---

## Issue #6: Build useStreamProcessor React Hook

**Labels**: `streaming-infrastructure`, `react-hooks`, `phase-1`, `P1`, `foundational`

### Body

```markdown
## Overview
Create the core React hook for consuming mock streams in pattern demos.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.2
- **Architecture**: DDD-WORKUP.md - Pattern Exhibition Context
- **CD3 Score**: 22 (high reusability across all patterns)

## Description
Implement the `useStreamProcessor` React hook that consumes async generators from the mock SSE infrastructure and manages streaming state.

## Acceptance Criteria
- [ ] Hook implemented in `src/lib/hooks/useStreamProcessor.ts`
- [ ] Accepts fixture ID and delay profile
- [ ] Returns: `{ events, isStreaming, error, pause, resume, reset }`
- [ ] Handles cleanup on unmount
- [ ] Integrates with network inspector capture
- [ ] Error handling for stream failures
- [ ] TypeScript generic for event types
- [ ] Comprehensive JSDoc documentation
- [ ] Unit tests with >80% coverage

## Technical Implementation

### Files to Create
- `src/lib/hooks/useStreamProcessor.ts` - Main hook
- `src/lib/hooks/useStreamProcessor.test.ts` - Tests

## Dependencies
- **Depends on**: #4 (Stream Schema), #5 (Mock SSE Generator)
- **Blocks**: All pattern implementations

## Effort Estimate
2 days

## References
- [DDD-WORKUP.md](docs/architecture/DDD-WORKUP.md) - PatternDemo Aggregate
- [CLAUDE.md](CLAUDE.md) - Custom Hooks for Logic
```

---

## Issue #7: Create Fixture Repository System

**Labels**: `streaming-infrastructure`, `fixtures`, `phase-1`, `P1`, `foundational`

### Body

```markdown
## Overview
Design and implement the fixture repository for deterministic mock data across all patterns.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.2
- **Architecture**: DDD-WORKUP.md - Streaming Infrastructure Context
- **CD3 Score**: 16

## Description
Create the fixture repository system with JSON-based fixtures for all 7 patterns, ensuring deterministic replay and easy authoring.

## Acceptance Criteria
- [ ] Fixture format defined and documented
- [ ] Fixture loader implemented in `src/lib/streaming/fixtureRepository.ts`
- [ ] Sample fixtures created for each pattern
- [ ] Fixtures are deterministic (INV-13)
- [ ] Fixtures are immutable (INV-14)
- [ ] Fixture validation (INV-16)
- [ ] BDD specs pass: `specs/streaming-infrastructure/deterministic-replay.feature`

## Technical Implementation

### Files to Create
- `src/lib/streaming/fixtureRepository.ts` - Loader and validator
- `src/fixtures/patterns/` - Pattern fixture files
- `src/fixtures/streamflow-pm/` - StreamFlow PM business data

## Dependencies
- **Depends on**: #4 (Stream Schema must be defined)
- **Blocks**: All pattern implementations

## Effort Estimate
2 days

## References
- [DDD-WORKUP.md](docs/architecture/DDD-WORKUP.md) - FixtureRepository
- [BDD Deterministic Replay](specs/streaming-infrastructure/deterministic-replay.feature)
```

---

## Issue #8: Implement Network Inspector Component

**Labels**: `developer-tools`, `ui-components`, `phase-1`, `P1`

### Body

```markdown
## Overview
Build the Network Inspector panel for real-time stream event visualization and debugging.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.3
- **Architecture**: DDD-WORKUP.md - Developer Tools Context
- **CD3 Score**: 14

## Description
Create the Network Inspector component that captures, visualizes, and allows inspection of all streaming events in real-time.

## Acceptance Criteria
- [ ] Component implemented in `src/components/NetworkInspector/`
- [ ] Real-time event capture (updates within 50ms)
- [ ] Event filtering by type
- [ ] JSON payload inspector with syntax highlighting
- [ ] Export events to JSON file
- [ ] Event search capability
- [ ] Captures ALL events (INV-15)
- [ ] Minimal performance impact <5% (INV-17)
- [ ] BDD specs pass: `specs/developer-tools/network-inspector.feature` (20 scenarios)

## Technical Implementation

### Files to Create
- `src/components/NetworkInspector/NetworkInspector.tsx`
- `src/components/NetworkInspector/EventList.tsx`
- `src/components/NetworkInspector/JsonViewer.tsx`
- `src/lib/hooks/useNetworkCapture.ts`

## Dependencies
- **Depends on**: #1 (React project), #4 (Stream Schema)
- **Used by**: All pattern implementations

## Effort Estimate
3 days

## References
- [DDD-WORKUP.md](docs/architecture/DDD-WORKUP.md) - NetworkCapture Aggregate
- [BDD Network Inspector](specs/developer-tools/network-inspector.feature)
```

---

## Issue #9: Build Annotated Source Viewer Component

**Labels**: `developer-tools`, `ui-components`, `phase-1`, `P1`

### Body

```markdown
## Overview
Create the Annotated Source code viewer with syntax highlighting and inline educational explanations.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.4
- **Architecture**: DDD-WORKUP.md - Developer Tools Context
- **CD3 Score**: 12

## Description
Build a code viewer component that displays pattern source code with syntax highlighting and inline annotations explaining key concepts.

## Acceptance Criteria
- [ ] Component implemented in `src/components/AnnotatedSource/`
- [ ] Syntax highlighting for TypeScript/TSX
- [ ] Inline annotations support
- [ ] Annotations written in markdown
- [ ] Copy-to-clipboard functionality
- [ ] Line number display
- [ ] Highlight specific lines or sections

## Technical Implementation

### Files to Create
- `src/components/AnnotatedSource/AnnotatedSource.tsx`
- `src/components/AnnotatedSource/CodeHighlighter.tsx`
- `src/components/AnnotatedSource/Annotations.tsx`

## Dependencies
- **Depends on**: #1 (React project)
- **Used by**: All pattern demos

## Effort Estimate
2 days

## References
- [CLAUDE.md](CLAUDE.md) - Annotated Source is Documentation
```

---

## Issue #10: Implement Chain-of-Reasoning Pattern

**Labels**: `pattern`, `chain-of-reasoning`, `phase-2`, `P1`

### Body

```markdown
## Overview
Implement the first complete streaming pattern: Chain-of-Reasoning with reasoning beads and promotion CTA.

## Strategic Alignment
- **Phase**: Phase 2 - Foundational Patterns
- **Milestone**: Foundational Patterns Complete (Dec 22, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 2, Epic 2.1
- **CD3 Score**: 20 (first pattern, educational reference)

## Description
Build the complete Chain-of-Reasoning pattern demo showing intermediate reasoning steps before the final answer.

## Acceptance Criteria
- [ ] All files in `src/patterns/chain-of-reasoning/` directory
- [ ] ReasoningBeadline component (vertical timeline)
- [ ] "Promote to Plan" CTA interaction
- [ ] StreamFlow PM sprint planning demo
- [ ] Network Inspector integration
- [ ] Annotated Source integration
- [ ] BDD specs pass: `specs/patterns/chain-of-reasoning.feature` (18 scenarios)
- [ ] Component tests with >80% coverage

## Technical Implementation

### Files to Create
- `src/patterns/chain-of-reasoning/ChainOfReasoningDemo.tsx`
- `src/patterns/chain-of-reasoning/ReasoningBeadline.tsx`
- `src/patterns/chain-of-reasoning/hooks.ts`
- `src/patterns/chain-of-reasoning/types.ts`
- `src/patterns/chain-of-reasoning/fixtures.ts`

## Dependencies
- **Depends on**: #4, #5, #6, #7, #8

## Effort Estimate
4 days

## References
- [Pattern Spec](../../test-codex/patterns/chain-of-reasoning-guide/README.md)
- [BDD Specs](specs/patterns/chain-of-reasoning.feature)
```

---

## Issue #11: Create Base UI Component Library

**Labels**: `ui-components`, `phase-1`, `P1`, `foundational`

### Body

```markdown
## Overview
Build reusable base UI components with consistent styling and StreamFlow PM theming.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.5
- **CD3 Score**: 15

## Description
Create the foundational UI component library including Button, Card, Input, Table, Badge, and layout components.

## Acceptance Criteria
- [ ] Components in `src/components/ui/` directory
- [ ] Base components: Button, Card, Input, Table, Badge, Spinner, Tooltip
- [ ] Layout components: AppShell, PatternPage, DemoContainer
- [ ] Consistent spacing and typography
- [ ] Component prop types with TypeScript
- [ ] JSDoc documentation
- [ ] Unit tests for each component

## Technical Implementation

### Files to Create
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Table.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/PatternPage.tsx`

## Dependencies
- **Depends on**: #1 (React project)
- **Used by**: All pattern implementations

## Effort Estimate
3 days
```

---

## Issue #12: Add Dark Mode and StreamFlow PM Theming

**Labels**: `ui-components`, `theming`, `phase-1`, `P1`

### Body

```markdown
## Overview
Implement dark mode toggle and finalize StreamFlow PM visual identity and theming system.

## Strategic Alignment
- **Phase**: Phase 1 - Foundation
- **Milestone**: Foundation Complete (Dec 1, 2024)
- **Roadmap**: PRODUCT-ROADMAP.md Phase 1, Epic 1.5

## Description
Add dark mode support with theme toggle and establish the complete StreamFlow PM visual identity.

## Acceptance Criteria
- [ ] Dark mode toggle component
- [ ] Theme persists in localStorage
- [ ] All components support both light and dark modes
- [ ] StreamFlow PM logo created (SVG)
- [ ] Design tokens defined
- [ ] CSS variables for theme switching
- [ ] Respects system preferences

## Technical Implementation

### Files to Create
- `src/styles/themes.css`
- `src/components/ThemeToggle.tsx`
- `src/lib/hooks/useTheme.ts`
- `public/streamflow-logo.svg`

## Dependencies
- **Depends on**: #11 (Base UI components)

## Effort Estimate
2 days
```

---

## Summary

**Total Issues**: 12
**Total Estimated Days**: 26.5 days

**Phase 0 (Ready)**: Issues #1, #2, #3 (3.5 days)
**Phase 1 (Backlog)**: Issues #4-9, #11-12 (19 days)
**Phase 2 (Backlog)**: Issue #10 (4 days)

**Priority Order**:
1. #1 - Vite + React + TypeScript
2. #2 - Vitest Testing
3. #3 - GitHub Actions CI/CD
4. #4 - Stream Event Schema
5. #5 - Mock SSE Generator
6. #6 - useStreamProcessor Hook
7. #7 - Fixture Repository
8. #11 - Base UI Components
9. #8 - Network Inspector
10. #9 - Annotated Source Viewer
11. #12 - Dark Mode & Theming
12. #10 - Chain-of-Reasoning Pattern
