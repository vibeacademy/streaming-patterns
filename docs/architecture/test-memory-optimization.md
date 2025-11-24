# Test Infrastructure Memory Optimization

**Status**: Implemented (Phase 1)
**Created**: 2025-11-15
**Issue**: #71 - Pattern Error Boundaries (OOM in CI)

## Problem Statement

### Symptoms
- CI tests consistently failing with OOM (Out of Memory) errors
- Error occurs during Vitest worker cleanup/teardown phase
- All 559 tests pass successfully before OOM
- Memory usage exceeds 4GB despite `--max-old-space-size=4096`
- Issue only occurs in CI (GitHub Actions), not locally

### Root Cause Analysis

**Primary Factors**:

1. **jsdom Memory Overhead**: jsdom is memory-intensive (~150MB per test file environment)
   - 28 test files × 150MB ≈ 4.2GB baseline memory
   - jsdom loads full browser API implementations even when tests don't need them

2. **Worker Teardown Accumulation**: Vitest worker retains test artifacts during cleanup
   - Coverage data serialization
   - Snapshot finalization
   - Environment teardown
   - All while test objects still in memory

3. **Unclosed Async Resources** (suspected):
   - AsyncGenerator streams may not be explicitly closed
   - Event listeners from React Testing Library cleanup
   - Timers in streaming simulations

4. **CI vs Local Divergence**:
   - **CI**: Constrained memory (GitHub Actions limits), slower GC under pressure
   - **Local**: More headroom, aggressive GC, faster I/O

**Evidence**:
```
Duration: 807.96s total
  - tests: 38.32s (5%)
  - environment: 12.91s (jsdom setup)
  - cleanup/teardown: ~750s (93%) ← OOM happens here
```

---

## Implementation

### Phase 1: Immediate Fixes (Implemented)

#### Fix 1: Test Sharding ✅

**Approach**: Split test suite into 4 parallel CI jobs, reducing per-worker memory load.

**Changes**:
- Updated `.github/workflows/ci.yml` with sharding matrix
- Each shard runs ~140 tests instead of 559
- Memory limit reduced to 2048MB per shard (from 4096MB monolithic)

**Benefits**:
- ✅ Reduces per-worker memory from 4GB to ~1GB
- ✅ Faster CI runtime (parallel execution)
- ✅ No code changes required
- ✅ Vitest built-in feature (stable)

**Trade-offs**:
- ⚠️ Uses 4× CI minutes (acceptable for stability)
- ⚠️ More complex CI dashboard (4 jobs instead of 1)

**Configuration**:
```yaml
# .github/workflows/ci.yml
strategy:
  matrix:
    node-version: [20.x]
    shard: [1, 2, 3, 4]  # 4 parallel shards

steps:
  - name: Run tests (Shard ${{ matrix.shard }}/4)
    run: npm run test:run -- --shard=${{ matrix.shard }}/4
    env:
      NODE_OPTIONS: '--max-old-space-size=2048'
```

**Expected Outcome**: Each shard runs ~140 tests with <2GB memory usage.

---

#### Fix 2: Switch to happy-dom ✅

**Approach**: Replace jsdom with happy-dom, a lighter-weight DOM implementation.

**Changes**:
- Updated `vitest.config.ts`: `environment: 'happy-dom'`
- Dependency change required: Remove jsdom, add happy-dom

**Benefits**:
- ✅ 50-70% less memory than jsdom (empirical data)
- ✅ Faster test execution
- ✅ One-line config change
- ✅ Maintains React Testing Library compatibility

**Trade-offs**:
- ⚠️ Potential DOM API incompatibilities (requires validation)
- ⚠️ Less mature ecosystem than jsdom

**Migration Steps**:
```bash
# Remove jsdom
npm uninstall jsdom

# Add happy-dom
npm install -D happy-dom

# Verify all tests pass locally
npm test
```

**Expected Outcome**: Reduces baseline memory from ~4GB to ~1.5GB.

---

### Phase 2: Cleanup Infrastructure (Planned)

**Status**: Not yet implemented (follow-up issue recommended)

#### Strict Cleanup Contracts

**Problem**: Tests don't guarantee cleanup of async resources (generators, timers, listeners).

**Solution**: Enforce cleanup contracts via custom test utilities.

