# Streaming Validation Loop

## Pattern Overview

The **Streaming Validation Loop** pattern demonstrates checkpoint-based validation where the stream pauses at critical decision points, waits for user approval or edits, and resumes with validated values. This pattern is essential for building human-in-the-loop systems, approval workflows, and compliance checks.

## Intent

Enable users to review and approve AI-generated content at critical checkpoints before the system proceeds. The pattern creates natural pause points in a streaming flow where human judgment can validate, modify, or reject proposed actions.

## Mindset Shift

**Traditional approach**: AI generates a complete plan, presents it for approval, regenerates if rejected (all-or-nothing).

**Streaming Validation Loop**: AI pauses at each critical decision point, allowing incremental approval and edits while maintaining context and flow.

### Key Benefits
- **Progressive disclosure**: Users see decisions as they're made, not all at once
- **Context preservation**: Approved values carry forward to subsequent decisions
- **Efficiency**: No need to regenerate entire plans for minor edits
- **Transparency**: Clear audit trail of what was approved vs. edited vs. skipped
- **User control**: Users can intervene at any point without disrupting the entire flow

## Demo Scenario

**StreamFlow PM: Q1 Budget Allocation**

The AI allocates Q1 budget across engineering teams (Frontend, Backend, Mobile, Platform). At each team's allocation, the stream pauses and presents a checkpoint card with:

- **Proposed budget**: Amount recommended by AI
- **Headcount breakdown**: FTEs and contractors
- **Rationale**: Why this allocation makes sense
- **Actions**: Approve, Edit, or Skip

Users can:
1. **Approve**: Accept the proposed allocation as-is
2. **Edit**: Modify budget, headcount, or contractors
3. **Skip**: Reject this allocation (team gets $0)

If no action is taken within 30 seconds, the checkpoint auto-approves.

## UX Flow

```
1. Stream budget analysis for Team A
   └─> Display analysis text

2. Reach checkpoint (pause stream)
   └─> Show checkpoint card with proposal
   └─> Start countdown timer (30s)
   └─> Wait for user action

3. User approves/edits/skips OR timeout
   └─> Emit checkpoint_response event
   └─> Emit checkpoint_resume event with approved value
   └─> Continue streaming

4. Repeat for Team B, C, D...

5. Emit final plan with all approved allocations
   └─> Show complete budget breakdown
   └─> Display timeline of all checkpoints
```

## Stream Contract

### Checkpoint Event (Pause Stream)

```typescript
{
  type: 'checkpoint',
  data: {
    checkpointId: 'checkpoint-frontend',
    phase: 'waiting_for_approval',
    question: 'Approve $250,000 allocation to Frontend team?',
    proposedValue: {
      team: 'Frontend',
      budget: 250000,
      headcount: 4,
      contractors: 1,
      rationale: 'Frontend team needs additional headcount for dashboard redesign.'
    },
    actions: ['approve', 'edit', 'skip'],
    timeoutMs: 30000
  },
  timestamp: 1699545600000
}
```

### Checkpoint Response Event (User Action)

```typescript
{
  type: 'checkpoint_response',
  data: {
    checkpointId: 'checkpoint-frontend',
    action: 'edit',
    editedValue: {
      team: 'Frontend',
      budget: 275000,  // User increased budget
      headcount: 4,
      contractors: 1,
      rationale: 'Frontend team needs additional headcount for dashboard redesign.'
    }
  },
  timestamp: 1699545610000
}
```

### Checkpoint Resume Event (Stream Continues)

```typescript
{
  type: 'checkpoint_resume',
  data: {
    checkpointId: 'checkpoint-frontend',
    approvedValue: {
      team: 'Frontend',
      budget: 275000,  // Approved value (edited)
      headcount: 4,
      contractors: 1,
      rationale: 'Frontend team needs additional headcount for dashboard redesign.'
    },
    phase: 'resuming'
  },
  timestamp: 1699545611000
}
```

### Budget Analysis Event (Before Checkpoint)

```typescript
{
  type: 'budget_analysis',
  data: {
    team: 'Frontend',
    analysis: `Analyzing Frontend team budget requirements...

Current team: 3 FTEs, 0 contractors
Planned initiatives: Dashboard redesign, streaming UX library
Recommended allocation: $250,000`
  },
  timestamp: 1699545595000
}
```

### Final Plan Event (All Checkpoints Resolved)

```typescript
{
  type: 'final_plan',
  data: {
    allocations: [
      { team: 'Frontend', budget: 275000, headcount: 4, contractors: 1, rationale: '...' },
      { team: 'Backend', budget: 300000, headcount: 5, contractors: 0, rationale: '...' },
      // ... more teams
    ],
    totalBudget: 1125000,
    summary: 'Q1 Budget Allocation Plan - Approved\n\nTotal Budget: $1,125,000\n...'
  },
  timestamp: 1699545700000
}
```

## UI Techniques

### 1. Checkpoint Card

The checkpoint card is the primary UI element for user interaction:

