---
name: Caching Strategy
description: Load when implementing ISR, revalidation, Supabase query caching, or optimizing data fetching patterns for performance
---

# Purpose
Optimize Gavelogy's data fetching and page rendering performance through strategic caching at the Next.js, Supabase, and client-side levels.

# When to Use
- Configuring page rendering strategy (SSG, SSR, ISR)
- Adding revalidation to data fetches
- Implementing client-side data caching
- Optimizing Supabase query performance
- Debugging stale data issues

# Core Concepts

## Next.js Caching Layers

```
Request → Edge Cache → ISR Cache → Server Render → Supabase
                ↑              ↑            ↑
           CDN cache    Static page    Dynamic render
```

## Page Rendering Strategies

### Static Generation (Best for: public content)
```tsx
// app/cases/page.tsx — regenerate every 10 minutes
export const revalidate = 600; // seconds

export default async function CasesPage() {
  const { data } = await supabase.from('cases').select('id, title, category');
  return <CaseList cases={data} />;
}
```

### Dynamic Rendering (Best for: user-specific data)
```tsx
// app/dashboard/page.tsx — always fresh
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // User-specific data — can't cache
  const { data } = await supabase.from('user_progress')
    .select('*')
    .eq('user_id', userId);
  return <Dashboard stats={data} />;
}
```

### On-Demand Revalidation (Best for: admin-updated content)
```ts
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { path, tag, secret } = await req.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (tag) revalidateTag(tag);
  if (path) revalidatePath(path);

  return NextResponse.json({ revalidated: true });
}
```

### Tagged Fetch Caching
```tsx
// Fetch with cache tags for granular revalidation
async function getCases() {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/cases`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY! },
    next: {
      revalidate: 3600, // 1 hour
      tags: ['cases'],  // can revalidate by tag
    },
  });
  return res.json();
}

// After admin updates cases:
revalidateTag('cases'); // Purge all fetches tagged 'cases'
```

## Client-Side Caching with Zustand

```ts
// Cache Supabase data in Zustand to avoid refetching
import { create } from 'zustand';

interface CacheStore {
  cases: Case[] | null;
  casesLoadedAt: number | null;
  fetchCases: () => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheStore>((set, get) => ({
  cases: null,
  casesLoadedAt: null,

  fetchCases: async () => {
    const { casesLoadedAt } = get();
    const now = Date.now();

    // Return cached data if fresh
    if (casesLoadedAt && now - casesLoadedAt < CACHE_TTL) return;

    const { data } = await supabase.from('cases').select('*');
    set({ cases: data, casesLoadedAt: now });
  },
}));
```

## Caching Decision Matrix

| Data Type | Strategy | Revalidation | Example |
|-----------|----------|-------------|---------|
| Public case list | ISR | 10 min | `/cases` page |
| Case detail | ISR | 1 hour | `/cases/[id]` page |
| User dashboard | Dynamic | None (always fresh) | `/dashboard` |
| Leaderboard | ISR | 5 min | `/arena/leaderboard` |
| User profile | Client cache | 5 min | Zustand store |
| Questions bank | ISR + tag | On admin update | `revalidateTag('questions')` |
| Game session | Dynamic | None | Real-time data |
| Static pages | SSG | Build-time | `/about`, `/pricing` |

# Best Practices

1. **Default to ISR** — most pages benefit from caching with periodic refresh
2. **Use `dynamic = 'force-dynamic'` sparingly** — only for truly user-specific pages
3. **Tag-based revalidation** — more precise than path-based
4. **Client cache with TTL** — prevent refetching on every navigation
5. **Separate public and private data** — public can be cached aggressively
6. **Pre-warm critical pages** — generate at build time with `generateStaticParams`

# Common Pitfalls

1. **Caching user-specific data** → other users see wrong data
2. **No revalidation on admin actions** → stale content after updates
3. **Over-fetching on every mount** → client-side cache prevents this
4. **Missing `revalidate` export** → page defaults to static (never updates)
5. **Using `no-store` everywhere** → defeats Next.js caching, slower pages

# Related Skills
- `nextjs-app-router` — Rendering strategies and data fetching
- `supabase-integration` — Supabase query patterns
- `performance-monitoring` — Measuring cache effectiveness
