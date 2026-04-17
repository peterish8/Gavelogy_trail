---
name: Content Security Policy
description: Load when configuring security headers, CSP, CORS, XSS prevention, or hardening the Next.js application against common web attacks
---

# Purpose
Harden Gavelogy against XSS, clickjacking, MIME sniffing, and other web attacks by configuring Content Security Policy headers, CORS, and other security headers in Next.js.

# When to Use
- Setting up or modifying security headers
- Debugging CSP violations (blocked scripts, styles, images)
- Adding a new external resource (font, CDN, analytics script)
- Hardening the app before production launch
- Investigating XSS or injection vulnerabilities

# Key Files
| File | Role |
|------|------|
| `next.config.ts` | Security headers configuration |
| `src/middleware.ts` | Dynamic CSP with nonces |

# Core Concepts

## Security Headers in next.config.ts

```ts
// next.config.ts
import type { NextConfig } from 'next';

const securityHeaders = [
  // Prevent XSS — tell browser to block reflected XSS
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Prevent clickjacking — don't allow in iframes
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME-type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // HSTS — force HTTPS for 1 year
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Permissions Policy — restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

## Content Security Policy (CSP)

CSP is the most important security header — it controls what resources the browser can load:

```ts
// CSP for Gavelogy — adjust domains as needed
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'",       // Required for Next.js dev mode — REMOVE in production
    "'unsafe-inline'",     // Required for Next.js — use nonces in production
    'https://accounts.google.com', // Google OAuth
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",    // Required for Tailwind + Framer Motion inline styles
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.supabase.co',       // Supabase storage
    'https://*.googleusercontent.com', // Google avatars
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',       // Supabase API
    'wss://*.supabase.co',         // Supabase realtime
    'https://accounts.google.com', // Google OAuth
  ],
  'frame-src': [
    "'self'",
    'https://accounts.google.com', // Google OAuth popup
  ],
  'object-src': ["'none'"],        // No Flash/plugins
  'base-uri': ["'self'"],          // Prevent base tag hijacking
  'form-action': ["'self'"],       // Forms only submit to self
  'frame-ancestors': ["'none'"],   // Prevent framing (same as X-Frame-Options: DENY)
  'upgrade-insecure-requests': [], // Force HTTPS for all resources
};

function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}
```

## CSP with Nonces (Advanced — Middleware)

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const response = NextResponse.next();

  // Replace 'unsafe-inline' with nonce for scripts
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    frame-src 'self' https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\n/g, ' ').trim();

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce); // Pass to components

  return response;
}

// In layout.tsx — read nonce for inline scripts
// const nonce = headers().get('x-nonce');
```

## CORS Configuration for API Routes

```ts
// src/app/api/[...]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://gavelogy.com',
  'https://www.gavelogy.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '',
].filter(Boolean);

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24h
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

// Handle preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  // ... your logic
  return NextResponse.json(data, { headers: corsHeaders(origin) });
}
```

# Security Header Checklist

| Header | Value | Status |
|--------|-------|--------|
| `Content-Security-Policy` | Restrictive policy | ⬜ Configure |
| `X-XSS-Protection` | `1; mode=block` | ⬜ Add |
| `X-Frame-Options` | `DENY` | ⬜ Add |
| `X-Content-Type-Options` | `nosniff` | ⬜ Add |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ⬜ Add |
| `Strict-Transport-Security` | `max-age=31536000` | ⬜ Add |
| `Permissions-Policy` | Disable unused features | ⬜ Add |

# Testing Security Headers

```bash
# Test your security headers
# Visit: https://securityheaders.com/?q=gavelogy.com
# Visit: https://csp-evaluator.withgoogle.com/

# Check headers locally
curl -I http://localhost:3001
```

# Common Pitfalls

1. **CSP too strict in dev** → blocks Next.js hot reload → use `unsafe-eval` only in dev
2. **Missing Supabase domain in `connect-src`** → API calls silently blocked
3. **Forgetting `wss:` for realtime** → WebSocket connections fail
4. **`unsafe-inline` in `style-src`** → needed for Tailwind/Framer Motion inline styles
5. **CORS `*` wildcard** → allows any origin to call your API
6. **Not testing after adding CSP** → random features break silently

# Related Skills
- `input-validation` — Complementary XSS prevention at input level
- `rate-limiting` — Another layer of API protection
- `nextjs-app-router` — Middleware and headers configuration