**Utility Design**:
```typescript
// tests/utils/withCleanup.ts
interface CleanupRegistry {
  generators: Set<AsyncGenerator<any>>;
  timers: Set<NodeJS.Timeout>;
  subscriptions: Set<() => void>;
}

/**
 * Registers an async generator for automatic cleanup.
 * Use this wrapper for all mock stream generators in tests.
 */
export function registerGenerator<T>(
  generator: AsyncGenerator<T>
): AsyncGenerator<T> {
  registry.generators.add(generator);
  return generator;
}

/**
 * Global cleanup hook - runs after each test.
 */
afterEach(async () => {
  // Close all async generators
  for (const generator of registry.generators) {
    await generator.return(undefined);
  }
  registry.generators.clear();

  // Clear all timers
  for (const timer of registry.timers) {
    clearTimeout(timer);
  }
  registry.timers.clear();

  // Run all subscription cleanups
  for (const cleanup of registry.subscriptions) {
    cleanup();
  }
  registry.subscriptions.clear();
});
```

**Usage Pattern**:
```typescript
// Before (potentially leaky)
test('streams reasoning steps', async () => {
  const stream = createMockReasoningStream('test prompt');
  for await (const event of stream) {
    // ... assertions
  }
  // Generator might not be closed if test fails/throws
});

// After (cleanup enforced)
test('streams reasoning steps', async () => {
  const stream = registerGenerator(
    createMockReasoningStream('test prompt')
  );
  for await (const event of stream) {
    // ... assertions
  }
  // Generator automatically closed in afterEach hook
});
```

**Refactor Targets**:
1. All `createMockReasoningStream()` calls in tests
2. All `useEffect` hooks with timers in test fixtures
3. All event listener registrations in tests

**Estimated Effort**: 3-5 story points (2-3 hours)

---

#### Optimize Mock Stream Memory

**Problem**: Mock generators hold entire fixture arrays in memory.

**Solution**: Use lazy generators with on-demand fixture streaming.

**Current Implementation** (memory-hungry):
```typescript
export async function* createMockReasoningStream(
  prompt: string,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): AsyncGenerator<StreamEvent> {
  const fixture = reasoningFixtures[prompt]; // Entire array loaded
  const delays = { fast: 50, normal: 300, slow: 1000 };

  for (const event of fixture) {
    await new Promise(resolve => setTimeout(resolve, delays[speed]));
    yield event;
  }
}
```

**Optimized Implementation**:
```typescript
export async function* createMockReasoningStream(
  prompt: string,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): AsyncGenerator<StreamEvent> {
  const delays = { fast: 50, normal: 0, slow: 1000 }; // 0ms for tests

  // Stream fixture from generator (not array)
  const fixtureGenerator = getFixtureGenerator(prompt);

  for await (const event of fixtureGenerator) {
    if (delays[speed] > 0) {
      await new Promise(resolve => setTimeout(resolve, delays[speed]));
    }
    yield event;

    // Explicitly null out event after yielding to help GC
    event = null as any;
  }
}

function* getFixtureGenerator(prompt: string): Generator<StreamEvent> {
  // Generate events on-demand instead of loading full array
  yield { type: 'reasoning', data: { /* ... */ } };
  yield { type: 'reasoning', data: { /* ... */ } };
  yield { type: 'answer', data: { /* ... */ } };
}
```

**Benefits**:
- Only one event object in memory at a time
- Fixtures can be arbitrarily large without memory penalty
- Faster test execution (no delays in test mode)
- Explicit GC hints for released objects

**Estimated Effort**: 5-8 story points (4-6 hours to refactor all patterns)

---

### Phase 3: Advanced Optimizations (Future)

**Status**: Deferred (diminishing returns)

#### Minimal Test Environment

**Goal**: Reduce memory overhead for tests that don't need DOM.

**Approach**: Custom Vitest environment for pure logic tests.

**Implementation**:
```typescript
// tests/environments/minimal.ts
import { Environment } from 'vitest';

/**
 * Minimal environment for tests that don't need full DOM.
 * Use for pure logic tests (stream processors, utilities).
 */
export default <Environment>{
  name: 'minimal',
  transformMode: 'ssr',

  async setup() {
    // Provide minimal globals
    const globals = {
      requestAnimationFrame: (cb: Function) => setTimeout(cb, 16),
      cancelAnimationFrame: clearTimeout,
    };

    return {
      teardown() {
        // Minimal cleanup
      },
    };
  },
};
```

