---
name: Mobile PWA
description: Load when adding Progressive Web App support, service workers, offline capability, install prompts, or optimizing for mobile web experience
---

# Purpose
Turn Gavelogy into a Progressive Web App so students can install it on their phones, use it offline, and get a native-app-like experience without an app store.

# When to Use
- Adding PWA install capability
- Implementing offline support
- Creating a service worker
- Adding a web app manifest
- Optimizing mobile performance

# Core Concepts

## Web App Manifest

```json
// public/manifest.json
{
  "name": "Gavelogy — Legal Reasoning Platform",
  "short_name": "Gavelogy",
  "description": "Master legal reasoning through gamified learning",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f0f1a",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable any" }
  ],
  "screenshots": [
    { "src": "/screenshots/dashboard.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshots/desktop.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide" }
  ],
  "categories": ["education", "games"]
}
```

## Link Manifest in Layout

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gavelogy',
  },
  themeColor: '#6366f1',
};
```

## Service Worker (Basic Caching)

```ts
// public/sw.js
const CACHE_NAME = 'gavelogy-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Serve from cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/offline');
        });
      })
  );
});
```

## Register Service Worker

```tsx
// src/components/pwa/register-sw.tsx
'use client';
import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return null;
}
```

## Install Prompt

```tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt?.prompt();
    const { outcome } = await deferredPrompt?.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 p-4 rounded-xl bg-[var(--color-bg-elevated)] shadow-2xl border border-[var(--color-border)]">
      <h3 className="font-semibold text-sm">Install Gavelogy</h3>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
        Add to your home screen for a faster experience
      </p>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleInstall}>
          <Download className="h-4 w-4" /> Install
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
```

## Offline Page

```tsx
// src/app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <div className="text-6xl">📡</div>
        <h1 className="text-2xl font-bold">You're offline</h1>
        <p className="text-[var(--color-text-secondary)]">
          Check your internet connection and try again.
        </p>
        <button onClick={() => window.location.reload()} className="text-[var(--color-primary)] underline">
          Retry
        </button>
      </div>
    </div>
  );
}
```

# PWA Checklist

| Item | Status |
|------|--------|
| Web app manifest | ⬜ |
| Icons (72, 96, 128, 192, 512) | ⬜ |
| Service worker | ⬜ |
| Offline page | ⬜ |
| Install prompt | ⬜ |
| Theme color in `<meta>` | ⬜ |
| Apple web app meta tags | ⬜ |
| HTTPS required | ⬜ |

# Best Practices

1. **Network-first strategy** — always try fresh data, fallback to cache
2. **Don't cache API responses** — user data must be live
3. **Cache static assets aggressively** — JS, CSS, images
4. **Version your cache** — `gavelogy-v2` to bust old caches on deploy
5. **Show offline indicator** — let users know they're offline
6. **Test on real devices** — PWA install prompts vary by browser

# Related Skills
- `responsive-layout` — Mobile-optimized layouts
- `performance-monitoring` — Track PWA engagement
- `notifications` — Push notifications via service worker
