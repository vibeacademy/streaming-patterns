# Global Test Mocks

This directory contains global mocks used across all tests in the streaming-patterns project.

## Purpose

Global mocks are shared test utilities that mock external dependencies, browser APIs, or complex modules that don't need to be tested directly.

## When to Add Mocks Here

Add mocks to this directory when:

1. **Browser APIs**: Mocking Web APIs not available in jsdom (e.g., `IntersectionObserver`, `ResizeObserver`)
2. **External Libraries**: Mocking third-party libraries used across multiple components
3. **Environment Variables**: Mocking environment-specific configuration
4. **Network Requests**: Mocking fetch or other HTTP clients (if needed in future)

## When NOT to Add Mocks Here

Do NOT add pattern-specific or component-specific mocks here. Those should live alongside the tests they support:

- Pattern-specific mocks: `src/patterns/{pattern-name}/__mocks__/`
- Component-specific mocks: `src/components/{component-name}/__mocks__/`

## Examples

### Example: Mocking a third-party library

```typescript
// tests/mocks/thirdPartyLibrary.ts
import { vi } from 'vitest';

export const mockLibrary = {
  doSomething: vi.fn(),
  doSomethingElse: vi.fn(),
};
```

### Example: Mocking fetch (if needed)

```typescript
// tests/mocks/fetch.ts
import { vi } from 'vitest';

global.fetch = vi.fn();

export function mockFetchSuccess(data: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

export function mockFetchError(error: string) {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error(error)
  );
}
```

## Usage in Tests

Import global mocks in your test files when needed:

```typescript
import { mockFetchSuccess } from '@/../tests/mocks/fetch';

describe('MyComponent', () => {
  it('should fetch data', async () => {
    mockFetchSuccess({ data: 'test' });
    // ... test code
  });
});
```

## Current Mocks

Currently, basic browser API mocks are handled in `tests/setup.ts`:
- `IntersectionObserver`
- `ResizeObserver`
- `window.matchMedia`

Add new global mocks here as the project grows.
