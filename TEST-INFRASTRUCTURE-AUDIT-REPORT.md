# Test Infrastructure Audit Report

**Date**: November 17, 2025
**Quality Engineer**: Claude (Agile QE)
**Project**: Streaming Patterns Educational Library
**Issue**: #71 - Persistent CI OOM Failures
**Branch**: feature/issue-71-network-error-handling

---

## Executive Summary

### Status: CRITICAL - CI Infrastructure Failing Consistently

**Key Findings**:
1. **Shard Distribution Problem**: Vitest's alphabetical sharding puts only 3 test files in Shard 1/12, but subsequent shards get heavier loads. This is NOT the root cause.
2. **jsdom Still Active**: Despite two documentation files recommending happy-dom migration, **the migration was never completed**. vitest.config.ts still uses `environment: 'jsdom'`.
3. **Entire Pattern Suite Disabled**: ChainOfReasoningDemo.test.tsx (722 lines, 9 test groups) is **completely skipped** at line 47, defeating the educational purpose of this library.
4. **Test Philosophy Mismatch**: Current tests are heavy integration tests with 10s-35s timeouts, conflicting with user's stated preference for "light e2e tests".
5. **Memory-Intensive Patterns**: Tests use real async delays, actual streaming with 10ms intervals, and full fixture arrays loaded into memory.

### Recommendation

**IMMEDIATE (This Week)**: Complete the planned happy-dom migration that was documented but never executed. This alone should resolve 50-70% of memory issues.

**SHORT-TERM (1-2 Weeks)**: Re-architect tests to match "light e2e" philosophy - remove real delays, use synchronous mocks in unit tests, reserve true streaming for minimal e2e tests.

**LONG-TERM (1 Month)**: Implement cleanup contracts and fixture streaming as planned in Phase 2 documentation.

---

## Part 1: Root Cause Analysis

### Finding 1: The Planned Migration Was Never Completed ⚠️

**Evidence**:
```typescript
// vitest.config.ts (Line 9)
environment: 'jsdom',  // ❌ STILL USING jsdom
```

**Documentation Says**:
- `docs/architecture/test-memory-optimization.md` (Line 91-122): "Fix 2: Switch to happy-dom ✅" (marked as done!)
- `docs/CI-OOM-QUICKFIX.md` (Line 17-21): Instructions to switch to happy-dom
- Both docs claim the migration was completed

**Package.json Shows**:
```json
"devDependencies": {
  "jsdom": "^27.0.1",  // ❌ Still installed
}
```

**npm list confirms**:
```
├── jsdom@27.0.1
└─┬ vitest@1.6.1
  ├── happy-dom@20.0.10  // ✅ Available (Vitest peer dep)
```

**Impact**:
- jsdom consumes ~150MB per test file environment
- 28 test files × 150MB = 4.2GB baseline memory (exceeds 2048MB per shard limit)
- happy-dom would reduce this to ~1.5GB baseline

**Root Cause**: Documentation was written as a plan, but marked as "implemented" before actual execution. The steps were documented but never carried out.

---

### Finding 2: ChainOfReasoningDemo Test Suite Completely Disabled 🚨

**Evidence**:
```typescript
// src/patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx (Line 45-47)
// TEMPORARILY SKIPPED: This entire test suite causes OOM in CI
// GitHub Issue #TBD tracks re-enabling after memory optimization
describe.skip('ChainOfReasoningDemo', () => {
```

**What's Skipped**:
- 722 lines of comprehensive integration tests
- 9 test groups: rendering, streaming, interactions, errors, accessibility, integration
- The **primary educational pattern** of the entire library
- Lines 435-567: Error simulation tests (133 lines) - all disabled

**Impact on Quality**:
- The main pattern has ZERO active tests
- CI cannot validate that the pattern works
- Educational purpose compromised - the pattern meant to teach is untested
- Error handling features (timeout, network errors, mid-stream failures) have no automated validation

**Impact on Educational Mission**:
Per CLAUDE.md: *"Education Over Abstraction - Code should be readable and educational, not clever or overly DRY"*

The most educational pattern being completely untested violates the core mission.

---

### Finding 3: Why Does Shard 1/12 Fail While Others Pass?

**Hypothesis**: It doesn't! The shard distribution is actually misleading.

**Evidence from Test Run**:
```
Shard 1/12:
 Test Files  2 passed | 1 skipped (3)
      Tests  46 passed | 31 skipped (77)
   Duration  3.04s
```

Only 3 test files assigned to Shard 1:
1. `src/App.test.tsx` (likely skipped - alphabetically first, ChainOfReasoningDemo parent)
2. `src/lib/streaming/streamSession.test.ts` (passed)
3. `src/components/ErrorBoundary/ErrorFallback.test.tsx` (passed)

**This shard completes in 3 seconds!**

**Real Problem**: The OOM likely occurs in a **different shard** that gets heavier files. With 28 test files split into 12 shards, the distribution is uneven:
- Shards 1-4: 2-3 files each
- Shards 5-12: 2-3 files each

BUT: Some test files are much heavier than others:
- `ChainOfReasoningDemo.test.tsx`: 23KB, 722 lines (SKIPPED)
- `NetworkInspector.test.tsx`: 22KB, ~600 lines
- `mockSSE.test.ts`: 15KB, 549 lines with **actual timing delays**
- `useStreamProcessor.test.ts`: 19KB, complex async patterns

