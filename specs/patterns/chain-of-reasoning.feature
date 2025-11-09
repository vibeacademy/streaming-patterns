Feature: Chain-of-Reasoning Pattern
  As a user of the Chain-of-Reasoning pattern
  I want to see intermediate reasoning steps before the final answer
  So that I can understand the AI's thought process and intervene if needed

  Background:
    Given a Chain-of-Reasoning demo
    And StreamFlow PM context with project "Dashboard Redesign"
    And the fixture "sprint-planning-reasoning"

  Rule: Reasoning steps must be visible before final answer

    Scenario: Reasoning beads stream before answer
      When I start the demo with prompt "Plan a 2-week sprint"
      Then I should see reasoning beads appear sequentially
      And each bead should show a reasoning step summary
      And reasoning beads should complete before the answer streams
      And the final answer should reference reasoning step IDs

  Rule: Each reasoning bead is a first-class, interactive element

    Scenario: Reasoning bead structure
      When a reasoning bead is rendered
      Then it should display:
        | field       | visible |
        | step number | yes     |
        | summary     | yes     |
        | confidence  | yes     |
      And it should be expandable to show details
      And it should have a unique ID

    Scenario: Expand reasoning bead details
      Given reasoning beads have been rendered
      When I click on reasoning bead 2
      Then a detail drawer should open
      And I should see the full reasoning details
      And I should see the confidence score
      And I should see supporting evidence (if available)

  Rule: Users can promote reasoning steps to the main conversation

    Scenario: Promote reasoning step to plan
      Given reasoning beads:
        | id | summary                  | confidence |
        | 1  | Analyze backlog items    | 0.92       |
        | 2  | Estimate team capacity   | 0.85       |
        | 3  | Identify dependencies    | 0.78       |
      When I hover over reasoning bead 2
      Then I should see a "Promote to Plan" button
      When I click "Promote to Plan"
      Then bead 2 should be added to the main conversation
      And it should be highlighted as promoted
      And the network inspector should capture a "reasoning_promoted" event

    Scenario: Promoted beads appear in chat history
      Given I have promoted reasoning bead 3
      When I view the conversation history
      Then I should see the promoted reasoning step
      And it should be clearly marked as promoted content
      And it should include attribution to the reasoning chain

  Rule: Stream contract must be followed

    Scenario: Reasoning events precede answer events
      When the demo streams events
      Then events should arrive in this order:
        | sequence | event_type | example_data                          |
        | 1        | reasoning  | {id: "1", summary: "...", confidence} |
        | 2        | reasoning  | {id: "2", summary: "...", confidence} |
        | 3        | reasoning  | {id: "3", summary: "...", confidence} |
        | 4        | answer     | {text: "Sprint plan: ..."}            |
      And reasoning events should complete before answer starts

    Scenario: Network inspector shows reasoning channel
      When the demo is streaming
      Then the network inspector should show "reasoning" events
      And each reasoning event should have schema:
        | field      | type   | required |
        | id         | string | yes      |
        | summary    | string | yes      |
        | confidence | number | yes      |
        | details    | string | no       |
        | timestamp  | number | yes      |

  Rule: Reasoning beads should communicate progress

    Scenario: Vertical timeline shows sequence
      When reasoning beads render
      Then they should appear in a vertical timeline
      And each bead should have a sequence number
      And beads should animate in from left
      And the timeline should visually stress sequencing

    Scenario: Confidence visualization
      Given reasoning beads with varying confidence:
        | id | summary                | confidence |
        | 1  | Analyze priorities     | 0.95       |
        | 2  | Estimate complexity    | 0.65       |
        | 3  | Assign tasks           | 0.88       |
      When beads are rendered
      Then bead 1 should show high confidence (green indicator)
      And bead 2 should show medium confidence (yellow indicator)
      And bead 3 should show high confidence (green indicator)

  Rule: Pattern must handle errors gracefully

    Scenario: Missing reasoning ID in answer
      Given reasoning events with IDs ["1", "2", "3"]
      When the answer event references ID "4" (which doesn't exist)
      Then the UI should show a warning
      And the reference should be marked as broken
      And the answer should still render

    Scenario: Interrupted reasoning stream
      Given 3 reasoning events have been emitted
      When the stream encounters an error
      Then partial reasoning should remain visible
      And users should see an error message
      And users should be able to retry

  Rule: Reasoning can be paused and inspected

    Scenario: Pause during reasoning phase
      Given the demo is streaming reasoning beads
      And 2 beads have appeared
      When I pause the demo
      Then reasoning should stop streaming
      And the 2 visible beads should remain
      When I resume the demo
      Then reasoning should continue from bead 3

    Scenario: Freeze on reasoning step for investigation
      Given reasoning bead 3 is currently streaming
      When I click "Freeze"
      Then streaming should pause
      And I should be able to open bead 3 details
      And I should be able to expand evidence drawer
      And I should be able to request branch exploration (future feature)

  Rule: Pattern demonstrates StreamFlow PM scenario

    Scenario: Sprint planning reasoning steps
      Given prompt "Plan a 2-week sprint for Dashboard Redesign"
      When the demo runs
      Then reasoning steps should include:
        | step | summary                           |
        | 1    | Analyzing backlog priorities      |
        | 2    | Estimating team capacity          |
        | 3    | Identifying task dependencies     |
        | 4    | Allocating tasks to team members  |
        | 5    | Calculating sprint velocity       |
      And the final answer should be a sprint plan
      And the plan should reference high-priority reasoning steps

  Rule: Accessibility requirements

    Scenario: Keyboard navigation through reasoning beads
      Given reasoning beads are rendered
      And the beadline has focus
      When I press "Tab"
      Then the first bead should be focused
      When I press "Arrow Down"
      Then the next bead should be focused
      When I press "Enter"
      Then the focused bead should expand

    Scenario: Screen reader support
      Given reasoning beads are streaming
      When a new bead appears
      Then a screen reader should announce "New reasoning step: [summary]"
      And the beadline should have aria-live="polite"
      And each bead should have a descriptive aria-label

  Rule: Performance requirements

    Scenario: Smooth animation with many beads
      Given a fixture with 20 reasoning steps
      When all beads render
      Then animations should remain smooth (60fps)
      And there should be no layout shift
      And memory usage should remain stable

  Rule: Pattern should support redaction (future enhancement)

    @future
    Scenario: Redact reasoning step
      Given reasoning beads have been rendered
      When a "redact" event arrives for bead 2
      Then bead 2 should be removed from the timeline
      And subsequent beads should re-number
      And the answer should not reference the redacted bead
