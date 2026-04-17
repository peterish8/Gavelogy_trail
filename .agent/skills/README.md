# Agent Skills Index

Lazily-loadable knowledge modules for the Gavelogy codebase.
Each skill solves one capability deeply with best practices, code examples, and pitfalls.

## How Skills Are Discovered

Load a skill when the task matches its description. Skills prevent context bloat by being narrow and deep — only load what you need.

---

## Global / Framework Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Next.js App Router | `nextjs-app-router/` | New pages, server/client components, API routes, routing issues |
| Supabase Integration | `supabase-integration/` | DB queries, RLS, RPCs, real-time, auth on server |
| Zustand State Management | `zustand-state-management/` | Creating/modifying stores, persistence, devtools |
| Tailwind CSS v4 | `tailwind-v4/` | Styling, animations, dark mode, theming |
| Framer Motion | `framer-motion/` | Animations, page transitions, gestures, scroll effects |
| TypeScript Strict | `typescript-strict/` | TS errors, utility types, generics, type-safe patterns |

## Project-Specific Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Auth System | `auth-system/` | Login, logout, sessions, device limiting, OAuth |
| Gamification Engine | `gamification-engine/` | Game modes, XP/coins economy, bot AI, leagues |
| Quiz & Spaced Repetition | `quiz-spaced-repetition/` | Quiz flows, mistake tracking, recall algorithm |
| PDF Annotation | `pdf-annotation/` | PDF viewer, highlights, bezier connectors, virtualization |
| Dashboard & Analytics | `dashboard-analytics/` | Charts, activity graphs, streaks, performance panels |
| Admin Tagging Tool | `admin-tagging/` | Admin PDF annotation, case tagging, content creation |

## Security Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Input Validation | `input-validation/` | Zod schemas, form validation, sanitization, Server Action validation |
| Rate Limiting | `rate-limiting/` | API protection, brute force prevention, per-user throttling |
| Content Security Policy | `content-security-policy/` | CSP headers, CORS, XSS prevention, security hardening |
| RLS Audit | `rls-audit/` | Supabase Row Level Security audit, data exposure checks |

## Design & UI Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Design System | `design-system/` | Design tokens, CVA components, typography, color palette |
| Accessibility | `accessibility/` | WCAG compliance, keyboard nav, screen readers, ARIA |
| Responsive Layout | `responsive-layout/` | Mobile-first, breakpoints, container queries, touch targets |
| Dark Mode | `dark-mode/` | Theme switching, CSS custom properties, FOUC prevention |
| Emil Design Engineering | `emil-design-eng/` | UI polish, animation decisions, component design, micro-interactions, Emil Kowalski philosophy |

## Code Quality Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Testing Strategy | `testing-strategy/` | Vitest, Testing Library, Playwright E2E, test organization |
| Error Handling | `error-handling/` | Error boundaries, error pages, retry logic, result types |
| Code Architecture | `code-architecture/` | Feature folders, barrel exports, naming conventions |
| CI/CD Pipeline | `ci-cd-pipeline/` | GitHub Actions, quality gates, automated deployment |

## Performance & SEO Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Performance Monitoring | `performance-monitoring/` | Sentry, Vercel Analytics, Web Vitals, custom tracking |
| Image Optimization | `image-optimization/` | next/image, blur placeholders, sizing, remote patterns |
| Caching Strategy | `caching-strategy/` | ISR, revalidation, client caching, fetch tags |
| SEO Optimization | `seo-optimization/` | Meta tags, sitemaps, structured data, Open Graph |

## Growth Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Notifications | `notifications/` | Toast system, push notifications, notification center |
| Search | `search/` | Full-text search, Cmd+K modal, Supabase tsvector |
| Mobile PWA | `mobile-pwa/` | Service worker, offline support, install prompt, manifest |

## Meta-Skills

| Skill | Folder | When to Load |
|-------|--------|-------------|
| Ecosystem Monitor | `ecosystem-monitor/` | Dep upgrades, breaking changes, migration planning, security audits |
| Auth Redirect Troubleshooting | `auth-redirect-troubleshooting/` | OAuth redirect loops, race conditions, bouncing bugs |

---

## Suggested Future Skills

| Future Skill | Trigger |
|-------------|---------|
| `real-time-multiplayer` | When implementing live game sync beyond current event polling |
| `payment-integration` | When implementing Razorpay/Stripe for course purchases |
| `content-management` | When building a full CMS for courses/notes/questions |
| `ai-personalization` | When integrating Claude API for adaptive learning paths |