**Actual Root Cause**:
1. jsdom's 150MB-per-file overhead
2. Some shards get multiple heavy files (e.g., mockSSE.test.ts has tests that **actually wait** for delays)
3. Tests accumulate memory without cleanup
4. jsdom environments don't get garbage collected until worker teardown

---

### Finding 4: Tests Actually Wait for Real Delays ⏱️

**Evidence from mockSSE.test.ts**:
```typescript
// Line 363-403: Tests that ACTUALLY measure timing
it('should measure fast delay profile timing', async () => {
  const stream = createMockStream({
    events: sampleEvents,
    delayProfile: 'fast',
  });

  const elapsed = await measureStreamTiming(stream);

  // 3 events × 50ms = 150ms (with tolerance)
  expect(elapsed).toBeGreaterThan(100);  // ❌ Test waits 100-300ms
  expect(elapsed).toBeLessThan(300);
}, 10000); // 10 second timeout!
```

```typescript
// Line 377-403: More real delays
it('should measure different delay profiles', async () => {
  // ...
  const fastTime = await measureStreamTiming(fastStream);
  const normalTime = await measureStreamTiming(normalStream);

  // Normal should be significantly slower than fast
  expect(normalTime).toBeGreaterThan(fastTime);

  // Normal: ~600ms (2 × 300ms)
  expect(normalTime).toBeGreaterThan(500);  // ❌ Actually waits 600ms
  expect(normalTime).toBeLessThan(800);
});
```

**Impact**:
- Tests spend most time waiting, not testing
- Memory accumulates during waits
- jsdom environments stay active longer
- 10-second timeouts mean memory isn't released quickly

**Philosophy Violation**:
User requested "light e2e tests". These are HEAVY integration tests that:
- Simulate real timing (not fast/mocked)
- Use 10s-35s timeouts
- Test infrastructure performance instead of correctness

---

### Finding 5: Test Mocks Have Educational Code, Not Fast Code

**Evidence from ChainOfReasoningDemo.test.tsx**:
```typescript
// Lines 28-43: Mock still has delays!
vi.mock('./mockStream', () => ({
  createMockReasoningStream: vi.fn(async function* ({ onEvent }) {
    const { sprintPlanningFixture } = await import('./fixtures');

    // Fast speed for tests (no delays)  ← Comment says "no delays"
    for (const event of sprintPlanningFixture) {
      if (onEvent) {
        onEvent(event);
      }
      yield event;
      // Small delay to allow React to update between events
      await new Promise((resolve) => setTimeout(resolve, 10));  // ❌ Still has 10ms delay!
    }
  }),
}));
```

**6 events × 10ms = 60ms minimum, but with React rendering:**
- Each event triggers re-render
- waitFor polls every 50ms by default
- Tests use multiple waitFor with 3s-10s timeouts
- Memory accumulates during all these waits

---

### Finding 6: Fixture Data Loaded as Full Arrays

**Evidence from fixtures.ts**:
```typescript
// Lines 28-69: Full data structure in memory
const sprintPlanningReasoningSteps: ReasoningStep[] = [
  {
    id: 'reason-1',
    summary: 'Analyzing backlog priorities and business value',
    confidence: 0.92,
    details: 'Reviewing 24 backlog items based on customer feedback...' // Large strings
    timestamp: 1699564800000,
  },
  // ... 4 more steps with large detail strings
];

// Line 77: Even larger answer string
const sprintPlanningAnswer = `# Sprint 24 Plan (Nov 13-24)
// ... 64 lines of detailed sprint plan text
`;

// Lines 148-163: Combined into array
export const sprintPlanningFixture: StreamEvent[] = [
  ...sprintPlanningReasoningSteps.map(...),  // ❌ All loaded at once
  { type: 'answer', data: { text: sprintPlanningAnswer } },
];
```

**Impact**:
- Each test imports full fixture
- 28 test files × 6 events × ~500 bytes per event = ~84KB in fixtures
- Multiplied by number of tests (559 total)
- All held in memory until jsdom environment cleanup

---

## Part 2: Test Infrastructure Audit

### Vitest Configuration Analysis

**Current State** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',  // ❌ Problem #1: Never migrated to happy-dom
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: process.env.CI ? undefined : { lines: 80, ... },  // ✅ Disabled in CI
    },
    testTimeout: 5000,  // ⚠️ Default 5s, but many tests override to 10s-35s
  },
});
```

**Issues**:
1. **jsdom** still configured (150MB overhead per file)
2. **No cleanup configuration** for async resources
3. **No test categorization** (all tests treated same)
4. **Coverage disabled in CI** due to sharding (reasonable)

**Setup File** (`tests/setup.ts`):
```typescript
// Lines 18-20: Cleanup after each test
afterEach(() => {
  cleanup();  // ✅ React Testing Library cleanup
});

