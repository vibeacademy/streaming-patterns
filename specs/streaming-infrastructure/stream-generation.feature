Feature: Stream Event Generation
  As a Streaming Infrastructure Context
  I want to generate mock streaming events from fixtures
  So that pattern demos receive deterministic, realistic event streams

  Background:
    Given a fixture repository loaded with test fixtures

  Scenario: Create stream session from fixture
    Given a fixture named "reasoning-sprint-planning"
    And delay profile "normal"
    When I create a stream session with this fixture
    Then the session should be in "active" state
    And the session should have a unique session ID
    And the stream cursor should be at position 0

  # Invariant: INV-4 - Events must be emitted in order
  Scenario: Events are emitted in fixture order
    Given a stream session with fixture "reasoning-sprint-planning"
    When I consume all events from the stream
    Then events should be emitted in the order defined in the fixture
    And event IDs should match fixture event IDs
    And no events should be skipped

  # Invariant: INV-5 - Timestamps must be monotonically increasing
  Scenario: Event timestamps are monotonically increasing
    Given a stream session with fixture "reasoning-sprint-planning"
    When I consume all events from the stream
    Then each event timestamp should be >= the previous event timestamp
    And the timestamp delta should approximate the delay profile

  Scenario: Delay profiles control timing
    Given a fixture with 5 events
    When I create a stream session with delay profile "fast"
    And I measure the time to consume all events
    Then total time should be approximately 250ms (5 events × 50ms)

    When I create a stream session with delay profile "normal"
    And I measure the time to consume all events
    Then total time should be approximately 1500ms (5 events × 300ms)

    When I create a stream session with delay profile "slow"
    And I measure the time to consume all events
    Then total time should be approximately 5000ms (5 events × 1000ms)

  Scenario: Stream enrichment adds metadata
    Given a stream session with fixture "reasoning-sprint-planning"
    When I consume an event from the stream
    Then the event should have a sessionId
    And the event should have a timestamp
    And the event should preserve original payload from fixture
    And the event should have metadata.source = "mock"

  # Invariant: INV-7 - Session must close cleanly
  Scenario: Stream session closes after all events
    Given a stream session with fixture containing 7 events
    When I consume all 7 events
    Then the stream should close automatically
    And the session state should be "closed"
    And no more events should be emittable

  Scenario: Stream session can be closed early
    Given an active stream session
    And 3 events have been consumed
    When I close the stream session
    Then the session state should be "closed"
    And the stream should stop emitting events
    And cleanup should be triggered

  Scenario: Paused stream retains cursor position
    Given a stream session with fixture containing 10 events
    And 4 events have been consumed
    When I pause the stream
    Then the cursor position should be 4
    And the session state should be "paused"
    When I resume the stream
    Then the next event should be event 5
    And the cursor position should advance to 5

  # Invariant: INV-8 - Cannot emit events from closed session
  Scenario: Closed session rejects event emission
    Given a stream session
    When I close the session
    And I attempt to consume another event
    Then the stream should be exhausted
    And no event should be emitted

  Scenario: Event types are preserved from fixture
    Given a fixture with mixed event types:
      | type      | count |
      | reasoning | 5     |
      | answer    | 3     |
      | memory    | 2     |
    When I consume all events from the stream
    Then I should receive 5 "reasoning" events
    And I should receive 3 "answer" events
    And I should receive 2 "memory" events
    And events should maintain type-specific payloads

  Scenario: Stream handles empty fixture
    Given an empty fixture
    When I create a stream session with this fixture
    Then the stream should close immediately
    And no events should be emitted

  Scenario: Large fixture streaming performance
    Given a fixture with 1000 events
    When I create a stream session with delay profile "fast"
    And I consume all events
    Then all 1000 events should be delivered
    And memory usage should remain constant
    And no events should be buffered unnecessarily

  # Invariant: INV-9 - Event payloads must match schema
  Scenario: Event payloads conform to schema
    Given a stream session with fixture "reasoning-sprint-planning"
    When I consume events from the stream
    Then "reasoning" events should have {id, summary, confidence}
    And "answer" events should have {text}
    And all events should have {type, data, timestamp}

  Scenario: Stream cursor tracks position accurately
    Given a stream session with fixture containing 10 events
    When I consume 3 events
    Then the cursor position should be 3
    And cursor.isAtEnd() should be false
    When I consume 7 more events
    Then the cursor position should be 10
    And cursor.isAtEnd() should be true

  Scenario: Concurrent stream sessions are independent
    Given fixture "reasoning-sprint-planning"
    When I create stream session A with this fixture
    And I create stream session B with this fixture
    Then session A and session B should have different session IDs
    When I pause session A
    Then session B should continue streaming
    When I close session B
    Then session A should remain paused and functional
