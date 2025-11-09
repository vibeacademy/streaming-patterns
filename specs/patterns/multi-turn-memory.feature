Feature: Multi-Turn Memory Timeline
  As a user of the Multi-Turn Memory Timeline pattern
  I want to see what the agent remembers across conversation turns
  So that I can understand, pin, or prune the agent's memory

  Background:
    Given a Multi-Turn Memory Timeline demo
    And StreamFlow PM context with project "Q4 Planning"
    And the fixture "memory-timeline-scenario"

  Rule: Memory cards stream alongside conversation

    Scenario: Memory cards appear during streaming
      When I start a conversation with "Let's plan Q4 goals"
      Then the agent should stream a message response
      And memory cards should appear in the timeline
      And each card should represent a discrete memory
      And cards should have types: fact, decision, task, risk

    Scenario: Memory timeline is separate from chat
      Given a conversation is streaming
      When memory events are emitted
      Then memory cards should appear in a horizontal timeline
      And the timeline should be separate from the chat thread
      And the timeline should remain visible during scrolling

  Rule: Memory cards have lifecycle events

    Scenario: Memory card creation
      When a "memory.create" event is emitted
      Then a new memory card should appear in the timeline
      And the card should show:
        | field     | visible |
        | summary   | yes     |
        | type      | yes     |
        | timestamp | yes     |
      And the card should have a unique memory ID

    Scenario: Memory card update
      Given an existing memory card with ID "mem-1"
      When a "memory.update" event for "mem-1" is emitted
      Then the card should update in place
      And the updated fields should be highlighted
      And the card should show an "updated" badge
      And the original timestamp should be preserved

    Scenario: Memory card prune
      Given memory cards:
        | id    | summary               | type |
        | mem-1 | Budget is $500k       | fact |
        | mem-2 | John is out this week | fact |
      When a "memory.prune" event for "mem-2" is emitted
      Then card "mem-2" should fade out
      And card "mem-2" should be removed from the timeline
      And card "mem-1" should remain

  Rule: Users can pin and prune memory cards

    Scenario: Pin a memory card
      Given a memory card "Budget is $500k"
      When I click the pin icon on the card
      Then the card should show a pin indicator
      And the card should remain even if prune events arrive
      And the network inspector should capture a "memory.pin" event
      And future turns should include this pinned memory in context

    Scenario: Prune a memory card
      Given a memory card "Old requirement (outdated)"
      When I click the prune icon on the card
      Then the card should be removed from the timeline
      And the network inspector should capture a "memory.prune" event
      And the agent should confirm "Removed from memory"
      And future turns should not include this memory

    Scenario: Pinned cards survive prune events
      Given a memory card "Critical deadline: Nov 30"
      And I have pinned this card
      When a "memory.prune" event for this card arrives from the stream
      Then the card should remain in the timeline
      And it should still show the pin indicator
      And a warning should indicate "Server tried to prune pinned memory"

  Rule: Memory types are visually distinct

    Scenario: Memory card types
      Given memory cards of different types:
        | id    | summary                | type     |
        | mem-1 | Budget is $500k        | fact     |
        | mem-2 | Approved new feature   | decision |
        | mem-3 | Review wireframes      | task     |
        | mem-4 | Tight timeline         | risk     |
      When cards are rendered
      Then "fact" cards should have a blue accent
      And "decision" cards should have a green accent
      And "task" cards should have a purple accent
      And "risk" cards should have a red accent
      And each type should have a distinct icon

  Rule: Memory timeline can be filtered

    Scenario: Filter by memory type
      Given a timeline with 10 memory cards:
        | type     | count |
        | fact     | 4     |
        | decision | 3     |
        | task     | 2     |
        | risk     | 1     |
      When I filter to show only "decision" cards
      Then I should see 3 cards
      And all visible cards should be type "decision"
      When I select "decision" and "risk"
      Then I should see 4 cards

    Scenario: Search memory cards
      Given a timeline with memory cards
      When I search for "budget"
      Then only cards containing "budget" should be visible
      And the search term should be highlighted in cards
      When I clear the search
      Then all cards should be visible again

  Rule: Memory provenance is transparent

    Scenario: Show token excerpt that generated memory
      Given a memory card "Budget approved: $500k"
      When I hover over the card
      Then a tooltip should appear
      And the tooltip should show the exact token excerpt from the stream
      And the excerpt should be quoted: "...approved a budget of $500k..."
      And the tooltip should link to the turn where it was created

    Scenario: Memory timestamp shows creation time
      Given a memory card created at "2024-11-09 10:30:00"
      When I view the card
      Then it should show a relative timestamp "2 hours ago"
      When I hover over the timestamp
      Then it should show the absolute time "Nov 9, 2024 10:30 AM"

  Rule: Stream contract is followed

    Scenario: Memory events have correct schema
      When memory events are emitted
      Then each "memory.create" event should have:
        | field     | type   | required |
        | id        | string | yes      |
        | type      | enum   | yes      |
        | summary   | string | yes      |
        | ttl       | number | no       |
        | metadata  | object | no       |
      And type should be one of: fact, decision, task, risk

    Scenario: Memory events are separate from message events
      When the stream emits events
      Then "memory" events should have type "memory"
      And "message" events should have type "message"
      And both event types can arrive interleaved
      And the UI should route them to separate components

  Rule: Memory influences subsequent turns

    Scenario: Pinned memories feed into next turn
      Given I have pinned memories:
        | id    | summary               |
        | mem-1 | Budget is $500k       |
        | mem-2 | Deadline is Nov 30    |
      When I start a new turn with "What's our timeline?"
      Then the agent's response should reference "Nov 30"
      And the response should show awareness of the deadline memory
      And the network inspector should show pinned memories in the request context

    Scenario: Agent explains how memory influenced response
      Given pinned memory "Budget is $500k"
      When I ask "Can we hire 3 more developers?"
      Then the agent should reference the budget memory
      And the response might say "Given your $500k budget..."
      And the memory card should highlight when referenced

  Rule: Empty state is clear

    Scenario: No memories yet
      Given a conversation with no memory events
      When I view the memory timeline
      Then I should see "No active memories"
      And the empty state should explain what memories are
      And it should say "Memory cards will appear as we talk"

    Scenario: All memories pruned
      Given a timeline that previously had 5 memories
      And all memories have been pruned
      When I view the memory timeline
      Then I should see "No active memories"
      And it should say "All memories have been cleared"

  Rule: StreamFlow PM scenario

    Scenario: Project planning memory evolution
      Given a conversation about "Q4 Planning"
      When the agent processes the prompt
      Then memories should be created for:
        | type     | example_summary                |
        | fact     | Team size is 8 developers      |
        | decision | Focus on mobile app first      |
        | task     | Draft technical spec by Nov 15 |
        | risk     | Tight timeline for Q4 launch   |
      And these memories should persist across turns
      And they should influence subsequent planning discussions

  Rule: Performance requirements

    Scenario: Timeline handles many memory cards
      Given a fixture with 50 memory events
      When all memories are rendered
      Then the timeline should scroll smoothly
      And rendering should complete within 100ms
      And memory usage should remain stable

  Rule: Accessibility

    Scenario: Keyboard navigation through memory cards
      Given a memory timeline with 5 cards
      When I press "Tab" to focus the timeline
      And I press "Arrow Right"
      Then the next card should be focused
      When I press "Enter"
      Then the card should expand to show details

    Scenario: Screen reader support
      Given a memory timeline
      When a new memory card appears
      Then a screen reader should announce "New memory: [type] - [summary]"
      And the timeline should have aria-label="Memory timeline"
      And each card should have aria-label describing its content

  Rule: Memory can be patched mid-stream

    Scenario: Client sends memory.patch command
      Given a memory card "Budget is $500k"
      When I edit the card summary to "Budget is $600k"
      And I save the change
      Then a "memory.patch" event should be sent to the stream
      And the server should acknowledge the patch
      And subsequent responses should use the updated budget
      And the card should show an "edited by user" badge

  Rule: Memory TTL (Time To Live)

    @future
    Scenario: Memory expires after TTL
      Given a memory card with ttl=3600 (1 hour)
      When 1 hour elapses
      Then the memory card should automatically prune
      And a notification should say "Expired memory removed"
      And the agent should not include it in future turns

  Rule: Network inspector integration

    Scenario: Memory events in network inspector
      When memory events are emitted
      Then the network inspector should capture them
      And they should be filterable by type "memory"
      And I should be able to see the full event payload
      And I should see creation, update, and prune events
