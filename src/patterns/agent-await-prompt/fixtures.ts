/**
 * Mock fixture data for the Agent-Await-Prompt pattern.
 *
 * This module provides deterministic, replayable stream event sequences
 * that demonstrate the pause/resume mechanics of the Agent-Await-Prompt pattern.
 *
 * Fixtures simulate realistic scenarios from StreamFlow PM where the AI
 * discovers missing information mid-task and pauses to request it from the user.
 *
 * @module patterns/agent-await-prompt/fixtures
 */

import type { StreamEvent, InputField } from './types';

/**
 * Input fields for project setup scenario.
 *
 * These fields represent common project metadata that might be missing
 * when a user tries to create a new project in StreamFlow PM.
 */
const projectSetupFields: InputField[] = [
  {
    name: 'projectName',
    type: 'text',
    label: 'Project Name',
    required: true,
    placeholder: 'e.g., Mobile App Redesign',
    helpText: 'A descriptive name for your project',
  },
  {
    name: 'budget',
    type: 'number',
    label: 'Budget (USD)',
    required: false,
    placeholder: '50000',
    helpText: 'Optional: Total budget allocated for this project',
    defaultValue: 0,
  },
  {
    name: 'deadline',
    type: 'date',
    label: 'Target Deadline',
    required: true,
    helpText: 'When does this project need to be completed?',
  },
  {
    name: 'teamSize',
    type: 'number',
    label: 'Team Size',
    required: true,
    placeholder: '5',
    helpText: 'Number of team members assigned to this project',
  },
];

/**
 * Input fields for sprint planning scenario.
 *
 * Fields needed when the AI tries to plan a sprint but lacks key context.
 */
const sprintPlanningFields: InputField[] = [
  {
    name: 'sprintDuration',
    type: 'number',
    label: 'Sprint Duration (weeks)',
    required: true,
    placeholder: '2',
    helpText: 'How long should this sprint be?',
    defaultValue: 2,
  },
  {
    name: 'velocityTarget',
    type: 'number',
    label: 'Velocity Target (story points)',
    required: false,
    placeholder: '40',
    helpText: 'Optional: Target story points for this sprint',
  },
  {
    name: 'startDate',
    type: 'date',
    label: 'Sprint Start Date',
    required: true,
    helpText: 'When does this sprint begin?',
  },
];

/**
 * Fixture: Project setup scenario with missing required fields.
 *
 * Demonstrates the AI discovering missing information early in the task
 * and pausing to request it before continuing.
 *
 * Flow:
 * 1. AI starts analyzing project requirements
 * 2. Discovers missing project metadata
 * 3. Pauses and requests input
 * 4. (User submits input - handled by client)
 * 5. Resumes with acknowledgment
 * 6. Completes project setup
 */
export const projectSetupFixture: StreamEvent[] = [
  {
    type: 'text',
    data: {
      text: "I'll help you set up a new project in StreamFlow PM. ",
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: "Let me check what information we have... ",
      isComplete: false,
    },
  },
  {
    type: 'await_input',
    data: {
      message:
        'I need some information to continue setting up your project. Please provide the following details:',
      fields: projectSetupFields,
      timeoutMs: 60000,
    },
  },
  // After user submits input, the stream resumes with these events:
  {
    type: 'resume',
    data: {
      message: 'Great! I have all the information I need.',
      receivedFields: ['projectName', 'budget', 'deadline', 'teamSize'],
    },
  },
  {
    type: 'text',
    data: {
      text: 'Creating your project with the following details:\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '**Project Setup Complete**\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Project created in StreamFlow PM\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Team workspace initialized\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Project board configured\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Notification preferences set\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: 'Your project is ready! You can now start adding tasks and inviting team members.',
      isComplete: true,
    },
  },
];

/**
 * Fixture: Sprint planning scenario with partial information.
 *
 * Demonstrates the AI working with some context but needing additional
 * details mid-way through the task.
 *
 * Flow:
 * 1. AI starts sprint planning with known backlog
 * 2. Begins analyzing priorities
 * 3. Realizes sprint parameters are missing
 * 4. Pauses and requests input
 * 5. (User submits input)
 * 6. Resumes and completes sprint plan
 */
export const sprintPlanningFixture: StreamEvent[] = [
  {
    type: 'text',
    data: {
      text: "Let me help you plan your next sprint. ",
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: "I can see you have 24 items in your backlog. ",
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: "I'm analyzing priorities based on business value and dependencies... ",
      isComplete: false,
    },
  },
  {
    type: 'await_input',
    data: {
      message:
        'To create an accurate sprint plan, I need a few more details about this sprint:',
      fields: sprintPlanningFields,
      timeoutMs: 60000,
    },
  },
  {
    type: 'resume',
    data: {
      message: 'Perfect! Continuing with sprint planning...',
      receivedFields: ['sprintDuration', 'velocityTarget', 'startDate'],
    },
  },
  {
    type: 'text',
    data: {
      text: '\n\n**Sprint Plan**\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: 'Based on your team velocity and the sprint duration, here are the recommended items:\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '**High Priority** (Must Have)\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '1. User authentication flow (8 pts) - Foundation for security features\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '2. Dashboard analytics widgets (13 pts) - High business value\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '3. Mobile responsive layout (8 pts) - Unblocks mobile testing\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '**Medium Priority** (Should Have)\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '4. Export reports feature (5 pts)\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '5. Team collaboration comments (5 pts)\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '**Total: 39 story points**\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: 'This sprint plan balances your velocity target with high-value deliverables. Ready to commit?',
      isComplete: true,
    },
  },
];

