Feature: Network Event Inspector
  As a Developer Tools Context
  I want to capture and visualize all streaming events
  So that developers can understand streaming mechanics and debug their implementations

  Background:
    Given a network inspector component
    And a pattern demo is ready

  # Invariant: INV-15 - Network inspector must capture all events
  Scenario: All stream events are captured
    Given a stream session with 10 events
    When the stream emits all 10 events
    Then the network inspector should have captured exactly 10 events
    And no events should be missing
    And events should be captured in emission order

  Scenario: Events are captured with metadata
    Given a running stream session
    When an event is emitted
    Then the network inspector should capture:
      | field           | present |
      | type            | yes     |
      | data            | yes     |
      | timestamp       | yes     |
      | sessionId       | yes     |
      | captureTime     | yes     |
      | sequenceNumber  | yes     |

  Scenario: Real-time event visualization
    Given a network inspector visible in the UI
    And a stream session is streaming
    When a new event is emitted
    Then the event should appear in the inspector within 50ms
    And the event should be highlighted as "new"
    And the highlight should fade after 1 second

  Scenario: Event filtering by type
    Given a captured event log with mixed event types:
      | type       | count |
      | reasoning  | 5     |
      | answer     | 3     |
      | memory     | 4     |
    When I filter to show only "reasoning" events
    Then I should see 5 events in the inspector
    And all visible events should be type "reasoning"
    When I filter to show "reasoning" and "memory"
    Then I should see 9 events in the inspector

  Scenario: Event payload inspection
    Given a captured event with complex payload
    When I click on the event in the inspector
    Then the event should expand
    And I should see a formatted JSON view of the payload
    And the JSON should be syntax highlighted
    And nested objects should be collapsible

  Scenario: Event search and filtering
    Given a captured event log with 50 events
    When I search for "sprint planning"
    Then only events containing "sprint planning" should be visible
    And the search term should be highlighted in results
    When I clear the search
    Then all 50 events should be visible again

  Scenario: Export event log
    Given a captured event log with 20 events
    When I click "Export Events"
    Then a JSON file should download
    And the file should contain all 20 events
    And the file should be valid JSON
    And the file should include metadata:
      | field       | present |
      | exportedAt  | yes     |
      | sessionId   | yes     |
      | patternName | yes     |
      | eventCount  | yes     |

  Scenario: Clear event log
    Given a captured event log with 15 events
    When I click "Clear Events"
    Then the event log should be empty
    And the inspector should show "No events captured"
    And the cleared events should not be recoverable

  Scenario: Event timestamp visualization
    Given a captured event log
    When I view the timeline visualization
    Then events should be plotted on a time axis
    And inter-event delays should be visually apparent
    And hovering over a point should show event details

  Scenario: Copy event to clipboard
    Given a captured event with payload {"id": "1", "summary": "Analyzing backlog"}
    When I click "Copy Event" for this event
    Then the event JSON should be copied to clipboard
    And I should see a "Copied!" confirmation

  Scenario: Event count statistics
    Given a captured event log with mixed types
    When I view the inspector statistics panel
    Then I should see:
      | metric              | displayed |
      | Total events        | yes       |
      | Events by type      | yes       |
      | Average delay       | yes       |
      | Total duration      | yes       |
      | Events per second   | yes       |

  # Invariant: INV-17 - Inspector must not interfere with demo performance
  Scenario: Inspector has minimal performance impact
    Given a stream session with 1000 events
    And delay profile "fast"
    When I stream with inspector enabled
    And I measure streaming time as T1
    When I stream without inspector
    And I measure streaming time as T2
    Then T1 should be within 5% of T2
    And memory usage should not increase significantly

  Scenario: Inspector survives demo reset
    Given a captured event log with 20 events
    When I reset the demo
    And I check the "Preserve inspector log" option
    Then the event log should remain
    And events should be marked as "previous session"
    When I start a new demo
    Then new events should be appended
    And should be visually distinct from old events

  Scenario: Multiple pattern demos with single inspector
    Given pattern demo A is running
    And pattern demo B is running
    When demo A emits an event
    And demo B emits an event
    Then the inspector should show both events
    And events should be tagged with their demo source
    And I should be able to filter by demo source

  Scenario: Event detail drawer
    Given a captured reasoning event
    When I click the event in the inspector
    Then a detail drawer should open
    And I should see:
      | section         | content                    |
      | Event Type      | "reasoning"                |
      | Timestamp       | formatted date/time        |
      | Sequence Number | event's position in stream |
      | Payload         | formatted JSON             |
      | Metadata        | sessionId, captureTime     |

  Scenario: Inspector keyboard navigation
    Given a captured event log with 10 events
    And the inspector has focus
    When I press "j"
    Then the next event should be selected
    When I press "k"
    Then the previous event should be selected
    When I press "Enter"
    Then the selected event should expand
    When I press "Escape"
    Then the event should collapse

  Scenario: Event stream playback
    Given a completed demo with captured events
    When I click "Replay Events"
    Then events should "replay" in the inspector
    And each event should highlight in sequence
    And timing should match original delays
    And I should be able to pause/resume playback

  Scenario: Inspector auto-scroll behavior
    Given a network inspector with 50 events
    And I'm viewing events at the top of the list
    When new events are captured
    Then the inspector should NOT auto-scroll
    And I should see a "New events available" badge

    When I'm viewing the bottom of the list
    And new events are captured
    Then the inspector should auto-scroll to show new events

  Scenario: Event comparison mode
    Given a captured event log
    When I select event 5 and event 8
    And I click "Compare Events"
    Then I should see a side-by-side diff view
    And differences should be highlighted
    And common fields should be visible

  Scenario: Inspector persistence across page reloads
    Given a captured event log with 30 events
    When I reload the page
    And persistence is enabled
    Then the event log should be restored
    And all 30 events should be present
    And I should see a "Restored previous session" message
