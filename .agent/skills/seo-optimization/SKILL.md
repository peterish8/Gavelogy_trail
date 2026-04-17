---
name: SEO Optimization
description: Load when implementing meta tags, structured data, Open Graph images, sitemaps, or improving search engine rankings for the website
---

# Purpose
Optimize Gavelogy for search engines to drive organic traffic from law students searching for CLAT prep, legal reasoning practice, and case study resources.

# When to Use
- Adding meta tags to new pages
- Generating Open Graph images for social sharing
- Creating or updating the sitemap
- Implementing structured data (JSON-LD)
- Improving search engine rankings
- Debugging SEO issues

# Core Concepts

## Metadata API (Next.js 15)

```tsx
// src/app/layout.tsx — Global metadata
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://gavelogy.com'),
  title: {
    default: 'Gavelogy — Master Legal Reasoning Through Gamified Learning',
    template: '%s | Gavelogy',
  },
  description: 'India\'s #1 legal reasoning platform for CLAT PG aspirants. Practice with real cases, gamified quizzes, and spaced repetition.',
  keywords: ['CLAT PG', 'legal reasoning', 'law exam prep', 'case study', 'Indian judiciary'],
  authors: [{ name: 'Gavelogy' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://gavelogy.com',
    siteName: 'Gavelogy',
    title: 'Gavelogy — Master Legal Reasoning',
    description: 'Gamified legal reasoning platform for CLAT PG prep',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Gavelogy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gavelogy — Master Legal Reasoning',
    description: 'Gamified legal reasoning for CLAT PG',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

### Page-Level Metadata
```tsx
// src/app/cases/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: caseData } = await supabase
    .from('cases')
    .select('title, description, category')
    .eq('id', id)
    .single();

  if (!caseData) return { title: 'Case Not Found' };

  return {
    title: caseData.title,
    description: caseData.description?.slice(0, 160),
    openGraph: {
      title: caseData.title,
      description: caseData.description?.slice(0, 160),
      type: 'article',
    },
  };
}
```

## Sitemap Generation

```ts
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: cases } = await supabase
    .from('cases')
    .select('id, updated_at')
    .order('updated_at', { ascending: false });

  const caseEntries = (cases ?? []).map((c) => ({
    url: `https://gavelogy.com/cases/${c.id}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: 'https://gavelogy.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://gavelogy.com/cases',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://gavelogy.com/arena',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...caseEntries,
  ];
}
```

## Robots.txt

```ts
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/callback'],
      },
    ],
    sitemap: 'https://gavelogy.com/sitemap.xml',
  };
}
```

## Structured Data (JSON-LD)

```tsx
// src/app/layout.tsx or per-page
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Gavelogy',
    description: 'Gamified legal reasoning platform for CLAT PG aspirants',
    url: 'https://gavelogy.com',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
```

## SEO Checklist

| Item | Status |
|------|--------|
| Title tags on every page | ⬜ |
| Meta descriptions (≤160 chars) | ⬜ |
| Open Graph meta tags | ⬜ |
| Twitter Card meta tags | ⬜ |
| `sitemap.xml` generated | ⬜ |
| `robots.txt` configured | ⬜ |
| Structured data (JSON-LD) | ⬜ |
| Canonical URLs | ⬜ |
| Single `<h1>` per page | ⬜ |
| Semantic HTML throughout | ⬜ |
| `alt` text on all images | ⬜ |
| Fast page load (LCP < 2.5s) | ⬜ |
| Mobile-friendly (responsive) | ⬜ |

# Best Practices

1. **Unique title + description per page** — no duplicates
2. **160 chars max description** — Google truncates longer
3. **Keywords in heading hierarchy** — h1 contains primary keyword
4. **Dynamic OG images** — `@vercel/og` for auto-generated social images
5. **Internal linking** — link between related cases/topics
6. **Clean URLs** — `/cases/contract-law-101` not `/cases?id=123`

# Common Pitfalls

1. **Same title on every page** → search engines can't differentiate
2. **Missing `metadataBase`** → relative OG image URLs break
3. **No sitemap** → search engines miss pages
4. **Blocking `/` in robots.txt** → entire site disappears from search
5. **No `lang` attribute on `<html>`** → search engines guess language

# Related Skills
- `nextjs-app-router` — Metadata API and static generation
- `image-optimization` — OG image optimization
- `performance-monitoring` — Core Web Vitals impact SEO