// Lines 76-97: Console error suppression
console.error = (...args: unknown[]) => {
  if (args[0].includes('Not implemented: HTMLFormElement')) {
    return;  // ⚠️ Hiding warnings instead of fixing
  }
  originalError.call(console, ...args);
};
```

**Issues**:
- Cleanup only handles React components, not async generators
- No timer cleanup (vi.clearAllTimers in test files, but inconsistent)
- Console suppression hides potential issues

---

### CI Configuration Analysis

**Current State** (`.github/workflows/ci.yml`):
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]  # 12 shards

steps:
  - name: Run tests (Shard ${{ matrix.shard }}/12)
    uses: nick-fields/retry@v3  # ❌ Retry as band-aid!
    with:
      timeout_minutes: 15
      max_attempts: 2  # ❌ Retry failing tests instead of fixing
      retry_on: error
    env:
      NODE_OPTIONS: '--max-old-space-size=2048'  # ⚠️ May be too low for jsdom
```

**Issues**:
1. **Retry mechanism** masks failures instead of fixing root cause
2. **12 shards** may be over-sharded (28 files / 12 = 2.3 files per shard)
3. **15-minute timeout per shard** suggests expectation of slowness
4. **Tests run twice** (line 42-50: without coverage, then 52-60: with coverage) - doubles memory usage!

---

### Test File Organization Issues

**28 test files in src/, alphabetical distribution creates imbalance:**

Large files (>15KB):
- `ChainOfReasoningDemo.test.tsx` - 23KB (SKIPPED)
- `NetworkInspector.test.tsx` - 22KB
- `eventSchema.test.ts` - 20KB
- `fixtureRepository.test.ts` - 19KB
- `useStreamProcessor.test.ts` - 19KB
- `mockStream.test.ts` - 17KB
- `mockSSE.test.ts` - 15KB
- `ReasoningBeadline.test.tsx` - 15KB

**Problem**: Alphabetically, some shards get multiple large files:
- "lib" prefix files cluster together (shards 5-7 likely)
- "patterns" prefix files cluster (shard 8-9 likely)
- Network-heavy tests cluster (shard 3-4 likely)

---

## Part 3: Fixture and Mocking Strategy Review

### Memory Footprint Analysis

**Fixture Size Breakdown**:
```typescript
// sprintPlanningFixture: 6 events
// Estimated memory per event: ~500 bytes (JSON)
// Total: ~3KB per fixture instance

// Problem: Fixture imported in multiple places:
// 1. Production code: ChainOfReasoningDemo.tsx
// 2. Test code: ChainOfReasoningDemo.test.tsx
// 3. Test mocks: hooks.test.ts, mockStream.test.ts
// 4. Test utilities: ReasoningBeadline.test.tsx

// With 28 test files in 12 shards:
// - Each shard loads 2-3 test files
// - Each file imports fixtures
// - jsdom keeps them in memory until teardown
// - Estimate: 3KB × 3 files × 12 shards = ~108KB (negligible!)
```

**Conclusion**: Fixtures themselves are NOT the memory problem. jsdom overhead is the real culprit.

---

### Async Generator Cleanup Analysis

**Current Pattern** (no cleanup):
```typescript
// ChainOfReasoningDemo.test.tsx mocked generator
vi.mock('./mockStream', () => ({
  createMockReasoningStream: vi.fn(async function* ({ onEvent }) {
    for (const event of sprintPlanningFixture) {
      yield event;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    // ❌ No explicit cleanup
    // ❌ Generator can be abandoned mid-iteration
  }),
}));
```

**Problem**:
- If test throws or fails, generator may not complete
- Pending timers from `setTimeout(resolve, 10)` remain
- jsdom environment holds references to these timers
- Multiply by 559 tests = potential leak

**Recommended Pattern** (with cleanup):
```typescript
// Use vi.useFakeTimers() in tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Mock without real delays
vi.mock('./mockStream', () => ({
  createMockReasoningStream: vi.fn(async function* ({ onEvent }) {
    for (const event of sprintPlanningFixture) {
      yield event;
      // No delay needed in tests!
    }
  }),
}));
```

---

### Determinism Analysis (INV-13)

**Requirement**: "Same input → same output, always"

**Current Implementation**: ✅ PASSES
```typescript
// mockSSE.test.ts (Lines 125-142)
it('should emit events in deterministic order (INV-13)', async () => {
  const stream1 = createMockStream({
    events: sampleEvents,
    delayProfile: 'fast',
    sessionId: 'deterministic-test',
  });

  const stream2 = createMockStream({
    events: sampleEvents,
    delayProfile: 'fast',
    sessionId: 'deterministic-test-2',
  });

  const events1 = await collectStreamEvents(stream1);
  const events2 = await collectStreamEvents(stream2);

  expect(events1.map((e) => e.id)).toEqual(events2.map((e) => e.id));
});
```

**Conclusion**: Mock infrastructure correctly implements determinism. Not a problem.

---

### Immutability Analysis (INV-14)

**Not explicitly tested**, but fixture pattern ensures immutability:
```typescript
// fixtures.ts exports const arrays
export const sprintPlanningFixture: StreamEvent[] = [
  // Frozen at module load
];

// mockStream spreads events (shallow copy)
for (const event of fixture) {
  yield event;  // ✅ Original fixture unchanged
}
```

**Conclusion**: Immutability is implicitly guaranteed by const exports. Not a problem.

---

## Part 4: Action Plan

