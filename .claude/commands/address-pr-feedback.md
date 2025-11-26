Launch the github-ticket-worker agent to address pull request review feedback and implement requested changes.

**Command Usage:**
```
/address-pr-feedback {PR_NUMBER}
```

**Example:**
```
/address-pr-feedback 124
```

**Your tasks:**

1. **Retrieve PR Review Feedback:**
   - Fetch PR #{PR_NUMBER} details from GitHub
   - Read all review comments (both inline code comments and general review comments)
   - Identify specific change requests from pr-reviewer-merger agent or human reviewers
   - Parse requested changes into actionable tasks

2. **Analyze Review Comments:**
   - Categorize feedback by type:
     - Code quality issues (TypeScript, linting, formatting)
     - Test coverage gaps
     - Performance concerns
     - Security issues
     - Documentation missing/incomplete
     - Architectural suggestions
     - Bug fixes needed
   - Prioritize critical issues first
   - Create a task list of all changes needed

3. **Checkout and Update the PR Branch:**
   - Fetch the PR branch from remote
   - Checkout the branch locally
   - Ensure you're on the correct branch before making changes

4. **Implement Requested Changes:**
   - Address each review comment systematically
   - For code changes:
     - Fix TypeScript errors or `any` types
     - Add missing tests to improve coverage
     - Update documentation
     - Refactor code per suggestions
     - Fix security vulnerabilities
   - For each change, add a comment referencing which review feedback it addresses

5. **Verify Changes:**
   - Run tests: `npm test`
   - Run linter: `npm run lint`
   - Run build: `npm run build`
   - Ensure all checks pass before committing
   - If tests/build fail, fix issues and re-verify

6. **Commit and Push Updates:**
   - Create atomic commits for logical groups of changes
   - Use descriptive commit messages referencing review comments:
     ```
     Address PR #{PR_NUMBER} review feedback: {specific change}

     - {change 1}
     - {change 2}

     Addresses review comment: {link or description}
     ```
   - Push changes to the same branch (will update the PR automatically)

7. **Comment on PR:**
   - Add a comment to PR #{PR_NUMBER} summarizing all changes made
   - Reference which review comments were addressed
   - Mention if any feedback couldn't be addressed (with reasons)
   - Request re-review from the pr-reviewer-merger agent

**Example PR Comment:**
```markdown
## Review Feedback Addressed ✅

I've implemented all requested changes from the review:

### Changes Made:
1. **TypeScript Compliance** (Review comment #1)
   - Removed `any` types in `hooks.ts:186`
   - Added explicit return types to all functions

2. **Test Coverage** (Review comment #2)
   - Added 5 new test cases for edge cases
   - Coverage increased from 75% to 88%

3. **Documentation** (Review comment #3)
   - Added JSDoc comments to all public functions
   - Updated README with usage examples

4. **Performance** (Review comment #4)
   - Memoized expensive calculations with useMemo
   - Reduced re-renders by 40%

### Test Results:
- ✅ All 760 tests passing
- ✅ Build succeeds (792ms)
- ✅ No TypeScript errors
- ✅ No ESLint warnings

### Ready for Re-Review
All review feedback has been addressed. Please re-review when ready.

@pr-reviewer-merger ready for second review
```

**Important Guidelines:**
- **Preserve the original intent:** Don't change functionality unless specifically requested
- **Maintain code quality:** Follow CLAUDE.md standards
- **Test thoroughly:** All tests must pass before pushing
- **Communicate clearly:** Explain what you changed and why
- **Don't over-engineer:** Only address the specific feedback given
- **Ask if unclear:** If review feedback is ambiguous, ask for clarification before implementing

**Error Handling:**
- If PR number is invalid: Report error and exit
- If no review comments found: Report and ask user for clarification
- If changes cause test failures: Fix issues before pushing, or report blockers
- If review feedback is contradictory: Ask user which approach to take

**Success Criteria:**
- All review comments addressed
- Tests passing
- Build successful
- Changes committed and pushed
- PR comment added with summary
- PR moved back to "In Review" status (if applicable)

Return a detailed summary of:
- What review feedback was found
- What changes were implemented
- Test results
- Any feedback that couldn't be addressed (with reasons)
- Link to the updated PR
