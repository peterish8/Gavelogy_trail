# Gavelogy — CLAUDE.md

> AI assistant instructions for Claude Code working on the **Gavelogy** codebase.

---

## Project Overview

**Gavelogy** is a CLAT PG (Common Law Admission Test – Postgraduate) exam preparation platform.
It combines intelligent mistake-tracking, gamified competitive modes, PDF judgment annotation, and comprehensive analytics for law students.

**Stack at a glance:**
- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 4
- Convex (database + auth + realtime + storage — replaces Supabase entirely)
- @convex-dev/auth (email/password + Google OAuth)
- Zustand 5 (state management + persistence)
- Framer Motion 12
- Radix UI primitives
- pdfjs-dist 5 (PDF virtualization)
- cmdk (command palette)

**Dev port:** `3001` (`npm run dev` → `next dev --turbopack -p 3001`)

---

## Directory Map

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── admin/tag/          # Admin PDF tagging & judgment tool
│   ├── arena/              # Game modes (duel, speed-court, battle-royale)
│   ├── cases/              # Case notes with judgment annotations
│   ├── api/quiz/           # API routes for quiz save/recall
│   └── ...                 # dashboard, courses, quiz, mistakes, leaderboard
├── components/
│   ├── ui/                 # Radix-based primitives (button, card, dialog…)
│   ├── navigation/         # Sidebar, conditional sidebar, layout
│   ├── dashboard/          # Analytics panels
│   ├── game/               # All game-mode UI components
│   └── judgment/           # PDF viewer, highlights, bezier connectors
├── lib/
│   ├── stores/             # Zustand stores (auth, quiz, game, mistakes…)
│   ├── game/               # Economy, bot system, scoring logic
│   ├── auth-context.tsx    # React auth provider
│   ├── supabase.ts         # Supabase client (server)
│   ├── supabase-client.ts  # Supabase client (browser)
│   └── spaced-repetition-algorithm.ts
├── hooks/                  # Custom React hooks
├── actions/                # Next.js server actions
└── types/                  # Shared TypeScript types
```

---

## Architecture Rules

### Authentication
- **Two layers**: `AuthContext` (React context for UI) + `useAuthStore` (Zustand for persistence/state)
- Always use `useAuth()` hook from `src/lib/auth-context.tsx` in components
- Auth is powered by `@convex-dev/auth` — `signIn`, `signUp`, `signInWithGoogle`, `signOut` all come from `useAuth()`
- For raw Convex auth state: `useConvexAuth()` gives `isAuthenticated` and `isLoading`
- Device limit: max 3 devices enforced in `convex/sessions.ts` `startSession` mutation

### State Management
- Use **Zustand** for all shared state
- Stores live in `src/lib/stores/`
- Persisted stores use Zustand `persist` middleware with `localStorage`
- Never use React Context for mutable shared state — use Zustand instead
- Game state is **not persisted** (intentional — each session is fresh)

### Components
- Mark interactive components `'use client'` at the top
- Server Components are only in layouts and static pages
- Radix UI primitives (`src/components/ui/`) are the source of truth for base components — extend, don't rebuild
- Use `cn()` from `src/lib/utils.ts` for all className merging

### Convex
- Backend functions live in `convex/` — `query` (reactive reads), `mutation` (writes), `action` (side effects)
- In React components: use `useQuery(api.module.fn)` and `useMutation(api.module.fn)`
- In server actions / API routes: use `fetchQuery` / `fetchMutation` from `"convex/nextjs"`
- In Zustand stores (non-React): use `getConvexHttpClient()` from `src/lib/convex-client.ts`
- Authorization is inside each function via `requireAuth(ctx)` — no RLS
- Schema is the single source of truth: `convex/schema.ts`

### Styling
- Tailwind CSS 4 — uses `@tailwindcss/postcss` (no `tailwind.config.js`)
- Dark mode via `.dark` class on `<html>`
- Brand tokens in `src/app/globals.css` as CSS custom properties
- Animation: prefer Framer Motion for complex motion; Tailwind Animate for simple states

### Game Economy
- **XP** = progression currency, never decreases except after 10+ matches/day (soft cap)
- **Coins** = spendable; deducted on entry for paid modes
- Economy config lives in `src/lib/game/economy.ts` — change values there only
- Bot system in `src/lib/game/bot-system.ts` — 100 named bots with realistic accuracy/timing

### PDF / Judgment Mode
- PDF rendering via `pdfjs-dist` with canvas virtualization
- Only render visible pages via `IntersectionObserver` (see `useVirtualPDF.ts`)
- Highlight coordinates are stored per page; re-calculated on zoom
- Admin tagging UI is at `/admin/tag/[caseId]`

---

## Skill System

Agent skills live in `.agent/skills/`. Each skill is a focused knowledge module for a specific capability.

Load a skill when you need deep expertise in:
- `nextjs-app-router` — Server/client components, routing, layouts
- `supabase-integration` — Auth, RLS, RPCs, real-time
- `zustand-state-management` — Store patterns, persistence, devtools
- `tailwind-v4` — Tailwind CSS 4 syntax, migration from v3
- `framer-motion` — Animation patterns, variants, gestures
- `typescript-strict` — Strict mode patterns, utility types
- `auth-system` — Gavelogy's two-layer auth (context + store)
- `gamification-engine` — XP/coins economy, game modes, bot AI
- `quiz-spaced-repetition` — Quiz loading, confidence tracking, recall algorithm
- `pdf-annotation` — PDF virtualization, highlights, bezier connectors
- `dashboard-analytics` — Analytics data fetching, chart components
- `admin-tagging` — Admin content tagging & judgment annotation tool
- `ecosystem-monitor` — Dependency health, breaking changes, migration radar

---

## Common Commands

```bash
# Dev server (port 3001)
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## Key Conventions

- **No** `any` types unless you document why with a comment
- **No** direct DOM manipulation outside hooks/effects
- **No** hardcoded user IDs or env values in source
- Prefer `async/await` over `.then()` chains
- API routes must validate inputs before calling Convex mutations
- Server Actions in `src/actions/` use `'use server'` directive
- Keep components under ~300 lines; split when they grow
- All DB calls that could fail must have error handling surfaced to the user

---

## Environment Variables

```
NEXT_PUBLIC_CONVEX_URL=          # from Convex dashboard
CONVEX_DEPLOYMENT=               # set by `npx convex dev`
AUTH_GOOGLE_ID=                  # Google OAuth client ID
AUTH_GOOGLE_SECRET=              # Google OAuth client secret
JWKS=                            # generated by Convex Auth setup
AUTH_SECRET=                     # generated by Convex Auth setup
RAZORPAY_KEY_ID=                 # Razorpay payment key
RAZORPAY_KEY_SECRET=             # server-only
NEXT_PUBLIC_ADMIN_EMAILS=        # comma-separated admin emails
```

**Run `npx convex dev` once to initialise the project and generate `convex/_generated/`.**

---

## Agent Skill Discovery

When facing a complex task, check `.agent/skills/` for a matching skill before implementing from scratch.
Skills are lazily loaded — only load what you need for the current task.

The `ecosystem-monitor` skill guides how to check for stale dependencies and breaking changes.