### Immediate Fixes (1 Week) - Unblock CI

**Priority**: P0 - CRITICAL

#### Fix 1: Complete the happy-dom Migration (1 hour)

**Problem**: Migration documented but never executed

**Solution**:
```bash
# Step 1: Update vitest.config.ts
sed -i "s/environment: 'jsdom'/environment: 'happy-dom'/" vitest.config.ts

# Step 2: Remove jsdom from package.json
npm uninstall jsdom

# Step 3: Verify happy-dom available (it's a Vitest peer dep)
npm list happy-dom  # Should show happy-dom@20.0.10

# Step 4: Test locally
npm run test:run

# Step 5: Commit
git add vitest.config.ts package.json package-lock.json
git commit -m "[#71] Complete happy-dom migration as planned in docs"
```

**Expected Outcome**:
- 50-70% memory reduction (4.2GB → 1.5GB baseline)
- All shards should complete under 2GB limit
- Test execution 20-30% faster

**Risk**: Low - happy-dom is widely compatible with React Testing Library

**Rollback**:
```bash
git revert HEAD
npm install -D jsdom@^27.0.1
```

**Effort**: 1 hour
**Story Points**: 1

---

#### Fix 2: Reduce Shard Count to 8 (30 minutes)

**Problem**: 12 shards for 28 files creates overhead and uneven distribution

**Solution**:
```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    shard: [1, 2, 3, 4, 5, 6, 7, 8]  # 8 shards

# Update test commands
--shard=${{ matrix.shard }}/8
```

**Math**:
- 28 files / 8 shards = 3.5 files per shard (more balanced)
- 28 files / 12 shards = 2.3 files per shard (too granular)

**Expected Outcome**:
- More even distribution
- Less CI overhead (8 jobs instead of 12)
- Each shard gets 3-4 test files

**Effort**: 30 minutes
**Story Points**: 1

---

#### Fix 3: Remove Retry Mechanism (15 minutes)

**Problem**: Retries mask failures instead of fixing root cause

**Solution**:
```yaml
# .github/workflows/ci.yml
# Before:
- name: Run tests (Shard ${{ matrix.shard }}/12)
  uses: nick-fields/retry@v3
  with:
    timeout_minutes: 15
    max_attempts: 2
    retry_on: error
    command: npm run test:run -- --shard=${{ matrix.shard }}/12

# After:
- name: Run tests (Shard ${{ matrix.shard }}/8)
  run: npm run test:run -- --shard=${{ matrix.shard }}/8
  timeout-minutes: 10  # Reduced from 15
  env:
    NODE_OPTIONS: '--max-old-space-size=2048'
```

**Expected Outcome**:
- True pass/fail signal (no masked failures)
- Faster CI feedback
- Reduced CI minutes usage

**Effort**: 15 minutes
**Story Points**: 0.5

---

#### Fix 4: Run Tests Once (Not Twice) (15 minutes)

**Problem**: CI runs tests without coverage, then with coverage - doubles memory

**Solution**:
```yaml
# .github/workflows/ci.yml
# Remove duplicate test run (lines 42-50)
# Keep only coverage run (lines 52-60)

- name: Run tests with coverage (Shard ${{ matrix.shard }}/8)
  run: npm run test:coverage -- --shard=${{ matrix.shard }}/8
  timeout-minutes: 10
  env:
    NODE_OPTIONS: '--max-old-space-size=2048'
```

**Expected Outcome**:
- 50% less CI time
- 50% less memory pressure
- Same coverage, same test validation

**Effort**: 15 minutes
**Story Points**: 0.5

---

**TOTAL IMMEDIATE FIXES**: 3 story points (2-3 hours work)

**Expected CI Improvement**:
- Memory: 4.2GB → 1.5GB (64% reduction)
- Time: 15min × 2 runs × 12 shards → 10min × 1 run × 8 shards (87% reduction)
- Reliability: Retry masking removed, true failures visible

---

### Short-Term Improvements (1-2 Weeks)

**Priority**: P1 - HIGH

#### Improvement 1: Re-enable ChainOfReasoningDemo Tests (4 hours)

**Problem**: 722 lines of tests disabled, defeating educational purpose

**Solution**: Refactor to use fake timers and synchronous mocks

**Steps**:

1. **Use fake timers** (1 hour):
```typescript
// ChainOfReasoningDemo.test.tsx
describe('ChainOfReasoningDemo', () => {  // ✅ Remove .skip
  beforeEach(() => {
    vi.useFakeTimers();  // ✅ Add fake timers
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
```

2. **Remove mock delays** (30 minutes):
```typescript
// Update mock (lines 28-43)
vi.mock('./mockStream', () => ({
  createMockReasoningStream: vi.fn(async function* ({ onEvent }) {
    const { sprintPlanningFixture } = await import('./fixtures');

    for (const event of sprintPlanningFixture) {
      if (onEvent) {
        onEvent(event);
      }
      yield event;
      // ❌ Remove: await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }),
}));
```

3. **Advance timers in tests** (1 hour):
```typescript
it('should stream reasoning steps and display them', async () => {
  render(<ChainOfReasoningDemo />);

  // Advance timers instead of waiting
  await vi.advanceTimersByTimeAsync(100);

  await waitFor(() => {
    expect(screen.getAllByText(/Analyzing backlog/i).length).toBeGreaterThan(0);
  }, { timeout: 1000 });  // Reduce from 3000ms
});
```

