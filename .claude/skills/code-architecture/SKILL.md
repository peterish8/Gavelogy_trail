---
name: Code Architecture
description: Load when organizing files, creating feature folders, establishing import patterns, defining service layers, or refactoring project structure
---

# Purpose
Maintain a clean, scalable codebase structure for Gavelogy using feature-based organization, clear separation of concerns, and consistent naming conventions.

# When to Use
- Creating a new feature or module
- Refactoring messy file organization
- Deciding where to put a new file
- Setting up barrel exports
- Creating service layers or utility modules
- Code review for structural issues

# Core Concepts

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group (no layout prefix)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx            # Auth layout (no navbar)
│   ├── (main)/                   # Main app route group
│   │   ├── dashboard/page.tsx
│   │   ├── arena/page.tsx
│   │   ├── cases/[id]/page.tsx
│   │   └── layout.tsx            # Main layout (with navbar)
│   ├── admin/                    # Admin routes
│   │   ├── tagging/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   └── game/route.ts
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # 404 page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + tokens
│
├── components/                   # Shared components
│   ├── ui/                       # Primitives (Button, Card, Badge)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── index.ts              # Barrel export
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── shared/                   # Cross-feature components
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       └── confirm-dialog.tsx
│
├── features/                     # Feature modules
│   ├── game/
│   │   ├── components/           # Game-specific components
│   │   │   ├── game-board.tsx
│   │   │   ├── score-display.tsx
│   │   │   └── timer.tsx
│   │   ├── hooks/                # Game-specific hooks
│   │   │   ├── use-game-state.ts
│   │   │   └── use-timer.ts
│   │   ├── utils/                # Game-specific utils
│   │   │   └── scoring.ts
│   │   └── index.ts              # Barrel export
│   ├── quiz/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── pdf/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── lib/                          # Core utilities & config
│   ├── supabase-client.ts        # Supabase browser client
│   ├── supabase-server.ts        # Supabase server client
│   ├── utils.ts                  # Generic utilities (cn, formatDate)
│   ├── constants.ts              # App-wide constants
│   ├── auth-context.tsx          # Auth provider
│   ├── validation/               # Zod schemas
│   │   ├── schemas.ts
│   │   └── index.ts
│   └── stores/                   # Zustand stores
│       ├── auth.ts
│       ├── game.ts
│       ├── quiz.ts
│       └── theme.ts
│
├── hooks/                        # Shared custom hooks
│   ├── use-async.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── types/                        # Shared TypeScript types
│   ├── database.ts               # Supabase generated types
│   ├── game.ts
│   └── index.ts
│
└── test/                         # Test utilities
    ├── setup.ts
    └── mocks/
```

## File Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | kebab-case file, PascalCase export | `score-display.tsx` → `ScoreDisplay` |
| Hooks | `use-` prefix, kebab-case | `use-game-state.ts` → `useGameState` |
| Utils | kebab-case | `format-date.ts` |
| Types | kebab-case | `game-types.ts` |
| Constants | SCREAMING_SNAKE_CASE values | `MAX_QUESTIONS = 50` |
| Stores | kebab-case, noun-based | `game.ts` → `useGameStore` |
| Pages | `page.tsx` (Next.js convention) | `src/app/dashboard/page.tsx` |

## Barrel Exports

```ts
// src/components/ui/index.ts
export { Button } from './button';
export { Card } from './card';
export { Badge } from './badge';

// Usage — clean single import
import { Button, Card, Badge } from '@/components/ui';
```

```ts
// src/features/game/index.ts
export { GameBoard } from './components/game-board';
export { ScoreDisplay } from './components/score-display';
export { useGameState } from './hooks/use-game-state';
export { calculateScore } from './utils/scoring';
```

## Import Order Convention

```ts
// 1. External packages
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. Internal aliases — lib, hooks, stores
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useGameStore } from '@/lib/stores/game';

// 3. Components
import { Button, Card } from '@/components/ui';
import { GameBoard } from '@/features/game';

// 4. Types
import type { GameMode } from '@/types/game';

// 5. Relative imports (same feature)
import { Timer } from './timer';
```

## Separation of Concerns

### Don't: Fat component with everything
```tsx
// ❌ Component does fetching, state, rendering, formatting
export function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    supabase.from('stats').select('*').then(({ data }) => setData(data));
  }, []);
  const formatted = data?.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString() }));
  return <div>{formatted?.map(...)}</div>;
}
```

### Do: Separated concerns
```tsx
// ✅ Hook handles data fetching
// src/features/dashboard/hooks/use-dashboard-stats.ts
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.from('stats').select('*')
      .then(({ data }) => setStats(data))
      .finally(() => setIsLoading(false));
  }, []);

  return { stats, isLoading };
}

// ✅ Util handles formatting
// src/features/dashboard/utils/format-stats.ts
export function formatStatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

// ✅ Component only renders
// src/features/dashboard/components/dashboard-view.tsx
export function DashboardView() {
  const { stats, isLoading } = useDashboardStats();
  if (isLoading) return <Skeleton />;
  return <StatsGrid stats={stats} />;
}
```

## When to Create a New Feature Module

Create a new feature folder when:
- The feature has **3+ components** specific to it
- The feature has its own **hooks or state logic**
- The feature is **conceptually distinct** (game ≠ quiz ≠ PDF)
- Multiple pages use the feature's components

Don't create a feature folder for:
- A single reusable component → put in `components/ui/` or `components/shared/`
- A single utility function → put in `lib/utils.ts`
- Types used across features → put in `types/`

# Best Practices

1. **Feature-first, not type-first** — `features/game/components/` not `components/game/`
2. **Barrel exports at module boundaries** — clean imports, hide internals
3. **Co-locate related files** — test next to source, types next to component
4. **Single Responsibility** — one component, one job
5. **No circular imports** — features don't import from each other directly
6. **Shared code goes up** — if 2+ features need it, move to `lib/` or `hooks/`

# Common Pitfalls

1. **Giant `utils.ts`** → split into focused modules: `format.ts`, `math.ts`, `dom.ts`
2. **Components in `app/` directory** → put in `components/` or `features/`, pages only in `app/`
3. **No barrel exports** → messy imports: `import { X } from '@/features/game/components/sub/deep/x'`
4. **Cross-feature imports** → creates tight coupling, extract shared code to `lib/`
5. **Inconsistent naming** → `GameBoard.tsx` vs `game-board.tsx` — pick one convention

# Related Skills
- `nextjs-app-router` — Routing structure
- `typescript-strict` — Type organization
- `testing-strategy` — Test file organization
