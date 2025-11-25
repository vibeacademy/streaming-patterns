# Agent-Await-Prompt Pattern

## Intent

Teach developers how to implement pause/resume mechanics in streaming AI interactions, where the AI can pause mid-stream to request missing information from the user, then continue seamlessly once the input is provided.

## Pattern Overview

The Agent-Await-Prompt pattern demonstrates a more complex streaming paradigm than simple request-response flows. Instead of streaming continuously from start to finish, the AI can:

1. **Detect missing information** during task execution
2. **Pause the stream** to request specific input
3. **Wait for user response** with timeout fallback
4. **Resume streaming** from the same point once input is received
5. **Continue with defaults** if the user doesn't respond in time

This pattern is essential for:
- Interactive task wizards (project setup, configuration)
- Progressive form filling (collecting data as needed)
- Conversational workflows (chatbots, assistants)
- Adaptive UIs that respond to missing context

## UX Flow

### Successful Input Submission

```
1. User initiates task
   "Set up a new project in StreamFlow PM"

2. AI begins streaming
   "I'll help you set up a new project. Let me check what information we have..."

3. AI detects missing information
   Stream pauses, inline input fields appear

4. User fills out required fields
   - Project Name: "Mobile App Redesign"
   - Team Size: 5
   - Deadline: 2025-12-31

5. User submits input
   Input fields disappear, stream resumes

6. AI acknowledges and continues
   "Great! Creating your project with these details..."

7. Task completes
   "Your project is ready!"
```

### Timeout Fallback

```
1. User initiates task

2. AI begins streaming and pauses for input

3. Timer counts down (60s, 59s, 58s...)

4. User doesn't respond

5. Timeout expires
   "I didn't receive additional details, so I'll continue with default settings."

6. AI continues with fallback behavior
   "Creating project with standard configuration..."
```

## Stream Contract

### Event Types

#### `text` - Streaming text content

```typescript
{
  type: 'text',
  data: {
    text: 'Let me help you set up a new project. ',
    isComplete: false
  }
}
```

#### `await_input` - Request user input (pause stream)

```typescript
{
  type: 'await_input',
  data: {
    message: 'I need some information to continue setting up your project.',
    fields: [
      {
        name: 'projectName',
        type: 'text',
        label: 'Project Name',
        required: true,
        placeholder: 'e.g., Mobile App Redesign',
        helpText: 'A descriptive name for your project'
      },
      {
        name: 'budget',
        type: 'number',
        label: 'Budget (USD)',
        required: false,
        helpText: 'Optional: Total budget allocated'
      }
    ],
    timeoutMs: 60000
  }
}
```

#### `input_submission` - User submits input (client-generated)

```typescript
{
  type: 'input_submission',
  data: {
    projectName: 'Mobile App Redesign',
    budget: 50000,
    deadline: Date('2025-12-31'),
    teamSize: 5
  }
}
```

#### `resume` - Stream resumes after input

```typescript
{
  type: 'resume',
  data: {
    message: 'Great! I have all the information I need.',
    receivedFields: ['projectName', 'budget', 'deadline', 'teamSize']
  }
}
```

#### `timeout` - Timeout expired, continuing with fallback

```typescript
{
  type: 'timeout',
  data: {
    message: 'No response received. Continuing with default settings...',
    expiredFields: ['budget', 'deadline']
  }
}
```

## State Machine

```
┌──────────────────────────────────────────────────────────┐
│                      Stream Lifecycle                     │
└──────────────────────────────────────────────────────────┘

    idle
     │
     │ (prompt provided)
     ▼
  streaming ──────────────┐
     │                    │
     │ (text events)      │
     │                    │
     │ (await_input)      │ (text complete)
     ▼                    │
awaiting_input             │
     │                    │
     │ (timeout)          │
     ├────────────────────┤
     │                    │
     │ (input submit)     │
     ▼                    │
  resuming ───────────────┘
     │
     │ (resume event)
     ▼
  streaming
     │
     │ (all events done)
     ▼
  completed
```

## Implementation

### File Structure

```
src/patterns/agent-await-prompt/
├── AgentAwaitPromptDemo.tsx       # Main demo component
├── AgentAwaitPromptDemo.module.css # Demo styles
├── AgentAwaitPromptDemo.test.tsx   # Integration tests
├── InlineInputFields.tsx           # Input UI component
├── InlineInputFields.module.css    # Input field styles
├── hooks.ts                        # useAwaitPromptStream hook
├── hooks.test.ts                   # Hook tests
├── types.ts                        # TypeScript interfaces
├── fixtures.ts                     # Mock data scenarios
├── mockStream.ts                   # Stream generator
└── README.md                       # This file
```

### Core Hook: `useAwaitPromptStream`

