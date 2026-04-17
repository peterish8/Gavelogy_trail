---
name: Supabase Integration
description: Load when working with Supabase — database queries, auth, RLS policies, RPCs, real-time subscriptions, SSR auth, or storage
---

# Purpose
Complete guide to Supabase in Gavelogy — PostgreSQL database, Row-Level Security, custom RPCs for session management, and OAuth flows.

# When to Use
- Writing or debugging Supabase queries
- Adding new tables or RLS policies
- Calling or creating RPCs
- Auth state on server side
- Real-time subscriptions for game events
- Troubleshooting auth errors

# Setup

## Clients in this project
```ts
// src/lib/supabase-client.ts — browser (client components)
import { createBrowserClient } from '@supabase/ssr';
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase.ts — server (API routes, Server Actions)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, { cookies: { getAll: () => cookieStore.getAll(), ... } });
}
```

**Never** import the server client in `'use client'` components.

# Core Concepts

## Key Tables in Gavelogy
| Table | Description |
|-------|-------------|
| `users` | Auth profile with email, username, avatar |
| `quiz_attempts` | Quiz completions with score/time |
| `quiz_answers` | Per-question answers with confidence |
| `mistakes` | Flagged wrong answers for spaced repetition |
| `quiz_answer_confidence` | `'confident'` \| `'guess'` \| `'fluke'` per question |
| `game_lobbies` | Game session metadata |
| `game_players` | Players in each lobby |
| `game_answers` | Per-question game answers |
| `game_events` | Real-time JSON events for game sync |
| `daily_activity` | Aggregated daily stats per user |
| `activity_log` | Granular action tracking |
| `badge_progress` | Achievement milestones |
| `note_contents` | Notes with full-text search tsvector |
| `structure_items` | Hierarchical course structure |
| `draft_content_cache` | Draft versioning for admin content |

## RLS (Row-Level Security)
Every table has RLS enabled. All queries are scoped to `auth.uid()`:
```sql
-- Example: users can only see their own mistakes
CREATE POLICY "Own mistakes only" ON mistakes
  FOR ALL USING (user_id = auth.uid());
```

When a query returns `[]` unexpectedly, first check:
1. Is the user authenticated? (RLS blocks unauthenticated reads)
2. Does the policy match your query's `user_id` field?

## RPCs (Custom Functions)
```ts
// Start a session — enforces 3-device limit
const { data, error } = await supabase.rpc('start_session', {
  p_device_id: deviceId,
  p_user_id: userId,
});

// Logout session
await supabase.rpc('logout_session', { p_session_id: sessionId });
```

# Best Practices

## Typed Queries
```ts
// Generate types: supabase gen types typescript --project-id <id> > src/types/supabase.ts
import type { Database } from '@/types/supabase';
const supabase = createBrowserClient<Database>(url, key);

// Now queries are fully typed:
const { data } = await supabase
  .from('mistakes')
  .select('id, question_id, is_cleared')
  .eq('user_id', userId)
  .eq('is_cleared', false);
// data is: { id: string; question_id: string; is_cleared: boolean }[] | null
```

## Error Handling Pattern
```ts
async function fetchMistakes(userId: string) {
  const { data, error } = await supabase
    .from('mistakes')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[mistakes] fetch failed:', error.message);
    throw new Error(`Failed to load mistakes: ${error.message}`);
  }

  return data ?? [];
}
```

## Upsert Pattern (used in quiz saves)
```ts
await supabase.from('quiz_answer_confidence').upsert(
  {
    user_id: userId,
    question_id: questionId,
    confidence,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'user_id,question_id' }
);
```

## Real-Time Subscriptions (Game Events)
```ts
const channel = supabase
  .channel(`game:${lobbyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'game_events',
    filter: `lobby_id=eq.${lobbyId}`,
  }, (payload) => {
    handleGameEvent(payload.new);
  })
  .subscribe();

// Cleanup
return () => { supabase.removeChannel(channel); };
```

## Full-Text Search (Notes)
```ts
const { data } = await supabase
  .from('note_contents')
  .select('id, title, content')
  .textSearch('search_vector', query, { type: 'websearch', config: 'english' });
```

# Code Examples

## Save quiz attempt (API route pattern)
```ts
// app/api/quiz/save-attempt/route.ts
export async function POST(req: NextRequest) {
  const supabase = createBrowserClient(url, key);
  const { quizId, answers, score, timeSpent } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase.from('quiz_attempts').insert({
    user_id: user.id,
    quiz_id: quizId,
    score,
    time_spent: timeSpent,
    completed_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

## Paginated queries
```ts
const PAGE_SIZE = 20;
const { data } = await supabase
  .from('questions')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('created_at', { ascending: false });
```

## Auth OAuth callback
```ts
// app/auth/callback/page.tsx
import { createServerClient } from '@supabase/ssr';
export default async function AuthCallback({ searchParams }) {
  const { code } = await searchParams;
  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  redirect('/dashboard');
}
```

# Common Pitfalls

1. **Using server client in client component** → session cookies not accessible → auth fails
2. **Forgetting `.eq('user_id', userId)`** → RLS blocks return → empty array looks like no data
3. **Not handling `null` data** → `data?.map()` crashes when RLS returns null instead of `[]`
4. **Upsert without `onConflict`** → creates duplicate rows on repeated saves
5. **Real-time channel not cleaned up** → memory leaks, duplicate events on re-render
6. **`anon` key on server with service role operations** → use service role key only on server

# Performance Notes
- Use `select('id, name')` instead of `select('*')` — only fetch columns you need
- Index foreign keys (`user_id`, `quiz_id`) and frequently filtered columns
- For large datasets use `.range()` pagination
- Real-time subscriptions add latency; use `game_events` polling as fallback for game sync
- `supabase.rpc()` calls go through PostgREST — keep RPC functions lean

# Security Notes
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — **only use server-side**, never expose to client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose — RLS enforces data boundaries
- Always verify `auth.uid()` matches the `user_id` in mutations before calling server actions
- Input to RPCs should be validated before calling (no SQL injection via PostgREST, but validate types)
- Rate-limit API routes that call expensive RPCs

# Testing Strategy
```ts
// Use Supabase local dev for integration tests
// supabase start → local postgres on localhost:54322
// supabase db reset → fresh state

// In tests, seed with:
await supabase.from('users').insert({ id: TEST_USER_ID, email: 'test@gavelogy.com' });

// Test RLS by switching auth context:
const authedClient = createBrowserClient(url, key);
await authedClient.auth.setSession({ access_token: testUserToken, refresh_token: '' });
```

# Upgrade / Versioning Notes
- **@supabase/supabase-js v2**: `auth.user()` removed → use `auth.getUser()` (async)
- **@supabase/ssr**: Replaces `auth-helpers-nextjs` — use `createBrowserClient` / `createServerClient`
- **Realtime v2**: Channel-based API replaces old `from().on()` subscription syntax
- Watch: https://supabase.com/changelog

# Related Skills
- `auth-system` — Gavelogy's Zustand auth store wrapping Supabase auth
- `nextjs-app-router` — Server-side Supabase in App Router
- `quiz-spaced-repetition` — Query patterns for mistakes + confidence tables
