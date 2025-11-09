---
description: Check progress toward a roadmap milestone
---

Launch the agile-backlog-prioritizer agent to assess progress toward a specific milestone defined in `docs/PRODUCT-ROADMAP.md`.

**Usage**: `/check-milestone <milestone-name>`

**Example**: `/check-milestone "Foundation Complete"`

## What This Command Does

The agent will perform a comprehensive milestone health check:

### 1. Milestone Overview
- Read the milestone definition from `docs/PRODUCT-ROADMAP.md`
- Identify target completion date
- List all epics and tasks associated with the milestone
- Review exit criteria and success metrics

### 2. Progress Analysis
- Query project board at https://github.com/orgs/vibeacademy/projects/3
- Count issues in each status (Done, In Review, In Progress, Ready, Backlog)
- Calculate completion percentage
- Identify completed vs. remaining work

### 3. Blocker & Risk Assessment
- Identify blocked tickets (missing dependencies, unclear requirements)
- Flag tickets with no assignee or stale activity
- Review dependency chains and critical path items
- Assess risk factors (scope creep, technical debt, unclear specs)

### 4. Velocity & Forecasting
- Calculate team velocity (tickets completed per week)
- Estimate remaining effort based on incomplete tickets
- Project completion date based on current velocity
- Compare projected vs. target completion date

### 5. Recommendations
- **If on track**: Continue current pace, monitor risks
- **If behind schedule**:
  - Identify which tasks can be deferred to next milestone
  - Recommend parallelization opportunities
  - Suggest scope reduction if necessary
  - Flag tickets needing urgent attention
- **If ahead**: Consider pulling in work from next milestone

## Output Format

The agent should provide:

```markdown
## Milestone: <Name>
**Target Date**: <Date from roadmap>
**Projected Date**: <Based on velocity>
**Status**: 🟢 On Track | 🟡 At Risk | 🔴 Behind Schedule

### Progress Summary
- ✅ Completed: X tasks (Y%)
- 🔄 In Progress: X tasks
- ⏳ Ready: X tasks
- 📋 Backlog: X tasks
- **Total**: X tasks

### Critical Path Items
1. [#123] Item name - Status - Blockers
2. [#124] Item name - Status - Blockers

### Blockers & Risks
- 🚫 Blocker: Description
- ⚠️ Risk: Description

### Velocity Analysis
- Avg velocity: X tasks/week
- Remaining effort: Y tasks
- Estimated completion: <Date>
- Delta from target: +/- X days

### Recommendations
1. Action item
2. Action item
```

## Milestone Names (from PRODUCT-ROADMAP.md)

Available milestones:
- "Foundation Complete" (Dec 1, 2024)
- "Foundational Patterns Complete" (Dec 22, 2024)
- "Pattern Library Complete" (Jan 19, 2025)
- "Public Launch" (Feb 2, 2025)

## Best Practices

- Run this command weekly to monitor milestone health
- Use Memory MCP to track velocity trends over time
- Update PRODUCT-ROADMAP.md if target dates need adjustment
- Create new issues if gaps are identified during the check
- Move scope to next milestone if behind (don't compromise quality)