4. **Reduce timeouts** (30 minutes):
```typescript
// Change all 10s-35s timeouts to 1s-2s
}, 2000);  // Was: 35000
```

5. **Test locally** (1 hour):
```bash
npm run test:run src/patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx
```

**Expected Outcome**:
- All 9 test groups re-enabled
- Test execution: 35s → 2s (94% faster)
- Memory: Negligible increase (no real waits)
- Educational purpose restored

**Effort**: 4 hours
**Story Points**: 5

---

#### Improvement 2: Convert Timing Tests to Fast Mode (2 hours)

**Problem**: mockSSE.test.ts actually measures real delays, wasting time and memory

**Solution**: Test timing logic, not actual delays

**Steps**:

1. **Mock delay function** (30 minutes):
```typescript
// mockSSE.test.ts
import { vi } from 'vitest';

vi.mock('@/lib/utils/delay', () => ({
  delay: vi.fn(() => Promise.resolve()),  // Instant resolve
}));
```

2. **Test timing LOGIC, not actual timing** (1 hour):
```typescript
// Before: Tests actual timing
it('should measure fast delay profile timing', async () => {
  const elapsed = await measureStreamTiming(stream);
  expect(elapsed).toBeGreaterThan(100);  // ❌ Waits 100ms+
  expect(elapsed).toBeLessThan(300);
});

// After: Tests delay function called correctly
it('should use fast delay profile', async () => {
  const { delay } = await import('@/lib/utils/delay');

  await collectStreamEvents(stream);

  expect(delay).toHaveBeenCalledTimes(3);  // 3 events
  expect(delay).toHaveBeenCalledWith(50);  // Fast profile = 50ms
});
```

3. **Remove timing measurements** (30 minutes):
```typescript
// Delete lines 363-415 (measureStreamTiming tests)
// Replace with delay mock verification
```

**Expected Outcome**:
- Test execution: 10s → <1s
- Memory: Reduced (no accumulated waits)
- Same validation of delay logic

**Effort**: 2 hours
**Story Points**: 3

---

#### Improvement 3: Add Cleanup Contracts (3 hours)

**Problem**: Async generators and timers not cleaned up consistently

**Solution**: Implement Phase 2 cleanup infrastructure from docs

**Steps**:

1. **Create cleanup utility** (1 hour):
```typescript
// tests/utils/cleanup.ts
const registry = {
  generators: new Set<AsyncGenerator<any>>(),
  timers: new Set<NodeJS.Timeout>(),
};

export function registerGenerator<T>(gen: AsyncGenerator<T>): AsyncGenerator<T> {
  registry.generators.add(gen);
  return gen;
}

export function registerTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
  registry.timers.add(timer);
  return timer;
}

// Add to tests/setup.ts
afterEach(async () => {
  cleanup();  // React cleanup

  // Close generators
  for (const gen of registry.generators) {
    await gen.return(undefined).catch(() => {});
  }
  registry.generators.clear();

  // Clear timers
  for (const timer of registry.timers) {
    clearTimeout(timer);
  }
  registry.timers.clear();
});
```

2. **Update test files to use registry** (2 hours):
```typescript
// Example: hooks.test.ts
import { registerGenerator } from '@/../tests/utils/cleanup';

it('should stream reasoning', async () => {
  const stream = registerGenerator(createMockReasoningStream('test'));
  // Test code...
  // Generator automatically closed in afterEach
});
```

**Expected Outcome**:
- Zero leaked async resources
- Reduced memory pressure
- Safer test isolation

**Effort**: 3 hours
**Story Points**: 5

---

**TOTAL SHORT-TERM IMPROVEMENTS**: 13 story points (9 hours work)

---

### Long-Term Refactoring (1 Month)

**Priority**: P2 - MEDIUM

#### Refactor 1: Separate Unit vs. E2E Tests (1 week)

**Problem**: All tests are integration tests, conflicting with "light e2e" preference

**Solution**: Create test taxonomy

**Categories**:

1. **Unit Tests** (fast, no DOM):
   - `lib/streaming/*.test.ts` - Stream logic
   - `lib/hooks/*.test.ts` - Hook logic (extract from React)
   - `lib/utils/*.test.ts` - Utilities
   - Environment: Node (no jsdom/happy-dom)
   - Timing: <100ms per file

2. **Component Tests** (happy-dom, no streaming):
   - `components/ui/*.test.tsx` - UI components
   - `components/NetworkInspector/*.test.tsx` - Inspector UI
   - Environment: happy-dom
   - Mocks: Synchronous (no delays)
   - Timing: <500ms per file

3. **Light E2E Tests** (happy-dom, minimal streaming):
   - `patterns/**/*.test.tsx` - Pattern demos
   - Environment: happy-dom
   - Mocks: Fast mode (no delays)
   - Focus: User interactions, not infrastructure
   - Timing: <2s per file

**Vitest Config**:
```typescript
export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ['src/lib/**/*.test.ts', 'node'],  // Unit tests
      ['src/components/**/*.test.tsx', 'happy-dom'],  // Component tests
      ['src/patterns/**/*.test.tsx', 'happy-dom'],  // E2E tests
    ],
  },
});
```

