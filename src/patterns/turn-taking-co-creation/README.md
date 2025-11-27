# Turn-Taking Co-Creation Pattern

## Intent

Enable real-time collaborative document editing between a user and AI agent, where both parties can propose changes, see authorship clearly, and maintain user agency through patch review.

## Problem

When building collaborative AI experiences, users need:
- Clear visibility into who wrote what (transparency)
- Ability to accept or reject AI suggestions (agency)
- Real-time feedback on collaboration state (awareness)
- Conflict resolution when edits overlap (consistency)
- Undo/redo and version history (recoverability)

## Solution

The Turn-Taking Co-Creation pattern implements bidirectional streaming where both agent and user can propose edits as patches. The UI shows:
- **Authorship highlighting**: Color-coded text showing who wrote each part
- **Patch management**: Sidebar for reviewing and acting on agent suggestions
- **Turn indicators**: Visual signals showing who has control
- **Conflict resolution**: Configurable merge strategies when edits overlap

## Demo Scenario

**StreamFlow PM: Project Charter Co-Creation**

A product manager uses StreamFlow PM's AI assistant to co-create a project charter. The AI drafts initial content for sections (goals, scope, timeline, etc.) while the user can simultaneously edit, provide feedback, and refine the document.

## UX Flow

1. **Agent Drafts**: AI streams patches to build initial document sections
2. **User Reviews**: User sees color-coded authorship and pending suggestions
3. **User Edits**: User can accept, reject, or modify agent patches
4. **Agent Adapts**: AI acknowledges user edits and adjusts subsequent patches
5. **Conflict Resolution**: When edits overlap, merge strategy determines the winner
6. **Final Document**: Both parties' contributions are visible and traceable

## Stream Contract

### Event Types

#### `agent_patch`
Agent proposes a document edit.

```typescript
{
  type: 'agent_patch',
  timestamp: number,
  data: {
    patchId: string,
    sectionId: string,
    operation: 'insert' | 'replace' | 'delete',
    content: string,
    position: { start: number, end: number },
    metadata?: { confidence?: number }
  }
}
```

#### `user_patch`
User submits a document edit.

```typescript
{
  type: 'user_patch',
  timestamp: number,
  data: {
    patchId: string,
    sectionId: string,
    operation: 'insert' | 'replace' | 'delete',
    content: string,
    position: { start: number, end: number },
    supersedes?: string  // Agent patch ID being replaced
  }
}
```

#### `patch_ack`
Agent acknowledges a user edit.

```typescript
{
  type: 'patch_ack',
  timestamp: number,
  data: {
    patchId: string,
    status: 'accepted' | 'rejected' | 'modified',
    message: string
  }
}
```

#### `section_complete`
Agent finishes drafting a section.

```typescript
{
  type: 'section_complete',
  timestamp: number,
  data: {
    sectionId: string
  }
}
```

#### `conflict`
Conflict detected between agent and user edits.

```typescript
{
  type: 'conflict',
  timestamp: number,
  data: {
    sectionId: string,
    agentPatchId: string,
    userPatchId: string,
    resolution: 'user_wins' | 'agent_wins' | 'manual'
  }
}
```

## UI Techniques

### 1. Authorship Highlighting

Break document text into authorship spans and render each with appropriate color:

```typescript
interface AuthorshipSpan {
  start: number;
  end: number;
  author: 'agent' | 'user';
  patchId: string;
}
```

Algorithm:
1. Sort patches by timestamp
2. Iterate through text, creating spans for each authorship region
3. Merge adjacent spans from the same author
4. Render with CSS color-coding

### 2. Patch-Based Editing

Represent changes as discrete operations:

```typescript
interface Patch {
  id: string;
  sectionId: string;
  author: 'agent' | 'user';
  operation: 'insert' | 'replace' | 'delete';
  content: string;
  position: { start: number, end: number };
  timestamp: number;
}
```

### 3. Conflict Detection

Check if two patches overlap:

