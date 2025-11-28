# Streaming Patterns Library

> **Educational pattern library for building modern streaming AI/LLM interfaces**

Learn to build real-time streaming experiences through working examples, annotated code, and hands-on experimentation—all running locally with zero API costs.

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Quick Start

Get up and running in under 3 minutes:

```bash
# Clone the repository
git clone https://github.com/vibeacademy/streaming-patterns.git
cd streaming-patterns

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

That's it! No API keys, no configuration, no accounts needed.

---

## Why Streaming Patterns?

Modern AI interfaces don't just show final answers—they stream thinking in real-time. But **how do you actually build these interfaces?**

This library teaches you through:

- **Working Demos**: See patterns in action, not just read about them
- **Mock Streaming**: Experiment locally without API costs or rate limits
- **Production-Ready Code**: TypeScript + React patterns you can adapt immediately
- **Network Inspector**: Visualize what's happening under the hood
- **Annotated Source**: Learn from inline explanations of streaming logic

**Perfect for:**
- Frontend developers building AI-powered products
- Product designers exploring streaming UX possibilities
- Teams needing concrete examples to align on patterns
- Educators teaching modern web development

---

## Streaming Patterns

Each pattern demonstrates a real-world streaming UX technique in the context of **StreamFlow PM**—a fictional project management SaaS.

### Implemented Patterns

#### 1. Chain-of-Reasoning Guide
**Status**: ✅ Complete
**Intent**: Expose intermediate reasoning tokens to build user trust and enable intervention.

Shows the AI's "thinking" as a vertical timeline of reasoning steps before presenting the final answer. Users can see the process, not just the result.

**Demo Scenario**: AI planning a 2-week sprint with visible reasoning steps
**Stream Events**: `reasoning`, `answer`
**UI Technique**: Vertical bead-line with expandable reasoning cards

[**Try it live →**](https://streamingpatterns.com/patterns/chain-of-reasoning)

---

### Planned Patterns (Coming Soon)

<details>
<summary><strong>2. Agent-Await-Prompt</strong> (Phase 2)</summary>

**Intent**: Agent requests missing information mid-stream instead of guessing.

The AI pauses mid-stream to ask clarifying questions, then resumes once the user responds.

**Demo Scenario**: Budget approval workflow pausing to request cost center
**Stream Events**: `reasoning`, `await_input`, `resume`, `answer`
</details>

<details>
<summary><strong>3. Tabular Stream View</strong> (Phase 2)</summary>

**Intent**: Stream tables row-by-row for large datasets.

Shows data arriving incrementally instead of blocking on full table generation.

**Demo Scenario**: Team capacity report streaming 50 rows
**Stream Events**: `table_meta`, `table_row`, `table_complete`
</details>

<details>
<summary><strong>4. Multi-Turn Memory Timeline</strong> (Phase 3)</summary>

**Intent**: Surface evolving memory across conversation turns.

Visualizes how the AI's understanding evolves across multiple interactions.

**Demo Scenario**: Project retrospective with memory surfacing
**Stream Events**: `memory_update`, `memory_reference`, `turn_complete`
</details>

<details>
<summary><strong>5. Turn-Taking Co-Creation</strong> (Phase 3)</summary>

**Intent**: Collaborative drafting where agent and user take turns editing.

Real-time collaborative editing with the AI as a co-author.

**Demo Scenario**: Sprint retrospective document co-creation
**Stream Events**: `draft_chunk`, `handoff`, `user_edit`, `resume`
</details>

<details>
<summary><strong>6. Streaming Validation Loop</strong> (Phase 3)</summary>

**Intent**: Checkpoint-based validation with user approval gates.

The AI pauses at validation points, allowing users to approve or reject before continuing.

**Demo Scenario**: Multi-step project plan with approval checkpoints
**Stream Events**: `checkpoint`, `validation_request`, `approved`, `rejected`
</details>

<details>
<summary><strong>7. Schema-Governed Exchange</strong> (Phase 3)</summary>

**Intent**: Stream and validate JSON against predefined schemas.

Ensures structured data conforms to expected schemas as it streams.

**Demo Scenario**: Structured task breakdown with schema validation
**Stream Events**: `schema_chunk`, `validation_error`, `schema_complete`
</details>

---

## Key Features

### Mock Streaming Infrastructure
No real LLM APIs—everything runs locally with deterministic, replayable mock streams.
- Configurable delays and chunk sizes
- Realistic streaming behavior
- Error condition simulation
- Works offline after `npm install`

### Network Inspector
Real-time visualization of stream events as they arrive:
- Event type filtering
- JSON payload inspection
- Timing and throughput metrics
- Export logs for debugging

### Annotated Source Code
Learn how patterns work with inline explanations:
- Syntax-highlighted code viewer
- Key logic highlighted
- React hooks and state management explained
- Links to related concepts

### StreamFlow PM Business Context
Consistent, realistic scenarios across all patterns:
- Sprint planning and retrospectives
- Budget approvals and capacity planning
- Risk analysis and team coordination
- Authentic project management workflows

---

## Tech Stack

- **React 18+**: UI framework with concurrent features
- **TypeScript 5+**: Strict mode, full type safety
- **Vite 5+**: Lightning-fast dev server and builds
- **Vitest**: Unit and integration testing
- **React Router**: Pattern navigation
- **Prism.js**: Syntax highlighting
- **Cloudflare Workers**: Production deployment

---

## Project Structure

```
streaming-patterns/
├── src/
│   ├── patterns/              # Pattern implementations
│   │   └── chain-of-reasoning/
│   │       ├── ChainOfReasoningDemo.tsx
│   │       ├── mockStream.ts
│   │       ├── fixtures.ts
│   │       └── types.ts
│   ├── components/            # Shared UI components
│   │   ├── NetworkInspector/
│   │   └── AnnotatedSource/
│   └── lib/                   # Streaming utilities
├── docs/                      # Documentation
│   ├── PRODUCT-REQUIREMENTS.md
│   ├── PRODUCT-ROADMAP.md
│   └── architecture/
├── .github/workflows/         # CI/CD pipelines
└── CLAUDE.md                  # Development standards
```

---

## Development

### Running Locally

```bash
# Development server (with HMR)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests in watch mode (interactive)
npm test

