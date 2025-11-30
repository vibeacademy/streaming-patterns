# Schema-Governed Exchange Pattern

## Intent

Enforce schema contracts on streaming JSON payloads with real-time validation, providing immediate feedback on type errors, missing fields, and validation constraints before data is fully received.

## Mindset Shift

**Traditional Approach**: Validate JSON only after complete payload arrives → Discover errors late → Waste bandwidth and time

**Streaming Pattern**: Validate progressively as chunks stream in → Detect errors early → Provide immediate feedback and suggestions

This pattern teaches developers how to build type-safe streaming interfaces where validation happens in real-time, not as an afterthought.

## When to Use This Pattern

- **Structured Data Entry**: Forms or wizards where AI generates JSON configurations
- **API Payload Validation**: Validate API responses as they stream in
- **Type-Safe Streaming**: Enforce runtime type safety for TypeScript/Zod schemas
- **Data Quality Assurance**: Catch malformed data before processing completes

## Demo Scenario

**StreamFlow PM Context**: AI generates a project setup JSON payload with team assignments, budget, deadlines, and deliverables. The schema validator ensures all required fields are present, types are correct, and business constraints (e.g., budget ≥ $1000) are satisfied.

**Real-World Value**: Instead of waiting for the full payload and then discovering the budget was sent as `"25k"` (string) instead of `25000` (number), the validator catches it immediately and suggests the fix.

## UX Flow

1. **Schema HUD Appears**: Displays expected structure (required fields, types, constraints, examples)
2. **Stream Begins**: JSON payload chunks arrive progressively
3. **Progressive Validation**: Each chunk is validated against schema using Zod
4. **Visual Feedback**:
   - **Validation Badge**: Green (valid) / Amber (partial) / Red (invalid)
   - **Error Highlights**: Invalid fields are underlined in red
   - **Auto-Suggestions**: Common fixes appear (e.g., "Convert '25k' to 25000")
5. **Completion**: Final validation confirms all requirements met

## Stream Contract

### Event Types

#### 1. Schema Definition Event

Sent first to establish the contract.

```typescript
{
  type: 'schema',
  data: {
    schemaId: 'project-setup-v1',
    version: '1.0.0',
    description: 'StreamFlow PM project setup schema',
    schema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', minLength: 3 },
        budget: { type: 'number', minimum: 1000 },
        teamIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        // ... more fields
      },
      required: ['projectName', 'budget', 'teamIds']
    }
  }
}
```

#### 2. Payload Chunk Event

Progressive JSON payload.

```typescript
{
  type: 'payload',
  data: {
    chunk: {
      projectName: 'Mobile App Redesign',
      budget: 75000
      // ... partial or complete payload
    },
    complete: false, // true when fully streamed
    chunkIndex: 0
  }
}
```

#### 3. Schema Error Event

Validation failures with suggestions.

```typescript
{
  type: 'schema_error',
  data: {
    field: 'budget',
    error: 'Expected number, got string "75k"',
    suggestion: 'Convert "75k" to 75000',
    severity: 'error' | 'warning' | 'info',
    code: 'invalid_type'
  }
}
```

## UI Techniques

### 1. Schema HUD

Collapsible panel showing:
- **Field names** with type annotations
- **Required indicators** (asterisk *)
- **Validation constraints** (min/max, format, enums)
- **Examples** for each field

**Implementation**: See `SchemaHUD.tsx` - Uses JSON Schema representation of Zod schemas for display.

### 2. Validation Badge

Real-time status indicator:
- **Valid** (green): All checks passed
- **Partial** (amber): Incomplete data (streaming)
- **Invalid** (red): Validation errors present
- **Pending** (gray): Waiting for schema/payload

**Implementation**: See `ValidationBadge.tsx` - Color-coded with pulsing animation.

### 3. Payload Viewer

JSON display with:
- **Syntax highlighting** (keys, values, types)
- **Error underlining** (red wavy lines for invalid fields)
- **Streaming indicator** (shows when incomplete)

**Implementation**: See `PayloadViewer.tsx` - Custom JSON renderer with error overlay.

### 4. Error Highlighter

Error list with:
- **Field path** (e.g., `owner.email`)
- **Error message** (human-readable)
- **Auto-fix suggestions** (when available)
- **Hover-to-highlight** (shows field in Schema HUD)

**Implementation**: See `ErrorHighlighter.tsx` - Interactive error cards.

## Server-Side Notes

### When to Validate

1. **On Each Chunk**: Validate partial schema (all fields optional) to catch type errors early
2. **On Completion**: Validate full schema (required fields enforced)
3. **Before Database Write**: Final validation as last line of defense

### Error Recovery Strategies

- **Auto-Correction**: Attempt to fix common errors (e.g., "25k" → 25000)
- **Schema Evolution**: Support multiple schema versions (v1, v2, etc.)
- **Graceful Degradation**: Accept partial data if core fields are valid

### Performance Considerations

- **Debounce Validation**: Don't validate on every byte (use chunk boundaries)
- **Async Validation**: Offload to Web Worker for complex schemas
- **Caching**: Memoize schema compilation (Zod schemas are expensive to create)