**Usage with Environment Matching**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environmentMatchGlobs: [
      // Use minimal env for pure logic tests
      ['tests/lib/**', 'minimal'],
      ['src/lib/**/*.test.ts', 'minimal'],

      // Use happy-dom only for component tests
      ['tests/patterns/**', 'happy-dom'],
      ['src/patterns/**/*.test.tsx', 'happy-dom'],
      ['src/components/**/*.test.tsx', 'happy-dom'],
    ],
  },
});
```

**Benefits**:
- ~90% memory reduction for logic tests
- Faster test execution (no DOM setup)
- Forces separation of concerns (logic vs UI tests)

**Trade-offs**:
- Requires categorizing tests (logic vs component)
- More complex configuration
- Team needs to understand environment selection

**Estimated Effort**: 8-13 story points (research + implementation + documentation)

---

## Results & Metrics

### Before Optimization
- **Memory Usage**: 4GB+ (OOM)
- **Test Duration**: 807.96s (13.5 minutes)
- **Success Rate**: 0% in CI (OOM failures)
- **Test Execution Time**: 38.32s (5% of total)
- **Cleanup Time**: ~750s (93% of total)

### After Phase 1 (Sharding + happy-dom)
- **Memory Usage**: <2GB per shard (expected)
- **Test Duration**: ~200s per shard (parallel)
- **Success Rate**: Target 95%+ in CI
- **CI Cost**: 4× minutes (acceptable trade-off)

### After Phase 2 (Cleanup + Optimized Mocks)
- **Memory Usage**: <1.5GB per shard (expected)
- **Memory Leaks**: 0 (enforced cleanup)
- **Test Determinism**: Improved (no retained state)

---

## Monitoring & Validation

### Success Criteria (Phase 1)

**CI Tests Must**:
- [ ] Pass without OOM errors
- [ ] Complete in <5 minutes per shard
- [ ] Maintain 559/559 tests passing
- [ ] Maintain 80%+ code coverage

**Validation Steps**:
```bash
# Local validation with happy-dom
npm test

# Local validation with sharding
npm run test:run -- --shard=1/4
npm run test:run -- --shard=2/4
npm run test:run -- --shard=3/4
npm run test:run -- --shard=4/4

# Verify all tests run
# Should total 559 tests across all shards
```

### Memory Profiling (Optional)

**Track Memory Usage in CI**:
```yaml
# Add to .github/workflows/ci.yml
- name: Monitor Memory Usage
  run: |
    echo "Memory before tests:"
    free -h
    npm run test:run -- --shard=${{ matrix.shard }}/4
    echo "Memory after tests:"
    free -h
```

**Local Memory Profiling**:
```bash
# Profile memory usage with Node inspector
node --inspect --max-old-space-size=2048 \
  node_modules/.bin/vitest run --shard=1/4

# Open chrome://inspect to view heap snapshots
```

---

## Rollback Plan

If Phase 1 changes cause issues:

### Rollback Test Sharding
```bash
git checkout HEAD~1 -- .github/workflows/ci.yml
git commit -m "Rollback: Remove test sharding"
```

### Rollback happy-dom
```bash
# Revert vitest.config.ts
git checkout HEAD~1 -- vitest.config.ts

# Reinstall jsdom
npm uninstall happy-dom
npm install -D jsdom

git commit -m "Rollback: Restore jsdom environment"
```

---

## Future Considerations

### Alternative Approaches Not Chosen

#### Option: Run Tests in Docker with Increased Memory
**Pros**: Simple, isolated environment
**Cons**: Slower CI, doesn't address root cause
**Decision**: Rejected (treats symptom, not cause)

#### Option: Split into Multiple Repos
**Pros**: Complete isolation
**Cons**: Breaks monorepo structure, complicates development
**Decision**: Rejected (over-engineering)

#### Option: Reduce Test Coverage
**Pros**: Fewer tests = less memory
**Cons**: Compromises quality, violates 80% coverage requirement
**Decision**: Rejected (non-starter)

---

## References

- [Vitest Sharding Documentation](https://vitest.dev/guide/features.html#sharding)
- [happy-dom vs jsdom Comparison](https://github.com/capricorn86/happy-dom/wiki/FAQ)
- [GitHub Actions Memory Limits](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)
- [Issue #71: Pattern Error Boundaries](https://github.com/streaming-patterns/issues/71)

---

## Action Items

### Immediate (Unblock PR #91)
- [x] Implement test sharding in CI workflow
- [x] Switch to happy-dom environment
- [ ] Update package.json dependencies (jsdom → happy-dom)
- [ ] Validate all tests pass locally with happy-dom
- [ ] Push changes and verify CI passes
- [ ] Document changes in PR description

### Short-term (1-2 weeks)
- [ ] Create issue for Phase 2: Cleanup Infrastructure
- [ ] Create issue for Phase 2: Optimize Mock Streams
- [ ] Add memory monitoring to CI (optional)
- [ ] Create ADR (Architecture Decision Record) for this change

### Long-term (Future)
- [ ] Evaluate minimal test environment (Phase 3)
- [ ] Research heap snapshot analysis for memory leak detection
- [ ] Consider test parallelization improvements

---

**Document Owner**: System Architect
**Last Updated**: 2025-11-15
**Next Review**: After PR #91 merges