# Run tests with coverage report
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

All patterns maintain >80% test coverage with unit, component, and integration tests.

---

## Architecture & Standards

This project follows strict quality standards:

- **TypeScript Strict Mode**: No `any` types, full type safety
- **Functional Components**: React hooks, no class components
- **Mock-First**: All streaming is deterministic and replayable
- **Education Over Abstraction**: Code prioritizes readability and learning
- **Comprehensive Testing**: 80%+ coverage with Vitest

For detailed architecture and development standards, see [`CLAUDE.md`](./CLAUDE.md).

---

## Documentation

- **[Product Requirements](./docs/PRODUCT-REQUIREMENTS.md)**: Vision, goals, and feature specifications
- **[Product Roadmap](./docs/PRODUCT-ROADMAP.md)**: Development phases and milestones
- **[Development Standards](./CLAUDE.md)**: Architecture, code standards, and workflows
- **[Mock SSE Architecture](./docs/MOCK-SSE-ARCHITECTURE.md)**: Deep dive into mock streaming infrastructure

---

## Deployment

This project is deployed to Cloudflare Workers with automated CI/CD:

**Production**: [streamingpatterns.com](https://streamingpatterns.com)

Every pull request gets an ephemeral preview environment at `https://pr-{number}.streamingpatterns.com`.

---

## Contributing

We welcome contributions! Whether it's:
- Reporting bugs or suggesting features
- Improving documentation
- Adding new patterns
- Fixing issues

**Before contributing:**
1. Read [`CLAUDE.md`](./CLAUDE.md) for development standards
2. Check existing issues and PRs
3. Follow the trunk-based development workflow
4. Ensure tests pass and coverage >80%

**Development Workflow:**
1. Create feature branch: `feature/issue-{number}-description`
2. Implement with tests
3. Run `npm test && npm run lint && npm run build`
4. Create pull request with detailed description
5. Wait for review from `pr-reviewer` agent

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Learn More

- **Live Demo**: [streamingpatterns.com](https://streamingpatterns.com)
- **GitHub Issues**: [Report bugs or request features](https://github.com/vibeacademy/streaming-patterns/issues)
- **Project Board**: [Track development progress](https://github.com/orgs/vibeacademy/projects/3)

---

## Acknowledgments

Built with inspiration from:
- Modern AI interfaces (ChatGPT, Claude, Cursor, etc.)
- React Server Components streaming patterns
- Streaming UX research and best practices

---

**Ready to learn streaming patterns?**

```bash
npm install && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and start exploring!