/**
 * Fixture: Timeout scenario - user doesn't respond to input request.
 *
 * Demonstrates graceful fallback behavior when the user doesn't provide
 * input within the timeout period.
 *
 * Flow:
 * 1. AI starts task
 * 2. Requests input
 * 3. (User doesn't respond - timeout occurs)
 * 4. AI continues with default behavior
 */
export const timeoutFallbackFixture: StreamEvent[] = [
  {
    type: 'text',
    data: {
      text: "I'll set up your project with the information available. ",
      isComplete: false,
    },
  },
  {
    type: 'await_input',
    data: {
      message:
        'To provide the best setup, I need some additional details:',
      fields: [
        {
          name: 'projectType',
          type: 'text',
          label: 'Project Type',
          required: false,
          placeholder: 'e.g., Web App, Mobile App, Infrastructure',
          helpText: 'What type of project is this?',
        },
        {
          name: 'priority',
          type: 'text',
          label: 'Priority Level',
          required: false,
          placeholder: 'High, Medium, or Low',
          helpText: 'Business priority for this project',
        },
      ],
      timeoutMs: 5000, // Short timeout for demo purposes
    },
  },
  // This event is sent by the mock stream after timeout
  {
    type: 'timeout',
    data: {
      message:
        "I didn't receive additional details, so I'll continue with default settings.",
      expiredFields: ['projectType', 'priority'],
    },
  },
  {
    type: 'text',
    data: {
      text: '\n\nCreating project with standard configuration...\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Project created successfully\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '✓ Default workflow applied\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: '\nYou can update project settings anytime from the project dashboard.',
      isComplete: true,
    },
  },
];

/**
 * Fixture: Multiple input requests scenario.
 *
 * Demonstrates an AI task that requires multiple rounds of user input,
 * pausing and resuming multiple times.
 *
 * Flow:
 * 1. AI starts complex task
 * 2. Requests first set of inputs
 * 3. (User submits)
 * 4. Continues processing
 * 5. Requests second set of inputs
 * 6. (User submits)
 * 7. Completes task
 */
export const multipleInputsFixture: StreamEvent[] = [
  {
    type: 'text',
    data: {
      text: "I'll help you set up a complete project roadmap. ",
      isComplete: false,
    },
  },
  {
    type: 'await_input',
    data: {
      message: 'First, tell me about the project basics:',
      fields: [
        {
          name: 'projectName',
          type: 'text',
          label: 'Project Name',
          required: true,
          placeholder: 'My Project',
        },
        {
          name: 'duration',
          type: 'number',
          label: 'Expected Duration (weeks)',
          required: true,
          placeholder: '12',
        },
      ],
      timeoutMs: 60000,
    },
  },
  {
    type: 'resume',
    data: {
      message: 'Got it! Now analyzing phases...',
      receivedFields: ['projectName', 'duration'],
    },
  },
  {
    type: 'text',
    data: {
      text: '\n\nBased on the duration, I recommend 4 phases: Planning, Development, Testing, and Launch. ',
      isComplete: false,
    },
  },
  {
    type: 'await_input',
    data: {
      message: 'Now, let me know about your team resources:',
      fields: [
        {
          name: 'developers',
          type: 'number',
          label: 'Number of Developers',
          required: true,
          placeholder: '5',
        },
        {
          name: 'designers',
          type: 'number',
          label: 'Number of Designers',
          required: true,
          placeholder: '2',
        },
      ],
      timeoutMs: 60000,
    },
  },
  {
    type: 'resume',
    data: {
      message: 'Excellent! Finalizing the roadmap...',
      receivedFields: ['developers', 'designers'],
    },
  },
  {
    type: 'text',
    data: {
      text: '\n\n**Project Roadmap Complete**\n\n',
      isComplete: false,
    },
  },
  {
    type: 'text',
    data: {
      text: 'Your roadmap is ready with phase timelines, resource allocation, and milestone tracking.',
      isComplete: true,
    },
  },
];

/**
 * Get the appropriate fixture based on a prompt.
 *
 * This function matches prompts to scenarios for deterministic demos.
 * If no match is found, returns the default project setup fixture.
 *
 * @param prompt - The user's input prompt
 * @returns Array of stream events for the matched scenario
 *
 * @example
 * ```typescript
 * const fixture = getFixtureForPrompt('Set up a new project');
 * // Returns projectSetupFixture
 * ```
 */
export function getFixtureForPrompt(prompt: string): StreamEvent[] {
  const normalizedPrompt = prompt.toLowerCase().trim();

  // Match sprint planning keywords
  if (
    normalizedPrompt.includes('sprint') ||
    normalizedPrompt.includes('plan') ||
    normalizedPrompt.includes('backlog')
  ) {
    return sprintPlanningFixture;
  }

  // Match timeout/fallback keywords
  if (
    normalizedPrompt.includes('timeout') ||
    normalizedPrompt.includes('fallback') ||
    normalizedPrompt.includes('no response')
  ) {
    return timeoutFallbackFixture;
  }

  // Match multiple inputs keywords
  if (
    normalizedPrompt.includes('roadmap') ||
    normalizedPrompt.includes('multiple') ||
    normalizedPrompt.includes('complex')
  ) {
    return multipleInputsFixture;
  }

  // Default to project setup scenario
  return projectSetupFixture;
}

/**
 * Get all available fixtures as a map for testing purposes.
 *
 * @returns Map of fixture names to event arrays
 */
export function getAllFixtures(): Record<string, StreamEvent[]> {
  return {
    projectSetup: projectSetupFixture,
    sprintPlanning: sprintPlanningFixture,
    timeoutFallback: timeoutFallbackFixture,
    multipleInputs: multipleInputsFixture,
  };
}
