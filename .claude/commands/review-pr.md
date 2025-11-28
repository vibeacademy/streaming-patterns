---
description: Review pull requests in the In Review column and provide GO/NO-GO recommendation (human merges)
---

Launch the pr-reviewer agent to:
- Find pull requests linked to tickets in the In Review column on https://github.com/orgs/vibeacademy/projects/3
- Conduct thorough code review against project standards
- Verify tests pass, TypeScript compliance, and pattern implementation correctness
- Post a detailed GO/NO-GO review comment for each PR
- Request changes for PRs that need improvement
- Tag PRs as "Ready for human merge" but DO NOT merge or move tickets to Done
