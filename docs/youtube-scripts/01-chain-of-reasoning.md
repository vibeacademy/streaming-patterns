# Chain of Reasoning: Making AI Thinking Visible

## Prerequisites
- Understanding of basic React components and hooks
- Familiarity with async/await syntax
- Watched Episode 1 (Why Streaming Matters)

## Mental Model Shifts
1. **Answer First → Reasoning First**: Show the journey, not just the destination
2. **Trust by Authority → Trust by Transparency**: Users believe what they can verify
3. **Single Output → Structured Stream**: Events have types, not just text

---

## Hook (0:00 - 0:45)

[Visual: AI chat showing a single-line answer with no explanation - "The answer is 42."]
[Prompt: Dark chat interface with minimal AI response bubble showing "The answer is 42." in white text, empty space around it suggesting incompleteness, question mark icon floating nearby, cold/sterile aesthetic, 16:9]

(Audio) "The answer is 42."

Thanks. Super helpful. How did you get there? Why should I trust this? What if you're wrong?

[Visual: Same question, but now with visible reasoning steps appearing as glowing beads in a vertical timeline]
[Video Prompt: Dark chat interface with vertical timeline appearing on left, glowing circular beads materialize one by one from top to bottom, each bead pulses as it appears with text labels fading in - "Analyzing requirements...", "Considering constraints...", "Evaluating trade-offs...", connecting lines draw between beads, final answer fades in below the chain - THIS IS THE CORE PATTERN being introduced, essential to show the streaming reasoning visualization, 16:9]

(Audio) Now look at this. Same question, same AI. But now you can see it thinking: "First, I'm analyzing the requirements... then I'm considering the constraints... here's where I'm making a trade-off..."

Suddenly, you're not just trusting a black box. You're evaluating a thought process.

[Visual: Title card - "Pattern 1: Chain of Reasoning" with episode number]
[Prompt: Dark gradient background with bold white text "Chain of Reasoning", subtitle "Making AI Thinking Visible", pattern number "1/7" badge in corner, subtle particle effects, series branding style, 16:9]

(Audio) This is the Chain of Reasoning pattern. And it's probably the most important pattern in this entire series—because it turns AI from something you blindly trust into something you can actually verify.

Let's break it down.

---

## Recap: The Streaming Mindset (0:45 - 1:30)

[Visual: Quick recap - data flowing continuously vs. discrete request/response]
[Prompt: Split screen dark background, left side shows discrete blocks with gaps between them labeled "Batch", right side shows continuous stream of particles flowing smoothly labeled "Stream", callback to Episode 1 visual style, 16:9]

(Audio) In the last video, we talked about how streaming fundamentally changes UI development. Data arrives continuously. Your UI is never really "done" until the stream closes.

Today's pattern—Chain of Reasoning—shows how to use streaming not just to show answers faster, but to show *how* the answer is being formed.

[Visual: StreamFlow PM logo and interface preview]
[Prompt: Dark interface showing StreamFlow PM product logo centered, dashboard preview with project cards visible in background, "Your Demo Context" label at bottom, consistent product branding, professional SaaS aesthetic, 16:9]

(Audio) Let me show you what this looks like in practice.

---

## The Demo (1:30 - 4:00)

[Visual: StreamFlow PM interface - Sprint Planning view with "Plan Sprint" button prominent]
[Prompt: Dark project management interface showing sprint planning view, prominent blue "Plan Sprint" button in center, backlog items visible in sidebar list, team capacity widget in corner, clean professional SaaS aesthetic, 16:9]

(Audio) This is StreamFlow PM—a fictional project management tool we're using throughout this series. The scenario: an AI assistant is planning a two-week sprint.

[Visual: User clicks button, first reasoning bead appears with confidence badge]
[Prompt: Sprint planning interface with vertical bead timeline on left, first circular bead visible with blue glow, text "Analyzing backlog priorities" beside it, confidence badge "90%" next to bead, cursor near the Plan Sprint button, 16:9]

(Audio) Watch what happens. The AI doesn't just spit out a sprint plan. First, we see its reasoning steps appearing one by one.

"Analyzing backlog priorities..." There's step one. It's looking at the 24 items in the backlog and figuring out what matters most.

[Visual: Second bead appears with different confidence, chain growing]
[Prompt: Timeline now showing two beads connected by line, second bead labeled "Estimating team capacity" with "85%" confidence badge in slightly cooler color, chain growing visualization, 16:9]

(Audio) "Estimating team capacity..." Step two. How many hours does the team actually have?

