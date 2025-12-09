# Agent Await Prompt: When AI Needs to Pause and Ask

## Prerequisites
- Understanding of async/await and Promises
- Familiarity with React hooks (useState, useEffect)
- Watched Episodes 1-2 (streaming basics, Chain of Reasoning)

## Mental Model Shifts
1. **Upfront Forms → Contextual Asking**: Gather information when it's needed, not before
2. **Continuous Stream → Pausable Stream**: Streams can wait for external input
3. **AI Guesses → AI Asks**: Better to pause than to assume incorrectly

---

## Hook (0:00 - 0:45)

[Visual: AI making wrong assumptions - "I've created your project with a budget of $50,000 and a team of 5 engineers."]
[Prompt: Dark chat interface with AI response bubble showing confident but wrong assumptions about budget and team size, red warning indicators appearing around the incorrect numbers, frustrating UX moment, 16:9]

(Audio) "I've created your project with a budget of $50,000 and a team of 5 engineers."

Wait—who said anything about $50,000? My budget is half that. And I only have 3 engineers.

[Visual: Same scenario but AI pauses mid-stream - form fields appear inline for Project Name, Budget, Team Size, Deadline]
[Video Prompt: Dark chat interface with streaming text that types out "I'll help set up your project..." then pauses mid-sentence, inline form slides up smoothly with four input fields labeled "Project Name", "Budget", "Team Size", "Deadline", countdown timer appears showing "60s", stream paused for input - THIS IS THE CORE PATTERN demonstrating how streams can pause for user input, essential visualization, 16:9]

(Audio) Now watch this. Same task, but when the AI realizes it's missing critical information—it stops. Right in the middle of streaming. And asks you.

[Visual: Title card - "Pattern 2: Agent Await Prompt" with episode number]
[Prompt: Dark gradient background with bold white text "Agent Await Prompt", subtitle "When AI Needs to Pause and Ask", pattern number "2/7" badge in corner, subtle pause icon effect, series branding style, 16:9]

(Audio) This is the Agent Await Prompt pattern. And it solves one of the most frustrating problems in AI UX: silent assumptions that lead to useless outputs.

---

## Connecting to Chain of Reasoning (0:45 - 1:30)

[Visual: Quick callback to Chain of Reasoning - beads appearing, then transition to new challenge]
[Prompt: Brief flash of Chain of Reasoning pattern with beads, then visual transition with question mark appearing mid-chain, chain pausing with "?" indicator, new challenge introduction, 16:9]

(Audio) In the last video, we learned how to show the AI's thinking process with Chain of Reasoning. We saw how streaming lets users watch decisions being made in real-time.

But what happens when the AI is *thinking* and realizes it's missing something crucial?

[Visual: Three options diagram - Ask Upfront (tedious), Guess (risky), Ask In Context (ideal)]
[Prompt: Dark background with three path options shown as cards, left card gray "Ask Upfront" with long form icon, middle card red "Guess" with dice icon, right card green "Ask In Context" with speech bubble icon highlighted as ideal, decision options comparison, 16:9]

(Audio) In a traditional system, it would either ask you upfront—before doing any work—or just guess and hope for the best.

Streaming gives us a third option: ask *in context*, right when the information is needed, without losing all the work done so far.

That's what Agent Await Prompt enables.

---

## The Demo (1:30 - 4:00)

[Visual: StreamFlow PM interface - Project Setup wizard with "Start Setup" button]
[Prompt: Dark project management interface showing project setup wizard view, prominent blue "Start Setup" button in center, empty project template visible, clean professional SaaS aesthetic, 16:9]

(Audio) Let's see this in action. We're back in StreamFlow PM, and this time the AI is helping us set up a new project.

[Visual: User clicks button, stream begins - text appears]
[Prompt: Cursor near "Start Setup" button, chat area showing text "I'll help you set up your new project. Let me start by configuring the basics...", streaming in progress indicator, 16:9]

(Audio) The stream begins: "I'll help you set up your new project. Let me start by configuring the basics..."

[Visual: Stream pauses mid-sentence, form fields slide in with labels and a 60-second countdown timer]
[Prompt: Streaming text stopped with visible pause indicator, inline form visible with four labeled input fields, countdown timer badge showing "60" seconds, smooth interruption state, 16:9]

(Audio) Now watch. The AI realizes it needs specific information.

