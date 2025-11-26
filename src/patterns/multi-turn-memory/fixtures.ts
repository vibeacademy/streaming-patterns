/**
 * Multi-Turn Memory Timeline Pattern - Mock Conversation Fixtures
 *
 * This file contains deterministic, realistic conversation data for the Q4 planning
 * scenario. The conversation demonstrates how an agent builds and maintains memory
 * across multiple turns.
 *
 * @pattern Multi-Turn Memory Timeline
 * @educational Demonstrates multi-turn conversation flow with memory lifecycle
 */

import type { StreamEvent } from './types';

/**
 * Q4 Planning Conversation Fixture
 *
 * Scenario: Product manager discusses Q4 goals with StreamFlow PM assistant.
 * The conversation spans 3 turns and demonstrates memory creation, updates, and pruning.
 *
 * Turn 1: Initial planning context (team, budget, timeline)
 * Turn 2: Feature prioritization and risk identification
 * Turn 3: Resource allocation and final plan
 */
export const q4PlanningConversation: StreamEvent[] = [
  // ========== TURN 1: Initial Planning Context ==========
  {
    type: 'message',
    timestamp: 1699545600000,
    data: {
      id: 'msg-001',
      role: 'user',
      content: 'Help me plan Q4 for the StreamFlow PM product. We have a team of 8 engineers and a budget of $500k. The goal is to launch our mobile app by December 31st.',
      turnNumber: 1,
    },
  },
  {
    type: 'message',
    timestamp: 1699545605000,
    data: {
      id: 'msg-002',
      role: 'agent',
      content: 'I\'ll help you plan Q4 for StreamFlow PM. Let me process the key details...',
      turnNumber: 1,
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545606000,
    data: {
      id: 'mem-001',
      memoryType: 'fact',
      summary: 'Team size: 8 engineers',
      tokenExcerpt: '...we have a team of 8 engineers...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545607000,
    data: {
      id: 'mem-002',
      memoryType: 'fact',
      summary: 'Q4 budget: $500k',
      tokenExcerpt: '...and a budget of $500k...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545608000,
    data: {
      id: 'mem-003',
      memoryType: 'fact',
      summary: 'Deadline: December 31st',
      tokenExcerpt: '...launch our mobile app by December 31st...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545609000,
    data: {
      id: 'mem-004',
      memoryType: 'task',
      summary: 'Launch mobile app',
      tokenExcerpt: '...The goal is to launch our mobile app...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },

  // ========== TURN 2: Feature Prioritization ==========
  {
    type: 'message',
    timestamp: 1699545620000,
    data: {
      id: 'msg-003',
      role: 'user',
      content: 'Focus on user authentication and push notifications first. We can defer the analytics dashboard to Q1 next year.',
      turnNumber: 2,
    },
  },
  {
    type: 'message',
    timestamp: 1699545625000,
    data: {
      id: 'msg-004',
      role: 'agent',
      content: 'Got it. I\'ll prioritize user authentication and push notifications for Q4, and move analytics dashboard to Q1. Let me identify the key priorities and risks...',
      turnNumber: 2,
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545626000,
    data: {
      id: 'mem-005',
      memoryType: 'decision',
      summary: 'Priority #1: User authentication',
      tokenExcerpt: '...Focus on user authentication and push notifications first...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545627000,
    data: {
      id: 'mem-006',
      memoryType: 'decision',
      summary: 'Priority #2: Push notifications',
      tokenExcerpt: '...Focus on user authentication and push notifications first...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545628000,
    data: {
      id: 'mem-007',
      memoryType: 'decision',
      summary: 'Defer analytics dashboard to Q1',
      tokenExcerpt: '...defer the analytics dashboard to Q1 next year...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545629000,
    data: {
      id: 'mem-008',
      memoryType: 'risk',
      summary: 'Tight timeline: 10 weeks until launch',
      tokenExcerpt: 'Based on December 31st deadline, we have approximately 10 weeks...',
      metadata: {
        source: 'agent',
        confidence: 0.9,
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545630000,
    data: {
      id: 'mem-009',
      memoryType: 'risk',
      summary: 'Limited team capacity for aggressive timeline',
      tokenExcerpt: 'With 8 engineers and 3 major features, capacity may be tight...',
      metadata: {
        source: 'agent',
        confidence: 0.85,
      },
    },
  },

  // ========== TURN 3: Budget Reallocation ==========
  {
    type: 'message',
    timestamp: 1699545640000,
    data: {
      id: 'msg-005',
      role: 'user',
      content: 'Actually, we got budget approval for an additional $100k. Use it to hire 2 contract engineers for the authentication work.',
      turnNumber: 3,
    },
  },
  {
    type: 'message',
    timestamp: 1699545645000,
    data: {
      id: 'msg-006',
      role: 'agent',
      content: 'Excellent! With the increased budget, I\'ll plan for 2 additional contract engineers to accelerate authentication. This should reduce the capacity risk.',
      turnNumber: 3,
    },
  },
  {
    type: 'memory.update',
    timestamp: 1699545646000,
    data: {
      id: 'mem-002',
      updates: {
        summary: 'Q4 budget: $600k (increased from $500k)',
        tokenExcerpt: '...budget approval for an additional $100k...',
      },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545647000,
    data: {
      id: 'mem-010',
      memoryType: 'decision',
      summary: 'Hire 2 contract engineers for authentication',
      tokenExcerpt: '...hire 2 contract engineers for the authentication work...',
      metadata: {
        source: 'user',
        confidence: 1.0,
      },
    },
  },
  {
    type: 'memory.update',
    timestamp: 1699545648000,
    data: {
      id: 'mem-001',
      updates: {
        summary: 'Team size: 10 engineers (8 FTE + 2 contractors)',
        tokenExcerpt: 'Team composition: 8 full-time engineers plus 2 contractors...',
      },
    },
  },
  {
    type: 'memory.prune',
    timestamp: 1699545649000,
    data: {
      id: 'mem-009',
      reason: 'Superseded by increased team capacity',
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545650000,
    data: {
      id: 'mem-011',
      memoryType: 'fact',
      summary: 'Contractor budget allocation: $100k',
      tokenExcerpt: 'Additional $100k allocated for 2 contract engineers...',
      metadata: {
        source: 'agent',
        confidence: 0.95,
      },
    },
  },
];

/**
 * Shorter conversation for fast testing.
 * Demonstrates basic memory creation and updates in 2 turns.
 */
export const shortConversation: StreamEvent[] = [
  {
    type: 'message',
    timestamp: 1699545600000,
    data: {
      id: 'msg-001',
      role: 'user',
      content: 'Plan a sprint for a team of 5 with a $50k budget.',
      turnNumber: 1,
    },
  },
  {
    type: 'message',
    timestamp: 1699545605000,
    data: {
      id: 'msg-002',
      role: 'agent',
      content: 'I\'ll help plan your sprint.',
      turnNumber: 1,
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545606000,
    data: {
      id: 'mem-001',
      memoryType: 'fact',
      summary: 'Team size: 5 engineers',
      tokenExcerpt: '...team of 5...',
      metadata: { source: 'user', confidence: 1.0 },
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545607000,
    data: {
      id: 'mem-002',
      memoryType: 'fact',
      summary: 'Budget: $50k',
      tokenExcerpt: '...$50k budget...',
      metadata: { source: 'user', confidence: 1.0 },
    },
  },
  {
    type: 'message',
    timestamp: 1699545620000,
    data: {
      id: 'msg-003',
      role: 'user',
      content: 'Budget increased to $75k.',
      turnNumber: 2,
    },
  },
  {
    type: 'message',
    timestamp: 1699545625000,
    data: {
      id: 'msg-004',
      role: 'agent',
      content: 'Noted, updating budget.',
      turnNumber: 2,
    },
  },
  {
    type: 'memory.update',
    timestamp: 1699545626000,
    data: {
      id: 'mem-002',
      updates: {
        summary: 'Budget: $75k (increased from $50k)',
        tokenExcerpt: '...Budget increased to $75k...',
      },
    },
  },
];

/**
 * Test fixture with all memory lifecycle events.
 */
export const memoryLifecycleFixture: StreamEvent[] = [
  {
    type: 'message',
    timestamp: 1699545600000,
    data: {
      id: 'msg-001',
      role: 'user',
      content: 'Test message',
      turnNumber: 1,
    },
  },
  {
    type: 'memory.create',
    timestamp: 1699545601000,
    data: {
      id: 'mem-create',
      memoryType: 'fact',
      summary: 'Created memory',
      tokenExcerpt: 'Token excerpt',
    },
  },
  {
    type: 'memory.update',
    timestamp: 1699545602000,
    data: {
      id: 'mem-create',
      updates: { summary: 'Updated memory' },
    },
  },
  {
    type: 'memory.prune',
    timestamp: 1699545603000,
    data: {
      id: 'mem-create',
      reason: 'Test pruning',
    },
  },
];
