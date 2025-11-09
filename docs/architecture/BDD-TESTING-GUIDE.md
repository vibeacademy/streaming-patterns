# BDD Testing Guide: Executable Specifications

## Overview

This document explains the Behavior-Driven Development (BDD) testing strategy for the Streaming Patterns Library. Our BDD specs serve as **executable documentation** that validates the system behaves according to the Domain-Driven Design architecture defined in [DDD-WORKUP.md](./DDD-WORKUP.md).

## Philosophy

**BDD specs are not just tests—they are living documentation.**

- ✅ **Readable by non-developers**: Product owners and designers can understand them
- ✅ **Executable**: They run as automated tests validating behavior
- ✅ **Organized by domain**: Specs follow DDD bounded contexts
- ✅ **Test invariants**: Every DDD invariant has corresponding scenarios
- ✅ **Educational**: Specs teach how patterns work through examples

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Cucumber.js** | Gherkin parser and BDD framework |
| **Vitest** | Test runner and assertion library |
| **Testing Library** | React component testing utilities |
| **TypeScript** | Type-safe step definitions |

## Directory Structure

```
specs/
├── README.md                           # Overview and quick start
├── vitest.config.ts                    # Vitest configuration for BDD
├── package.json.template               # Dependencies and scripts
│
├── support/                            # Shared test infrastructure
│   ├── world.ts                        # Cucumber World (shared state)
│   ├── hooks.ts                        # Before/After hooks
│   ├── setup.ts                        # Vitest global setup
│   └── fixtures/                       # Test data organized by context
│
├── pattern-exhibition/                 # BOUNDED CONTEXT: Pattern Exhibition
│   ├── demo-lifecycle.feature          # Demo state machine specs
│   ├── pattern-interactions.feature    # User interaction specs
│   └── step-definitions/
│       ├── demo-lifecycle.steps.ts
│       └── pattern-interactions.steps.ts
│
├── streaming-infrastructure/           # BOUNDED CONTEXT: Streaming Infrastructure
│   ├── stream-generation.feature       # Event generation specs
│   ├── event-ordering.feature          # Order invariants
│   ├── deterministic-replay.feature    # Determinism guarantee specs
│   └── step-definitions/
│       ├── stream-generation.steps.ts
│       ├── event-ordering.steps.ts
│       └── deterministic-replay.steps.ts
│
├── developer-tools/                    # BOUNDED CONTEXT: Developer Tools
│   ├── network-inspector.feature       # Event capture specs
│   ├── event-capture.feature           # Completeness invariants
│   ├── annotated-source.feature        # Source viewer specs
│   └── step-definitions/
│
└── patterns/                           # Individual pattern specs
    ├── chain-of-reasoning.feature      # Chain-of-Reasoning pattern
    ├── multi-turn-memory.feature       # Multi-Turn Memory pattern
    ├── agent-await-prompt.feature      # Agent Await Prompt pattern
    ├── streaming-validation-loop.feature
    ├── tabular-stream-view.feature
    ├── turn-taking-co-creation.feature
    ├── schema-governed-exchange.feature
    └── step-definitions/
```

## Mapping: DDD Bounded Contexts → BDD Specs

| Bounded Context | Feature Files | Purpose |
|-----------------|---------------|---------|
| **Pattern Exhibition** | `pattern-exhibition/*.feature` | Validate demo lifecycle, state transitions (INV-1, INV-2) |
| **Streaming Infrastructure** | `streaming-infrastructure/*.feature` | Validate event generation, ordering (INV-4), determinism (INV-13) |
| **Developer Tools** | `developer-tools/*.feature` | Validate event capture completeness (INV-15) |
| **StreamFlow PM** | Fixtures + pattern scenarios | Provide realistic business context |
| **Individual Patterns** | `patterns/*.feature` | Validate each pattern's stream contract and UX |

## Invariant Coverage

Every invariant from `DDD-WORKUP.md` is tested by BDD scenarios:

| Invariant ID | Description | Feature File | Scenario |
|--------------|-------------|--------------|----------|
| **INV-1** | Valid state transitions only | `pattern-exhibition/demo-lifecycle.feature` | "Valid demo state transitions" |
| **INV-2** | Demo state must be valid | `pattern-exhibition/demo-lifecycle.feature` | "Invalid state transitions are rejected" |
| **INV-4** | Event order preservation | `streaming-infrastructure/event-ordering.feature` | "Events are emitted in fixture order" |
| **INV-5** | Timestamps monotonic | `streaming-infrastructure/stream-generation.feature` | "Event timestamps are monotonically increasing" |
| **INV-7** | Session closes cleanly | `streaming-infrastructure/stream-generation.feature` | "Stream session closes after all events" |
| **INV-8** | No events from closed session | `streaming-infrastructure/stream-generation.feature` | "Closed session rejects event emission" |
| **INV-9** | Payloads match schema | `streaming-infrastructure/stream-generation.feature` | "Event payloads conform to schema" |
| **INV-13** | Fixture determinism | `streaming-infrastructure/deterministic-replay.feature` | "Same fixture produces identical event sequence" |
| **INV-14** | Fixtures immutable | `streaming-infrastructure/deterministic-replay.feature` | "Fixtures cannot be modified during streaming" |
| **INV-15** | Event capture completeness | `developer-tools/network-inspector.feature` | "All stream events are captured" |
| **INV-16** | Fixture format validation | `streaming-infrastructure/deterministic-replay.feature` | "Invalid fixture format is rejected" |
| **INV-17** | Inspector non-interference | `developer-tools/network-inspector.feature` | "Inspector has minimal performance impact" |

## Running Specs

### Installation

```bash
# Install dependencies
npm install

# Install BDD-specific dependencies
npm install --save-dev @cucumber/cucumber ts-node c8
```

### Run All Specs

```bash
npm run specs
```

### Run by Bounded Context

```bash
# Pattern Exhibition Context
npm run specs:exhibition

# Streaming Infrastructure Context
npm run specs:infrastructure

# Developer Tools Context
npm run specs:tools

# All Individual Patterns
npm run specs:patterns
```

### Run Individual Pattern Specs

```bash
npm run specs:chain-of-reasoning
npm run specs:multi-turn-memory
npm run specs:agent-await-prompt
npm run specs:streaming-validation-loop
npm run specs:tabular-stream-view
npm run specs:turn-taking-co-creation
npm run specs:schema-governed-exchange
```

### Development Workflows

```bash
# Watch mode (re-runs on file changes)
npm run specs:watch

# Generate HTML report
npm run specs:html-report
# Opens: specs/reports/cucumber-report.html

# Generate JSON report (for CI/CD)
npm run specs:json-report

# Run with coverage
npm run specs:coverage
```

### CI/CD Integration

```bash
# Run all tests (unit + BDD) with coverage
npm run test:all:coverage

# Validate entire project (lint, test, build)
npm run validate
```

## Writing BDD Specs

### Gherkin Syntax

Feature files use Gherkin syntax:

```gherkin
Feature: [Feature Name]
  As a [role]
  I want [capability]
  So that [benefit]

  Background:
    Given [common setup for all scenarios]

  Rule: [Business rule or invariant]

    Scenario: [Specific test case]
      Given [initial state]
      When [action taken]
      Then [expected outcome]

    Scenario Outline: [Parameterized test]
      Given <parameter>
      When I do <action>
      Then I should see <result>

      Examples:
        | parameter | action | result |
        | value1    | act1   | res1   |
        | value2    | act2   | res2   |
```

### Example: Testing an Invariant

**Invariant**: INV-4 - Events must be emitted in order

```gherkin
Feature: Stream Event Ordering
  As a Streaming Infrastructure Context
  I want events to be emitted in fixture order
  So that patterns receive predictable sequences (INV-4)

  Scenario: Events are emitted in fixture order
    Given a stream session with fixture "reasoning-sprint-planning"
    When I consume all events from the stream
    Then events should be emitted in the order defined in the fixture
    And event IDs should match fixture event IDs
    And no events should be skipped
```

**Step Definition** (TypeScript):