"Before I continue, I need some details:"
- Project name
- Budget
- Team size
- Deadline

[Visual: Close-up on countdown timer]
[Prompt: Close-up view of countdown timer badge, numbers showing around 57 seconds, subtle pulse animation suggested, urgency without anxiety, timer detail, 16:9]

(Audio) Notice a few things. There's a countdown timer—60 seconds. This creates gentle urgency. The AI isn't going to wait forever.

[Visual: Form fields are inline with the conversation, not a separate modal or page]
[Prompt: Wide view of chat interface showing form fields appearing directly in the conversation flow, no modal overlay, context preserved with previous messages visible above, inline form integration, 16:9]

(Audio) The fields are inline, right where the conversation is happening. I'm not redirected to some settings page. The context is preserved.

[Visual: User fills in the form fields - typing values]
[Prompt: Form fields showing entered values - "Mobile Redesign", "150000", "8", "March 15", each field filled, form completion state, 16:9]

(Audio) Let me fill these in... Project name: "Mobile Redesign". Budget: $150,000. Team size: 8. Deadline: March 15th.

[Visual: User clicks Submit button, stream resumes with acknowledgment]
[Prompt: Submit button highlighted, form sliding away, stream resuming with new text "Thanks! I've noted that the Mobile Redesign project has a budget of $150,000 with 8 team members...", smooth transition from input to continuation, 16:9]

(Audio) And now watch what happens.

"Thanks! I've noted that the Mobile Redesign project has a budget of $150,000 with 8 team members and a March 15th deadline. Now let me continue setting up your workspace..."

The stream picked up exactly where it left off. The AI acknowledged my input and incorporated it into its work.

[Visual: Network Inspector showing event sequence]
[Prompt: Network Inspector panel showing event list with sequence - blue "text" events, then orange "await_input" event highlighted, then green "input_submission" event, then blue "resume" event, event flow visualization, 16:9]

(Audio) If we look at the Network Inspector, you can see the exact sequence: streaming text, an "await_input" event that paused everything, then my submission, then a "resume" event that continued the stream.

---

## The Psychology of In-Context Asking (4:00 - 5:30)

[Visual: Long overwhelming form with many fields - user looking frustrated before even starting]
[Prompt: Dark interface showing overwhelming multi-step form with 10+ fields visible, progress bar at top showing "Step 1 of 4", user frustration icon in corner, form fatigue visualization, 16:9]

(Audio) Why does this feel so much better than just asking everything upfront?

Think about filling out a long form before you can even use a product. Name, email, company size, use case, how you heard about us, preferred contact method...

By question five, you're already annoyed. You don't even know if this product will be useful yet, and you're doing homework.

[Visual: Contrast - conversation that just starts, with occasional inline questions appearing naturally]
[Prompt: Dark chat interface showing conversation already in progress with helpful content, small inline question visible contextually mid-flow, natural conversation feel, progressive disclosure contrast, 16:9]

(Audio) Now compare that to a conversation that just *starts*. The AI begins helping you. And only when it genuinely needs something does it pause and ask—in the context of work that's already happening.

[Visual: Side-by-side comparison - "Form Fatigue" on left vs "Progressive Disclosure" on right]
[Prompt: Split screen dark background, left side shows grayed out overwhelming form labeled "Form Fatigue" with exhausted emoji, right side shows natural conversation flow labeled "Progressive Disclosure" with engaged emoji, green highlighting on right side, UX comparison, 16:9]

(Audio) This is called **progressive disclosure**. Instead of demanding everything upfront, you reveal complexity gradually, only when it's relevant.

[Paradigm Shift]

(Audio) And streaming makes this possible in a way that wasn't practical before. The AI can do some work, realize it's stuck, pause, get what it needs, and continue—all in one fluid experience.

---

## Under the Hood (5:30 - 8:00)

[Visual: Conceptual diagram of StreamController as a traffic light - green (flowing), yellow (pausing), red (waiting)]
[Prompt: Dark background with traffic light metaphor, stream represented as flowing particles, three states shown - green light with flowing particles, yellow with slowing, red with stopped particles, "StreamController" label, pause/resume mechanism, 16:9]

(Audio) Let's look at how this works technically. The key insight is that we're using JavaScript Promises to pause and resume an async generator.

First, we have something called a StreamController. Think of it as a traffic light for our stream.