**Visual Design**:
- **Progress bar**: Shows time remaining until auto-approval
- **Question**: Clear prompt for the user
- **Proposed values**: Display all relevant data
- **Action buttons**: Approve (green), Edit (blue), Skip (gray)
- **Keyboard shortcuts**: Enter = approve, E = edit, Esc = skip

**Behavior**:
- Slides in with animation when checkpoint is reached
- Blocks other interactions while active (modal-like)
- Countdown timer updates every second
- Auto-approves when timer expires

**Code Example**:
```tsx
<CheckpointCard
  checkpoint={activeCheckpoint}
  onApprove={() => actions.approve(activeCheckpoint.id)}
  onEdit={(editedValue) => actions.edit(activeCheckpoint.id, editedValue)}
  onSkip={() => actions.skip(activeCheckpoint.id)}
  remainingTimeMs={remainingTimeMs}
/>
```

### 2. Timeline Visualization

The timeline provides a retrospective view of all checkpoints:

**Features**:
- **Chronological list**: Shows checkpoints in order
- **Action badges**: Color-coded by action type (approve/edit/skip)
- **Duration tracking**: Shows how long each checkpoint took
- **Budget comparison**: Displays proposed vs. approved values
- **Edit indicators**: Highlights edited checkpoints
- **Timeout badges**: Marks auto-approved checkpoints

**Benefits**:
- Audit trail for compliance
- Helps users understand decision flow
- Educational value (shows where edits occurred)

### 3. Edit Mode

Inline editing allows users to modify proposals without leaving the checkpoint flow:

**UX Pattern**:
1. User clicks "Edit" button
2. Checkpoint card transforms to edit form
3. User modifies budget, headcount, or contractors
4. User clicks "Submit Changes"
5. Stream resumes with edited values

**Validation**:
- Enforce min/max constraints
- Show error messages for invalid inputs
- Prevent submission until valid

### 4. Timeout Handling

**Visual Countdown**:
- Progress bar shrinks as time passes
- Color transitions: green → yellow → red
- Text updates: "Auto-approve in 15s"

**Timeout Behavior**:
- Default action: Auto-approve
- Can be configured per checkpoint
- Server-side timeout enforcement (prevent indefinite waiting)

## Server Notes

### When to Emit Checkpoints

**Critical Decision Points**:
- Financial allocations or approvals
- Data modifications with compliance implications
- Actions with irreversible consequences
- User-specific preferences or choices

**Bad Checkpoint Locations**:
- Every single decision (checkpoint fatigue)
- Non-critical cosmetic choices
- Decisions that can be easily undone

### Handling Edits

When a user edits a value:

1. **Validate edited value** (server-side)
2. **Cascade changes** to dependent values
3. **Re-calculate downstream** allocations if needed
4. **Emit checkpoint_resume** with validated value

**Example**: If user increases Frontend budget, ensure total doesn't exceed limit.

### Timeout Strategy

**Server Configuration**:
```typescript
{
  checkpointTimeout: 30000,  // 30 seconds
  timeoutAction: 'approve',  // or 'skip', 'reject'
  maxCheckpoints: 10,        // Prevent infinite loops
  allowEdits: true           // Enable/disable editing
}
```

**Server-Side Enforcement**:
- Start timer when checkpoint is emitted
- If no response within `checkpointTimeout`, apply `timeoutAction`
- Emit `checkpoint_resume` event automatically
- Log timeout for audit trail

### State Management

**Server Tracks**:
- All active checkpoints
- User responses (approve/edit/skip)
- Approved values (for cascading to next decisions)
- Timeline history (for audit trail)

**Database Schema**:
```sql
CREATE TABLE checkpoints (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  phase VARCHAR NOT NULL,  -- waiting_for_approval, resuming, timed_out
  proposed_value JSON NOT NULL,
  approved_value JSON,
  action VARCHAR,  -- approve, edit, skip
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

## Instrumentation

### Metrics to Track

**Checkpoint Metrics**:
- `checkpoint_presented_count`: Number of checkpoints shown
- `checkpoint_approved_count`: Number of approvals
- `checkpoint_edited_count`: Number of edits
- `checkpoint_skipped_count`: Number of skips
- `checkpoint_timed_out_count`: Number of timeouts

**Duration Metrics**:
- `checkpoint_duration_ms`: Time from presentation to resolution
- `checkpoint_edit_time_ms`: Time spent in edit mode
- `total_approval_flow_duration_ms`: End-to-end time

**Edit Metrics**:
- `budget_edit_delta`: Average change in edited budgets
- `edit_frequency_by_team`: Which teams get edited most

### Analytics Events

```typescript
// Checkpoint presented
{
  event: 'checkpoint_presented',
  checkpointId: 'checkpoint-frontend',
  team: 'Frontend',
  proposedBudget: 250000,
  timestamp: 1699545600000
}

// User action
{
  event: 'checkpoint_action',
  checkpointId: 'checkpoint-frontend',
  action: 'edit',
  originalValue: 250000,
  editedValue: 275000,
  delta: 25000,
  durationMs: 12500,
  timestamp: 1699545612500
}