```typescript
const {
  text,              // Accumulated text content
  streamState,       // idle | streaming | awaiting_input | resuming | completed | error
  inputFields,       // Fields to display (when awaiting_input)
  inputMessage,      // Message explaining why input is needed
  submitInput,       // Function to submit user input
  timeoutRemaining,  // Milliseconds until timeout
  error,             // Error object if stream fails
  isActive           // True if stream is active (streaming/awaiting/resuming)
} = useAwaitPromptStream('Set up a project', {
  speed: 'normal',
  defaultTimeoutMs: 60000,
  resumeOnTimeout: true,
  onEvent: (event) => { /* capture for network inspector */ }
});
```

### Stream Controller Pattern

The pause/resume mechanism uses a `StreamController` class:

```typescript
class StreamController {
  // Pause the stream and wait for input
  async waitForInput(timeoutMs: number): Promise<InputData> {
    // Returns a promise that external code can resolve
  }

  // Resume the stream by resolving the waiting promise
  submitInput(data: InputData): void {
    // Resolves the promise, allowing stream to continue
  }
}
```

The async generator stream awaits on this controller:

```typescript
async function* createMockAwaitPromptStream(config, controller) {
  // ... stream text events ...

  // Pause when await_input event is encountered
  yield awaitInputEvent;

  // Wait for external input submission
  const inputData = await controller.waitForInput(timeoutMs);

  // Resume streaming
  yield resumeEvent;

  // ... continue with remaining events ...
}
```

## UI Techniques

### 1. Inline Input Fields

Fields appear **embedded in the conversation** rather than in modals or separate forms:

```tsx
<div className="message-bubble">
  <p>{text}</p>

  {streamState === 'awaiting_input' && (
    <InlineInputFields
      fields={inputFields}
      message={inputMessage}
      onSubmit={submitInput}
      timeoutRemaining={timeoutRemaining}
    />
  )}
</div>
```

### 2. Visual Input States

- **Listening Animation**: Pulsing dots show the AI is paused and waiting
- **Required vs. Optional**: Asterisks and labels differentiate field importance
- **Timeout Countdown**: Timer creates urgency and sets expectations
- **Validation Feedback**: Inline errors prevent invalid submissions

### 3. Stream State Indicators

```tsx
<StateBadge state={streamState}>
  {/* streaming: pulsing blue badge */}
  {/* awaiting_input: yellow badge with clock icon */}
  {/* resuming: green badge */}
</StateBadge>
```

## Educational Notes

### Why This Pattern Matters

1. **Better UX than Full-Page Forms**
   - Maintains conversation context
   - Feels more natural and less jarring
   - Reduces perceived complexity

2. **Flexible Information Gathering**
   - Only ask for what's needed
   - Can request multiple rounds of input
   - Adapt based on user's previous answers

3. **Graceful Degradation**
   - Timeout handling prevents infinite waits
   - Fallback behavior keeps the flow moving
   - User can always skip optional fields

### Technical Challenges Solved

1. **Async Generator Pause/Resume**
   - Generators naturally support pausing (`yield`)
   - External control via Promise-based controller
   - Cleanup on cancellation/timeout

2. **React State Synchronization**
   - Stream state (async) ↔ Component state (sync)
   - Custom hook bridges the gap
   - Proper cleanup prevents memory leaks

3. **Type Safety with Discriminated Unions**
   - `StreamEvent` union type for all events
   - TypeScript narrows types based on `event.type`
   - Exhaustiveness checking ensures all cases handled

### Common Pitfalls

1. **Memory Leaks**
   - Always cleanup on unmount
   - Cancel pending timeouts
   - Abort ongoing stream controllers

2. **Race Conditions**
   - User might submit input while timeout fires
   - Handle edge case: timeout wins if it fires first
   - Use refs for mounted state checks

3. **Validation Gaps**
   - Validate on both client and "server" (mock stream)
   - Required field enforcement before submission
   - Type-specific validation (email, URL, etc.)

## Running the Demo

```bash
# Start development server
npm run dev

# Navigate to the pattern
open http://localhost:5173/patterns/agent-await-prompt

# Run tests
npm test -- agent-await-prompt
```

## Demo Scenarios

### 1. Project Setup
Default scenario - AI sets up a new StreamFlow PM project, requests name, budget, deadline, and team size.

### 2. Sprint Planning
AI plans a sprint, pauses to request sprint duration, velocity target, and start date.

### 3. Timeout Fallback
Short timeout (5s for demo) - shows fallback behavior when user doesn't respond.

### 4. Multiple Inputs
Complex workflow requiring multiple pause/resume cycles.

## Further Reading

- **AsyncGenerators in JavaScript**: [MDN Async Iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)
- **React Custom Hooks**: [React Hooks Documentation](https://react.dev/learn/reusing-logic-with-custom-hooks)
- **Discriminated Unions in TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- **Form Validation Best Practices**: [Web.dev Forms Guide](https://web.dev/learn/forms/)

## License

MIT - Part of the Streaming Patterns educational library.