[Visual: StreamController class code showing waitForUserResponse and submitResponse methods]
[Prompt: Dark code editor showing StreamController class definition, two methods visible - waitForUserResponse creating a Promise, submitResponse resolving the Promise, key mechanism code with syntax highlighting, 16:9]

(Audio) The stream calls `waitForUserResponse`, which creates a Promise that just... waits. It doesn't resolve until either the user submits a response, or the timeout expires.

```typescript
class StreamController {
  private resolveWait: (() => void) | null = null;

  async waitForUserResponse(timeoutMs: number) {
    return new Promise((resolve) => {
      this.resolveWait = resolve;
      setTimeout(() => resolve({ timeout: true }), timeoutMs);
    });
  }

  submitResponse(data: unknown) {
    this.resolveWait?.(data);
  }
}
```

[Visual: Mock stream generator code using controller]
[Prompt: Dark code editor showing async generator function, yield statement for await_input event, then await controller.waitForUserResponse call highlighted, then yield statement for resume event, pause point in stream code, 16:9]

(Audio) Now in our stream generator:

```typescript
async function* createAwaitPromptStream(controller) {
  yield { type: 'text', data: { text: 'Setting up your project...' } };

  // PAUSE: Emit await_input and wait
  yield { type: 'await_input', data: { fields: [...] } };
  const userInput = await controller.waitForUserResponse(60000);

  // RESUME: Continue with the user's data
  yield { type: 'resume', data: { received: userInput } };
  yield { type: 'text', data: { text: 'Great! Continuing...' } };
}
```

[Visual: Highlight on "await controller.waitForUserResponse()" line with annotation]
[Video Prompt: Code editor with await controller.waitForUserResponse line glowing and pulsing, annotation box draws in with text "Stream pauses here" with arrow pointing to the line, small hourglass icon appears, visual emphasis on the pause mechanism - THIS IS THE KEY TECHNICAL INSIGHT that enables the pattern, essential to highlight, 16:9]

(Audio) See that `await controller.waitForUserResponse()`? That's where the magic happens. The generator is literally paused, waiting on that Promise.

Meanwhile, in the UI, the user sees the form. When they click Submit, we call `controller.submitResponse(data)`, which resolves the Promise, and the generator continues from exactly where it stopped.

[Visual: State machine diagram showing: idle → streaming → awaiting_input → resuming → completed]
[Prompt: Dark background with state machine circles connected by arrows, states labeled - "idle", "streaming", "awaiting_input" (highlighted), "resuming", "completed", state progression visualization, 16:9]

(Audio) The whole thing flows through a state machine:
- `idle` → User hasn't started yet
- `streaming` → Data is flowing
- `awaiting_input` → Paused, waiting for user
- `resuming` → User submitted, stream restarting
- `completed` → Done

This state machine is your source of truth. The UI just reacts to whatever state you're in.

---

## **[CTA INSERTION POINT]** (8:00 - 8:15)

[Visual: Course preview showing hands-on implementation of pause/resume patterns]
[Prompt: Collage showing course content - code editor with StreamController visible, state machine diagram, timeout handling demo, "Handle the Edge Cases" text overlay, professional course aesthetic, 16:9]

(Audio) If you want to implement this pattern in your own projects—handling edge cases like timeouts, validation, and error recovery...

**[INSERT 15-30 SECOND CTA HERE]**

(Audio) Let me show you some variations of this pattern and when each makes sense...

---

## Variations and Trade-offs (8:15 - 9:30)

[Visual: Timeout behavior options - four cards showing Auto-Approve, Cancel, Extend, Leave Pending]
[Prompt: Dark background with four option cards in a row, each showing different timeout behavior - "Auto-Approve" with checkmark, "Cancel" with X, "Extend Timer" with clock+, "Leave Pending" with pause icon, timeout strategy options, 16:9]

(Audio) The Agent Await Prompt pattern has a few interesting variations.

**Timeout behavior**: What happens when the timer runs out?
- You could auto-approve with default values
- You could cancel the whole operation
- You could extend the timer
- You could leave the question pending

Different products make different choices here. For low-stakes decisions, auto-approve with defaults is fine. For high-stakes decisions, you probably want to cancel and let the user restart.

[Visual: Multiple pauses diagram - stream with two or three pause points marked]
[Prompt: Dark background with horizontal stream flow diagram, multiple pause points marked with form icons at different positions along the stream, "Multiple Pauses OK" label, multi-pause possibility, 16:9]

