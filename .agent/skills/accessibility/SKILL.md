---
name: Accessibility
description: Load when implementing WCAG compliance, keyboard navigation, screen reader support, focus management, ARIA patterns, or accessible component design
---

# Purpose
Ensure Gavelogy is accessible to all users including those with visual, motor, and cognitive disabilities by implementing WCAG 2.1 AA standards across all components.

# When to Use
- Building new interactive components
- Adding keyboard navigation
- Fixing screen reader issues
- Running accessibility audits
- Implementing focus management (modals, dropdowns)
- Making game modes accessible

# Core Concepts

## Semantic HTML First

```tsx
// ❌ Bad — div soup
<div className="header">
  <div className="nav">
    <div onClick={handleClick}>Home</div>
  </div>
</div>

// ✅ Good — semantic elements
<header>
  <nav aria-label="Main navigation">
    <a href="/" onClick={handleClick}>Home</a>
  </nav>
</header>
```

## Heading Hierarchy

```tsx
// ✅ Every page has exactly one h1, hierarchy flows down
<h1>Dashboard</h1>          // Page title
  <h2>Your Progress</h2>    // Section
    <h3>Weekly Stats</h3>   // Sub-section
  <h2>Recent Activity</h2>  // Another section

// ❌ Never skip heading levels
<h1>Dashboard</h1>
  <h4>Stats</h4>  // Skipped h2, h3!
```

## Keyboard Navigation

### Focus Management
```tsx
// Trap focus in modals
import { useEffect, useRef } from 'react';

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === 'Escape') {
        // Close modal
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}
```

### Skip Navigation Link
```tsx
// Add at the very top of layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
>
  Skip to main content
</a>

// And the target
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

## ARIA Patterns

### Button with Loading State
```tsx
<button
  onClick={handleSubmit}
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? 'Submitting answer...' : 'Submit answer'}
>
  {isLoading ? <Spinner /> : 'Submit'}
</button>
```

### Live Regions (Announcements)
```tsx
// Announce dynamic changes to screen readers
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {score > 0 && `Score updated: ${score} points`}
</div>

// For urgent announcements (errors)
<div aria-live="assertive" role="alert" className="sr-only">
  {error && `Error: ${error}`}
</div>
```

### Tab Panel Pattern
```tsx
<div role="tablist" aria-label="Game modes">
  {modes.map((mode, i) => (
    <button
      key={mode.id}
      role="tab"
      id={`tab-${mode.id}`}
      aria-selected={activeTab === i}
      aria-controls={`panel-${mode.id}`}
      tabIndex={activeTab === i ? 0 : -1}
      onClick={() => setActiveTab(i)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') setActiveTab((i + 1) % modes.length);
        if (e.key === 'ArrowLeft') setActiveTab((i - 1 + modes.length) % modes.length);
      }}
    >
      {mode.label}
    </button>
  ))}
</div>

{modes.map((mode, i) => (
  <div
    key={mode.id}
    role="tabpanel"
    id={`panel-${mode.id}`}
    aria-labelledby={`tab-${mode.id}`}
    hidden={activeTab !== i}
  >
    {mode.content}
  </div>
))}
```

### Progress Indicators
```tsx
// XP progress bar
<div
  role="progressbar"
  aria-valuenow={currentXP}
  aria-valuemin={0}
  aria-valuemax={maxXP}
  aria-label={`${currentXP} of ${maxXP} XP earned`}
>
  <div style={{ width: `${(currentXP / maxXP) * 100}%` }} />
</div>
```

## Color & Contrast

```css
/* Minimum contrast ratios (WCAG AA):
   - Normal text: 4.5:1
   - Large text (18px+ bold or 24px+): 3:1
   - UI components: 3:1
*/

/* ❌ Low contrast — fails */
.bad { color: oklch(0.8 0.05 250); background: oklch(0.95 0.01 250); }

/* ✅ Good contrast — 4.5:1+ */
.good { color: oklch(0.3 0.05 250); background: oklch(0.95 0.01 250); }
```

## Form Accessibility

```tsx
// ✅ Complete accessible form field
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email address
    <span className="text-error" aria-hidden="true"> *</span>
  </label>
  <input
    id="email"
    name="email"
    type="email"
    required
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : 'email-hint'}
    className={cn('input-base', errors.email && 'border-error')}
  />
  <p id="email-hint" className="text-sm text-text-muted">
    We'll never share your email
  </p>
  {errors.email && (
    <p id="email-error" role="alert" className="text-sm text-error">
      {errors.email}
    </p>
  )}
</div>
```

## Testing Accessibility

```bash
# Automated tools
# 1. Lighthouse in Chrome DevTools → Accessibility audit
# 2. axe DevTools browser extension
# 3. WAVE (Web Accessibility Evaluation Tool)

# Keyboard testing checklist:
# - Tab through entire page — all interactive elements reachable?
# - Shift+Tab — reverse order works?
# - Enter/Space — activates buttons/links?
# - Escape — closes modals/dropdowns?
# - Arrow keys — navigate tabs/menus?
# - Focus visible on every element?

# Screen reader testing:
# - NVDA (Windows, free)
# - VoiceOver (macOS, built-in)
# - ChromeVox (Chrome extension)
```

# Accessibility Checklist

| Item | Status |
|------|--------|
| Skip navigation link | ⬜ |
| Semantic HTML throughout | ⬜ |
| Single `<h1>` per page | ⬜ |
| All images have `alt` text | ⬜ |
| All forms have labels | ⬜ |
| Color contrast ≥ 4.5:1 | ⬜ |
| Keyboard navigable | ⬜ |
| Focus visible on all interactive elements | ⬜ |
| ARIA roles on custom widgets | ⬜ |
| Error messages linked via `aria-describedby` | ⬜ |
| Live regions for dynamic content | ⬜ |
| No content conveyed by color alone | ⬜ |
| Reduced motion support | ⬜ |

## Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

# Common Pitfalls

1. **`onClick` on `<div>`** → use `<button>` or add `role="button"` + `tabIndex={0}` + keyboard handler
2. **Missing `alt` on images** → screen readers read filename
3. **Icon-only buttons** → must have `aria-label`
4. **`display: none` vs `sr-only`** → hidden content is different from visually-hidden-but-readable
5. **Auto-focus on page load** → disorienting for screen reader users
6. **Color as sole indicator** → add icons/text alongside color changes

# Related Skills
- `design-system` — Building accessible components
- `framer-motion` — Respecting `prefers-reduced-motion`
- `dark-mode` — Ensuring contrast in both themes
