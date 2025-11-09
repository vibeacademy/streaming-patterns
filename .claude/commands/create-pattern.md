---
description: Create scaffolding for a new streaming pattern
---

Create a new streaming pattern with complete directory structure and scaffolding files.

**Usage**: `/create-pattern <pattern-name>`

**Example**: `/create-pattern chain-of-reasoning`

## What This Command Does

1. **Validate Pattern Name**
   - Check if pattern directory already exists
   - Verify pattern name is in kebab-case format
   - Confirm pattern specification exists in `/patterns/<pattern-name>/README.md`

2. **Create Directory Structure**
   ```
   src/patterns/<pattern-name>/
   ├── <PatternName>Demo.tsx          # Main demo component
   ├── <PatternName>Demo.test.tsx     # Test file
   ├── mockStream.ts                  # Stream generator
   ├── fixtures.ts                    # Demo data
   ├── hooks.ts                       # Custom React hooks
   ├── types.ts                       # TypeScript interfaces
   └── README.md                      # Pattern documentation
   ```

3. **Generate Scaffold Files**
   - **types.ts**: Basic TypeScript interfaces for the pattern's stream events
   - **fixtures.ts**: Template for fixture data with StreamFlow PM context
   - **mockStream.ts**: Async generator function template
   - **hooks.ts**: Custom hook template (e.g., `use<PatternName>Stream`)
   - **<PatternName>Demo.tsx**: Main demo component with network inspector integration
   - **<PatternName>Demo.test.tsx**: Basic test suite
   - **README.md**: Copy pattern spec from `/patterns/<pattern-name>/README.md`

4. **Update Application**
   - Add route in `src/App.tsx`
   - Add pattern card to home page
   - Update pattern list/navigation

## Implementation Guidelines

Follow these standards when scaffolding:
- Use TypeScript strict mode (no `any` types)
- Include JSDoc comments for all exported functions/components
- Follow naming conventions from CLAUDE.md
- Add network inspector integration by default
- Include annotated source viewer placeholder
- Generate test stubs that cover basic rendering and streaming

## Before Running

Ensure the pattern specification exists:
- Pattern spec should be in `/patterns/<pattern-name>/README.md`
- Spec should include: Intent, UX Flow, Stream Contract, UI Techniques

If the pattern spec doesn't exist, create it first based on the pattern template.

## After Scaffolding

The developer should:
1. Review generated files and customize for the specific pattern
2. Implement mock stream logic based on pattern spec
3. Create fixture data for StreamFlow PM demo scenario
4. Build UI components for the pattern
5. Write comprehensive tests
6. Run tests: `npm test`
7. Verify in browser: `npm run dev`
