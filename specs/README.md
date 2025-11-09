# BDD Specifications for Streaming Patterns Library

This directory contains executable Behavior-Driven Development (BDD) specifications organized by bounded contexts from our Domain-Driven Design architecture.

## Structure

```
specs/
├── README.md                           # This file
├── vitest.config.ts                    # BDD test configuration
├── support/                            # Shared test utilities
│   ├── world.ts                        # Cucumber world for shared state
│   ├── hooks.ts                        # Before/After hooks
│   └── fixtures.ts                     # Test fixture helpers
│
├── pattern-exhibition/                 # Pattern Exhibition Context specs
│   ├── demo-lifecycle.feature
│   ├── pattern-interactions.feature
│   └── step-definitions/
│       ├── demo-lifecycle.steps.ts
│       └── pattern-interactions.steps.ts
│
├── streaming-infrastructure/           # Streaming Infrastructure Context specs
│   ├── stream-generation.feature
│   ├── event-ordering.feature
│   ├── deterministic-replay.feature
│   └── step-definitions/
│       ├── stream-generation.steps.ts
│       ├── event-ordering.steps.ts
│       └── deterministic-replay.steps.ts
│
├── developer-tools/                    # Developer Tools Context specs
│   ├── network-inspector.feature
│   ├── event-capture.feature
│   ├── annotated-source.feature
│   └── step-definitions/
│       ├── network-inspector.steps.ts
│       ├── event-capture.steps.ts
│       └── annotated-source.steps.ts
│
└── patterns/                           # Individual pattern specs
    ├── chain-of-reasoning.feature
    ├── multi-turn-memory.feature
    ├── agent-await-prompt.feature
    ├── streaming-validation-loop.feature
    ├── tabular-stream-view.feature
    ├── turn-taking-co-creation.feature
    ├── schema-governed-exchange.feature
    └── step-definitions/
        ├── chain-of-reasoning.steps.ts
        ├── multi-turn-memory.steps.ts
        ├── agent-await-prompt.steps.ts
        ├── streaming-validation-loop.steps.ts
        ├── tabular-stream-view.steps.ts
        ├── turn-taking-co-creation.steps.ts
        └── schema-governed-exchange.steps.ts
```

## Technology Stack

- **Vitest**: Test runner and assertion library
- **@cucumber/cucumber**: Gherkin parser and BDD framework
- **Testing Library**: React component testing utilities
- **TypeScript**: Type-safe step definitions

## Running Specs

### Run All Specs
```bash
npm run specs
```

### Run Specs by Bounded Context
```bash
npm run specs:exhibition        # Pattern Exhibition Context
npm run specs:infrastructure    # Streaming Infrastructure Context
npm run specs:tools            # Developer Tools Context
npm run specs:patterns         # All pattern implementations
```

### Run Individual Pattern Specs
```bash
npm run specs -- chain-of-reasoning
npm run specs -- multi-turn-memory
npm run specs -- agent-await-prompt
npm run specs -- streaming-validation-loop
npm run specs -- tabular-stream-view
npm run specs -- turn-taking-co-creation
npm run specs -- schema-governed-exchange
```

### Run with Coverage
```bash
npm run specs:coverage
```

### Run in Watch Mode
```bash
npm run specs:watch
```

## Writing Specs

### Gherkin Style Guide

**Use Domain Language**: Feature files should use the ubiquitous language from our DDD model.

```gherkin
Feature: Stream Session Lifecycle
  As a streaming infrastructure
  I want to manage event generation lifecycle
  So that patterns can receive deterministic events

  Background:
    Given a fixture repository with sample events
    And delay profile set to "fast"

  Scenario: Start and complete a stream session
    When I create a stream session with fixture "sprint-planning"
    Then the session should be in "active" state
    When I consume all events from the stream
    Then I should receive exactly 7 events
    And the session should be in "closed" state
    And event timestamps should be monotonically increasing
```

**Organize by Aggregate**: Group scenarios around aggregates from the DDD model.

**Test Invariants**: Each invariant from DDD-WORKUP.md should have corresponding scenarios.

### Step Definition Patterns

**Given**: Set up initial state (arrange)
```typescript
Given('a fixture repository with sample events', function() {
  this.fixtureRepo = new FixtureRepository();
  this.fixtureRepo.load('sample-events');
});
```

