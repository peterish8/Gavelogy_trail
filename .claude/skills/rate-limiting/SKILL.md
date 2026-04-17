---
name: Rate Limiting
description: Load when protecting API routes from abuse, implementing request throttling, adding DDoS prevention, or configuring per-user rate limits
---

# Purpose
Protect Gavelogy's API routes and Server Actions from abuse, brute force attacks, and DDoS by implementing rate limiting at the middleware and route level.

# When to Use
- Adding rate limiting to new or existing API routes
- Protecting auth endpoints (login, signup) from brute force
- Throttling game submission endpoints
- Implementing per-user or per-IP request limits
- Debugging "too many requests" issues

# Setup

## Option 1: Upstash Rate Limiting (Recommended for Production)
```bash
npm install @upstash/ratelimit @upstash/redis
```

```env
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Option 2: In-Memory Rate Limiting (Dev / Simple Use)
No dependencies needed — use a `Map` with TTL.

## Key Files
| File | Role |
|------|------|
| `src/lib/rate-limit.ts` | Rate limiter factory |
| `src/middleware.ts` | Global rate limiting middleware |
| `src/app/api/*/route.ts` | Per-route rate limits |

# Core Concepts

## In-Memory Rate Limiter (No External Deps)

```ts
// src/lib/rate-limit.ts

interface RateLimitConfig {
  interval: number; // ms
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(key);
  }
}, 60_000);

export function rateLimit(config: RateLimitConfig) {
  return {
    check(key: string): { success: boolean; remaining: number; resetIn: number } {
      const now = Date.now();
      const entry = rateLimitMap.get(key);

      if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + config.interval });
        return { success: true, remaining: config.maxRequests - 1, resetIn: config.interval };
      }

      if (entry.count >= config.maxRequests) {
        return { success: false, remaining: 0, resetIn: entry.resetTime - now };
      }

      entry.count++;
      return { success: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetTime - now };
    },
  };
}

// Pre-configured limiters
export const authLimiter = rateLimit({ interval: 15 * 60 * 1000, maxRequests: 10 }); // 10 per 15min
export const apiLimiter = rateLimit({ interval: 60 * 1000, maxRequests: 60 }); // 60 per min
export const gameLimiter = rateLimit({ interval: 60 * 1000, maxRequests: 30 }); // 30 per min
export const searchLimiter = rateLimit({ interval: 60 * 1000, maxRequests: 20 }); // 20 per min
```

## Upstash Rate Limiter (Production)

```ts
// src/lib/rate-limit-upstash.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Sliding window — smoother than fixed window
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'), // 10 requests per 15 min
  analytics: true,
  prefix: 'rl:auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'rl:api',
});

export const gameLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'rl:game',
});
```

## Middleware-Level Rate Limiting

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { apiLimiter, authLimiter } from '@/lib/rate-limit';

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit auth endpoints more aggressively
  if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/signup') {
    const ip = getClientIP(req);
    const result = authLimiter.check(`auth:${ip}`);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // Rate limit all API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(req);
    const result = apiLimiter.check(`api:${ip}`);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(result.resetIn / 1000)) },
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  }

  return NextResponse.next();
}
```

## Per-Route Rate Limiting

```ts
// src/app/api/game/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { gameLimiter } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'anon';
  const result = gameLimiter.check(`game:${userId}`);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Slow down! Too many submissions.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(result.resetIn / 1000)) } }
    );
  }

  // Process game submission...
}
```

## Client-Side Rate Limit Handling

```tsx
'use client';

async function submitAnswer(data: unknown) {
  const res = await fetch('/api/game/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter) : 60;
    toast.error(`Too many requests. Try again in ${seconds}s`);
    return;
  }

  if (!res.ok) throw new Error('Submission failed');
  return res.json();
}
```

# Recommended Limits by Endpoint

| Endpoint | Limit | Window | Rationale |
|----------|-------|--------|-----------|
| `/login`, `/signup` | 10 | 15 min | Prevent brute force |
| `/api/auth/*` | 10 | 15 min | Auth endpoints |
| `/api/game/submit` | 30 | 1 min | Game answers |
| `/api/quiz/*` | 30 | 1 min | Quiz submissions |
| `/api/search` | 20 | 1 min | Search queries |
| `/api/*` (general) | 60 | 1 min | General API |
| Server Actions | 30 | 1 min | Form submissions |

# Best Practices

1. **Use IP + User ID as key** — prevents bypass via multiple accounts
2. **Return `Retry-After` header** — tells clients when to retry
3. **Use sliding window** — smoother than fixed window (avoids burst at boundary)
4. **Different limits for different endpoints** — auth is stricter than general API
5. **Log rate limit hits** — helps detect attacks early
6. **Show friendly error on client** — "Slow down!" not "429 Too Many Requests"
7. **Exempt health checks** — don't rate limit monitoring endpoints

# Common Pitfalls

1. **In-memory limiter resets on deploy** → use Upstash for production
2. **Missing `x-forwarded-for` behind proxy** → always check both headers
3. **Rate limiting by session only** → unauthenticated attackers bypass it
4. **Too aggressive limits** → legitimate users get blocked during normal use
5. **Not handling 429 on client** → app shows generic error instead of retry message

# Related Skills
- `content-security-policy` — Complementary security layer
- `input-validation` — Validate before processing
- `error-handling` — How to surface rate limit errors
