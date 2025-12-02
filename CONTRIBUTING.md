# Contributing to Streaming Patterns

Thank you for your interest in contributing to the Streaming Patterns Library! This project helps developers learn how to build modern streaming AI interfaces through working examples and educational resources.

Whether you're fixing a bug, improving documentation, or adding a new pattern, your contribution helps the entire community learn better patterns for building streaming UX.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Add a New Pattern](#how-to-add-a-new-pattern)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Need Help?](#need-help)

---

## Code of Conduct

This project adheres to a Code of Conduct that we expect all contributors to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Git**: For version control

### First Time Setup

1. **Fork the repository** on GitHub (optional for external contributors)

2. **Clone the repository**:
   ```bash
   git clone https://github.com/vibeacademy/streaming-patterns.git
   cd streaming-patterns
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to [http://localhost:5173](http://localhost:5173)

That's it! No API keys, no configuration, no accounts needed. Everything runs locally with mock streaming infrastructure.

---

## Development Setup

### Available Commands

```bash
# Development server with hot module reloading
npm run dev

# Type checking (without building)
npm run type-check

# Linting
npm run lint

# Run tests in watch mode (interactive)
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Project Structure

```
streaming-patterns/
├── src/
│   ├── patterns/              # Pattern implementations
│   │   └── chain-of-reasoning/
│   │       ├── ChainOfReasoningDemo.tsx    # Main demo component
│   │       ├── ReasoningBeadline.tsx       # UI components
│   │       ├── mockStream.ts               # Mock stream generator
│   │       ├── fixtures.ts                 # Demo data
│   │       ├── types.ts                    # TypeScript interfaces
│   │       ├── hooks.ts                    # Custom React hooks
│   │       └── ChainOfReasoningDemo.test.tsx  # Tests
│   ├── components/            # Shared UI components
│   │   ├── NetworkInspector/  # Stream event visualization
│   │   └── AnnotatedSource/   # Code viewer with annotations
│   └── lib/                   # Streaming utilities and hooks
├── docs/                      # Documentation
├── CLAUDE.md                  # Architecture & development standards
└── CONTRIBUTING.md            # This file
```

---

## How to Add a New Pattern

Adding a new streaming pattern is a great way to contribute! Each pattern demonstrates a real-world streaming UX technique in the context of StreamFlow PM (our fictional project management SaaS).

### Step 1: Understand the Pattern Specification

Before implementing, create or review the pattern specification. This should define:
- **Intent**: Why this pattern exists (the problem it solves)
- **UX Flow**: Step-by-step user experience
- **Stream Contract**: Event types and schemas
- **UI Techniques**: Specific UI requirements
- **Demo Scenario**: Realistic StreamFlow PM use case

### Step 2: Create the Pattern Directory

```bash
mkdir -p src/patterns/your-pattern-name
cd src/patterns/your-pattern-name
```

### Step 3: Define TypeScript Types

Create `types.ts` with strict TypeScript interfaces:

```typescript
// types.ts
export interface YourStreamEvent {
  id: string;
  type: 'your_event_type';
  data: YourDataType;
  timestamp: number;
}

export interface YourDataType {
  // Define your data structure
}
```

### Step 4: Create Mock Fixtures

Create `fixtures.ts` with deterministic, replayable mock data:

```typescript
// fixtures.ts
import type { YourStreamEvent } from './types';

export const yourScenarioFixture: YourStreamEvent[] = [
  {
    id: '1',
    type: 'your_event_type',
    data: { /* ... */ },
    timestamp: Date.now()
  },
  // ... more events
];
```

### Step 5: Implement Mock Stream Generator

Create `mockStream.ts` with a realistic streaming implementation:

```typescript
// mockStream.ts
import { yourScenarioFixture } from './fixtures';
import type { YourStreamEvent } from './types';

export async function* createMockYourStream(
  input: string,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): AsyncGenerator<YourStreamEvent> {
  const delays = { fast: 50, normal: 300, slow: 1000 };
  const delayMs = delays[speed];

  for (const event of yourScenarioFixture) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield event;
  }
}
```

### Step 6: Create Custom Hook

Create `hooks.ts` to encapsulate streaming logic:

```typescript
// hooks.ts
import { useState, useEffect } from 'react';
import { createMockYourStream } from './mockStream';
import type { YourStreamEvent } from './types';

export function useYourStream(input: string) {
  const [data, setData] = useState<YourDataType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsStreaming(true);

    (async () => {
      const stream = createMockYourStream(input);

      for await (const event of stream) {
        if (cancelled) break;
        // Process events...
      }

      if (!cancelled) setIsStreaming(false);
    })();

    return () => { cancelled = true; };
  }, [input]);

  return { data, isStreaming };
}
```

### Step 7: Build UI Components

Create reusable UI components for your pattern's visual elements.

### Step 8: Create Main Demo Component

Create `YourPatternDemo.tsx`:

```typescript
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { NetworkInspector } from '@/components/NetworkInspector';
import { useYourStream } from './hooks';

export function YourPatternDemo() {
  const { captureEvent, events } = useNetworkCapture();
  const { data, isStreaming } = useYourStream('input');

  return (
    <div className="demo-container">
      <h1>Your Pattern Name</h1>
      {/* Your demo UI */}
      <NetworkInspector events={events} />
    </div>
  );
}
```

### Step 9: Write Tests

Create `YourPatternDemo.test.tsx` with comprehensive tests:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { YourPatternDemo } from './YourPatternDemo';

describe('Your Pattern Demo', () => {
  it('should stream data correctly', async () => {
    render(<YourPatternDemo />);

    await waitFor(() => {
      expect(screen.getByText(/expected content/i)).toBeInTheDocument();
    });
  });
});
```

### Step 10: Document the Pattern

Create a README.md in your pattern directory explaining:
- Pattern intent and use cases
- Implementation details
- How to run the demo
- Key learnings

---

## Code Standards

This project maintains strict code quality standards to ensure the codebase remains educational and maintainable.

### TypeScript Standards

- **Strict Mode Always**: No `any` types, full type safety
- **Explicit Types**: All function parameters and return types must be explicitly typed
- **Interfaces Over Types**: Use interfaces for object shapes
- **No Implicit Any**: Enable strict TypeScript compiler options

**Example**:
```typescript
// ✅ GOOD
interface ReasoningStep {
  id: string;
  summary: string;
  confidence: number;
}

export function processStep(step: ReasoningStep): void {
  console.log(step.summary);
}

// ❌ BAD
function processStep(step: any) {  // No 'any' types!
  console.log(step.summary);
}
```

### React Standards

- **Functional Components Only**: No class components
- **Props Interfaces**: Every component must have a typed props interface
- **Custom Hooks**: Extract logic into custom hooks for reusability
- **Event Handler Types**: Use proper TypeScript event types

**Example**:
```typescript
// ✅ GOOD
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ BAD
export function Button(props) {  // Missing types!
  return <button>{props.label}</button>;
}
```

### Code Organization

- **Import Order**: External deps → Internal absolute → Relative → Styles
- **File Naming**: PascalCase for components, camelCase for utilities
- **One Component Per File**: Except for small, tightly coupled helpers

### Documentation

- **JSDoc Comments**: For complex functions and hooks
- **Inline Comments**: Explain "why", not "what"
- **README Files**: For each pattern explaining implementation

For detailed architecture and development standards, see **[CLAUDE.md](./CLAUDE.md)**.

---

## Testing Requirements

All code contributions must include tests and meet coverage requirements.

### Coverage Requirements

- **Overall**: Minimum 80% coverage
- **Critical Paths**: 90%+ (streaming logic, state management)
- **UI Components**: 70%+ (focus on behavior, not implementation)

### Test Categories

#### Unit Tests
Test utilities, hooks, and pure functions:

```typescript
import { describe, it, expect } from 'vitest';
import { parseStreamEvent } from './streamProcessor';

describe('parseStreamEvent', () => {
  it('should parse events correctly', () => {
    const raw = 'data: {"type":"reasoning","id":"1"}\n\n';
    const event = parseStreamEvent(raw);
    expect(event.type).toBe('reasoning');
  });
});
```

#### Component Tests
Test React component behavior:

```typescript
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent data={mockData} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### Integration Tests
Test full pattern flows:

```typescript
describe('Pattern Demo Integration', () => {
  it('should stream data end-to-end', async () => {
    render(<PatternDemo />);

    await waitFor(() => {
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Before Submitting PR

Ensure all checks pass:

```bash
# Run all quality checks
npm run lint && npm run type-check && npm run test:run && npm run build
```

---

## Pull Request Process

We follow trunk-based development with feature branches and pull requests.

### 1. Create a Feature Branch

```bash
# Format: feature/issue-{number}-short-description
git checkout -b feature/issue-123-your-feature-name
```

### 2. Make Your Changes

- Write clean, well-documented code
- Add tests for new functionality
- Update documentation as needed
- Follow code standards (see [CLAUDE.md](./CLAUDE.md))

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Lint your code
npm run lint

# Type check
npm run type-check

# Build to catch any build errors
npm run build
```

### 4. Commit Your Changes

Follow the commit message guidelines (see below).

```bash
git add .
git commit -m "[#123] Add new streaming pattern for validation loops"
```

### 5. Push to GitHub

```bash
git push origin feature/issue-123-your-feature-name
```

### 6. Create Pull Request

1. Go to the repository on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template:
   - **Title**: `[#issue] Short, descriptive title`
   - **Description**: What changed and why
   - **Testing**: How you tested the changes
   - **Screenshots**: For UI changes
4. Link the related issue(s)
5. Submit the PR

### 7. Code Review

- A `pr-reviewer` agent will review your PR
- Address any feedback or requested changes
- Keep the conversation constructive and focused

### 8. Merge

- Once approved, a maintainer will merge your PR
- Your branch will be deleted automatically
- The related issue will be moved to "Done"

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows TypeScript strict mode (no `any`)
- [ ] All tests pass (`npm test`)
- [ ] Test coverage meets requirements (>80%)
- [ ] Code is linted (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Pattern matches specification (if applicable)
- [ ] Mock data is deterministic
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines

---

## Commit Message Guidelines

We follow a consistent commit message format for clarity and traceability.

### Format

```
[#issue] Short summary in present tense (50 chars max)

Optional longer description explaining:
- Why the change is needed
- What was changed
- Any breaking changes or migration notes

Closes #issue
```

### Examples

**Good commit messages**:

```
[#42] Implement chain-of-reasoning pattern demo

Adds the chain-of-reasoning pattern with mock streaming infrastructure,
reasoning bead line UI, and network inspector integration.

Closes #42
```

```
[#89] Fix memory leak in stream processor

The stream wasn't properly cleaned up when component unmounted,
causing memory leaks. Added cleanup in useEffect return.

Closes #89
```

```
[#156] Update README with new pattern examples

Added links to newly implemented patterns and updated
the "Implemented Patterns" section.

Closes #156
```

**Bad commit messages**:

```
fix bug              # What bug? No issue reference
update files         # Too vague
WIP                  # Work in progress should not be in main
Fixed stuff          # Not descriptive
```

### Tips

- Use present tense ("Add feature" not "Added feature")
- Reference the issue number with `[#number]`
- Keep the first line under 50 characters
- Explain "why" in the body, not just "what"
- Use `Closes #issue` to auto-close issues when merged

---

## Need Help?

We're here to help you contribute successfully!

### Resources

- **[CLAUDE.md](./CLAUDE.md)**: Detailed architecture and development standards
- **[README.md](./README.md)**: Project overview and quick start
- **[Product Requirements](./docs/PRODUCT-REQUIREMENTS.md)**: Vision and goals
- **[Product Roadmap](./docs/PRODUCT-ROADMAP.md)**: Development phases

### Getting Support

- **Questions about code**: Open a [GitHub Discussion](https://github.com/vibeacademy/streaming-patterns/discussions)
- **Bug reports**: Open a [GitHub Issue](https://github.com/vibeacademy/streaming-patterns/issues)
- **Feature requests**: Open a [GitHub Issue](https://github.com/vibeacademy/streaming-patterns/issues) with the "enhancement" label
- **Security issues**: See SECURITY.md (if applicable)

### Common Issues

**Tests failing locally?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

**TypeScript errors?**
```bash
# Regenerate types
npm run type-check
```

**Build fails?**
```bash
# Check for syntax errors
npm run lint

# Ensure all dependencies are installed
npm install
```

---

## Thank You!

Your contributions make this project better for everyone learning to build streaming AI interfaces. Every bug fix, documentation improvement, and new pattern helps developers worldwide create better user experiences.

We appreciate your time and effort in contributing to the Streaming Patterns Library!

---

**Ready to contribute?**

```bash
git checkout -b feature/issue-your-number-your-feature
npm install
npm run dev
```

Then start building! 🚀
