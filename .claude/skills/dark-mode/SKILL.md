---
name: Dark Mode
description: Load when implementing dark/light theme switching, configuring theme tokens, handling system preference detection, or fixing theme-related styling issues
---

# Purpose
Implement a robust dark/light theme system for Gavelogy using Tailwind v4 CSS custom properties, system preference detection, and persistent user choice.

# When to Use
- Adding dark mode support
- Fixing colors that look wrong in dark mode
- Adding theme toggle to settings/navbar
- Debugging `prefers-color-scheme` issues
- Ensuring contrast ratios in both themes

# Core Concepts

## Theme Tokens in CSS

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Light theme (default) */
:root {
  --color-bg: oklch(0.99 0.002 250);
  --color-bg-secondary: oklch(0.96 0.005 250);
  --color-bg-elevated: oklch(1 0 0);
  --color-bg-overlay: oklch(0 0 0 / 0.5);

  --color-text: oklch(0.15 0.01 250);
  --color-text-secondary: oklch(0.45 0.02 250);
  --color-text-muted: oklch(0.65 0.01 250);

  --color-border: oklch(0.90 0.01 250);
  --color-border-hover: oklch(0.80 0.02 250);

  --color-primary: oklch(0.55 0.20 250);
  --color-primary-hover: oklch(0.48 0.20 250);
  --color-primary-light: oklch(0.93 0.04 250);

  --color-success: oklch(0.65 0.2 145);
  --color-warning: oklch(0.75 0.18 85);
  --color-error: oklch(0.60 0.22 25);

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.08);
}

/* Dark theme */
.dark {
  --color-bg: oklch(0.14 0.01 250);
  --color-bg-secondary: oklch(0.18 0.01 250);
  --color-bg-elevated: oklch(0.22 0.015 250);
  --color-bg-overlay: oklch(0 0 0 / 0.7);

  --color-text: oklch(0.93 0.005 250);
  --color-text-secondary: oklch(0.70 0.015 250);
  --color-text-muted: oklch(0.50 0.01 250);

  --color-border: oklch(0.28 0.015 250);
  --color-border-hover: oklch(0.38 0.02 250);

  --color-primary: oklch(0.65 0.18 250);
  --color-primary-hover: oklch(0.72 0.16 250);
  --color-primary-light: oklch(0.25 0.06 250);

  --color-success: oklch(0.70 0.18 145);
  --color-warning: oklch(0.80 0.16 85);
  --color-error: oklch(0.65 0.20 25);

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.5);
}
```

## Theme Provider with Zustand

```ts
// src/lib/stores/theme.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        let resolved: 'light' | 'dark';

        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = theme;
        }

        // Apply to DOM
        document.documentElement.classList.toggle('dark', resolved === 'dark');

        set({ theme, resolvedTheme: resolved });
      },
    }),
    {
      name: 'gavelogy-theme',
      onRehydrateStorage: () => (state) => {
        // Re-apply theme on page load
        if (state) state.setTheme(state.theme);
      },
    }
  )
);
```

## Theme Initializer (Prevent Flash)

```tsx
// src/app/layout.tsx
// Add this script to <head> to prevent FOUC (flash of unstyled content)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = JSON.parse(localStorage.getItem('gavelogy-theme') || '{}');
                  var theme = stored.state?.theme || 'system';
                  var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
```

## Theme Toggle Component

```tsx
'use client';
import { useThemeStore } from '@/lib/stores/theme';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === value}
          className={`
            p-2 rounded-md transition-all
            ${theme === value
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }
          `}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
```

## System Preference Listener

```ts
// Listen for OS theme changes when in "system" mode
useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    const { theme, setTheme } = useThemeStore.getState();
    if (theme === 'system') {
      setTheme('system'); // re-resolve
    }
  };

  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

## Using Theme Colors in Components

```tsx
// ✅ Use CSS custom properties
<div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)]">
  <h2 className="text-[var(--color-text)]">Title</h2>
  <p className="text-[var(--color-text-secondary)]">Description</p>
</div>

// ❌ Don't hardcode colors
<div className="bg-white border-gray-200 text-gray-900">
  {/* This breaks in dark mode! */}
</div>
```

# Best Practices

1. **Use CSS custom properties** — all colors go through `var(--color-*)`, never hardcode
2. **Prevent FOUC** — inline script in `<head>` applies `.dark` before paint
3. **Persist choice** — Zustand `persist` saves to localStorage
4. **Offer 3 options** — light, dark, system (respect user OS preference)
5. **Test both themes** — every component, every page
6. **Transition smoothly** — `transition-colors duration-300` on body
7. **Check contrast in both** — dark mode often has low contrast issues

# Common Pitfalls

1. **Flash of wrong theme** → FOUC because JS loads after paint → use inline script
2. **White flash on page load** → `bg-white` in HTML → use `bg-[var(--color-bg)]`
3. **Hardcoded `white`/`black`** → doesn't adapt to theme
4. **Images with white backgrounds** → add dark mode variants or transparent PNGs
5. **Shadows invisible in dark mode** → use stronger shadows with higher opacity
6. **Forgetting `suppressHydrationWarning`** → React complains about class mismatch

# Related Skills
- `design-system` — Token architecture
- `tailwind-v4` — Tailwind theme configuration
- `accessibility` — Contrast ratios in both themes
- `zustand-state-management` — Store patterns for theme