## Implementation Details

### Zod Schema Setup

```typescript
import { z } from 'zod';

// Full schema with all constraints
export const projectSetupSchema = z.object({
  projectName: z.string().min(3).max(100),
  budget: z.number().min(1000).max(10000000),
  teamIds: z.array(z.string().uuid()).min(1).max(10),
  // ... more fields
});

// Partial schema for progressive validation
export const partialProjectSetupSchema = projectSetupSchema.partial();
```

### Progressive Validation Hook

```typescript
function useSchemaValidation(options) {
  const [payload, setPayload] = useState({});
  const [validationResult, setValidationResult] = useState({ status: 'pending' });

  // On each payload chunk
  useEffect(() => {
    const result = partialProjectSetupSchema.safeParse(payload);

    if (result.success) {
      setValidationResult({ status: 'partial', errors: [] });
    } else {
      const errors = result.error.issues.map(formatZodError);
      setValidationResult({ status: 'invalid', errors });
    }
  }, [payload]);

  return { payload, validationResult };
}
```

### Auto-Suggestion Logic

```typescript
function formatZodError(issue: z.ZodIssue): ValidationError {
  let suggestion: string | undefined;

  if (issue.code === 'invalid_type' && issue.expected === 'number') {
    const value = String(issue.received);

    // Handle "25k" → 25000
    if (/^\d+k$/i.test(value)) {
      const num = parseInt(value) * 1000;
      suggestion = `Convert "${value}" to ${num}`;
    }
  }

  return {
    field: issue.path.join('.'),
    message: issue.message,
    suggestion,
    severity: 'error',
  };
}
```

## Instrumentation

Track these metrics:

- **Validation Time**: How long does progressive validation take?
- **Error Rate**: What percentage of streams have validation errors?
- **Auto-Fix Acceptance**: Do users apply suggested fixes?
- **Field Error Distribution**: Which fields fail most often?

Example instrumentation:

```typescript
analytics.track('schema_validation', {
  schemaId: 'project-setup-v1',
  status: validationResult.status,
  errorCount: validationResult.errors.length,
  validationTimeMs: Date.now() - startTime,
  autoFixSuggestionsCount: suggestions.size,
});
```

## Testing Strategy

### Unit Tests

- Schema validation (valid/invalid payloads)
- Error formatting and suggestions
- Partial schema validation

### Component Tests

- Schema HUD rendering
- Validation badge status changes
- Error highlighting interactions

### Integration Tests

- Full stream flow (schema → payload → errors)
- Progressive validation updates
- Network inspector event capture

See `schema.test.ts` and `SchemaExchangeDemo.test.tsx` for examples.

## Accessibility

- **ARIA Labels**: Validation status announced to screen readers
- **Keyboard Navigation**: Tab through errors, Enter to highlight field
- **Color + Text**: Don't rely on color alone (use icons + labels)
- **Error Descriptions**: Clear, actionable error messages

## Common Pitfalls

1. **Validating Too Frequently**: Don't validate on every byte → Use chunk boundaries
2. **Blocking UI on Validation**: Keep validation async to avoid jank
3. **Ignoring Partial Data**: Validate what you have, don't wait for completion
4. **Poor Error Messages**: "Invalid input" → "Budget must be a number, got string '25k'"

## Related Patterns

- **Streaming Validation Loop**: Combines schema validation with retry logic
- **Tabular Stream View**: Uses schemas to define table column types
- **Agent-Await Prompt**: Validates user input against expected schema

## References

- [Zod Documentation](https://zod.dev)
- [JSON Schema Specification](https://json-schema.org)
- [Progressive Web APIs](https://web.dev/progressive-web-apps/)

## Files in This Pattern

- `SchemaExchangeDemo.tsx` - Main demo component
- `SchemaHUD.tsx` - Schema visualization panel
- `PayloadViewer.tsx` - JSON payload display with errors
- `ValidationBadge.tsx` - Status indicator
- `ErrorHighlighter.tsx` - Error list with suggestions
- `schema.ts` - Zod schema definitions
- `types.ts` - TypeScript interfaces
- `fixtures.ts` - Mock payloads (valid/invalid)
- `mockStream.ts` - Stream generator
- `hooks.ts` - React hooks for validation
- `*.module.css` - Component styles
- `*.test.tsx` - Component and integration tests

## Running the Demo

```bash
npm run dev
# Navigate to http://localhost:5173/patterns/schema-governed-exchange

# Run tests
npm test schema-governed-exchange
```

## Try It Yourself

1. **Select "Multiple Errors" scenario** → See validation errors appear in real-time
2. **Hover over an error** → Field highlights in Schema HUD
3. **Check auto-suggestions** → See fixes for common errors
4. **Open Network Inspector** → View `schema`, `payload`, and `schema_error` events
5. **Change speed to "Slow"** → Watch progressive validation step-by-step

---

**Last Updated**: 2025-11-29
**Pattern Status**: ✅ Complete
**Test Coverage**: >80%