**When**: Perform action (act)
```typescript
When('I create a stream session with fixture {string}', async function(fixtureName: string) {
  this.streamSession = await createStreamSession(fixtureName, this.delayProfile);
});
```

**Then**: Assert expectations (assert)
```typescript
Then('the session should be in {string} state', function(expectedState: string) {
  expect(this.streamSession.state).toBe(expectedState);
});
```

## Bounded Context Coverage

### Pattern Exhibition Context
- ✅ Demo lifecycle (start, pause, resume, reset, complete)
- ✅ State transitions and invariants
- ✅ User interactions (promote reasoning, pin memory, approve checkpoint)
- ✅ Pattern metadata and registration

### Streaming Infrastructure Context
- ✅ Stream session management
- ✅ Event generation and ordering
- ✅ Deterministic fixture replay
- ✅ Pause/resume mechanics
- ✅ Delay profiles and timing

### Developer Tools Context
- ✅ Network event capture
- ✅ Event filtering and inspection
- ✅ Export functionality
- ✅ Annotated source viewer
- ✅ Real-time event visualization

### Individual Patterns
- ✅ Chain-of-Reasoning: Reasoning beads, promotion CTA
- ✅ Multi-Turn Memory: Timeline, pin/prune, memory lifecycle
- ✅ Agent Await Prompt: Input suspension, resume, timeout
- ✅ Streaming Validation Loop: Checkpoints, approval/skip, timeline marks
- ✅ Tabular Stream View: Schema announcement, row streaming, sort/filter
- ✅ Turn-Taking Co-Creation: Patches, authorship, conflict resolution
- ✅ Schema-Governed Exchange: Schema validation, error recovery, compliance

## Invariant Testing

Each invariant from `docs/architecture/DDD-WORKUP.md` should have corresponding BDD scenarios:

| Invariant | Feature File | Scenario |
|-----------|--------------|----------|
| INV-1: Valid state transitions | pattern-exhibition/demo-lifecycle.feature | Valid demo state transitions |
| INV-2: Demo state validity | pattern-exhibition/demo-lifecycle.feature | Demo state machine enforcement |
| INV-4: Event order preservation | streaming-infrastructure/event-ordering.feature | Events maintain order |
| INV-13: Fixture determinism | streaming-infrastructure/deterministic-replay.feature | Same fixture produces same events |
| INV-15: Event capture completeness | developer-tools/event-capture.feature | All events captured |

## Test Data

### Fixture Organization
```
specs/support/fixtures/
├── streaming/
│   ├── reasoning-events.json
│   ├── memory-events.json
│   ├── table-events.json
│   └── validation-events.json
├── streamflow-pm/
│   ├── projects.json
│   ├── sprints.json
│   └── tasks.json
└── patterns/
    ├── chain-of-reasoning.json
    ├── multi-turn-memory.json
    └── ...
```

### Using Fixtures in Specs
```gherkin
Given a stream fixture "reasoning-events"
And StreamFlow PM project "Dashboard Redesign"
When I start a chain-of-reasoning demo
Then reasoning beads should render from fixture
```

## CI/CD Integration

BDD specs run as part of the CI pipeline:

```yaml
# .github/workflows/specs.yml
- name: Run BDD Specs
  run: npm run specs

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/specs/lcov.info
```

## Best Practices

1. **One Feature Per Aggregate**: Each aggregate should have its own feature file
2. **Readable Scenarios**: Write scenarios that product owners can understand
3. **Reusable Steps**: Extract common steps into shared step definitions
4. **Test Invariants**: Every DDD invariant should be tested
5. **Avoid Implementation Details**: Focus on behavior, not implementation
6. **Use Examples**: Use Scenario Outlines for parameterized testing
7. **Keep Scenarios Independent**: Each scenario should be runnable in isolation

## Contributing

When adding a new pattern:

1. Create feature file in `specs/patterns/{pattern-name}.feature`
2. Write scenarios based on pattern's Stream Contract
3. Implement step definitions in `specs/patterns/step-definitions/{pattern-name}.steps.ts`
4. Ensure all invariants are tested
5. Add fixtures to `specs/support/fixtures/patterns/`
6. Update this README with new pattern coverage

## References

- [DDD Architecture Workup](../docs/architecture/DDD-WORKUP.md)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Vitest Documentation](https://vitest.dev)
- [Pattern Specifications](../../test-codex/patterns/)