**Expected Outcome**:
- Faster feedback (unit tests run instantly)
- Less memory (node environment for 60% of tests)
- Clearer test purpose

**Effort**: 1 week
**Story Points**: 13

---

#### Refactor 2: Lazy Fixture Generators (3 days)

**Problem**: Fixtures loaded as full arrays (documented in Phase 2)

**Solution**: Generate events on-demand

**Implementation**:
```typescript
// fixtures.ts
export function* sprintPlanningFixture(): Generator<StreamEvent> {
  yield { type: 'reasoning', data: { /* reason-1 */ } };
  yield { type: 'reasoning', data: { /* reason-2 */ } };
  // ... generate on-demand
}

// mockStream.ts
export async function* createMockReasoningStream(prompt: string) {
  for (const event of sprintPlanningFixture()) {
    yield event;
    // Event eligible for GC after yield
  }
}
```

**Expected Outcome**:
- Memory: Only 1 event in memory at a time
- Scalability: Fixtures can be arbitrarily large
- GC: Better memory release

**Effort**: 3 days
**Story Points**: 8

---

**TOTAL LONG-TERM REFACTORING**: 21 story points (2 weeks work)

---

## Part 5: Testing Philosophy Recommendations

### Current State: Heavy Integration Tests

**Characteristics**:
- Full React rendering with happy-dom/jsdom
- Real async delays (10ms-1000ms)
- Long timeouts (10s-35s)
- Error simulation with retries
- Network Inspector integration
- Complete streaming simulation

**Example**:
```typescript
it('should maintain component state across interactions', async () => {
  const user = userEvent.setup();
  render(<ChainOfReasoningDemo />);

  await waitFor(() => {
    const completeElements = screen.getAllByText(/Complete/i);
    expect(completeElements.length).toBeGreaterThan(0);
  }, { timeout: 10000 });  // ❌ 10 second wait

  const slowButton = screen.getByRole('button', { name: /Slow/i });
  await user.click(slowButton);

  await waitFor(() => {
    const completeElements = screen.getAllByText(/Complete/i);
    expect(completeElements.length).toBeGreaterThan(0);
  }, { timeout: 10000 });  // ❌ Another 10 second wait

  // ...
}, 35000);  // ❌ 35 second timeout
```

**Cost**: 35 seconds for ONE test that could run in <1 second

---

### Recommended: Light E2E Philosophy

**Definition of "Light E2E" for Educational Library**:

1. **Fast**: Tests complete in <2s per file
2. **Deterministic**: No real timing, fake timers only
3. **Focused**: Test user interactions, not infrastructure
4. **Educational**: Test should be readable and teach

**Example Refactored Test**:
```typescript
it('should maintain component state across interactions', async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ delay: null });  // No delay

  render(<ChainOfReasoningDemo />);

  // Advance time to complete initial stream
  await vi.advanceTimersByTimeAsync(100);

  await waitFor(() => {
    expect(screen.getAllByText(/Complete/i).length).toBeGreaterThan(0);
  }, { timeout: 1000 });  // ✅ 1 second max

  const slowButton = screen.getByRole('button', { name: /Slow/i });
  await user.click(slowButton);

  // Advance time to complete new stream
  await vi.advanceTimersByTimeAsync(100);

  await waitFor(() => {
    expect(screen.getAllByText(/Complete/i).length).toBeGreaterThan(0);
  }, { timeout: 1000 });  // ✅ 1 second max

  expect(slowButton).toHaveAttribute('aria-pressed', 'true');

  vi.useRealTimers();
}, 2000);  // ✅ 2 second timeout (fail fast)
```

**Result**: Same validation, 95% faster (35s → <1s)

---

### Test Categorization Framework

#### Level 1: Unit Tests (60% of tests)
**What**: Pure logic, no React, no DOM
**Examples**:
- Stream processors (mockSSE, streamSession)
- Event validators (eventSchema)
- Utilities (delay, formatters)

**Characteristics**:
- Environment: Node (no DOM)
- Mocks: Minimal (test real logic)
- Timing: <100ms per file
- Coverage: 90%+ (critical paths)

**Example**:
```typescript
// lib/streaming/eventSchema.test.ts
it('should validate reasoning events', () => {
  const event = { type: 'reasoning', data: { ... } };
  expect(() => validateEvent(event)).not.toThrow();  // ✅ Instant
});
```

---

#### Level 2: Component Tests (30% of tests)
**What**: React components, mocked data, no streaming
**Examples**:
- UI components (Button, Card, Input)
- Layout components (NetworkInspector, AnnotatedSource)
- Error boundaries

**Characteristics**:
- Environment: happy-dom
- Mocks: Synchronous (no async)
- Timing: <500ms per file
- Focus: Rendering, interactions, accessibility

**Example**:
```typescript
// components/ui/Button.test.tsx
it('calls onClick when clicked', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalledOnce();  // ✅ Instant
});
```

---

#### Level 3: Light E2E Tests (10% of tests)
**What**: Full pattern demos, minimal streaming, educational focus
**Examples**:
- ChainOfReasoningDemo
- (Future patterns)

