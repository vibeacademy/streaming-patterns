/**
 * Turn-Taking Co-Creation Pattern - Mock Conversation Fixtures
 *
 * This file contains deterministic conversation data for the project charter
 * collaborative drafting scenario. It demonstrates how agent and user take turns
 * editing a shared document with patches, acknowledgments, and conflict resolution.
 *
 * @pattern Turn-Taking Co-Creation
 * @educational Demonstrates collaborative editing with bidirectional streaming
 */

import type { StreamEvent } from './types';

/**
 * Project Charter Collaborative Drafting Fixture
 *
 * Scenario: PM and AI co-author a project charter for "StreamFlow Mobile Launch".
 * The document has 4 sections: Goals, Scope, Timeline, and Risks.
 *
 * Flow:
 * 1. Agent drafts initial Goals section
 * 2. User edits the timeline in Goals (supersedes agent patch)
 * 3. Agent acknowledges user edit and adapts
 * 4. Agent drafts Scope section
 * 5. User adds additional scope item
 * 6. Agent drafts Timeline section
 * 7. User modifies a milestone date
 * 8. Agent drafts Risks section
 */
export const projectCharterCollaboration: StreamEvent[] = [
  // ========== SECTION 1: PROJECT GOALS (Agent drafts, user edits) ==========

  // Agent: Draft opening line
  {
    type: 'agent_patch',
    timestamp: 1699545600000,
    data: {
      patchId: 'patch-001',
      sectionId: 'goals',
      operation: 'insert',
      content: 'Launch StreamFlow Mobile to expand our project management platform to mobile devices.',
      position: { start: 0, end: 0 },
      metadata: {
        source: 'agent',
        confidence: 0.95,
      },
    },
  },

  // Agent: Add key objective 1
  {
    type: 'agent_patch',
    timestamp: 1699545601000,
    data: {
      patchId: 'patch-002',
      sectionId: 'goals',
      operation: 'insert',
      content: '\n\nKey Objectives:\n1. Deliver iOS and Android apps with core PM features (tasks, projects, teams)',
      position: { start: 86, end: 86 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Agent: Add key objective 2 with timeline
  {
    type: 'agent_patch',
    timestamp: 1699545602000,
    data: {
      patchId: 'patch-003',
      sectionId: 'goals',
      operation: 'insert',
      content: '\n2. Achieve 10,000 active mobile users by Q2 2025',
      position: { start: 176, end: 176 },
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // User: Edit the timeline to be more aggressive (supersedes agent's Q2 → Q1)
  {
    type: 'user_patch',
    timestamp: 1699545605000,
    data: {
      patchId: 'patch-004',
      sectionId: 'goals',
      operation: 'replace',
      content: '10,000 active mobile users by March 2025',
      position: { start: 193, end: 231 },
      supersedes: 'patch-003', // User is correcting agent's timeline
    },
  },

  // Agent: Acknowledge user edit
  {
    type: 'patch_ack',
    timestamp: 1699545606000,
    data: {
      patchId: 'patch-004',
      status: 'accepted',
      message: 'Incorporated your accelerated timeline. Adjusting downstream milestones accordingly.',
    },
  },

  // Agent: Add key objective 3 (adapted to user's timeline)
  {
    type: 'agent_patch',
    timestamp: 1699545607000,
    data: {
      patchId: 'patch-005',
      sectionId: 'goals',
      operation: 'insert',
      content: '\n3. Launch with parity feature set to web app by January 2025',
      position: { start: 231, end: 231 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Mark Goals section as complete
  {
    type: 'section_complete',
    timestamp: 1699545608000,
    data: {
      sectionId: 'goals',
    },
  },

  // ========== SECTION 2: PROJECT SCOPE (Agent drafts, user adds) ==========

  // Agent: Draft scope intro
  {
    type: 'agent_patch',
    timestamp: 1699545610000,
    data: {
      patchId: 'patch-006',
      sectionId: 'scope',
      operation: 'insert',
      content: 'The mobile app will include the following features:',
      position: { start: 0, end: 0 },
      metadata: {
        source: 'agent',
        confidence: 0.95,
      },
    },
  },

  // Agent: Add in-scope features
  {
    type: 'agent_patch',
    timestamp: 1699545611000,
    data: {
      patchId: 'patch-007',
      sectionId: 'scope',
      operation: 'insert',
      content: '\n\nIn Scope:\n- User authentication (OAuth 2.0 + biometric)\n- Task management (create, edit, assign, complete)\n- Project dashboard with real-time updates\n- Team collaboration (comments, mentions, notifications)',
      position: { start: 52, end: 52 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Agent: Add out-of-scope items
  {
    type: 'agent_patch',
    timestamp: 1699545612000,
    data: {
      patchId: 'patch-008',
      sectionId: 'scope',
      operation: 'insert',
      content: '\n\nOut of Scope (defer to future releases):\n- Gantt chart views\n- Time tracking\n- Budget management',
      position: { start: 249, end: 249 },
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // User: Add push notifications to in-scope (inline edit)
  {
    type: 'user_patch',
    timestamp: 1699545615000,
    data: {
      patchId: 'patch-009',
      sectionId: 'scope',
      operation: 'insert',
      content: '\n- Push notifications for task assignments and mentions',
      position: { start: 249, end: 249 },
    },
  },

  // Agent: Acknowledge user addition
  {
    type: 'patch_ack',
    timestamp: 1699545616000,
    data: {
      patchId: 'patch-009',
      status: 'accepted',
      message: 'Great addition! Push notifications are critical for mobile engagement.',
    },
  },

  // Mark Scope section as complete
  {
    type: 'section_complete',
    timestamp: 1699545617000,
    data: {
      sectionId: 'scope',
    },
  },

  // ========== SECTION 3: TIMELINE (Agent drafts, user modifies milestone) ==========

  // Agent: Draft timeline intro
  {
    type: 'agent_patch',
    timestamp: 1699545620000,
    data: {
      patchId: 'patch-010',
      sectionId: 'timeline',
      operation: 'insert',
      content: 'Project Timeline (13-week sprint to launch):',
      position: { start: 0, end: 0 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Agent: Add milestone 1
  {
    type: 'agent_patch',
    timestamp: 1699545621000,
    data: {
      patchId: 'patch-011',
      sectionId: 'timeline',
      operation: 'insert',
      content: '\n\nPhase 1 (Weeks 1-4): Foundation\n- Authentication and user onboarding\n- Core data sync infrastructure\n- Due: November 30, 2024',
      position: { start: 46, end: 46 },
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // Agent: Add milestone 2
  {
    type: 'agent_patch',
    timestamp: 1699545622000,
    data: {
      patchId: 'patch-012',
      sectionId: 'timeline',
      operation: 'insert',
      content: '\n\nPhase 2 (Weeks 5-8): Core Features\n- Task and project management\n- Real-time collaboration\n- Due: December 28, 2024',
      position: { start: 177, end: 177 },
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // User: Move Phase 2 deadline earlier
  {
    type: 'user_patch',
    timestamp: 1699545625000,
    data: {
      patchId: 'patch-013',
      sectionId: 'timeline',
      operation: 'replace',
      content: 'Due: December 20, 2024',
      position: { start: 285, end: 307 },
    },
  },

  // Agent: Acknowledge and flag potential risk
  {
    type: 'patch_ack',
    timestamp: 1699545626000,
    data: {
      patchId: 'patch-013',
      status: 'accepted',
      message: 'Updated Phase 2 deadline. This is aggressive - I\'ll flag capacity as a risk.',
    },
  },

  // Agent: Add milestone 3
  {
    type: 'agent_patch',
    timestamp: 1699545627000,
    data: {
      patchId: 'patch-014',
      sectionId: 'timeline',
      operation: 'insert',
      content: '\n\nPhase 3 (Weeks 9-13): Polish & Launch\n- Push notifications\n- Performance optimization\n- Beta testing and bug fixes\n- Due: January 25, 2025',
      position: { start: 307, end: 307 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Mark Timeline section as complete
  {
    type: 'section_complete',
    timestamp: 1699545628000,
    data: {
      sectionId: 'timeline',
    },
  },

  // ========== SECTION 4: RISKS (Agent drafts based on user's timeline edits) ==========

  // Agent: Draft risks intro
  {
    type: 'agent_patch',
    timestamp: 1699545630000,
    data: {
      patchId: 'patch-015',
      sectionId: 'risks',
      operation: 'insert',
      content: 'Key Risks and Mitigation Strategies:',
      position: { start: 0, end: 0 },
      metadata: {
        source: 'agent',
        confidence: 0.95,
      },
    },
  },

  // Agent: Add risk 1 (influenced by user's aggressive timeline)
  {
    type: 'agent_patch',
    timestamp: 1699545631000,
    data: {
      patchId: 'patch-016',
      sectionId: 'risks',
      operation: 'insert',
      content: '\n\n1. Tight Timeline Risk\n   - Accelerated deadlines leave minimal buffer\n   - Mitigation: Hire 2 additional contract mobile developers, reduce scope if needed',
      position: { start: 37, end: 37 },
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },

  // Agent: Add risk 2
  {
    type: 'agent_patch',
    timestamp: 1699545632000,
    data: {
      patchId: 'patch-017',
      sectionId: 'risks',
      operation: 'insert',
      content: '\n\n2. Platform Fragmentation\n   - iOS and Android require separate codebases\n   - Mitigation: Use React Native for code sharing, prioritize iOS first',
      position: { start: 203, end: 203 },
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // Agent: Add risk 3
  {
    type: 'agent_patch',
    timestamp: 1699545633000,
    data: {
      patchId: 'patch-018',
      sectionId: 'risks',
      operation: 'insert',
      content: '\n\n3. User Adoption\n   - Mobile app success depends on strong value proposition\n   - Mitigation: Early beta program with existing customers, mobile-first features (offline mode)',
      position: { start: 338, end: 338 },
      metadata: {
        source: 'agent',
        confidence: 0.8,
      },
    },
  },

  // Mark Risks section as complete
  {
    type: 'section_complete',
    timestamp: 1699545634000,
    data: {
      sectionId: 'risks',
    },
  },
];

/**
 * Shorter collaboration for fast testing.
 * Demonstrates basic agent draft + user edit flow in 1 section.
 */
export const shortCollaboration: StreamEvent[] = [
  {
    type: 'agent_patch',
    timestamp: 1699545600000,
    data: {
      patchId: 'patch-001',
      sectionId: 'goals',
      operation: 'insert',
      content: 'Launch mobile app by Q2 2025.',
      position: { start: 0, end: 0 },
    },
  },
  {
    type: 'user_patch',
    timestamp: 1699545605000,
    data: {
      patchId: 'patch-002',
      sectionId: 'goals',
      operation: 'replace',
      content: 'Launch mobile app by March 2025.',
      position: { start: 0, end: 29 },
      supersedes: 'patch-001',
    },
  },
  {
    type: 'patch_ack',
    timestamp: 1699545606000,
    data: {
      patchId: 'patch-002',
      status: 'accepted',
      message: 'Updated timeline to March 2025.',
    },
  },
  {
    type: 'section_complete',
    timestamp: 1699545607000,
    data: {
      sectionId: 'goals',
    },
  },
];

/**
 * Conflict scenario for testing conflict resolution.
 * Agent and user edit the same text simultaneously.
 */
export const conflictScenario: StreamEvent[] = [
  // Agent starts drafting
  {
    type: 'agent_patch',
    timestamp: 1699545600000,
    data: {
      patchId: 'patch-001',
      sectionId: 'goals',
      operation: 'insert',
      content: 'Target 5,000 users',
      position: { start: 0, end: 0 },
    },
  },
  // User edits the same region while agent is still streaming
  {
    type: 'user_patch',
    timestamp: 1699545601000,
    data: {
      patchId: 'patch-002',
      sectionId: 'goals',
      operation: 'replace',
      content: 'Target 10,000 users',
      position: { start: 0, end: 18 },
      supersedes: 'patch-001',
    },
  },
  // Conflict detected
  {
    type: 'conflict',
    timestamp: 1699545602000,
    data: {
      sectionId: 'goals',
      agentPatchId: 'patch-001',
      userPatchId: 'patch-002',
      resolution: 'user_wins', // User edit takes precedence
    },
  },
  // Agent acknowledges conflict resolution
  {
    type: 'patch_ack',
    timestamp: 1699545603000,
    data: {
      patchId: 'patch-002',
      status: 'accepted',
      message: 'Understood. Increasing target to 10,000 users.',
    },
  },
];

/**
 * Initial document structure for the project charter.
 * This provides the empty sections that will be filled during collaboration.
 */
export const initialDocument = {
  id: 'charter-001',
  title: 'StreamFlow Mobile Launch - Project Charter',
  sections: [
    {
      id: 'goals',
      title: 'Project Goals',
      content: '',
      patches: [],
      order: 1,
    },
    {
      id: 'scope',
      title: 'Scope',
      content: '',
      patches: [],
      order: 2,
    },
    {
      id: 'timeline',
      title: 'Timeline',
      content: '',
      patches: [],
      order: 3,
    },
    {
      id: 'risks',
      title: 'Risks',
      content: '',
      patches: [],
      order: 4,
    },
  ],
  createdAt: 1699545600000,
  updatedAt: 1699545600000,
};