[Visual: Third bead with lower confidence - showing uncertainty]
[Prompt: Chain with three connected beads, third bead "Identifying dependencies" with "75%" badge in dimmer shade indicating lower confidence, visual gradient of confidence across beads, uncertainty becoming apparent, 16:9]

(Audio) "Identifying dependencies..." Step three. Which tasks block other tasks?

Each step shows a confidence level. This one is 90% confident. This one is only 75%—the AI is less sure about this conclusion.

[Visual: User clicks to expand one bead, revealing detailed reasoning text]
[Prompt: Middle bead expanded into larger card showing detailed reasoning paragraph, collapse arrow at top, expansion showing hidden depth of reasoning, 16:9]

(Audio) And if I click on any step, I can see the details. The actual reasoning that led to this conclusion.

[Visual: All reasoning complete, final answer section appearing below the bead timeline]
[Prompt: Complete chain of five beads at top, horizontal separator line, sprint plan content below with formatted task list showing assignments and story points, "Sprint Plan" heading visible, final output after reasoning, 16:9]

(Audio) Only after all the reasoning is complete do we see the final sprint plan. But now, when I read that plan, I understand *why* these items were prioritized. I can actually evaluate whether the AI made good decisions.

[Visual: Network Inspector panel showing stream of events]
[Prompt: Right side panel showing Network Inspector, event list with rows showing event type badges ("reasoning" in blue, "answer" in green), timestamps, and payload previews, debugging transparency visualization, 16:9]

(Audio) And here's something cool. This Network Inspector shows every event that flowed through the stream. You can see the exact moment each reasoning step arrived, the exact payload it contained.

This isn't just a UI trick—it's real transparency into how streaming AI systems work.

---

## Why This Pattern Matters (4:00 - 5:30)

[Visual: Three pillars - "Trust", "Intervention", "Learning" - each with icon]
[Prompt: Dark background, three vertical column cards, left column orange with eye icon and "Trust" label, middle column blue with stop-hand icon and "Intervention" label, right column green with brain icon and "Learning" label, benefit pillars visualization, 16:9]

(Audio) So why go through all this trouble? Why not just show the answer?

Three reasons.

[Visual: Trust pillar expanded - showing verification concept]
[Prompt: Trust pillar card expanded, user avatar icon with checkmarks next to reasoning steps, "Verify Before Believing" subtext, trust-building through transparency visualization, 16:9]

(Audio) **First: Trust.** When you can see how a conclusion was reached, you're not blindly trusting a black box. You can spot when the AI misunderstood the question. You can catch faulty reasoning before it becomes a faulty outcome.

[Visual: Intervention pillar expanded - showing stream interruption]
[Prompt: Intervention pillar expanded, reasoning chain with red stop icon breaking the flow mid-chain, "Correct Course Early" subtext, early intervention power visualization, 16:9]

(Audio) **Second: Early intervention.** In a streaming UI, users can stop the process mid-way. If you're watching the AI reason and you see it going in the wrong direction—maybe it's ignoring an important constraint—you can interrupt and redirect before it wastes time on a bad answer.

[Visual: Learning pillar expanded - showing prompt improvement]
[Prompt: Learning pillar expanded, split view showing original prompt transforming into improved prompt based on feedback, "Work Better Together" subtext, learning loop visualization, 16:9]

(Audio) **Third: Learning.** Users actually learn how to work with AI better when they can see its thought process. They start to understand what makes a good prompt, what context helps, what trips the AI up.

[Paradigm Shift]

[Visual: Comparison - Calculator (no work shown) vs. Financial Advisor (work shown)]
[Prompt: Split comparison on dark background, left side shows simple calculator display with just "= 42" result in cold gray, right side shows financial advisor desk with spreadsheet showing all calculations visible in warm tones, "Simple vs. Consequential" label at bottom, stakes comparison visual, 16:9]

(Audio) This isn't just a nice-to-have. This is the difference between an AI tool that people abandon after a week and one that becomes indispensable.

Think about it like this: a calculator doesn't need to show its work for "2 + 2". But a financial advisor explaining a retirement plan? You absolutely want to see the reasoning.

AI is powerful enough now that it's making decisions that matter. And decisions that matter deserve visible reasoning.

---

## Under the Hood (5:30 - 8:00)

[Visual: Code file structure - types.ts, mockStream.ts, hooks.ts, component.tsx]
[Prompt: Dark code editor sidebar showing file tree, chain-of-reasoning folder expanded, four files highlighted with colored icons - types.ts in blue, mockStream.ts in purple, hooks.ts in green, ChainOfReasoningDemo.tsx in orange, folder structure for pattern implementation, 16:9]

(Audio) Let's look at how this actually works in code. And don't worry—even if you're not a developer, you'll get the core concepts.

