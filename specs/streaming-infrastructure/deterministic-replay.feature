Feature: Deterministic Stream Replay
  As a Streaming Infrastructure Context
  I want stream sessions to replay identically from the same fixture
  So that demos are consistent and educational outcomes are predictable

  Background:
    Given a fixture repository with deterministic fixtures

  # Invariant: INV-13 - Same fixture produces same events (determinism guarantee)
  Scenario: Same fixture produces identical event sequence
    Given fixture "reasoning-sprint-planning"
    When I create stream session A with this fixture
    And I consume all events from session A
    And I record the events as sequence A
    When I create stream session B with the same fixture
    And I consume all events from session B
    And I record the events as sequence B
    Then sequence A should exactly match sequence B
    And event IDs should be identical
    And event payloads should be identical
    And event types should be identical

  Scenario: Determinism holds across multiple replays
    Given fixture "memory-timeline-scenario"
    When I replay the fixture 10 times
    Then all 10 sequences should be identical
    And event count should be the same in all replays
    And event order should be the same in all replays

  Scenario: Timing delays are consistent within tolerance
    Given fixture "table-streaming-scenario"
    And delay profile "normal" with 300ms per event
    When I replay the fixture 5 times
    And I measure inter-event delays for each replay
    Then delay means should be within ±10ms across replays
    And delay variance should be minimal

  # Invariant: INV-14 - Fixtures are immutable
  Scenario: Fixtures cannot be modified during streaming
    Given fixture "validation-checkpoints"
    When I start streaming from this fixture
    And I attempt to modify the fixture data
    Then the modification should not affect the ongoing stream
    And subsequent streams should use the original fixture data

  Scenario: Pausing and resuming maintains determinism
    Given fixture "reasoning-sprint-planning"
    When I create stream session A
    And I consume 5 events from session A
    And I pause session A
    And I consume remaining events from session A
    And I record the full sequence as sequence A

    When I create stream session B
    And I consume all events from session B without pausing
    And I record the full sequence as sequence B

    Then sequence A should match sequence B
    And the pause should not affect event content or order

  Scenario: Fixture versioning ensures consistency
    Given fixture "reasoning-sprint-planning" version "1.0"
    When I stream from this fixture on date X
    And I record the event sequence
    And I stream from this fixture on date Y (weeks later)
    Then both sequences should be identical
    And the fixture version should remain "1.0"
    And fixture contents should be unchanged

  Scenario: Random-seeming fixture is still deterministic
    Given fixture "validation-with-random-failures"
    And the fixture includes "random" failure injection points
    When I replay the fixture 10 times
    Then failures should occur at the same event positions
    And failure types should be identical across replays
    And the "randomness" is actually deterministic

  Scenario: Different fixtures produce different sequences
    Given fixture "reasoning-sprint-planning"
    And fixture "memory-conversation"
    When I stream from "reasoning-sprint-planning" as sequence A
    And I stream from "memory-conversation" as sequence B
    Then sequence A should differ from sequence B
    And event counts should likely differ
    And event types should reflect different patterns

  Scenario: Fixture loading is idempotent
    Given fixture repository
    When I load fixture "reasoning-sprint-planning"
    And I stream from it as sequence A
    When I reload the fixture repository
    And I load fixture "reasoning-sprint-planning" again
    And I stream from it as sequence B
    Then sequence A should match sequence B
    And the fixture data should be identical

  Scenario: Delay profile changes timing, not content
    Given fixture "table-streaming-scenario"
    When I stream with delay profile "fast" as sequence A
    And I stream with delay profile "slow" as sequence B
    Then event content should be identical between A and B
    And event order should be identical between A and B
    But timing should differ according to delay profiles

  Scenario: Fixture supports offline demos
    Given no network connectivity
    And fixture "turn-taking-patches"
    When I create a stream session
    Then streaming should work normally
    And events should be emitted from the fixture
    And no network requests should be made
    And determinism should be maintained

  # Invariant: INV-16 - Fixture format validation
  Scenario: Invalid fixture format is rejected
    Given an invalid fixture missing required fields
    When I attempt to load the fixture
    Then the fixture should fail validation
    And an error should describe what's missing
    And no stream session should be created

  Scenario: Fixture validation catches schema mismatches
    Given a fixture with events missing "type" field
    When I attempt to load the fixture
    Then validation should fail
    And the error should indicate "type field required"

  Scenario: Well-formed fixture passes validation
    Given a fixture with all required fields:
      | field     | present |
      | id        | yes     |
      | version   | yes     |
      | events    | yes     |
      | events[].type | yes |
      | events[].data | yes |
    When I load the fixture
    Then validation should succeed
    And the fixture should be ready for streaming

  Scenario: Fixture caching improves performance
    Given fixture "reasoning-sprint-planning"
    When I load the fixture for the first time
    And I measure load time as T1
    When I load the same fixture again
    And I measure load time as T2
    Then T2 should be significantly less than T1
    And fixture data should be identical

  Scenario: Concurrent fixture access is safe
    Given fixture "memory-timeline-scenario"
    When stream session A is consuming from the fixture
    And stream session B starts consuming from the same fixture
    Then both sessions should stream independently
    And neither session should affect the other
    And the fixture should remain unchanged