```typescript
// specs/streaming-infrastructure/step-definitions/event-ordering.steps.ts

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';

Given('a stream session with fixture {string}', function(fixtureName: string) {
  this.fixture = this.fixtureRepository[fixtureName];
  this.streamSession = createStreamSession(this.fixture);
});

When('I consume all events from the stream', async function() {
  this.consumedEvents = [];
  for await (const event of this.streamSession.generate()) {
    this.consumedEvents.push(event);
  }
});

Then('events should be emitted in the order defined in the fixture', function() {
  const fixtureOrder = this.fixture.events.map(e => e.id);
  const actualOrder = this.consumedEvents.map(e => e.id);
  expect(actualOrder).toEqual(fixtureOrder);
});
```

### Using the Cucumber World

The `World` object provides shared state across steps:

```typescript
// Access in step definitions via `this`
Given('a pattern demo', function() {
  this.patternDemo = {
    id: 'demo-1',
    patternId: 'chain-of-reasoning',
    state: 'idle',
  };
});

When('I start the demo', function() {
  this.patternDemo.state = 'streaming';
});

Then('the demo should be streaming', function() {
  expect(this.patternDemo.state).toBe('streaming');
});
```

### Tagging Scenarios

Use tags to organize and filter scenarios:

```gherkin
@slow
Scenario: Large fixture streaming
  Given a fixture with 1000 events
  When I stream all events
  Then performance should be acceptable

@future
Scenario: Advanced feature not yet implemented
  Given a future capability
  When it's implemented
  Then it should work

@chain-of-reasoning @streamflow-pm
Scenario: Sprint planning with reasoning
  Given StreamFlow PM project "Dashboard"
  When I plan a sprint
  Then reasoning steps should appear
```

Run tagged scenarios:

```bash
# Run only @slow scenarios
npm run specs -- --tags "@slow"

# Run everything except @future
npm run specs -- --tags "not @future"

# Run specific pattern
npm run specs -- --tags "@chain-of-reasoning"
```

## Best Practices

### 1. Use Domain Language

✅ **Good**: Uses ubiquitous language from DDD model

```gherkin
Given a PatternDemo in "streaming" state
When I pause the demo
Then the StreamSession should transition to "paused"
And the cursor position should be preserved
```

❌ **Bad**: Uses implementation details

```gherkin
Given a component with state.phase = "streaming"
When I call setState({ phase: "paused" })
Then state.session.cursor should not change
```

### 2. Test Behavior, Not Implementation

✅ **Good**: Focuses on observable behavior

```gherkin
When I click "Promote to Plan"
Then the reasoning bead should appear in the chat
And a "reasoning_promoted" event should be captured
```

❌ **Bad**: Tests internal state

```gherkin
When I call handlePromote()
Then this.state.promotedBeads should include the bead
And this.networkCapture.events.push should be called
```

### 3. One Scenario Per Concept

Each scenario should test one specific aspect:

```gherkin
# ✅ Focused scenario
Scenario: Pausing preserves cursor position
  Given a streaming demo at event 5
  When I pause the demo
  Then the cursor should remain at event 5

# ❌ Testing too much at once
Scenario: Complete demo lifecycle
  When I start, pause, resume, and reset the demo
  Then everything should work correctly
```

### 4. Use Scenario Outlines for Data Variations

```gherkin
Scenario Outline: State transition validation
  Given a demo in "<current>" state
  When I attempt to "<action>"
  Then the operation should "<result>"

  Examples:
    | current   | action | result  |
    | idle      | start  | succeed |
    | idle      | pause  | fail    |
    | streaming | pause  | succeed |
    | paused    | resume | succeed |
```

### 5. Organize by Aggregate

Group scenarios around DDD aggregates:

```gherkin
Feature: StreamSession Aggregate
  # All scenarios related to StreamSession behavior

Feature: PatternDemo Aggregate
  # All scenarios related to PatternDemo behavior
```

## Debugging Specs

### Enable Verbose Output

```bash
VITEST_VERBOSE=1 npm run specs
```

### Enable Debug Mode

```gherkin
@debug
Scenario: Debugging this specific scenario
  Given some state
  When something happens
  Then I want to see detailed logs
```

### Inspect World State

Add a debug hook in `specs/support/hooks.ts`:

```typescript
After({ tags: '@debug' }, async function() {
  console.log('World state:', {
    patternDemo: this.patternDemo,
    streamSession: this.streamSession,
    networkInspector: this.networkInspector,
  });
});
```