// Timeout
{
  event: 'checkpoint_timeout',
  checkpointId: 'checkpoint-backend',
  team: 'Backend',
  defaultAction: 'approve',
  timestamp: 1699545640000
}
```

### Error Scenarios

**Handle These Errors**:
- User closes browser during approval (auto-approve on server timeout)
- Network disconnection (retry mechanism)
- Invalid edited values (server-side validation)
- Checkpoint ID mismatch (log and reject)
- Concurrent edits (last-write-wins or optimistic locking)

## Implementation Guide

### 1. Core Hook: `useValidationStream`

```typescript
const {
  activeCheckpoint,      // Currently waiting checkpoint
  allocations,           // Approved allocations so far
  timeline,              // History of all checkpoints
  isWaitingForApproval,  // Is stream paused?
  actions                // approve(), edit(), skip(), reset()
} = useValidationStream({ speed: 'normal' });
```

### 2. Pause/Resume Mechanism

The stream uses **async generators** with **promise-based pausing**:

```typescript
// In mockStream.ts
export async function* createValidationStream(options) {
  for (const event of fixture) {
    yield event;

    if (event.type === 'checkpoint') {
      // PAUSE: Create promise and wait for user response
      const response = await options.onCheckpointResponse(event.data.checkpointId);

      // User responded - resume stream
      yield { type: 'checkpoint_response', data: response };
      yield { type: 'checkpoint_resume', data: { approvedValue: response.value } };
    }
  }
}
```

**Key Insight**: The `await` keyword naturally pauses the generator until the promise resolves. User actions resolve the promise, allowing the stream to continue.

### 3. Checkpoint State Lifecycle

```
DRAFTING → WAITING_FOR_APPROVAL → RESUMING → (next checkpoint)
   ↓              ↓                    ↓
Stream      User Action         Stream Continues
Emits       Resolves Promise    With Approved Value
Checkpoint
```

### 4. Testing Checkpoints

```typescript
// Auto-approve for fast tests
const stream = createAutoApproveValidationStream('fast', 100);

// Simulate specific actions
const stream = createValidationStream({
  speed: 'fast',
  onCheckpointResponse: async (id) => {
    if (id === 'checkpoint-frontend') {
      return { action: 'edit', editedValue: { budget: 275000 } };
    }
    return { action: 'approve' };
  }
});
```

## Accessibility

### Keyboard Navigation
- **Enter**: Approve current checkpoint
- **E**: Enter edit mode
- **Esc**: Skip checkpoint
- **Tab**: Navigate between form fields (in edit mode)

### Screen Reader Support
- Checkpoint card has `role="dialog"`
- Countdown timer has `aria-live="polite"`
- Action buttons have descriptive `aria-label`
- Timeline has `role="region"`

### Visual Indicators
- High-contrast action buttons
- Color + text for status (not color alone)
- Clear focus states for keyboard nav
- Large touch targets (44x44px minimum)

## When to Use This Pattern

**Good Fit**:
- Budget approvals or financial decisions
- Compliance workflows (legal, HR, security)
- Multi-step wizards with critical choices
- Data import with validation checkpoints
- AI-generated content that requires review

**Bad Fit**:
- Real-time chat (too disruptive)
- Rapid micro-interactions (checkbox fatigue)
- Fully automated flows (no human needed)
- Read-only content (no decisions to make)

## Variations

### 1. Conditional Checkpoints

Only pause for high-risk decisions:

```typescript
if (proposedBudget > THRESHOLD) {
  yield { type: 'checkpoint', ... };
} else {
  // Auto-approve small budgets
  yield { type: 'checkpoint_resume', data: { approvedValue } };
}
```

### 2. Multi-User Approvals

Require multiple approvals:

```typescript
{
  type: 'checkpoint',
  data: {
    approversRequired: 2,
    approversCompleted: ['alice@company.com'],
    pendingApprovers: ['bob@company.com']
  }
}
```

### 3. Rollback Support

Allow users to undo previous approvals:

```typescript
actions.rollback('checkpoint-frontend');
// Stream reverts to that checkpoint and re-presents it
```

## Related Patterns

- **Agent-Await-Prompt**: Similar pause/resume, but for user input rather than approval
- **Multi-Turn Memory Timeline**: Shows conversation history, this shows approval history
- **Turn-Taking Co-Creation**: Alternating control, this is gated approval

## Files

- `ValidationLoopDemo.tsx` - Main demo component
- `CheckpointCard.tsx` - Approval UI component
- `Timeline.tsx` - Retrospective timeline view
- `hooks.ts` - `useValidationStream` hook
- `mockStream.ts` - Mock stream generator with checkpoint logic
- `fixtures.ts` - Budget allocation demo data
- `types.ts` - TypeScript interfaces
- `ValidationLoopDemo.test.tsx` - Comprehensive tests

## Running the Demo

```bash
npm run dev
# Navigate to /patterns/streaming-validation-loop
```

## Testing

```bash
npm test src/patterns/streaming-validation-loop
```

## References

- [MDN: Async Generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*)
- [React Hook Design Patterns](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [WCAG 2.1: Dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

**Educational Value**: This pattern teaches checkpoint-based validation, promise-driven pause/resume, timeout handling, and audit trail generation. It's a practical pattern for real-world approval workflows.
