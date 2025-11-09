Feature: Pattern Demo Lifecycle
  As a Pattern Exhibition Context
  I want to manage the lifecycle of pattern demonstrations
  So that users can start, pause, resume, reset, and complete demos deterministically

  Background:
    Given a pattern registry with registered patterns
    And a fixture repository with demo scenarios

  # Invariant: INV-1 - Only valid state transitions are allowed
  Scenario: Valid demo state transitions
    Given a pattern demo in "idle" state
    When I start the demo
    Then the demo should transition to "streaming" state
    When I pause the demo
    Then the demo should transition to "paused" state
    When I resume the demo
    Then the demo should transition to "streaming" state
    When the stream completes
    Then the demo should transition to "completed" state

  # Invariant: INV-2 - Demo state must be valid at all times
  Scenario: Invalid state transitions are rejected
    Given a pattern demo in "idle" state
    When I attempt to pause the demo
    Then the operation should fail with error "Cannot pause: demo not streaming"
    And the demo should remain in "idle" state

  Scenario Outline: State transition validation
    Given a pattern demo in "<current_state>" state
    When I attempt to "<action>"
    Then the operation should "<result>"

    Examples:
      | current_state | action | result |
      | idle          | start  | succeed |
      | idle          | pause  | fail |
      | idle          | resume | fail |
      | streaming     | start  | fail |
      | streaming     | pause  | succeed |
      | paused        | resume | succeed |
      | paused        | pause  | fail |
      | completed     | start  | fail |
      | completed     | reset  | succeed |

  Scenario: Starting a demo initializes stream session
    Given a pattern demo for "chain-of-reasoning"
    And fixture "sprint-planning-scenario"
    When I start the demo
    Then a stream session should be created
    And the session should use fixture "sprint-planning-scenario"
    And the demo phase should be "streaming"
    And the network inspector should start capturing events

  Scenario: Pausing a demo suspends event emission
    Given a running pattern demo
    And the demo has emitted 3 events
    When I pause the demo
    Then event emission should stop
    And the stream cursor should preserve its position
    And the demo phase should be "paused"

  Scenario: Resuming a demo continues from pause point
    Given a paused pattern demo
    And the stream cursor is at event 4
    When I resume the demo
    Then event emission should continue
    And the next event should be event 4
    And the demo phase should be "streaming"

  Scenario: Resetting a demo returns to initial state
    Given a completed pattern demo
    When I reset the demo
    Then the stream session should be destroyed
    And all demo state should clear
    And the demo phase should be "idle"
    And the network inspector should clear events

  Scenario: Demo completion triggers cleanup
    Given a running pattern demo
    When the stream emits its final event
    Then the demo should automatically transition to "completed"
    And the stream session should close
    And completion metadata should be recorded
    And the network inspector should remain accessible

  # Invariant: INV-3 - Demo must have a valid fixture before starting
  Scenario: Cannot start demo without fixture
    Given a pattern demo for "chain-of-reasoning"
    And no fixture is selected
    When I attempt to start the demo
    Then the operation should fail with error "Fixture required"
    And the demo should remain in "idle" state

  Scenario: Demo speed controls affect timing
    Given a pattern demo with fixture "sprint-planning-scenario"
    And delay profile set to "fast"
    When I start the demo
    Then events should emit with ~50ms delays

    When I pause and change delay profile to "slow"
    And I resume the demo
    Then subsequent events should emit with ~1000ms delays

  Scenario: Error during streaming transitions to error state
    Given a running pattern demo
    When a stream error occurs
    Then the demo should transition to "error" state
    And the error details should be captured
    And the stream session should close
    And users should see an error message with retry option

  # Invariant: INV-6 - Demo UI must reflect current phase
  Scenario: UI reflects demo phase changes
    Given a pattern demo component
    When the demo phase changes to "streaming"
    Then the UI should show streaming indicators
    And pause button should be enabled
    And start button should be disabled

    When the demo phase changes to "paused"
    Then the UI should show paused indicators
    And resume button should be enabled
    And pause button should be disabled

  Scenario: Multiple demos can run concurrently
    Given pattern demo A for "chain-of-reasoning"
    And pattern demo B for "multi-turn-memory"
    When I start demo A
    And I start demo B
    Then both demos should stream independently
    And network inspector should capture events from both
    And each demo should maintain its own state
    And pausing demo A should not affect demo B

  Scenario: Demo session ID uniqueness
    Given a pattern demo
    When I start the demo
    Then a unique session ID should be generated
    When I reset and start the demo again
    Then a new unique session ID should be generated
    And the new session ID should differ from the previous one
