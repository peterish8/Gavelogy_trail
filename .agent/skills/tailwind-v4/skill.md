---
name: Tailwind CSS v4
description: Load when writing styles, adding animations, theming, or debugging Tailwind CSS v4 in this project — v4 has significant syntax and config changes from v3
---

# Purpose
Tailwind CSS 4 usage in Gavelogy — utility classes, dark mode, CSS variables as theme tokens, animations, and the new CSS-first configuration approach.

# When to Use
- Adding or editing component styles
- Creating animations or transitions
- Configuring theme colors/fonts
- Dark mode implementation
- Debugging why a Tailwind class isn't working
- Migrating v3 patterns to v4

# Setup
```bash
# No tailwind.config.js in v4!
# Config is done in CSS via @theme directive
# PostCSS plugin: @tailwindcss/postcss
```

`postcss.config.mjs`:
```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

`globals.css`:
```css
@import "tailwindcss";  /* v4: single import replaces @tailwind base/components/utilities */
```

# Core Concepts

## What Changed in v4 vs v3

| Feature | v3 | v4 |
|---------|----|----|
| Config file | `tailwind.config.js` | CSS `@theme` directive |
| Import | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Arbitrary values | `text-[#fff]` | Same ✅ |
| CSS variables | External | First-class `@theme` tokens |
| Dark mode | `darkMode: 'class'` in config | `@variant dark {...}` or `.dark:` class |
| Custom utilities | `@layer utilities {}` | Same or `@utility` |
| PostCSS plugin | `tailwindcss` | `@tailwindcss/postcss` |

## Theme Tokens (CSS Variables)
In Gavelogy, tokens are defined in `globals.css`:
```css
@theme {
  --color-primary: #6B9BD2;
  --color-secondary: #F8C9D0;
  --color-accent: #2C2C2C;
  --color-brand-dark: #1a1a2e;
}
```

Use them in classes:
```html
<div class="bg-primary text-secondary border-accent">...</div>
```

Or in arbitrary values:
```html
<div class="bg-[var(--color-primary)]">...</div>
```

## Dark Mode
Class-based dark mode (`.dark` on `<html>`):
```html
<div class="bg-white dark:bg-gray-900 text-black dark:text-white">
```

Toggle in Zustand theme store → sets `document.documentElement.classList.toggle('dark')`.

## Animations
```css
/* globals.css — define keyframes */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@utility animate-shimmer {
  animation: shimmer 2s linear infinite;
}
```

```html
<span class="animate-shimmer bg-gradient-to-r ...">Loading...</span>
```

Built-in from `tailwindcss-animate`:
```html
<div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
```

# Best Practices

## Responsive Design
```html
<!-- Mobile-first (default), then sm/md/lg/xl/2xl breakpoints -->
<div class="flex flex-col md:flex-row gap-4 md:gap-8">
  <aside class="w-full md:w-64">
  <main class="flex-1">
```

## Component Variants with CVA
```ts
// src/components/ui/button.tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        ghost: 'hover:bg-accent/10 text-foreground',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);
```

## Class Merging with `cn()`
```ts
// Always use cn() from src/lib/utils.ts
import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-card p-4', className)} {...props} />;
}
```

## Game UI Patterns
```html
<!-- Arena gradient backgrounds -->
<div class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">

<!-- XP progress bar -->
<div class="h-2 rounded-full bg-gray-700">
  <div class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
       style={{ width: `${xpPercent}%` }} />
</div>

<!-- Coin badge -->
<span class="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-yellow-400 text-sm font-medium">
  <GCoinIcon class="h-4 w-4" /> {coins}
</span>
```

# Code Examples

## Auth Page Background
```tsx
// AuthBackground.tsx — glassmorphism card on gradient
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
  <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
```

## Dashboard Card
```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total XP</h3>
  <p className="text-3xl font-bold text-foreground">{xp.toLocaleString()}</p>
</div>
```

## Loading Skeleton
```html
<div class="h-4 w-3/4 rounded bg-muted animate-pulse" />
<div class="h-4 w-1/2 rounded bg-muted animate-pulse mt-2" />
```

## Mobile Nav
```html
<nav class="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 bg-background border-t border-border md:hidden">
```

# Common Pitfalls

1. **Using old `tailwind.config.js`** — v4 ignores it; use `@theme` in CSS
2. **`@tailwind base/components/utilities`** — replaced by `@import "tailwindcss"` in v4
3. **Arbitrary color without `var()`** — use `bg-[var(--color-primary)]` not `bg-[--color-primary]`
4. **`purge` config** — doesn't exist in v4; content detection is automatic
5. **Missing `dark:` prefix** — remember to define dark variants explicitly for custom components
6. **`tailwind-merge` needed** — without it, conflicting classes (e.g., `p-2 p-4`) don't resolve correctly

# Performance Notes
- v4 is CSS-native — no JS config parsing, faster build times
- Turbopack + v4 = near-instant HMR for style changes
- Avoid `style={{ }}` inline for values that change infrequently — prefer Tailwind utilities
- Large `globals.css` with many `@keyframes` can bloat CSS — use Framer Motion for complex animations instead

# Security Notes
- No security implications specific to Tailwind
- Avoid rendering user-controlled class names: `className={userInput}` → XSS risk if user can inject `onclick` etc. via classes (not applicable in v4 but worth noting)

# Testing Strategy
```ts
// Visual regression with Playwright snapshots
// Check dark mode renders correctly
await page.evaluate(() => document.documentElement.classList.add('dark'));
await expect(page).toHaveScreenshot('dashboard-dark.png');
```

# Upgrade / Versioning Notes
- **v4.0**: Complete rewrite — CSS-first config, new PostCSS plugin, new import syntax
- **v4.1+**: `@starting-style`, `field-sizing`, and more new CSS features being added
- Migration guide: `npx @tailwindcss/upgrade@next` (automated codemod)
- Watch: https://tailwindcss.com/blog

# Related Skills
- `framer-motion` — For complex animations beyond Tailwind Animate
- `nextjs-app-router` — Global styles loaded in root layout
