---
name: Image Optimization
description: Load when working with next/image, optimizing assets, configuring remote images, implementing lazy loading, blur placeholders, or managing PDF thumbnails
---

# Purpose
Optimize all images on Gavelogy for fast loading using Next.js Image component, proper sizing, formats, lazy loading, and CDN delivery.

# When to Use
- Adding images to pages or components
- Configuring remote image domains (Supabase storage, Google avatars)
- Implementing blur placeholders
- Optimizing PDF thumbnail generation
- Debugging slow-loading images
- Reducing page weight

# Core Concepts

## Next.js Image Component

```tsx
import Image from 'next/image';

// ✅ Static import (best — auto-optimized)
import heroImage from '@/public/images/hero.webp';

<Image
  src={heroImage}
  alt="Gavelogy platform showing legal case analysis"
  priority  // for above-the-fold images
  placeholder="blur"  // auto-generated for static imports
/>

// ✅ Remote image with proper sizing
<Image
  src={user.avatar_url}
  alt={`${user.name}'s avatar`}
  width={48}
  height={48}
  className="rounded-full"
  sizes="48px"
/>

// ✅ Responsive hero image
<Image
  src="/images/hero.webp"
  alt="Legal learning platform"
  width={1200}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  className="rounded-xl w-full h-auto"
  priority
/>
```

## Remote Image Configuration

```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

## Blur Placeholder for Remote Images

```tsx
// Generate a tiny blur hash on the server
// Option 1: Use a base64 shimmer placeholder
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0f0f0" offset="20%" />
      <stop stop-color="#e0e0e0" offset="50%" />
      <stop stop-color="#f0f0f0" offset="80%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0f0f0" />
  <rect width="${w}" height="${h}" fill="url(#g)">
    <animate attributeName="x" from="-${w}" to="${w}" dur="1.5s" repeatCount="indefinite" />
  </rect>
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

<Image
  src={remoteSrc}
  alt="Case thumbnail"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(400, 300))}`}
/>
```

## Image Best Practices Checklist

| Practice | Status |
|----------|--------|
| All images use `next/image` | ⬜ |
| Above-fold images have `priority` | ⬜ |
| All images have meaningful `alt` text | ⬜ |
| `sizes` prop matches actual display size | ⬜ |
| Remote domains configured in `next.config.ts` | ⬜ |
| WebP/AVIF formats enabled | ⬜ |
| Blur placeholders for large images | ⬜ |
| No layout shift from images (width/height set) | ⬜ |

# Sizing Guide

| Use Case | Width | Height | `sizes` |
|----------|-------|--------|---------|
| Avatar (small) | 32-48 | 32-48 | `48px` |
| Avatar (large) | 96-128 | 96-128 | `128px` |
| Card thumbnail | 400 | 300 | `(max-width: 640px) 100vw, 400px` |
| Hero banner | 1200 | 600 | `(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px` |
| Icon/badge | 16-24 | 16-24 | `24px` |

# Common Pitfalls

1. **Missing `sizes` prop** → downloads full-size image on mobile
2. **No `priority` on hero** → LCP delay
3. **`alt=""` on meaningful images** → accessibility violation
4. **Using `<img>` instead of `<Image>`** → no optimization
5. **Not configuring remote patterns** → broken images from Supabase
6. **Missing width/height** → layout shift (CLS issues)

# Related Skills
- `responsive-layout` — Responsive image sizing
- `performance-monitoring` — LCP tracking
- `accessibility` — Image alt text requirements
