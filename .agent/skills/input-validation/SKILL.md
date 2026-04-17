---
name: Input Validation
description: Load when adding form validation, sanitizing user input, validating Server Actions or API routes, or setting up Zod schemas for type-safe validation
---

# Purpose
Prevent injection attacks, data corruption, and runtime errors by validating all user input at every boundary — client forms, Server Actions, API routes, and Supabase RPC calls.

# When to Use
- Adding a new form or user input field
- Creating or modifying Server Actions
- Building API routes that accept body/query parameters
- Validating data before Supabase inserts/updates
- Debugging data integrity issues

# Setup

## Install Zod
```bash
npm install zod
```

## Key Files to Create/Modify
| File | Role |
|------|------|
| `src/lib/validation/schemas.ts` | Central schema definitions |
| `src/lib/validation/index.ts` | Barrel export |
| `src/lib/validation/sanitize.ts` | HTML/XSS sanitization utils |

# Core Concepts

## Schema-First Validation with Zod

Define schemas once, use everywhere — forms, Server Actions, API routes:

```ts
// src/lib/validation/schemas.ts
import { z } from 'zod';

// === Auth Schemas ===
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces'),
});

// === Quiz / Game Schemas ===
export const quizAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.number().int().min(0).max(3),
  timeTakenMs: z.number().int().positive().max(300_000), // max 5 min
});

export const gameSettingsSchema = z.object({
  mode: z.enum(['classic', 'speed', 'practice']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.number().int().min(5).max(50),
});

// === Profile Schemas ===
export const profileUpdateSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  fullName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

// === Generic Schemas ===
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParam = z.string().uuid('Invalid ID format');

// Type inference — use these instead of manual interfaces
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
```

## Validating in Server Actions

```ts
// src/app/actions/quiz.ts
'use server';

import { quizAnswerSchema } from '@/lib/validation/schemas';

export async function submitAnswer(rawData: unknown) {
  // 1. Validate — throws ZodError if invalid
  const data = quizAnswerSchema.parse(rawData);

  // 2. Safe to use — fully typed
  const { questionId, selectedOption, timeTakenMs } = data;

  // 3. Proceed with Supabase insert
  const { error } = await supabase
    .from('quiz_answers')
    .insert({
      question_id: questionId,
      selected_option: selectedOption,
      time_taken_ms: timeTakenMs,
      user_id: user.id,
    });

  if (error) throw new Error('Failed to submit answer');
  return { success: true };
}
```

## Safe Parsing (no throw)

```ts
// Use safeParse when you want to handle errors gracefully
export async function updateProfile(rawData: unknown) {
  const result = profileUpdateSchema.safeParse(rawData);

  if (!result.success) {
    return {
      error: result.error.flatten().fieldErrors,
      // { username: ['Too short'], fullName: ['Only letters'] }
    };
  }

  // result.data is fully typed
  await supabase.from('users').update(result.data).eq('id', userId);
  return { success: true };
}
```

## Client-Side Form Validation

```tsx
'use client';
import { useState } from 'react';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

export function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData);

    try {
      const data: LoginInput = loginSchema.parse(raw);
      setErrors({});
      // proceed with login action
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      {errors.email && <span className="text-red-500">{errors.email}</span>}
      <input name="password" type="password" />
      {errors.password && <span className="text-red-500">{errors.password}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Input Sanitization

```ts
// src/lib/validation/sanitize.ts

/** Strip HTML tags to prevent XSS */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/** Escape HTML entities */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/** Sanitize search query — remove SQL-like patterns */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[';\\--]/g, '') // remove SQL injection chars
    .trim()
    .slice(0, 200); // limit length
}

/** Create a Zod transform that sanitizes strings */
export const sanitizedString = z.string().transform(stripHtml);
```

## Validating API Routes

```ts
// src/app/api/game/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { gameSettingsSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = gameSettingsSchema.parse(body);

    // Safe to use
    return NextResponse.json({ game: settings });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Validating URL Search Params

```ts
// In a server component or route handler
import { paginationSchema } from '@/lib/validation/schemas';

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { page, limit } = paginationSchema.parse(params);

  const { data } = await supabase
    .from('cases')
    .select('*')
    .range((page - 1) * limit, page * limit - 1);

  return <CaseList cases={data} />;
}
```

# Best Practices

1. **Validate at EVERY boundary** — client, server action, API route, RPC
2. **Use `parse()` for Server Actions** — throw errors loudly
3. **Use `safeParse()` for forms** — return field-level errors
4. **Infer types from schemas** — `z.infer<typeof schema>` instead of manual types
5. **Sanitize before display** — even validated data should be escaped in HTML
6. **Limit string lengths** — always `.max()` to prevent memory abuse
7. **Use `.coerce`** — for search params that come as strings: `z.coerce.number()`
8. **Never trust `FormData` directly** — always parse through a schema

# Common Pitfalls

1. **Validating only on client** → server still accepts garbage
2. **Using `as` type assertion instead of parse** → bypasses all validation
3. **Not handling ZodError in API routes** → returns 500 instead of 400
4. **Missing `.trim()` on strings** → whitespace-only input passes
5. **Not validating UUIDs** → SQL errors from malformed IDs
6. **Trusting `req.json()` directly** → any shape can be sent

# Performance Notes
- Zod validation is ~1μs per field — negligible overhead
- Put heavy validations (regex, async checks) last in chain
- Use `.lazy()` for recursive schemas to avoid circular references

# Related Skills
- `auth-system` — Login/signup validation patterns
- `supabase-integration` — RPC parameter validation
- `error-handling` — How to surface validation errors to users
- `content-security-policy` — Complementary XSS prevention
