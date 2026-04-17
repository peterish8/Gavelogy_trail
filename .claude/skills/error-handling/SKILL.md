---
name: Error Handling
description: Load when implementing error boundaries, error pages, toast notifications, graceful degradation, or debugging unhandled errors
---

# Purpose
Implement comprehensive error handling across Gavelogy to ensure users see friendly error messages, errors are logged for debugging, and the app recovers gracefully from failures.

# When to Use
- Adding error boundaries to new pages/features
- Creating `error.tsx` or `not-found.tsx` pages
- Implementing toast notifications for async errors
- Handling Supabase query failures
- Adding retry logic for network errors
- Debugging unhandled promise rejections

# Key Files
| File | Role |
|------|------|
| `src/app/error.tsx` | Global error boundary |
| `src/app/not-found.tsx` | 404 page |
| `src/app/[...slug]/error.tsx` | Route-level error boundaries |
| `src/components/error-boundary.tsx` | Reusable error boundary |
| `src/lib/errors.ts` | Error utility classes |

# Core Concepts

## App-Level Error Page
```tsx
// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error:', error);
    // TODO: Send to Sentry/LogRocket
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Something went wrong
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          We hit an unexpected error. Our team has been notified.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="primary">Try Again</Button>
          <Button onClick={() => window.location.href = '/'} variant="secondary">
            Go Home
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 p-4 bg-red-50 text-red-800 text-xs text-left rounded-lg overflow-auto max-h-40">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}
```

## 404 Not Found Page
```tsx
// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="text-8xl font-bold text-[var(--color-primary)]">404</div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-[var(--color-text-secondary)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
```

## Custom Error Classes
```ts
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super(`Too many requests. Try again in ${retryAfter}s`, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}
```

## Server Action Error Handling
```ts
// Pattern: return result objects, don't throw
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function submitQuizAnswer(input: unknown): Promise<ActionResult<{ xp: number }>> {
  try {
    const data = quizAnswerSchema.parse(input);

    const { data: result, error } = await supabase
      .from('quiz_answers')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: 'Failed to save answer', code: error.code };
    }

    return { success: true, data: { xp: result.xp_earned } };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: 'Invalid input', code: 'VALIDATION' };
    }
    console.error('Unexpected error:', err);
    return { success: false, error: 'Something went wrong' };
  }
}
```

## Client Error Handling Hook
```tsx
// src/hooks/use-async.ts
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null, error: null, isLoading: false,
  });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const data = await fn();
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setState({ data: null, error: message, isLoading: false });
      throw err;
    }
  }, []);

  return { ...state, execute };
}
```

## Retry Logic for Network Errors
```ts
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, delayMs = 1000, backoff = 2 } = {}
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxRetries) break;

      // Only retry on network errors, not validation errors
      if (lastError.message.includes('validation') || lastError.message.includes('401')) {
        throw lastError;
      }

      await new Promise(r => setTimeout(r, delayMs * Math.pow(backoff, attempt)));
    }
  }

  throw lastError!;
}

// Usage
const data = await withRetry(() => supabase.from('cases').select('*'));
```

# Error Handling Checklist

| Layer | Pattern | Status |
|-------|---------|--------|
| Global error boundary | `src/app/error.tsx` | ⬜ |
| 404 page | `src/app/not-found.tsx` | ⬜ |
| Route error boundaries | `error.tsx` per route group | ⬜ |
| Server Action results | Return `{ success, error }` objects | ⬜ |
| API route try/catch | Consistent JSON error responses | ⬜ |
| Client async operations | `useAsync` hook or try/catch | ⬜ |
| Supabase errors | Check `error` from every query | ⬜ |
| Form validation errors | Field-level error display | ⬜ |
| Network retry | `withRetry` for critical operations | ⬜ |

# Best Practices

1. **Never show stack traces in production** — log them, show friendly message
2. **Use Result objects** — `{ success, data }` or `{ success, error }` instead of throwing
3. **Error boundaries per route group** — `/dashboard/error.tsx` separate from `/game/error.tsx`
4. **Log errors with context** — include user ID, route, action name
5. **Retry network errors** — with exponential backoff
6. **Always check `error` from Supabase** — even "successful" calls can have errors

# Common Pitfalls

1. **Catching errors silently** → `catch(e) {}` hides bugs
2. **Showing raw error messages** → "column 'x' does not exist" leaks DB schema
3. **No error boundary** → white screen of death
4. **Throwing in Server Actions** → unhandled on client, no useful message
5. **Not differentiating error types** → 404 and 500 both show "Error"

# Related Skills
- `input-validation` — Validation error handling
- `testing-strategy` — Testing error states
- `rate-limiting` — Rate limit error responses
