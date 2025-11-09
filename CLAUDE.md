# Streaming Patterns Library - Architecture & Development Standards

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Architecture Principles](#architecture-principles)
4. [Code Standards](#code-standards)
5. [Testing Strategy](#testing-strategy)
6. [Development Workflow](#development-workflow)
7. [Pattern Implementation Guide](#pattern-implementation-guide)

---

## Technology Stack

### Core Technologies
- **React 18+**: UI framework (functional components, hooks, concurrent features)
- **TypeScript 5+**: Static typing (strict mode enabled, no `any` types)
- **Vite 5+**: Build tool and dev server (fast HMR, optimized builds)

### Testing & Quality
- **Vitest**: Unit and integration testing (Jest-compatible API)
- **Testing Library**: Component testing (React Testing Library)
- **ESLint**: Linting (TypeScript, React, accessibility rules)
- **Prettier**: Code formatting (consistent style)

### Streaming & State
- **Custom Hooks**: `useStreamProcessor`, `useNetworkInspector`, etc.
- **Mock Infrastructure**: Deterministic stream generators (no real APIs)
- **EventSource Polyfill**: SSE simulation for mock streams

### UI & Styling
- **CSS Modules** or **Tailwind CSS**: Component styling
- **Framer Motion** (optional): Animations for streaming UX
- **Prism.js** or **Shiki**: Syntax highlighting for annotated source

---

## Project Structure

```
streaming-patterns/
├── .claude/                      # Agent policies and settings
│   ├── agents/
│   │   ├── github-ticket-worker.md
│   │   ├── pr-reviewer-merger.md
│   │   └── agile-backlog-prioritizer.md
│   └── settings.local.json
│
├── docs/                         # Product documentation
│   ├── PRODUCT-REQUIREMENTS.md
│   ├── PRODUCT-ROADMAP.md
│   └── architecture/             # Technical deep dives
│
├── src/
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root component with routing
│   │
│   ├── patterns/                 # Pattern implementations
│   │   ├── chain-of-reasoning/
│   │   │   ├── ChainOfReasoningDemo.tsx      # Main demo component
│   │   │   ├── ReasoningBeadline.tsx         # UI: reasoning bead list
│   │   │   ├── mockStream.ts                 # Mock stream generator
│   │   │   ├── fixtures.ts                   # Demo data (sprints, tasks)
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   ├── hooks.ts                      # useReasoningStream hook
│   │   │   └── ChainOfReasoningDemo.test.tsx # Tests
│   │   │
│   │   ├── agent-await-prompt/
│   │   ├── tabular-stream-view/
│   │   ├── multi-turn-memory-timeline/
│   │   ├── turn-taking-co-creation/
│   │   ├── streaming-validation-loop/
│   │   └── schema-governed-exchange/
│   │
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # Base UI components (Button, Card, etc.)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── AppShell.tsx
│   │   │   ├── PatternPage.tsx
│   │   │   └── DemoContainer.tsx
│   │   ├── NetworkInspector/    # Network inspector panel
│   │   │   ├── NetworkInspector.tsx
│   │   │   ├── EventList.tsx
│   │   │   ├── JsonViewer.tsx
│   │   │   └── NetworkInspector.test.tsx
│   │   └── AnnotatedSource/     # Source code viewer
│   │       ├── AnnotatedSource.tsx
│   │       ├── CodeHighlighter.tsx
│   │       └── AnnotatedSource.test.tsx
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── streaming/            # Streaming infrastructure
│   │   │   ├── mockSSE.ts        # SSE emulation
│   │   │   ├── streamProcessor.ts # Stream parsing/chunking
│   │   │   ├── eventSchema.ts    # Event type definitions
│   │   │   └── fixtures.ts       # Shared mock data
│   │   ├── hooks/                # Shared React hooks
│   │   │   ├── useStreamProcessor.ts
│   │   │   ├── useNetworkCapture.ts
│   │   │   └── useDemoState.ts
│   │   └── utils/                # General utilities
│   │       ├── delay.ts
│   │       ├── formatters.ts
│   │       └── ...
│   │
│   ├── fixtures/                 # Global fixtures (StreamFlow PM data)
│   │   ├── projects.json
│   │   ├── teams.json
│   │   └── ...
│   │
│   ├── types/                    # Global TypeScript types
│   │   ├── events.ts             # Stream event types
│   │   ├── patterns.ts           # Pattern metadata types
│   │   └── streamflow.ts         # StreamFlow PM business types
│   │
│   └── styles/                   # Global styles
│       ├── globals.css
│       └── variables.css
│
├── public/                       # Static assets
│   ├── streamflow-logo.svg
│   └── patterns/                 # Pattern screenshots/GIFs
│
├── tests/                        # Test utilities
│   ├── setup.ts                  # Vitest setup
│   └── mocks/                    # Global mocks
│
├── package.json
├── tsconfig.json                 # TypeScript config (strict mode)
├── vite.config.ts                # Vite config
├── vitest.config.ts              # Vitest config
├── eslint.config.js              # ESLint config
├── .prettierrc                   # Prettier config
├── README.md                     # Project overview
├── CLAUDE.md                     # This file
├── CONTRIBUTING.md               # Contribution guide
└── LICENSE                       # MIT License
```

---

## Architecture Principles

### 1. Education Over Abstraction
**Principle**: Code should be readable and educational, not clever or overly DRY.

**Guidelines**:
- Prefer explicit code over magic abstractions
- Inline complex logic with comments rather than hiding in utilities
- Duplicate code if it makes each pattern more self-contained and understandable
- Every pattern should be understandable in isolation

**Example**:
```tsx
// ✅ GOOD: Explicit, easy to understand
function useReasoningStream(prompt: string) {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState<string>('');

  useEffect(() => {
    // Fetch mock stream
    const stream = createMockReasoningStream(prompt);

    stream.on('reasoning', (step: ReasoningStep) => {
      // Add new reasoning step to the list
      setReasoning(prev => [...prev, step]);
    });

    stream.on('answer', (text: string) => {
      // Accumulate answer text
      setAnswer(prev => prev + text);
    });

    return () => stream.close();
  }, [prompt]);

  return { reasoning, answer };
}

// ❌ BAD: Too abstract, hides learning
function useStream<T>(config: StreamConfig<T>) {
  return useGenericStreamProcessor(config);
}
```

### 2. Mock Infrastructure is Core
**Principle**: Mock streaming infrastructure is not a hack—it's the educational foundation.

**Guidelines**:
- Mocks must be deterministic (same input → same output)
- Mocks should mimic real LLM behavior (chunking, delays, error rates)
- Fixture data should be version-controlled and reviewable
- Provide speed controls (fast/normal/slow) for testing different scenarios

**Mock Stream Anatomy**:
```typescript
interface StreamEvent {
  id: string;
  type: 'reasoning' | 'answer' | 'memory' | 'validation' | 'table_row' | 'await_input' | 'schema_error';
  data: unknown;
  timestamp: number;
}

// Example: Mock reasoning stream
function createMockReasoningStream(prompt: string): AsyncGenerator<StreamEvent> {
  const fixture = reasoningFixtures[prompt] || reasoningFixtures.default;

  for (const event of fixture.events) {
    yield delay(event.delayMs); // Simulate network latency
    yield event;
  }
}
```

### 3. Components Own Their Streaming Logic
**Principle**: Each pattern implementation should be self-contained.

**Guidelines**:
- Pattern components manage their own stream state
- Custom hooks (`useReasoningStream`, `useValidationLoop`) encapsulate streaming logic
- Avoid global state managers (Redux, Zustand) unless absolutely necessary
- Patterns should work independently (not coupled to each other)

### 4. Network Inspector is a First-Class Feature
**Principle**: Transparency into stream mechanics is critical for learning.

**Guidelines**:
- Network inspector must capture ALL stream events
- Events should be tagged with type, timestamp, and full payload
- Inspector should not interfere with demo performance
- Export functionality for debugging

**Implementation**:
```tsx
// Every pattern uses the network capture hook
function ChainOfReasoningDemo() {
  const { captureEvent, events } = useNetworkCapture();
  const { reasoning, answer } = useReasoningStream({
    prompt: "Plan a sprint",
    onEvent: captureEvent  // Capture events for inspector
  });

  return (
    <DemoContainer>
      <ReasoningBeadline reasoning={reasoning} />
      <AnswerDisplay answer={answer} />
      <NetworkInspector events={events} />
    </DemoContainer>
  );
}
```

### 5. Annotated Source is Documentation
**Principle**: Code comments and annotations teach developers how patterns work.

**Guidelines**:
- Every pattern file should have JSDoc comments
- Complex logic should have inline comments explaining "why"
- Annotated source viewer highlights key sections
- Comments should be written for intermediate React developers (not experts)

---

## Code Standards

### TypeScript Standards

#### 1. Strict Mode Always
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 2. No `any` Types
```tsx
// ❌ BAD
function processEvent(event: any) { ... }

// ✅ GOOD
interface StreamEvent {
  type: 'reasoning' | 'answer';
  data: ReasoningData | AnswerData;
}

function processEvent(event: StreamEvent) { ... }
```

#### 3. Interface Over Type for Objects
```tsx
// ✅ GOOD
interface ReasoningStep {
  id: string;
  summary: string;
  confidence: number;
  timestamp: number;
}

// ❌ AVOID (use for unions/primitives only)
type ReasoningStep = {
  id: string;
  summary: string;
};
```

#### 4. Explicit Return Types for Functions
```tsx
// ✅ GOOD
function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString();
}

// ❌ AVOID
function formatTimestamp(ms: number) {  // Implicit return type
  return new Date(ms).toISOString();
}
```

### React Standards

#### 1. Functional Components Only
```tsx
// ✅ GOOD
export function ReasoningBeadline({ reasoning }: Props) {
  return <div>{/* ... */}</div>;
}

// ❌ BAD
export class ReasoningBeadline extends React.Component { ... }
```

#### 2. Props Interfaces
```tsx
// ✅ GOOD
interface ReasoningBeadlineProps {
  reasoning: ReasoningStep[];
  onPromote?: (step: ReasoningStep) => void;
  className?: string;
}

export function ReasoningBeadline({
  reasoning,
  onPromote,
  className
}: ReasoningBeadlineProps) {
  // ...
}
```

#### 3. Custom Hooks for Logic
```tsx
// ✅ GOOD: Encapsulate streaming logic in a hook
function useReasoningStream(prompt: string) {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Stream logic here
  }, [prompt]);

  return { reasoning, answer, isStreaming };
}

// Then use in component
function Demo() {
  const { reasoning, answer, isStreaming } = useReasoningStream("Plan sprint");
  // ...
}
```

#### 4. Event Handlers with Type Safety
```tsx
// ✅ GOOD
function handlePromote(step: ReasoningStep): void {
  console.log('Promoting step:', step.id);
}

<button onClick={() => handlePromote(step)}>
  Promote
</button>

// ❌ AVOID
<button onClick={(e: any) => handlePromote(e.target.value)}>
  Promote
</button>
```

#### 5. Error Boundaries
```tsx
// Every pattern should have an error boundary
<ErrorBoundary fallback={<ErrorDisplay />}>
  <ChainOfReasoningDemo />
</ErrorBoundary>
```

### File Organization Standards

#### Pattern File Structure
```
patterns/chain-of-reasoning/
├── ChainOfReasoningDemo.tsx      # Main demo component (exports default)
├── ReasoningBeadline.tsx          # UI component
├── AnswerDisplay.tsx              # UI component
├── mockStream.ts                  # Stream generator
├── fixtures.ts                    # Mock data
├── hooks.ts                       # useReasoningStream hook
├── types.ts                       # TypeScript interfaces
├── README.md                      # Pattern documentation
└── ChainOfReasoningDemo.test.tsx  # Tests
```

#### Import Order
```tsx
// 1. External dependencies
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

// 2. Internal absolute imports
import { Button } from '@/components/ui/Button';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';

// 3. Relative imports
import { ReasoningBeadline } from './ReasoningBeadline';
import { createMockReasoningStream } from './mockStream';
import type { ReasoningStep } from './types';

// 4. Styles
import styles from './ChainOfReasoningDemo.module.css';
```

---

## Testing Strategy

### Coverage Requirements
- **Minimum**: 80% overall coverage
- **Critical paths**: 90%+ (streaming logic, state management)
- **UI components**: 70%+ (focus on behavior, not implementation)

### Test Categories

#### 1. Unit Tests (Utilities, Hooks)
```typescript
// lib/streaming/streamProcessor.test.ts
import { describe, it, expect } from 'vitest';
import { parseStreamEvent } from './streamProcessor';

describe('parseStreamEvent', () => {
  it('should parse reasoning events correctly', () => {
    const raw = 'data: {"type":"reasoning","id":"1","summary":"Analyzing backlog"}\n\n';
    const event = parseStreamEvent(raw);

    expect(event.type).toBe('reasoning');
    expect(event.id).toBe('1');
  });

  it('should handle malformed events gracefully', () => {
    const raw = 'data: {invalid json}\n\n';
    expect(() => parseStreamEvent(raw)).toThrow();
  });
});
```

#### 2. Component Tests
```tsx
// patterns/chain-of-reasoning/ReasoningBeadline.test.tsx
import { render, screen } from '@testing-library/react';
import { ReasoningBeadline } from './ReasoningBeadline';

describe('ReasoningBeadline', () => {
  it('should render reasoning steps', () => {
    const reasoning = [
      { id: '1', summary: 'Step 1', confidence: 0.9, timestamp: Date.now() },
      { id: '2', summary: 'Step 2', confidence: 0.8, timestamp: Date.now() }
    ];

    render(<ReasoningBeadline reasoning={reasoning} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('should call onPromote when button clicked', async () => {
    const onPromote = vi.fn();
    const reasoning = [{ id: '1', summary: 'Step 1', confidence: 0.9, timestamp: Date.now() }];

    render(<ReasoningBeadline reasoning={reasoning} onPromote={onPromote} />);

    const button = screen.getByRole('button', { name: /promote/i });
    await userEvent.click(button);

    expect(onPromote).toHaveBeenCalledWith(reasoning[0]);
  });
});
```

#### 3. Integration Tests (Full Pattern Flow)
```tsx
// patterns/chain-of-reasoning/ChainOfReasoningDemo.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ChainOfReasoningDemo } from './ChainOfReasoningDemo';

describe('Chain of Reasoning Demo', () => {
  it('should stream reasoning steps and final answer', async () => {
    render(<ChainOfReasoningDemo />);

    // Wait for first reasoning step
    await waitFor(() => {
      expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
    });

    // Wait for final answer
    await waitFor(() => {
      expect(screen.getByText(/Sprint plan:/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify network inspector captured events
    expect(screen.getByText(/6 events/i)).toBeInTheDocument();
  });
});
```

### Test Utilities
```typescript
// tests/mocks/mockStream.ts
export function createTestStream(events: StreamEvent[]) {
  // Fast stream for tests (no delays)
  return events.map(e => ({ ...e, delayMs: 0 }));
}
```

---

## Development Workflow

### Trunk-Based Development

#### 1. Main Branch is Protected
- No direct commits to `main`
- All changes via feature branches + pull requests
- Main must always be in deployable state

#### 2. Feature Branch Naming
```bash
# Format: feature/issue-{number}-short-description
git checkout -b feature/issue-42-chain-of-reasoning-pattern
```

#### 3. Commit Messages
```bash
# Format: [#issue] Short summary
git commit -m "[#42] Implement chain-of-reasoning pattern demo"
git commit -m "[#42] Add tests for reasoning bead line component"
```

#### 4. Pull Request Process
1. Create feature branch
2. Implement feature + tests
3. Run `npm test && npm run lint && npm run build`
4. Push branch: `git push origin feature/issue-42-...`
5. Create PR with template
6. Move issue to "In Review" column
7. Wait for `pr-reviewer-merger` agent to review
8. Address feedback if needed
9. Agent merges when approved
10. Agent moves issue to "Done" column

### Code Review Standards

#### What Reviewers Check
- [ ] TypeScript strict mode compliance (no `any`)
- [ ] Tests pass with >80% coverage
- [ ] Pattern matches specification from README.md
- [ ] Mock data is deterministic
- [ ] Network inspector integration works
- [ ] Annotated source is clear and educational
- [ ] No security issues (XSS, injection)
- [ ] Performance is acceptable (no unnecessary re-renders)
- [ ] Accessibility (keyboard nav, screen readers)

#### When to Approve
- All tests pass
- Code meets quality standards
- Pattern works end-to-end
- Documentation is complete

#### When to Request Changes
- Tests fail or coverage is low
- TypeScript errors or `any` types
- Pattern doesn't match specification
- Security vulnerabilities
- Missing documentation

---

## Pattern Implementation Guide

### Step-by-Step: Implementing a New Pattern

#### Step 1: Read the Pattern Specification
```bash
# Pattern specs are in /patterns/{pattern-name}/README.md
# Understand:
# - Intent (why this pattern exists)
# - UX Flow (step-by-step user experience)
# - Stream Contract (event types and schemas)
# - UI Techniques (specific UI requirements)
```

#### Step 2: Create Pattern Directory
```bash
mkdir -p src/patterns/chain-of-reasoning
cd src/patterns/chain-of-reasoning
```

#### Step 3: Define TypeScript Types
```typescript
// types.ts
export interface ReasoningStep {
  id: string;
  summary: string;
  confidence: number;
  details?: string;
  timestamp: number;
}

export interface ReasoningStreamEvent {
  type: 'reasoning';
  data: ReasoningStep;
}

export interface AnswerStreamEvent {
  type: 'answer';
  data: { text: string };
}

export type StreamEvent = ReasoningStreamEvent | AnswerStreamEvent;
```

#### Step 4: Create Mock Fixtures
```typescript
// fixtures.ts
import type { StreamEvent } from './types';

export const sprintPlanningFixture: StreamEvent[] = [
  {
    type: 'reasoning',
    data: {
      id: '1',
      summary: 'Analyzing backlog priorities',
      confidence: 0.9,
      details: 'Reviewing 24 backlog items based on business value...',
      timestamp: Date.now()
    }
  },
  {
    type: 'reasoning',
    data: {
      id: '2',
      summary: 'Estimating capacity',
      confidence: 0.85,
      timestamp: Date.now() + 500
    }
  },
  // ... more events
  {
    type: 'answer',
    data: { text: 'Sprint Plan:\n\n1. User authentication (5 pts)\n...' }
  }
];
```

#### Step 5: Implement Mock Stream
```typescript
// mockStream.ts
import { sprintPlanningFixture } from './fixtures';
import type { StreamEvent } from './types';

export async function* createMockReasoningStream(
  prompt: string,
  speed: 'fast' | 'normal' | 'slow' = 'normal'
): AsyncGenerator<StreamEvent> {
  const delays = { fast: 50, normal: 300, slow: 1000 };
  const delayMs = delays[speed];

  const fixture = sprintPlanningFixture; // Could choose based on prompt

  for (const event of fixture) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    yield event;
  }
}
```

#### Step 6: Create Custom Hook
```typescript
// hooks.ts
import { useState, useEffect } from 'react';
import { createMockReasoningStream } from './mockStream';
import type { ReasoningStep, StreamEvent } from './types';

export function useReasoningStream(prompt: string) {
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsStreaming(true);

    (async () => {
      const stream = createMockReasoningStream(prompt);

      for await (const event of stream) {
        if (cancelled) break;

        if (event.type === 'reasoning') {
          setReasoning(prev => [...prev, event.data]);
        } else if (event.type === 'answer') {
          setAnswer(event.data.text);
        }
      }

      if (!cancelled) {
        setIsStreaming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prompt]);

  return { reasoning, answer, isStreaming };
}
```

#### Step 7: Build UI Components
```tsx
// ReasoningBeadline.tsx
import type { ReasoningStep } from './types';
import styles from './ReasoningBeadline.module.css';

interface Props {
  reasoning: ReasoningStep[];
  onPromote?: (step: ReasoningStep) => void;
}

export function ReasoningBeadline({ reasoning, onPromote }: Props) {
  return (
    <div className={styles.beadline}>
      {reasoning.map((step, index) => (
        <div key={step.id} className={styles.bead}>
          <div className={styles.number}>{index + 1}</div>
          <div className={styles.summary}>{step.summary}</div>
          {step.details && (
            <details className={styles.details}>
              <summary>View details</summary>
              <p>{step.details}</p>
            </details>
          )}
          {onPromote && (
            <button onClick={() => onPromote(step)}>
              Promote to Plan
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### Step 8: Create Main Demo Component
```tsx
// ChainOfReasoningDemo.tsx
import { useState } from 'react';
import { useNetworkCapture } from '@/lib/hooks/useNetworkCapture';
import { NetworkInspector } from '@/components/NetworkInspector';
import { AnnotatedSource } from '@/components/AnnotatedSource';
import { ReasoningBeadline } from './ReasoningBeadline';
import { useReasoningStream } from './hooks';

export function ChainOfReasoningDemo() {
  const { captureEvent, events } = useNetworkCapture();
  const [prompt] = useState('Plan a 2-week sprint for the StreamFlow PM dashboard');

  const { reasoning, answer, isStreaming } = useReasoningStream(prompt);

  // Capture events for network inspector
  useEffect(() => {
    reasoning.forEach(step => {
      captureEvent({ type: 'reasoning', data: step, timestamp: step.timestamp });
    });
  }, [reasoning, captureEvent]);

  return (
    <div className="demo-container">
      <h1>Chain of Reasoning</h1>
      <p>Watch the AI plan a sprint with visible reasoning steps.</p>

      <ReasoningBeadline
        reasoning={reasoning}
        onPromote={(step) => console.log('Promoted:', step)}
      />

      {answer && (
        <div className="answer">
          <h2>Final Plan</h2>
          <pre>{answer}</pre>
        </div>
      )}

      {isStreaming && <div className="loading">Streaming...</div>}

      <NetworkInspector events={events} />

      <AnnotatedSource
        file="chain-of-reasoning/hooks.ts"
        highlights={['useReasoningStream', 'event.type === "reasoning"']}
      />
    </div>
  );
}
```

#### Step 9: Write Tests
```tsx
// ChainOfReasoningDemo.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ChainOfReasoningDemo } from './ChainOfReasoningDemo';

describe('Chain of Reasoning Demo', () => {
  it('renders and streams reasoning steps', async () => {
    render(<ChainOfReasoningDemo />);

    // Check initial state
    expect(screen.getByText(/Watch the AI plan/i)).toBeInTheDocument();

    // Wait for first reasoning step
    await waitFor(() => {
      expect(screen.getByText(/Analyzing backlog/i)).toBeInTheDocument();
    });

    // Wait for final answer
    await waitFor(() => {
      expect(screen.getByText(/Sprint Plan:/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

#### Step 10: Update Pattern README
```markdown
# Chain-of-Reasoning Guide

## Intent
Teach developers how to expose intermediate reasoning tokens...

## Implementation Notes
- Mock stream: `src/patterns/chain-of-reasoning/mockStream.ts`
- Custom hook: `useReasoningStream`
- Event types: `reasoning` and `answer`

## Demo Scenario
StreamFlow PM: AI planning a 2-week sprint with visible reasoning steps.

## Running the Demo
\`\`\`bash
npm run dev
# Navigate to /patterns/chain-of-reasoning
\`\`\`
```

---

## Performance Guidelines

### 1. Avoid Unnecessary Re-renders
```tsx
// ✅ GOOD: Memoize expensive components
const ReasoningBead = memo(function ReasoningBead({ step }: Props) {
  return <div>{step.summary}</div>;
});

// ✅ GOOD: Use keys properly in lists
{reasoning.map(step => (
  <ReasoningBead key={step.id} step={step} />
))}
```

### 2. Debounce Rapid Updates
```typescript
// For high-frequency stream events
const debouncedUpdate = useMemo(
  () => debounce((text: string) => setAnswer(prev => prev + text), 16), // 60fps
  []
);
```

### 3. Optimize Large Lists
```tsx
// Use virtual scrolling for 100+ items
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## Accessibility Guidelines

### 1. Keyboard Navigation
```tsx
// All interactive elements must be keyboard-accessible
<button
  onClick={handlePromote}
  onKeyDown={(e) => e.key === 'Enter' && handlePromote()}
>
  Promote
</button>
```

### 2. ARIA Labels
```tsx
<div role="log" aria-live="polite" aria-label="Reasoning steps">
  {reasoning.map(step => (
    <div key={step.id} role="article">
      {step.summary}
    </div>
  ))}
</div>
```

### 3. Screen Reader Support
```tsx
// Announce new events to screen readers
<div aria-live="polite" className="sr-only">
  {isStreaming ? 'Streaming in progress' : 'Streaming complete'}
</div>
```

---

## Security Guidelines

### 1. No Real API Keys in Code
```typescript
// ❌ NEVER
const apiKey = 'sk-...';

// ✅ Mocks only
const mockResponse = fixtures.sprintPlanning;
```

### 2. Sanitize User Input (Future: if user input is added)
```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

### 3. Content Security Policy
```html
<!-- In index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline'"
>
```

---

## Deployment

### Build for Production
```bash
npm run build
# Output: dist/ directory

# Test production build locally
npm run preview
```

### Environment Variables
```bash
# No environment variables needed for MVP (mocks only)
# Future: optional API key support
VITE_OPENAI_API_KEY=optional-for-real-llm-mode
```

---

## FAQ for Developers

### Q: Can I use a different state manager (Redux, Zustand)?
A: For MVP, prefer React hooks for simplicity and educational value. If patterns become complex enough to justify global state, discuss in an issue first.

### Q: Can I add animations with Framer Motion?
A: Yes, but ensure they don't distract from learning. Animations should enhance understanding of streaming (e.g., showing data flow), not just look cool.

### Q: What if my mock stream needs to be more complex?
A: Mocks can be as complex as needed, but keep them deterministic. Use fixture files for complex scenarios.

### Q: How do I handle errors in streams?
A: Add error events to your stream schema:
```typescript
{ type: 'error', data: { message: 'Stream failed', code: 'NETWORK_ERROR' } }
```

### Q: Can I use external UI libraries (Radix, Headless UI)?
A: Yes, if they improve accessibility or DX. Document the choice in PR description.

---

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com/react)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: Nov 9, 2024
