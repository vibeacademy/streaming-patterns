## Summary
<!-- Provide a clear and concise description of what this PR accomplishes -->


## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] New pattern implementation
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Build/CI configuration change
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Related Issues
<!-- Link to related issues. Use "Closes #XXX" to auto-close issues when this PR is merged -->
Closes #


## Changes Made
<!-- Provide a detailed list of changes -->
-
-
-

## Pattern Implementation
<!-- Complete this section only if implementing a new pattern -->

**Pattern Name**:
**Demo Scenario**:
**Mock Data**:
**Stream Events**:

## Testing Checklist
<!-- All items must be checked before submitting -->

### Automated Tests
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Test coverage meets requirements (>80%)

### Code Quality
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Code follows project standards (see [CLAUDE.md](../CLAUDE.md))
- [ ] Props interfaces defined for all components
- [ ] Custom hooks follow naming conventions
- [ ] Mock data is deterministic and replayable

### Pattern-Specific Tests (if applicable)
- [ ] Pattern demo works end-to-end
- [ ] Network inspector captures all stream events
- [ ] Annotated source view renders correctly
- [ ] Mock stream events match specification
- [ ] UI components respond to stream updates

## Documentation Checklist
- [ ] Code has JSDoc comments for complex logic
- [ ] Inline comments explain "why", not "what"
- [ ] Pattern README.md created/updated (if applicable)
- [ ] CONTRIBUTING.md updated (if adding new processes)
- [ ] Type definitions exported and documented

## Manual Testing
<!-- Describe how you manually tested these changes -->

### Steps to Test
1.
2.
3.

### Expected Behavior
<!-- What should happen when following the steps above? -->


## Screenshots / Demo
<!-- For UI changes, include screenshots or GIFs showing the changes -->
<!-- For patterns, include demo of the streaming behavior -->


## Breaking Changes
<!-- If this is a breaking change, describe the impact and migration path -->


## Additional Context
<!-- Add any other context about the PR here -->


## Checklist
<!-- Final review before submitting -->
- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guide
- [ ] My code follows the project's code standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

---

**For Reviewers**:
- Check that all automated tests pass
- Verify TypeScript strict mode compliance
- Test the demo manually (for patterns)
- Review code quality and educational value
- Ensure documentation is clear and complete
