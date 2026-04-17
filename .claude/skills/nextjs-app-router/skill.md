---
name: Next.js App Router
description: Load when working with Next.js 15 App Router — routing, layouts, server/client components, server actions, streaming, caching, and Turbopack configuration
---

# Purpose
Deep expertise in Next.js 15 App Router patterns as used in Gavelogy — a full-stack React 19 application with SSR, client interactivity, and API routes.

# When to Use
- Adding new pages or routes
- Deciding between Server vs Client Component
- Using layouts, loading states, or error boundaries
- Writing API routes (`route.ts`)
- Writing Server Actions (`'use server'`)
- Configuring caching, revalidation, or streaming
- Debugging Turbopack issues

# Setup
```bash
# This project runs on port 3001 with Turbopack
npm run dev       # next dev --turbopack -p 3001
npm run build     # next build --turbopack
```

`next.config.ts` in this project disables ESLint/TS errors during build to allow rapid iteration:
```ts
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
```
Remove these for stricter prod builds.

# Core Concepts

## File-based Routing
```
app/
├── page.tsx              → /
├── layout.tsx            → wraps all children
├── loading.tsx           → Suspense fallback
├── error.tsx             → Error boundary
├── not-found.tsx         → 404
├── dashboard/
│   └── page.tsx          → /dashboard
├── cases/[year]/
│   └── [caseNumber]/
│       └── notes/page.tsx → /cases/:year/:caseNumber/notes
└── api/
    └── quiz/
        └── save-attempt/
            └── route.ts  → POST /api/quiz/save-attempt
```

## Server vs Client Components
| Capability | Server Component | Client Component |
|-----------|-----------------|-----------------|
| `async/await` fetch | ✅ | ❌ |
| Zustand / useState | ❌ | ✅ |
| Browser APIs | ❌ | ✅ |
| Direct DB access | ✅ | ❌ (use API routes) |
| Framer Motion | ❌ | ✅ |

**Rule of thumb:** Default to Server Component. Add `'use client'` only when you need interactivity, hooks, or browser APIs.

## Layouts
```tsx
// app/layout.tsx — Root layout (Server Component)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>  {/* Client providers */}
      </body>
    </html>
  );
}
```

Nested layouts inherit parent context:
```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
```

# Best Practices

## Data Fetching
```tsx
// Server Component — fetch directly
async function CoursePage() {
  const supabase = createServerClient(); // from @supabase/ssr
  const { data } = await supabase.from('courses').select('*');
  return <CourseList courses={data} />;
}
```

```tsx
// Client Component — use useEffect or SWR/React Query
'use client';
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);
}
```

## Server Actions
```tsx
// src/actions/quiz/save.ts
'use server';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';

const schema = z.object({ quizId: z.string().uuid(), score: z.number().min(0).max(100) });

export async function saveQuizAttempt(formData: FormData) {
  const parsed = schema.safeParse({ quizId: formData.get('quizId'), score: Number(formData.get('score')) });
  if (!parsed.success) throw new Error('Invalid input');
  const supabase = await createServerClient();
  await supabase.from('quiz_attempts').insert(parsed.data);
}
```

## API Routes
```ts
// app/api/quiz/save-attempt/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // validate, call Supabase, return
  return NextResponse.json({ success: true });
}
```

## Caching & Revalidation
```tsx
// Opt out of caching for dynamic data
fetch('/api/...', { cache: 'no-store' });

// Revalidate every 60s
fetch('/api/...', { next: { revalidate: 60 } });

// Tag-based revalidation
import { revalidateTag } from 'next/cache';
revalidateTag('quiz-data');
```

# Code Examples

## Route with dynamic params (cases)
```tsx
// app/cases/[year]/[caseNumber]/notes/page.tsx
interface Props {
  params: Promise<{ year: string; caseNumber: string }>;
}

export default async function CaseNotesPage({ params }: Props) {
  const { year, caseNumber } = await params; // Next.js 15: params is a Promise
  return <CaseNotesClient year={year} caseNumber={caseNumber} />;
}
```

> **Next.js 15 breaking change**: `params` and `searchParams` are now Promises — always `await` them.

## Loading UI
```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <LoadingSpinner fullPage />;
}
```

## Error Boundary
```tsx
// app/arena/error.tsx
'use client';
export default function ArenaError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  );
}
```

# Common Pitfalls

1. **Forgetting `'use client'`** on components using hooks → "useState is not a function" error
2. **Importing client components in server components** without wrapping → hydration mismatch
3. **Using `useRouter` in server component** → router is client-only
4. **Not awaiting `params` in Next.js 15** → TypeScript error, runtime undefined
5. **Sharing Supabase server client across requests** → use one instance per request
6. **Large page bundles** — split heavy client components with `dynamic(() => import(...))`

```tsx
import dynamic from 'next/dynamic';
const PDFViewer = dynamic(() => import('@/components/judgment/JudgmentPanel'), { ssr: false });
```

# Performance Notes
- Use React Suspense boundaries to stream content progressively
- `dynamic` import with `ssr: false` for browser-only (PDF, canvas) components
- Route segments are automatically code-split
- Turbopack gives ~10x faster HMR than webpack
- Avoid heavy computation in Server Components that block streaming

# Security Notes
- Never access `SUPABASE_SERVICE_ROLE_KEY` in client components or API routes without auth checks
- Validate all inputs in API routes and Server Actions with Zod
- Use `cookies()` from `next/headers` for server-side session reading
- CSP headers should be configured in `next.config.ts` middleware

# Testing Strategy
```bash
# Unit test server actions with Jest
# Integration test API routes with supertest or fetch mocks
# E2E with Playwright for full flow testing
```

```ts
// Mock Next.js navigation in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
```

# Upgrade / Versioning Notes
- **Next.js 15**: `params`/`searchParams` are now async Promises → codemods available: `npx @next/codemod@latest next-async-request-api .`
- **React 19**: New compiler, `use()` hook, Actions API — check for incompatible third-party libs
- **Turbopack** (stable in 15.3+): Replace `--experimental-turbopack` flag with just `--turbopack`
- Watch: https://github.com/vercel/next.js/releases

# Related Skills
- `supabase-integration` — DB calls inside server components/actions
- `auth-system` — Auth in layouts and middleware
- `typescript-strict` — Type-safe params and route handlers
