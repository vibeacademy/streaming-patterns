# UX Standards - Streaming Patterns Library

**Owner**: ux-designer agent
**Last Updated**: 2024-11-30
**Version**: 1.0.0

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Design Tokens](#design-tokens)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Standards](#component-standards)
7. [Accessibility (WCAG 2.1)](#accessibility-wcag-21)
8. [Theme System](#theme-system)
9. [Responsive Design](#responsive-design)
10. [Streaming UX Patterns](#streaming-ux-patterns)
11. [Animation & Motion](#animation--motion)
12. [Iconography](#iconography)
13. [Error States](#error-states)
14. [Audit Checklist](#audit-checklist)

---

## Design Philosophy

### Core Principles

1. **Educational Clarity**: Every design decision prioritizes learning. UI should never obscure the streaming patterns being demonstrated.

2. **Professional Minimalism**: Inspired by Linear, Notion, and Stripe. Clean, focused, distraction-free.

3. **Accessibility First**: WCAG 2.1 AA compliance is mandatory. AAA where practical.

4. **Theme Resilience**: All components must work flawlessly in both light and dark modes.

5. **Progressive Enhancement**: Core functionality works without JavaScript animations.

### Design Inspiration

- **Linear**: Information density, keyboard-first navigation
- **Stripe Docs**: Educational hierarchy, code presentation
- **Notion**: Clean whitespace, flexible layout
- **GitHub**: Developer familiarity, dark mode excellence

---

## Design Tokens

All design values are defined as CSS custom properties in `src/styles/variables.css`.

### Token Naming Convention

```
--{category}-{property}-{variant}

Examples:
--color-text-primary
--space-4
--font-size-lg
--border-radius-md
```

### Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Colors | `--color-` | `--color-primary-500` |
| Spacing | `--space-` | `--space-4` |
| Typography | `--font-` | `--font-size-lg` |
| Borders | `--border-` | `--border-radius-md` |
| Shadows | `--shadow-` | `--shadow-md` |
| Z-Index | `--z-index-` | `--z-index-modal` |
| Transitions | `--transition-` | `--transition-base` |

---

## Color System

### Primary Palette (Brand Blue)

Used for primary actions, links, focus states, and brand identity.

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-primary-50` | #EFF6FF | #1E3A8A | Subtle backgrounds |
| `--color-primary-100` | #DBEAFE | #1E40AF | Hover backgrounds |
| `--color-primary-500` | #3B82F6 | #60A5FA | Primary buttons, links |
| `--color-primary-600` | #2563EB | #93C5FD | Hover states |
| `--color-primary-700` | #1D4ED8 | #BFDBFE | Active states |

### Secondary Palette (Purple Accent)

Used for secondary actions and visual highlights.

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-secondary-500` | #A855F7 | #C084FC |

### Neutral Grays

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-neutral-50` | #F9FAFB | #111827 | Page background |
| `--color-neutral-100` | #F3F4F6 | #1F2937 | Secondary background |
| `--color-neutral-200` | #E5E7EB | #374151 | Borders |
| `--color-neutral-500` | #6B7280 | #9CA3AF | Tertiary text |
| `--color-neutral-600` | #4B5563 | #D1D5DB | Secondary text |
| `--color-neutral-900` | #111827 | #F9FAFB | Primary text |

### Semantic Colors

| Purpose | Token | Light | Dark | Contrast |
|---------|-------|-------|------|----------|
| Success | `--color-success-500` | #10B981 | #34D399 | Use 700 for text |
| Warning | `--color-warning-500` | #F59E0B | #FBBF24 | Use 700 for text |
| Error | `--color-error-500` | #EF4444 | #F87171 | Safe for text |
| Info | `--color-info-500` | #3B82F6 | #60A5FA | Use 700 for text |

### Semantic Aliases

Always use these semantic tokens instead of direct color values:

```css
/* Text */
--color-text-primary    /* Main content */
--color-text-secondary  /* Supporting content */
--color-text-tertiary   /* Subtle content */
--color-text-inverse    /* Text on dark backgrounds */
--color-text-link       /* Hyperlinks */

/* Backgrounds */
--color-bg-primary      /* Main background */
--color-bg-secondary    /* Cards, sections */
--color-bg-tertiary     /* Nested elements */

/* Borders */
--color-border-light    /* Subtle dividers */
--color-border-medium   /* Standard borders */
--color-border-dark     /* Emphasized borders */
```

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--font-size-xs` | 12px | 400 | 1.5 | Captions, badges |
| `--font-size-sm` | 14px | 400 | 1.5 | Secondary text, labels |
| `--font-size-base` | 16px | 400 | 1.5 | Body text |
| `--font-size-lg` | 18px | 500 | 1.5 | Emphasized body |
| `--font-size-xl` | 20px | 600 | 1.25 | Card titles |
| `--font-size-2xl` | 24px | 700 | 1.25 | Section titles |
| `--font-size-3xl` | 30px | 700 | 1.25 | Page subtitles |
| `--font-size-4xl` | 36px | 800 | 1.2 | Page titles |

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Emphasized text |
| `--font-weight-semibold` | 600 | Subheadings, buttons |
| `--font-weight-bold` | 700 | Headings |

### Typography Hierarchy

```
H1 (Page Title)     → 36px, 800 weight, --color-text-primary
H2 (Section Title)  → 24px, 700 weight, --color-text-primary
H3 (Card Title)     → 20px, 600 weight, --color-text-primary
Body                → 16px, 400 weight, --color-text-primary
Body Secondary      → 16px, 400 weight, --color-text-secondary
Caption             → 14px, 400 weight, --color-text-tertiary
Code                → 14px, 400 weight, --font-mono
```

---

## Spacing & Layout

### Spacing Scale (4px base)

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-0` | 0 | 0 | No space |
| `--space-1` | 0.25rem | 4px | Tight spacing |
| `--space-2` | 0.5rem | 8px | Related elements |
| `--space-3` | 0.75rem | 12px | Small gaps |
| `--space-4` | 1rem | 16px | Standard padding |
| `--space-6` | 1.5rem | 24px | Medium gaps |
| `--space-8` | 2rem | 32px | Section spacing |
| `--space-12` | 3rem | 48px | Major sections |
| `--space-16` | 4rem | 64px | Page sections |

### Layout Guidelines

**Component Internal Padding:**
- Small components: `--space-2` (8px)
- Cards, panels: `--space-4` (16px)
- Sections: `--space-6` to `--space-8`

**Component External Margin:**
- Related items: `--space-2` to `--space-4`
- Separate sections: `--space-8` to `--space-12`
- Page sections: `--space-12` to `--space-16`

### Container Widths

```css
--container-sm: 640px   /* Narrow content */
--container-md: 768px   /* Medium content */
--container-lg: 1024px  /* Wide content */
--container-xl: 1280px  /* Full-width */
--container-2xl: 1536px /* Extra wide */
```

---

## Component Standards

### Buttons

**Variants:**

| Variant | Background | Text | Border | Use Case |
|---------|------------|------|--------|----------|
| Primary | `--color-primary-500` | white | none | Main actions |
| Secondary | transparent | `--color-text-primary` | `--color-border-medium` | Secondary actions |
| Ghost | transparent | `--color-text-secondary` | none | Tertiary actions |
| Danger | `--color-error-500` | white | none | Destructive actions |

**Sizes:**

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| Small | 32px | 8px 12px | 14px |
| Medium | 40px | 10px 16px | 14px |
| Large | 48px | 12px 24px | 16px |

**States:**
```css
:hover    → Darken background 10%, or lighten in dark mode
:focus    → 3px ring (--shadow-focus)
:active   → Darken background 15%
:disabled → opacity: 0.5, cursor: not-allowed
```

### Cards

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg); /* 8px */
  padding: var(--space-4); /* 16px */
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Form Inputs

```css
.input {
  height: var(--input-height-md); /* 40px */
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-medium);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-focus);
}

.input:invalid,
.input[aria-invalid="true"] {
  border-color: var(--color-error-500);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-full);
}

/* Variants */
.badge-success { background: var(--color-success-50); color: var(--color-success-700); }
.badge-warning { background: var(--color-warning-50); color: var(--color-warning-700); }
.badge-error   { background: var(--color-error-50); color: var(--color-error-700); }
.badge-info    { background: var(--color-info-50); color: var(--color-info-700); }
```

---

## Accessibility (WCAG 2.1)

### Contrast Requirements

| Content Type | Minimum Ratio | Requirement |
|--------------|---------------|-------------|
| Normal text (<18px) | 4.5:1 | AA |
| Large text (18px+ or 14px bold) | 3:1 | AA |
| UI components | 3:1 | AA |
| Focus indicators | 3:1 | AA |

### Safe Color Combinations

**Light Mode:**
- `--color-text-primary` (#111827) on `--color-bg-primary` (#FFFFFF) = 16.1:1
- `--color-text-secondary` (#4B5563) on `--color-bg-primary` (#FFFFFF) = 7.5:1

**Dark Mode:**
- `--color-text-primary` (#F9FAFB) on `--color-bg-primary` (#111827) = 15.1:1
- `--color-text-secondary` (#D1D5DB) on `--color-bg-primary` (#111827) = 10.7:1

### Keyboard Navigation

1. **Tab Order**: Logical, follows visual flow
2. **Focus Visible**: All interactive elements show focus ring
3. **Skip Links**: Provide "Skip to content" link
4. **No Traps**: Users can tab out of any component

```css
/* Focus ring standard */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### Screen Reader Support

```html
<!-- Semantic structure -->
<main role="main" aria-label="Pattern Demo">
  <h1>Chain of Reasoning</h1>
  <section aria-label="Reasoning Steps">
    <article role="log" aria-live="polite">
      <!-- Streaming content announced -->
    </article>
  </section>
</main>

<!-- Interactive elements -->
<button aria-label="Promote reasoning step to plan">
  Promote
</button>

<!-- Loading states -->
<div role="status" aria-live="polite">
  Loading reasoning steps...
</div>
```

### Motion Sensitivity

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Theme System

### Implementation

Themes are controlled via `[data-theme]` attribute on `:root`:

```html
<html data-theme="light"> <!-- or "dark" -->
```

### Theme Toggle

```tsx
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
```

### Theme-Safe CSS

```css
/* ALWAYS use CSS variables */
.component {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
}

/* NEVER hardcode colors */
.component {
  background: #ffffff; /* BAD */
  color: #111827;      /* BAD */
}
```

### Testing Both Themes

Always verify components in both themes:

1. Toggle theme in browser DevTools: `document.documentElement.setAttribute('data-theme', 'dark')`
2. Check text contrast
3. Verify border visibility
4. Ensure shadows are visible but not harsh

---

## Responsive Design

### Breakpoints

```css
/* Mobile First */
/* Base: 0-639px (mobile) */

@media (min-width: 640px)  { /* sm: tablets */ }
@media (min-width: 768px)  { /* md: small laptops */ }
@media (min-width: 1024px) { /* lg: laptops */ }
@media (min-width: 1280px) { /* xl: desktops */ }
@media (min-width: 1536px) { /* 2xl: large screens */ }
```

### Responsive Patterns

**Stack on Mobile:**
```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Touch Targets:**
- Minimum 44x44px for touch targets
- 8px minimum spacing between targets

---

## Streaming UX Patterns

### Loading States

```css
/* Skeleton Loader */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary-500);
  border-radius: 50%;
  animation: pulse 1.4s infinite;
}
```

### Real-Time Updates

1. **Auto-scroll**: Smooth scroll to new content
2. **New Item Animation**: Fade-in with subtle slide
3. **Connection Status**: Visual indicator for stream state

```css
/* New item animation */
.new-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Network Inspector

- Monospace font for JSON
- Color-coded event types
- Timestamp in subtle gray
- Expandable payload sections

---

## Animation & Motion

### Timing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease-in-out | Hovers, toggles |
| `--transition-base` | 200ms ease-in-out | Standard transitions |
| `--transition-slow` | 300ms ease-in-out | Complex animations |

### Animation Guidelines

1. **Duration**: Keep under 300ms for UI feedback
2. **Easing**: Use `ease-out` for entrances, `ease-in` for exits
3. **Properties**: Animate `transform` and `opacity` for performance
4. **Reduced Motion**: Always respect user preference

---

## Iconography

### Icon Standards

- **Style**: Outline icons (Heroicons, Lucide)
- **Size**: 16px (small), 20px (default), 24px (large)
- **Stroke**: 1.5px stroke width
- **Color**: Inherit from text color

```css
.icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
  color: currentColor;
}
```

---

## Error States

### Error Message Pattern

```css
.error-message {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-error-50);
  border: 1px solid var(--color-error-500);
  border-radius: var(--border-radius-md);
  color: var(--color-error-700);
}
```

### Form Validation

```css
.input-error {
  border-color: var(--color-error-500);
}

.error-text {
  font-size: var(--font-size-sm);
  color: var(--color-error-700);
  margin-top: var(--space-1);
}
```

---

## Audit Checklist

### Visual Consistency

- [ ] All colors use CSS variables
- [ ] Typography follows hierarchy
- [ ] Spacing uses --space-* tokens
- [ ] Border radius is consistent
- [ ] Shadows follow elevation system

### Accessibility

- [ ] Color contrast meets 4.5:1 for text
- [ ] All interactive elements are focusable
- [ ] Focus indicators are visible (3px ring)
- [ ] ARIA labels on icon-only buttons
- [ ] Reduced motion is respected

### Theme Compatibility

- [ ] Component works in light mode
- [ ] Component works in dark mode
- [ ] No hardcoded color values
- [ ] Shadows visible but not harsh in dark mode

### Responsive

- [ ] Layout works on mobile (320px)
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable without zooming
- [ ] No horizontal scroll on mobile

### Streaming UX

- [ ] Loading states are present
- [ ] Real-time updates animate smoothly
- [ ] Connection status is visible
- [ ] Errors are handled gracefully

---

## Changelog

### v1.0.0 (2024-11-30)
- Initial UX standards document
- Design token definitions
- Component standards
- Accessibility requirements
- Theme system documentation