```typescript
function patchesOverlap(p1: Patch, p2: Patch): boolean {
  if (p1.sectionId !== p2.sectionId) return false;

  const { start: s1, end: e1 } = p1.position;
  const { start: s2, end: e2 } = p2.position;

  return s1 < e2 && s2 < e1;
}
```

### 4. Merge Strategies

Resolve conflicts with configurable strategies:

- **user_priority**: User edits always win (default for human-in-control)
- **agent_priority**: Agent edits win unless explicitly rejected
- **merge**: Attempt to combine both edits (complex but flexible)

## Implementation Guide

### File Structure

```
turn-taking-co-creation/
├── TurnTakingDemo.tsx           # Main demo component
├── TurnTakingDemo.module.css    # Demo styles
├── TurnTakingDemo.test.tsx      # Integration tests
├── CollaborativeEditor.tsx      # Document editor with authorship
├── CollaborativeEditor.module.css
├── PatchToolbar.tsx             # Patch management sidebar
├── PatchToolbar.module.css
├── AuthorshipLegend.tsx         # Color legend
├── AuthorshipLegend.module.css
├── TurnIndicator.tsx            # Turn state display
├── TurnIndicator.module.css
├── hooks.ts                     # useCollaborativeDocument hook
├── patchEngine.ts               # Patch operations & merging
├── patchEngine.test.ts          # Patch engine tests
├── mockStream.ts                # Mock collaboration stream
├── fixtures.ts                  # Demo data
├── types.ts                     # TypeScript definitions
└── README.md                    # This file
```

### Key Components

#### `useCollaborativeDocument` Hook

Manages collaborative editing state:

```typescript
const {
  document,
  sectionsWithAuthorship,
  isStreaming,
  pendingPatches,
  patchHistory,
  actions
} = useCollaborativeDocument({
  speed: 'normal',
  fixture: 'full',
  onEvent: handleEventCapture
});
```

#### `CollaborativeEditor` Component

Renders document with authorship highlighting:

```tsx
<CollaborativeEditor
  sections={sectionsWithAuthorship}
  isStreaming={isStreaming}
  onSectionClick={(sectionId) => handleEdit(sectionId)}
/>
```

#### `PatchToolbar` Component

Shows pending agent patches with accept/reject controls:

```tsx
<PatchToolbar
  pendingPatches={pendingPatches}
  onAcceptPatch={actions.acceptAgentPatch}
  onRejectPatch={actions.rejectAgentPatch}
  onAskWhy={actions.askWhy}
  isStreaming={isStreaming}
/>
```

## Testing

Run tests:

```bash
npm test turn-taking-co-creation
```

Test coverage:
- Patch operations (insert, replace, delete)
- Conflict detection and resolution
- Authorship span building
- Position adjustment (operational transform)
- Integration tests for demo component

## Running the Demo

```bash
npm run dev
```

Navigate to `/patterns/turn-taking-co-creation`

## Educational Takeaways

1. **Bidirectional Streaming**: Both user and agent can propose changes simultaneously, enabling true co-creation

2. **Operational Transform Basics**: Position adjustment demonstrates OT concepts for concurrent editing

3. **Authorship Transparency**: Color-coded text builds trust by showing exactly who contributed what

4. **User Agency**: Accept/reject/ask-why controls ensure users always have final say

5. **Conflict Resolution**: Different merge strategies suit different use cases and user expectations

6. **Patch-Based Architecture**: Representing changes as discrete operations enables undo/redo, version history, and fine-grained control

7. **Turn-Taking Signals**: Clear indicators reduce confusion about when it's safe to edit vs when to wait

## Future Enhancements

- Real-time cursor positions (showing where agent is typing)
- Voice dictation for user edits
- Branching versions (fork document to explore alternatives)
- Collaborative commenting on specific patches
- Time-travel debugging (replay all edits)
- Integration with actual LLM APIs (currently mock only)

## References

- [Operational Transform](https://en.wikipedia.org/wiki/Operational_transformation)
- [CRDTs for Collaborative Editing](https://crdt.tech/)
- [Google Docs Collaborative Editing](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs.html)

---

**Last Updated**: November 26, 2024