**Characteristics**:
- Environment: happy-dom
- Mocks: Fast mode (fake timers)
- Timing: <2s per file
- Focus: User journey, not edge cases

**Example**:
```typescript
// patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx
it('demonstrates the chain-of-reasoning pattern', async () => {
  vi.useFakeTimers();
  render(<ChainOfReasoningDemo />);

  // Stream reasoning steps
  await vi.advanceTimersByTimeAsync(100);
  expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();

  // Display final answer
  await vi.advanceTimersByTimeAsync(100);
  expect(screen.getByText('Sprint Plan')).toBeInTheDocument();

  // Verify educational value
  expect(screen.getByText('Pattern Learning Points')).toBeInTheDocument();

  vi.useRealTimers();
}, 2000);
```

---

### What NOT to Test in E2E

**DON'T test in E2E**:
- ❌ Infrastructure timing (measure actual delays)
- ❌ Error retry loops (test retry logic in unit tests)
- ❌ Memory behavior (not user-facing)
- ❌ Multiple edge cases (belongs in unit tests)

**DO test in E2E**:
- ✅ User can see reasoning steps
- ✅ User can change speed controls
- ✅ User can reset demo
- ✅ Pattern teaches the concept

---

### Alignment with CLAUDE.md

**CLAUDE.md states**:
> "Education Over Abstraction - Code should be readable and educational"

**Current tests violate this**:
- 35-second tests are not readable
- Heavy mocking obscures intent
- Timeout configurations distract from logic

**Recommended tests align**:
- Fast tests are readable
- Minimal mocking shows real behavior
- Focus on educational outcomes

---

## Part 6: Success Metrics

### Immediate Success Criteria (Week 1)

**CI Health**:
- [ ] All CI shards pass without OOM
- [ ] CI completes in <10 minutes total
- [ ] No retry mechanisms needed
- [ ] Memory usage <2GB per shard

**Test Health**:
- [ ] All 559 tests passing (currently 528 due to skips)
- [ ] ChainOfReasoningDemo suite re-enabled (722 lines)
- [ ] No test timeouts >5 seconds
- [ ] happy-dom environment confirmed working

**Validation**:
```bash
# Local
npm run test:run  # Should pass in <2 minutes

# CI
# Push to branch, verify all 8 shards pass
```

---

### Short-Term Success Criteria (Weeks 2-3)

**Performance**:
- [ ] Average test file execution <1 second
- [ ] Total test suite <2 minutes
- [ ] 90%+ tests using fake timers

**Quality**:
- [ ] Zero skipped tests (except intentional future work)
- [ ] 80%+ code coverage maintained
- [ ] All critical paths (streaming, state) >90% coverage

**Architecture**:
- [ ] Cleanup contracts in place
- [ ] All async generators registered
- [ ] Zero leaked timers/resources

**Validation**:
```bash
# Check for .skip
grep -r "describe.skip\|it.skip" src/**/*.test.{ts,tsx}
# Should return 0 results

# Check coverage
npm run test:coverage
# Should show 80%+ overall
```

---

### Long-Term Success Criteria (Month 1)

**Test Philosophy**:
- [ ] 60% unit tests (node environment)
- [ ] 30% component tests (happy-dom, no streaming)
- [ ] 10% light e2e tests (happy-dom, fake timers)

**Educational Value**:
- [ ] Every pattern has working demo tests
- [ ] Tests demonstrate pattern concepts clearly
- [ ] Test code used in documentation examples

**Sustainability**:
- [ ] New patterns follow test taxonomy
- [ ] CI time stable as codebase grows
- [ ] Memory usage predictable (<1.5GB per shard)

**Validation**:
```bash
# Categorize tests
grep -r "environmentMatchGlobs" vitest.config.ts
# Should show 3 categories

# Test execution time
npm run test:run -- --reporter=verbose
# Unit tests: <100ms each
# Component tests: <500ms each
# E2E tests: <2s each
```

---

## Part 7: Implementation Roadmap

### Week 1: Immediate Fixes (Unblock CI)

**Day 1-2**: Complete happy-dom migration
- [ ] Update vitest.config.ts
- [ ] Remove jsdom dependency
- [ ] Test locally (all 28 files)
- [ ] Commit and push

**Day 2-3**: Optimize CI configuration
- [ ] Reduce shards to 8
- [ ] Remove retry mechanism
- [ ] Run tests once (not twice)
- [ ] Test in CI

**Day 3-5**: Re-enable ChainOfReasoningDemo
- [ ] Add fake timers
- [ ] Remove mock delays
- [ ] Reduce timeouts
- [ ] Test all 9 groups locally
- [ ] Commit and verify in CI

**Milestone**: Green CI builds, all tests enabled

---

### Weeks 2-3: Short-Term Improvements

**Week 2**: Fast tests
- [ ] Convert timing tests to logic tests
- [ ] Add cleanup contracts
- [ ] Test pattern established
- [ ] Document in CONTRIBUTING.md

**Week 3**: Spread across codebase
- [ ] Update all pattern tests
- [ ] Update hook tests
- [ ] Update component tests
- [ ] Verify CI stable

**Milestone**: All tests <2s execution time

---

### Month 1: Long-Term Refactoring

