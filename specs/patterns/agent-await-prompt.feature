Feature: Agent Await Prompt Pattern
  As a user of the Agent Await Prompt pattern
  I want the agent to clearly request missing information and pause
  So that I can provide the necessary data without losing context

  Background:
    Given an Agent Await Prompt demo
    And StreamFlow PM context with project "New Mobile App"
    And the fixture "project-setup-with-missing-info"

  Rule: Agent identifies missing required fields

    Scenario: Agent highlights missing information
      When I start a conversation with "Set up a new project"
      Then the agent should stream its intent
      And it should highlight missing required variables
      And missing fields should be shown inline

    Scenario: Required fields are clearly indicated
      When an "await_input" event is emitted
      Then the UI should display required fields:
        | field       | type     | required |
        | projectName | text     | yes      |
        | budget      | number   | yes      |
        | deadline    | date     | yes      |
        | teamSize    | number   | no       |
      And required fields should have visual indicators
      And optional fields should be marked as such

  Rule: Stream pauses while waiting for input

    Scenario: Suspension with listening animation
      Given the agent is streaming
      When an "await_input" event arrives
      Then the stream should pause
      And the UI should show a "listening" animation
      And a friendly countdown or message should appear
      And the message bubble should remain in place

    Scenario: Inline input fields appear in context
      Given an "await_input" event for fields ["budget", "deadline"]
      When the UI renders the input request
      Then input fields should appear inline in the transcript
      And fields should maintain conversation context
      And the prompt should be right where the agent paused

  Rule: User provides input and stream resumes

    Scenario: Submit complete input
      Given the stream is paused awaiting input
      And required fields are ["projectName", "budget", "deadline"]
      When I enter:
        | field       | value           |
        | projectName | Mobile App v2.0 |
        | budget      | 250000          |
        | deadline    | 2025-03-31      |
      And I click "Submit"
      Then an "input_submission" event should be sent
      And the stream should resume
      And the agent should acknowledge the input
      And the response should continue in the same message bubble

    Scenario: Quick-suggestion chips
      Given the stream is awaiting input for "teamSize"
      And recent conversation mentioned "8 developers"
      When input chips are rendered
      Then I should see a quick-suggestion chip "8"
      When I click the "8" chip
      Then the field should auto-fill with 8
      And I shouldn't need to type manually

    Scenario: Skip with defaults
      Given the stream is awaiting optional input
      When I click "Skip for now"
      Then the agent should use default values
      And the stream should resume
      And the agent should confirm "Using defaults for [field names]"
      And the demo should illustrate graceful degradation

  Rule: Validation and error handling

    Scenario: Invalid input is rejected
      Given the stream is awaiting input for "budget"
      When I enter "-500" (negative number)
      And I click "Submit"
      Then I should see a validation error "Budget must be positive"
      And the input field should be highlighted
      And the stream should remain paused
      And I should be able to correct the input

    Scenario: Partial submission warning
      Given required fields are ["projectName", "budget", "deadline"]
      When I only fill "projectName"
      And I attempt to submit
      Then I should see "2 required fields missing"
      And unfilled required fields should be highlighted
      And submit button should remain disabled

  Rule: Timeout and abandonment handling

    Scenario: Heartbeat prevents timeout
      Given the stream is paused awaiting input
      When 30 seconds elapse
      Then heartbeat events should be sent
      And the connection should remain active
      And the UI should show "Still waiting..."

    Scenario: User abandons input
      Given the stream has been paused for 2 minutes
      And no input has been provided
      When the timeout fallback triggers
      Then the agent should summarize what's still missing
      And the agent should offer to continue without the data
      And the user should be able to resume manually

  Rule: Stream contract is followed

    Scenario: await_input event schema
      When an "await_input" event is emitted
      Then it should have the schema:
        | field            | type   | required |
        | type             | string | yes      |
        | requiredFields   | array  | yes      |
        | optionalFields   | array  | no       |
        | validationHints  | object | no       |
        | timeoutMs        | number | no       |
      And requiredFields should list field names and types

    Scenario: input_submission response
      When the user submits input
      Then the client should send an "input_submission" event
      And the event should include:
        | field  | type   |
        | type   | string |
        | data   | object |
        | fieldValues | object |
      And the server should inject data into the ongoing prompt

  Rule: StreamFlow PM scenario

    Scenario: Project setup requires missing details
      Given a conversation "Set up a new mobile app project"
      When the agent streams intent
      Then it should identify missing information:
        | field       | reason                        |
        | projectName | Required for project creation |
        | budget      | Required for resource planning|
        | deadline    | Required for timeline         |
        | stakeholder | Optional for notifications    |
      And the stream should pause for input
      And the UI should render inline input fields

    Scenario: Resume with provided data
      Given input has been provided:
        | field       | value           |
        | projectName | Mobile App v2.0 |
        | budget      | 250000          |
        | deadline    | 2025-03-31      |
      When the stream resumes
      Then the agent should say "Great! Setting up Mobile App v2.0..."
      And subsequent responses should reference the provided data
      And the network inspector should show input in context

  Rule: Accessibility

    Scenario: Keyboard navigation through input fields
      Given inline input fields are rendered
      When I press "Tab"
      Then the first input should be focused
      When I press "Tab" again
      Then the next input should be focused
      When I press "Shift+Tab"
      Then focus should move backward

    Scenario: Screen reader support
      Given the stream has paused for input
      Then a screen reader should announce "Agent is waiting for input"
      And required fields should be announced with "required"
      When input is submitted
      Then the screen reader should announce "Resuming..."

  Rule: Performance and UX

    Scenario: Smooth transition to input state
      When an "await_input" event arrives
      Then the transition should be smooth (no jank)
      And the input fields should animate in
      And the layout should not shift existing content

    Scenario: Input state is preserved on pause
      Given I have partially filled input fields
      When I pause the demo
      And I resume the demo
      Then my input should still be present
      And focus should be restored

  Rule: Network inspector integration

    Scenario: await_input events are captured
      When the stream emits an "await_input" event
      Then the network inspector should capture it
      And the event should show required fields
      And I should be able to inspect validation hints

    Scenario: input_submission is logged
      When I submit input
      Then the network inspector should capture the submission
      And it should show the submitted field values
      And it should link to the corresponding await_input event