### Use Cucumber's Built-in Logging

```typescript
When('something complex happens', function() {
  this.log('Starting complex operation...');
  // ... complex logic
  this.log('Complex operation complete');
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: BDD Specs

on: [push, pull_request]

jobs:
  bdd-specs:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run BDD specs
        run: npm run specs

      - name: Generate HTML report
        if: always()
        run: npm run specs:html-report

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cucumber-report
          path: specs/reports/

      - name: Run with coverage
        run: npm run specs:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/specs/lcov.info
```

## Reports and Visualization

### HTML Report

Generate a visual HTML report:

```bash
npm run specs:html-report
```

Opens `specs/reports/cucumber-report.html` showing:
- Features and scenarios
- Pass/fail status
- Execution time
- Step details

### JSON Report (for CI/CD)

```bash
npm run specs:json-report
```

Generates `specs/reports/cucumber-report.json` for integration with:
- Jenkins Cucumber Plugin
- GitLab Test Reports
- Custom dashboards

### Coverage Report

```bash
npm run specs:coverage
```

Shows code coverage from BDD specs:
- Lines covered
- Functions covered
- Branches covered
- Statements covered

## Monorepo Considerations

The BDD specs are designed for monorepo compatibility:

```
streaming-patterns/                    # Root monorepo
├── packages/
│   ├── core/                          # Core streaming infrastructure
│   │   └── specs/                     # Specs for core package
│   ├── patterns/                      # Pattern implementations
│   │   └── specs/                     # Specs for patterns package
│   └── ui-components/                 # Shared UI components
│       └── specs/                     # Specs for UI package
├── apps/
│   └── demo-app/                      # Demo application
│       └── specs/                     # E2E specs for demo app
└── specs/                             # Root-level integration specs
    └── README.md                      # This guide
```

Each package can have its own `specs/` directory with:
- Package-specific feature files
- Package-specific step definitions
- Shared world and hooks (via root `specs/support/`)

## Contributing

When adding a new pattern:

1. **Create feature file**: `specs/patterns/{pattern-name}.feature`
2. **Write scenarios**: Based on pattern's Stream Contract from `/patterns/{name}/README.md`
3. **Implement steps**: `specs/patterns/step-definitions/{pattern-name}.steps.ts`
4. **Add fixtures**: `specs/support/fixtures/patterns/{pattern-name}.json`
5. **Test invariants**: Ensure all pattern-specific invariants are covered
6. **Update docs**: Add pattern to this guide's coverage table

## FAQ

### Q: Why Cucumber instead of just Vitest?

**A**: Cucumber provides:
- Human-readable specs (Gherkin)
- Separation of behavior (feature files) from implementation (step definitions)
- Living documentation that non-developers can understand
- Direct mapping to DDD ubiquitous language

### Q: Can I run BDD specs and unit tests together?

**A**: Yes!

```bash
npm run test:all        # Runs both unit tests and BDD specs
npm run test:all:coverage  # With coverage
```

### Q: How do I test React components in BDD specs?

**A**: Use Testing Library in step definitions:

```typescript
import { render, screen } from '@testing-library/react';
import { ChainOfReasoningDemo } from '@/patterns/chain-of-reasoning';

When('I view the demo', function() {
  this.test.component = render(<ChainOfReasoningDemo />);
});

Then('I should see reasoning beads', function() {
  expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
});
```

### Q: How do I test async streaming behavior?

**A**: Use `waitFor` from Testing Library:

```typescript
import { waitFor } from '@testing-library/react';

Then('reasoning beads should appear', async function() {
  await waitFor(() => {
    expect(screen.getAllByRole('article')).toHaveLength(5);
  }, { timeout: 5000 });
});
```

### Q: What's the difference between `specs/` and `tests/`?

- **`specs/`**: BDD specifications (Cucumber, Gherkin)
- **`tests/`** or `src/**/*.test.ts`: Unit/integration tests (Vitest)

Both are valuable and complementary!

## References

- [DDD Architecture Workup](./DDD-WORKUP.md)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
- [Pattern Specifications](../../test-codex/patterns/)

---

**Last Updated**: Nov 9, 2024