(Audio) **Multiple pauses**: Can the stream pause more than once?

Absolutely. Some workflows might need three or four pieces of information at different points. Just be careful not to make it feel like an interrogation. If you're pausing more than twice, consider whether some of that could be asked upfront.

[Visual: Validation error appearing on form field without resuming stream]
[Prompt: Inline form visible with fields, one field showing red error message "Must be a positive number" below it, form shakes slightly indicated, Submit button disabled, validation before resume, 16:9]

(Audio) **Validation**: What if the user enters something invalid?

You can validate on submission and show an error without resuming the stream. The pause continues until valid input is received.

---

## Connecting to the Series (9:30 - 10:15)

[Visual: Pause/resume mechanism diagram with arrows pointing to future patterns]
[Prompt: Central diagram showing pause/resume mechanism, arrows extending outward to future pattern cards, "Streaming Validation Loop" card glows indicating shared mechanism, "Same Core Technique" label, pattern relationship, 16:9]

(Audio) This "pause and resume" technique we just learned is going to come back in a big way later in the series.

The Streaming Validation Loop pattern—which we'll cover soon—uses the same core mechanism, but for a different purpose: pausing at checkpoints where the user needs to approve something before the AI continues.

[Visual: Preview of Tabular Stream View - table with rows appearing progressively]
[Prompt: Preview of table interface, column headers visible, data rows partially filled, skeleton rows showing at bottom, progress indicator showing "5 of 12 rows", data streaming into table, 16:9]

(Audio) But first, in the next video, we're going to tackle a different challenge entirely: what about streaming structured data?

Not just text appearing word by word, but tables where rows populate progressively. Where you can sort and filter the data *before it's even finished loading*.

That's the **Tabular Stream View** pattern.

---

## Outro (10:15 - 10:45)

[Visual: Demo montage - form appearing, countdown timer, user submitting, stream resuming]
[Prompt: Four-panel static montage, panel 1 shows form sliding in mid-stream, panel 2 shows countdown timer, panel 3 shows user clicking Submit, panel 4 shows stream resuming with new content, pattern key moments, 16:9]

(Audio) That's Agent Await Prompt. The pattern that lets AI pause mid-stream to ask for what it needs.

[Visual: Key takeaways card - four bullet points with icons]
[Prompt: Dark card with "Key Takeaways" heading, four items with small icons: promise icon + "Use Promises to pause generators", form icon + "Show inputs inline preserving context", timer icon + "Add timeout for urgency", state icon + "Track state with state machine", takeaway summary card style, 16:9]

(Audio) Key takeaways:
- Use Promises to pause and resume async generators
- Show input forms inline, preserving context
- Add timeout timers to prevent indefinite blocking
- Track state with a clear state machine

No more silent assumptions. No more wasted work on bad guesses.

[Visual: GitHub link and subscribe CTA overlay with next episode teaser]
[Prompt: Dark overlay with GitHub repo card on left, subscribe button on right, "Code in Description" text, "Next: Tabular Stream View" teaser at bottom, clean end screen style, 16:9]

(Audio) Code is in the description. See you in the next one, where we stream tables row by row.

---

## Thumbnail Concept

[Visual: AI chat bubble with a question mark and form fields appearing mid-stream, text "AI ASKS BACK"]
[Prompt: YouTube thumbnail 1280x720, dark chat interface with AI bubble containing question mark, inline form fields glowing below the bubble, countdown timer badge visible, bold text "AI ASKS BACK" at bottom, orange and blue color scheme, high contrast clickable style]

---

## Production Notes

**Video Prompts Used (2 max):**
1. Stream pausing with inline form sliding in (core pattern visualization - thematically imperative)
2. Code highlighting the await pause point (key technical insight - thematically imperative)

**Key demo moments to capture:**
- Form sliding in mid-stream (smooth animation)
- Countdown timer ticking
- User filling in fields and submitting
- Stream seamlessly resuming

**Code sections to highlight:**
- StreamController class (brief)
- The await pattern in generator (emphasize the pause point)
- State machine states

**Paradigm shift moments:**
- Form fatigue vs. progressive disclosure comparison
- "Ask in context" as third option

**Continuity:**
- Reference Chain of Reasoning from previous video
- Foreshadow Streaming Validation Loop (same mechanism)
- Tease Tabular Stream View as next topic
- Consistent StreamFlow PM branding
