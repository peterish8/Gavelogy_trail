---
name: Design System
description: Load when building reusable UI components, establishing design tokens, creating consistent typography/color/spacing systems, or standardizing component patterns
---

# Purpose
Establish and maintain a consistent, premium design system for Gavelogy using Tailwind CSS v4 tokens, reusable component patterns, and a unified visual language across all pages.

# When to Use
- Creating new UI components
- Standardizing existing inconsistent components
- Adding new color variants or typography styles
- Building a component library or style guide
- Ensuring visual consistency across pages

# Key Files
| File | Role |
|------|------|
| `src/app/globals.css` | Design tokens via `@theme` |
| `src/components/ui/` | Reusable primitive components |
| `src/lib/utils.ts` | `cn()` utility for conditional classes |

# Core Concepts

## Design Tokens in Tailwind v4

Define all tokens in CSS using Tailwind v4's `@theme` syntax:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* === Colors === */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.04 250);
  --color-primary-200: oklch(0.86 0.08 250);
  --color-primary-300: oklch(0.76 0.12 250);
  --color-primary-400: oklch(0.66 0.16 250);
  --color-primary-500: oklch(0.55 0.20 250);
  --color-primary-600: oklch(0.48 0.20 250);
  --color-primary-700: oklch(0.40 0.18 250);
  --color-primary-800: oklch(0.33 0.15 250);
  --color-primary-900: oklch(0.26 0.12 250);

  --color-surface: oklch(0.99 0.002 250);
  --color-surface-secondary: oklch(0.96 0.005 250);
  --color-surface-elevated: oklch(1 0 0);

  --color-text-primary: oklch(0.15 0.01 250);
  --color-text-secondary: oklch(0.45 0.02 250);
  --color-text-muted: oklch(0.65 0.01 250);

  --color-success: oklch(0.65 0.2 145);
  --color-warning: oklch(0.75 0.18 85);
  --color-error: oklch(0.60 0.22 25);

  /* === Typography Scale === */
  --font-family-display: 'Outfit', sans-serif;
  --font-family-body: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */

  /* === Spacing Scale === */
  --spacing-xs: 0.25rem;  /* 4px */
  --spacing-sm: 0.5rem;   /* 8px */
  --spacing-md: 1rem;     /* 16px */
  --spacing-lg: 1.5rem;   /* 24px */
  --spacing-xl: 2rem;     /* 32px */
  --spacing-2xl: 3rem;    /* 48px */
  --spacing-3xl: 4rem;    /* 64px */

  /* === Border Radius === */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.07), 0 2px 4px -2px oklch(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.08), 0 4px 6px -4px oklch(0 0 0 / 0.04);
  --shadow-glow: 0 0 20px oklch(0.55 0.20 250 / 0.3);

  /* === Transitions === */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 450ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Component Architecture

### Button Component
```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-medium transition-all rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg',
        secondary: 'bg-surface-secondary text-text-primary hover:bg-primary-50 border border-primary-200',
        ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
        danger: 'bg-error text-white hover:opacity-90',
        success: 'bg-success text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({ className, variant, size, isLoading, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={isLoading} {...props}>
      {isLoading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
}
```

### Card Component
```tsx
// src/components/ui/card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all',
        {
          'bg-surface border border-primary-100': variant === 'default',
          'bg-surface-elevated shadow-lg': variant === 'elevated',
          'bg-surface-elevated/60 backdrop-blur-xl border border-white/20': variant === 'glass',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### Badge Component
```tsx
// src/components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        outline: 'border border-primary-200 text-primary-600',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

## Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Color tokens | `color-{name}-{shade}` | `color-primary-500` |
| Text colors | `color-text-{level}` | `color-text-secondary` |
| Surface colors | `color-surface-{variant}` | `color-surface-elevated` |
| Spacing | `spacing-{size}` | `spacing-lg` |
| Component files | kebab-case | `data-table.tsx` |
| Component exports | PascalCase | `DataTable` |
| Variant props | camelCase | `isLoading` |

# Best Practices

1. **Token first** — always use design tokens, never hardcode `#hex` or `px` values
2. **CVA for variants** — use `class-variance-authority` for all multi-variant components
3. **`cn()` for overrides** — always accept `className` prop and merge with `cn()`
4. **Composition over config** — prefer `<Card><CardHeader>` over 50 props
5. **One component per file** — keep files small and focused
6. **Document with comments** — each component should have a JSDoc comment

# Common Pitfalls

1. **Inconsistent spacing** → use tokens not arbitrary values
2. **Color hardcoding** → breaks dark mode and theming
3. **Missing focus styles** → accessibility failure
4. **No loading states** → buttons/cards need skeleton/spinner states
5. **Giant component files** → split into sub-components

# Related Skills
- `tailwind-v4` — Tailwind CSS v4 syntax and configuration
- `framer-motion` — Animation patterns for components
- `accessibility` — Accessible component patterns
- `dark-mode` — Theme switching implementation