[Visual: TypeScript type definition showing StreamEvent union type]
[Prompt: Dark code editor showing TypeScript code block, discriminated union type definition for StreamEvent with two variants clearly visible, syntax highlighting in blue for types green for strings orange for keywords, type-safe events definition, 16:9]

(Audio) First, we define what events can flow through our stream. We have two types: "reasoning" events and "answer" events.

```typescript
type StreamEvent =
  | { type: 'reasoning'; data: ReasoningStep }
  | { type: 'answer'; data: { text: string } };
```

The "reasoning" event carries a step—an id, a summary, a confidence score, and optional details. The "answer" event carries the final text.

[Visual: AsyncGenerator function with yield statements]
[Prompt: Dark code editor showing async generator function code, "async function*" declaration at top with asterisk prominently visible, yield statements in function body, streaming generator pattern code, 16:9]

(Audio) Next, we have our stream generator. This is the engine that produces events over time.

```typescript
async function* createMockReasoningStream(prompt) {
  for (const event of fixture) {
    await delay(300); // Simulate AI thinking time
    yield event;
  }
}
```

[Visual: Callout highlighting the asterisk in "async function*"]
[Video Prompt: Close-up zoom on code showing "async function*", asterisk grows larger and glows golden, annotation box draws in from side explaining "Generator function - yields events one at a time" with arrow pointing to asterisk - THIS IS THE KEY TECHNICAL CONCEPT that enables all streaming patterns, essential to emphasize, 16:9]

(Audio) That `async function*` with the star—that's a generator. It doesn't return all the data at once. It yields events one at a time, with pauses in between. That's what creates the streaming effect.

[Visual: Custom hook showing useState and useEffect with for-await loop]
[Prompt: Dark code editor showing React hook code, useState declarations at top with array and string types, useEffect block below containing for-await-of loop, state update calls inside the loop, clean hook pattern implementation, 16:9]

(Audio) Now here's where React comes in. This custom hook consumes the stream:

```typescript
function useReasoningStream(prompt) {
  const [reasoning, setReasoning] = useState([]);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const stream = createMockReasoningStream(prompt);

    for await (const event of stream) {
      if (event.type === 'reasoning') {
        setReasoning(prev => [...prev, event.data]);
      } else if (event.type === 'answer') {
        setAnswer(prev => prev + event.data.text);
      }
    }
  }, [prompt]);

  return { reasoning, answer };
}
```

[Visual: Highlight on "for await" loop with annotation]
[Prompt: Code with "for await (const event of stream)" line highlighted with glowing box, annotation text "Consumes stream continuously" beside it, event flow visualization concept, 16:9]

(Audio) Every time an event arrives, we check its type. If it's a reasoning step, we add it to our list. If it's answer text, we append it.

The key insight: our UI is constantly updating as data flows in. We're not waiting for everything to finish before rendering.

[Visual: Simple component using the hook, mapping over reasoning array]
[Prompt: Dark code editor showing React component code, hook usage at top destructuring reasoning and answer, JSX below with map function over reasoning array, ReasoningBead components being rendered, simple component structure, 16:9]

(Audio) And the component just uses this hook and renders the data. Nothing complicated—just mapping over the reasoning array and displaying each step.

---

## **[CTA INSERTION POINT]** (8:00 - 8:15)

[Visual: Course preview showing hands-on coding with streaming patterns]
[Prompt: Collage of four panels showing course content - IDE with streaming code visible, pattern demo UI screenshot, architecture diagram, hands-on project result, "Build It Yourself" text overlay in bold, professional course aesthetic, 16:9]

(Audio) Now if you want to build this yourself, with your own custom scenarios and more advanced techniques...

**[INSERT 15-30 SECOND CTA HERE]**

(Audio) Let me show you when to use this pattern—and when you might choose something else...

---

## When to Use This Pattern (8:15 - 9:30)

[Visual: "Use When" checklist with green checkmarks]
[Prompt: Dark card with "Use When" heading at top, four line items each with green checkmark icon: "Complex multi-factor decisions", "Trust is critical", "Thinking process is valuable", "Users should learn from AI", clean checklist style, 16:9]

(Audio) So when does Chain of Reasoning make sense?

**Use it when:**
- The AI is making complex decisions with multiple factors
- Trust is critical—users need to know why, not just what
- The thinking process itself is valuable information
- You want users to learn how to work with AI more effectively

[Visual: "Skip When" list with orange X marks]
[Prompt: Dark card with "Skip When" heading at top, four line items each with orange X icon: "Simple/obvious responses", "Speed trumps transparency", "Reasoning would be repetitive", "UI complexity not justified", clean skip-when list style, 16:9]

