---
description: Conduct a comprehensive UX audit of the streaming patterns site
---

Launch the ux-designer agent to conduct a full UX review cycle:

1. **Live Site Inspection**
   - Fetch the deployed site at https://streaming-patterns.pages.dev
   - Navigate through all pattern demos
   - Capture visual state in light and dark modes

2. **Visual Consistency Audit**
   - Verify design system token usage
   - Check for hardcoded colors or non-standard values
   - Validate typography hierarchy
   - Review spacing consistency

3. **Accessibility Audit**
   - Test color contrast ratios (WCAG 2.1 AA: 4.5:1 for text)
   - Verify keyboard navigation on all interactive elements
   - Check focus indicators visibility
   - Review ARIA labels and semantic structure
   - Verify reduced-motion support

4. **Theme Compatibility Check**
   - Test all components in light mode
   - Test all components in dark mode
   - Verify text readability in both themes
   - Check border and shadow visibility

5. **Usability Review**
   - Evaluate streaming UX patterns
   - Check loading and error states
   - Review responsive behavior
   - Assess overall user flow clarity

6. **Generate Audit Report**
   - Document all findings by severity (P0/P1/P2/P3)
   - Provide specific file:line references for issues
   - Create GitHub issues for P0/P1 items
   - Update UX-STANDARDS.md if new patterns are identified

**Output**: A comprehensive UX audit report with prioritized action items and recommendations.
