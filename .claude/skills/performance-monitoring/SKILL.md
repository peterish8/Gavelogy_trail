---
name: Performance Monitoring
description: Load when adding error tracking, analytics, Core Web Vitals monitoring, or integrating Sentry/Vercel Analytics for production observability
---

# Purpose
Monitor Gavelogy's performance and errors in production using Sentry for error tracking, Vercel Analytics for Web Vitals, and custom instrumentation for key user flows.

# When to Use
- Setting up production error tracking
- Adding performance monitoring
- Debugging production-only errors
- Tracking Core Web Vitals
- Adding custom metrics for game/quiz performance

# Setup

## Sentry Integration
```bash
npx @sentry/wizard@latest -i nextjs
# Or manual:
npm install @sentry/nextjs
```

```ts
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% session replay
  replaysOnErrorSampleRate: 0.5, // 50% replay on error
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
});
```

```ts
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

## Vercel Analytics
```bash
npm install @vercel/analytics @vercel/speed-insights
```

```tsx
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Core Web Vitals Tracking

```ts
// src/lib/vitals.ts
import type { Metric } from 'web-vitals';

export function reportWebVitals(metric: Metric) {
  const { name, value, rating } = metric;

  // Log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${name}: ${value} (${rating})`);
  }

  // Send to analytics
  // gtag, Sentry, custom endpoint, etc.
}
```

## Custom Performance Tracking

```ts
// Track key user flows
export function trackGamePerformance(metrics: {
  mode: string;
  loadTimeMs: number;
  questionsLoaded: number;
  totalTimeMs: number;
}) {
  // Send to your analytics
  if (typeof window !== 'undefined') {
    performance.mark(`game-${metrics.mode}-complete`);
  }
}

// Usage in game component
const startTime = performance.now();
// ... game logic ...
const endTime = performance.now();
trackGamePerformance({
  mode: 'classic',
  loadTimeMs: endTime - startTime,
  questionsLoaded: 20,
  totalTimeMs: endTime - startTime,
});
```

# Performance Budgets

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP (Largest Contentful Paint) | < 2.5s | < 4.0s |
| FID (First Input Delay) | < 100ms | < 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.25 |
| INP (Interaction to Next Paint) | < 200ms | < 500ms |
| TTFB (Time to First Byte) | < 800ms | < 1.8s |
| Bundle size (JS) | < 200KB | < 350KB |

# Best Practices

1. **Sample in production** — don't track 100% of transactions (cost + performance)
2. **Track user flows** — not just page loads, but game completion, quiz submission
3. **Set up alerts** — error spike alerts, performance degradation alerts
4. **Use source maps** — upload to Sentry for readable stack traces
5. **Monitor real users** — not just synthetic tests

# Related Skills
- `error-handling` — Errors that get reported to Sentry
- `ci-cd-pipeline` — Performance checks in CI