(Audio) **Maybe skip it when:**
- Responses are simple and obvious
- Speed is more important than transparency
- The reasoning would be boring or repetitive
- You're in a context where the extra UI complexity isn't worth it

[Visual: Spectrum diagram - "Calculator" to "Strategic Advisor"]
[Prompt: Horizontal spectrum bar on dark background, left end labeled "Calculator" with simple calculator icon and "2+2" text, right end labeled "Strategic Advisor" with brain/chart icon, gradient bar from gray on left to glowing blue on right, "When Reasoning Matters" title above, decision spectrum visualization, 16:9]

(Audio) Think about it like this: a calculator doesn't need to show its work for "2 + 2". But a financial advisor explaining a retirement plan? You absolutely want to see the reasoning.

AI is powerful enough now that it's making decisions that matter. And decisions that matter deserve visible reasoning.

---

## Connecting to the Series (9:30 - 10:15)

[Visual: Pattern 1 connecting to Pattern 2 preview]
[Prompt: Two pattern cards on dark background, left card shows Chain of Reasoning with checkmark, arrow pointing to right card showing Agent Await Prompt preview with input form visible, series progression visualization, 16:9]

(Audio) This Chain of Reasoning pattern is the foundation for everything that comes next in this series.

In the next video, we'll tackle a new challenge: what happens when the AI needs to *pause* and ask you a question before it can continue?

[Visual: Preview of Agent Await Prompt - stream pausing, form fields appearing inline]
[Prompt: Demo preview showing streaming text frozen mid-sentence with pause indicator, input form visible below with fields for "Project Name" and "Budget", countdown timer showing "30s", pause-and-ask interaction preview, 16:9]

(Audio) Maybe it's setting up a new project and realizes it needs your budget. Maybe it's writing code and needs to know your preferred framework.

This is the **Agent Await Prompt** pattern—and it takes everything we learned today about streaming and adds a new dimension: interruption.

---

## Outro (10:15 - 10:45)

[Visual: Demo montage - reasoning beads, confidence levels, expanded details, final answer]
[Prompt: Four-panel static montage, panel 1 shows beads in chain, panel 2 shows confidence badges with varying colors, panel 3 shows expanded bead detail card, panel 4 shows final sprint plan, pattern showcase with key moments, 16:9]

(Audio) That's Chain of Reasoning. The pattern that turns an AI black box into a transparent thought process.

[Visual: Key takeaways card - four bullet points with icons]
[Prompt: Dark card with "Key Takeaways" heading, four items with small icons: chain icon + "Stream reasoning before answer", gauge icon + "Show confidence levels", expand icon + "Allow detail expansion", inspector icon + "Capture events for debugging", takeaway summary card style, 16:9]

(Audio) Key takeaways:
- Stream reasoning steps before the final answer
- Show confidence levels so users know what to trust
- Let users expand details when they want to dig deeper
- Capture events in a Network Inspector for debugging and transparency

[Visual: GitHub link and subscribe CTA overlay]
[Prompt: Dark overlay with GitHub repo card showing code icon on left side, subscribe button with bell icon on right side, "Code in Description" text below GitHub card, "Next: Agent Await Prompt" teaser text at bottom, clean end screen style, 16:9]

(Audio) All the code for this demo is open source—link in the description.

See you in the next one, where we teach AI to pause and ask for help.

---

## Thumbnail Concept

[Visual: Split brain showing "hidden" vs "visible" thinking]
[Prompt: YouTube thumbnail 1280x720, brain illustration split vertically down middle, left half dark and shadowy with question marks floating, right half showing glowing blue chain of reasoning beads visible inside brain, bold text "SEE AI THINK" at bottom, high contrast blue and orange color scheme, clickable thumbnail style]

---

## Production Notes

**Video Prompts Used (2 max):**
1. Reasoning beads appearing one-by-one in timeline (core pattern visualization - thematically imperative)
2. Generator asterisk callout with annotation (key technical concept that enables all streaming - thematically imperative)

**Key demo moments to capture:**
- Beads appearing one by one (satisfying animation)
- Confidence levels varying between steps
- Click to expand details interaction
- Network Inspector showing event flow

**Code sections to highlight:**
- The `async function*` generator syntax (brief callout)
- The `for await` loop consumption (brief callout)
- The event type discrimination pattern

**Paradigm shift moments:**
- "Trust by transparency" concept introduction
- Calculator vs. Financial Advisor comparison

**Continuity:**
- Reference "black box" language from intro video
- Tease "pause and ask" challenge for next video
- Consistent StreamFlow PM branding throughout