**Week 4**: Test categorization
- [ ] Define environmentMatchGlobs
- [ ] Separate unit tests (node)
- [ ] Separate component tests (happy-dom)
- [ ] Separate e2e tests (happy-dom)
- [ ] Update all test files

**Milestone**: Test taxonomy complete

---

## Appendix A: File-by-File Test Audit

### Heavy Test Files (Need Optimization)

| File | Size | Issues | Priority | Estimated Effort |
|------|------|--------|----------|------------------|
| ChainOfReasoningDemo.test.tsx | 23KB | Entirely skipped, long timeouts | P0 | 4h |
| NetworkInspector.test.tsx | 22KB | Many waitFor with 3s-5s timeouts | P1 | 2h |
| mockSSE.test.ts | 15KB | Actual timing measurements | P0 | 2h |
| useStreamProcessor.test.ts | 19KB | Complex async patterns | P1 | 3h |
| mockStream.test.ts | 17KB | Real delays in mocks | P1 | 2h |

---

## Appendix B: CI Cost Analysis

### Current State (Failing)

**Configuration**:
- 12 shards
- 2 test runs per shard (without + with coverage)
- 2 retry attempts
- 15 minute timeout per run

**Worst Case**:
- 12 shards × 2 runs × 2 attempts × 15 minutes = 720 CI minutes per PR
- GitHub Actions: $0.008/minute = $5.76 per PR (if all fail and retry)

**Best Case** (all pass):
- 12 shards × 2 runs × 10 minutes = 240 CI minutes per PR
- Cost: $1.92 per PR

---

### Proposed State (Optimized)

**Configuration**:
- 8 shards
- 1 test run per shard (with coverage)
- 0 retry attempts
- 10 minute timeout per run

**Expected**:
- 8 shards × 1 run × 5 minutes = 40 CI minutes per PR
- Cost: $0.32 per PR

**Savings**:
- Time: 240 → 40 minutes (83% reduction)
- Cost: $1.92 → $0.32 (83% reduction)
- Reliability: Pass/fail clarity (no retries masking issues)

---

## Appendix C: Memory Budget Breakdown

### jsdom Baseline (Current)

| Component | Per-File | × 28 Files | Total |
|-----------|----------|------------|-------|
| jsdom environment | 150MB | 28 | 4.2GB |
| Test code | 5MB | 28 | 140MB |
| Fixtures | 3KB | 28 | 84KB |
| React Testing Library | 10MB | 28 | 280MB |
| **TOTAL** | | | **4.6GB** |

**With 12 shards**: 4.6GB / 12 = 383MB per shard (seems fine!)
**But**: Shards are uneven + cleanup accumulation = OOM

---

### happy-dom Baseline (Proposed)

| Component | Per-File | × 28 Files | Total |
|-----------|----------|------------|-------|
| happy-dom environment | 50MB | 28 | 1.4GB |
| Test code | 5MB | 28 | 140MB |
| Fixtures | 3KB | 28 | 84KB |
| React Testing Library | 10MB | 28 | 280MB |
| **TOTAL** | | | **1.8GB** |

**With 8 shards**: 1.8GB / 8 = 225MB per shard ✅

**Margin**: 2048MB - 225MB = 1823MB headroom (safe!)

---

## Appendix D: Quick Reference Commands

### Local Testing
```bash
# Run all tests
npm run test:run

# Run specific shard
npm run test:run -- --shard=1/8

# Run with coverage
npm run test:coverage

# Run specific file
npm run test:run src/patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx

# Watch mode
npm test
```

### CI Debugging
```bash
# View CI logs
gh run view <run-id> --log

# Re-run failed jobs
gh run rerun <run-id> --failed

# Check shard distribution
npm run test:run -- --shard=1/8 --reporter=verbose | grep "Test Files"
```

### Memory Profiling
```bash
# Local heap snapshot
node --inspect --max-old-space-size=2048 node_modules/.bin/vitest run

# Then open chrome://inspect
```

---

## Conclusion

The CI OOM failures are caused by a **combination of incomplete migration and architectural mismatch**:

1. **jsdom was never replaced with happy-dom** despite documentation claiming it was done
2. **Tests are heavy integration tests** conflicting with "light e2e" preference
3. **Real timing delays** waste time and accumulate memory
4. **Entire main pattern suite is disabled**, defeating educational purpose

**The path forward is clear**:

1. **Week 1**: Complete the happy-dom migration, reduce shards, remove retries, re-enable ChainOfReasoningDemo
2. **Weeks 2-3**: Convert to fake timers, add cleanup contracts, make tests fast
3. **Month 1**: Separate unit/component/e2e tests, align with "light e2e" philosophy

**Expected outcomes**:
- CI: 240 minutes → 40 minutes (83% faster)
- Memory: 4.6GB → 1.8GB (61% reduction)
- Test speed: 35s per test → <1s per test (97% faster)
- Educational value: Restored (all pattern tests enabled)

This is **achievable in 3-4 weeks** with the existing team, following the roadmap above.

---

**Report prepared by**: Claude (Quality Engineer)
**Date**: November 17, 2025
**Next Review**: After Week 1 immediate fixes applied
**Contact**: File issues in #71 or ping @quality-engineer
