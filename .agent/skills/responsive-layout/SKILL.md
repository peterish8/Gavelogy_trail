---
name: Responsive Layout
description: Load when implementing mobile-first responsive designs, breakpoint strategies, container queries, responsive navigation, or ensuring cross-device compatibility
---

# Purpose
Ensure Gavelogy looks and works perfectly on all screen sizes — mobile phones, tablets, laptops, and desktops — using Tailwind v4's responsive utilities and modern CSS techniques.

# When to Use
- Building new page layouts
- Making existing pages mobile-friendly
- Implementing responsive navigation (hamburger menu, bottom nav)
- Debugging layout issues on specific screen sizes
- Adding container queries for component-level responsiveness

# Core Concepts

## Breakpoint Strategy (Tailwind v4)

Tailwind v4 uses the same breakpoint prefixes but defined in CSS:

| Prefix | Min Width | Target Devices |
|--------|-----------|----------------|
| (none) | 0px | Mobile phones (default) |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops, small desktops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

## Mobile-First Pattern

```tsx
// ✅ Always start with mobile, layer up
<div className="
  px-4            // mobile: small padding
  sm:px-6         // tablet: more padding
  lg:px-8         // desktop: even more
  
  grid
  grid-cols-1     // mobile: single column
  sm:grid-cols-2  // tablet: 2 columns
  lg:grid-cols-3  // desktop: 3 columns
  xl:grid-cols-4  // large: 4 columns
  
  gap-4           // mobile: tight gap
  lg:gap-6        // desktop: spacious gap
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## Common Layout Patterns

### Page Shell with Sidebar
```tsx
// Dashboard layout — sidebar on desktop, bottom nav on mobile
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="
        hidden lg:flex
        fixed inset-y-0 left-0
        w-64 flex-col
        bg-surface-elevated border-r border-primary-100
        p-4
      ">
        <NavLinks />
      </aside>

      {/* Main content */}
      <main className="
        lg:ml-64       // offset for sidebar on desktop
        pb-20 lg:pb-0  // space for bottom nav on mobile
        p-4 lg:p-8
      ">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="
        fixed bottom-0 inset-x-0
        lg:hidden
        bg-surface-elevated border-t border-primary-100
        flex justify-around
        py-2 px-4
        z-50
      ">
        <BottomNavLinks />
      </nav>
    </div>
  );
}
```

### Responsive Card Grid
```tsx
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  gap-4 sm:gap-6
">
  {cases.map(c => (
    <Card key={c.id} className="
      p-4 sm:p-6
    ">
      <h3 className="text-base sm:text-lg font-semibold truncate">{c.title}</h3>
      <p className="text-sm text-text-secondary line-clamp-2 sm:line-clamp-3">{c.description}</p>
    </Card>
  ))}
</div>
```

### Responsive Text
```tsx
<h1 className="
  text-2xl      // mobile
  sm:text-3xl   // tablet
  lg:text-4xl   // desktop
  font-bold
  leading-tight
">
  Master Legal Reasoning
</h1>

<p className="
  text-sm       // mobile
  sm:text-base  // tablet+
  text-text-secondary
  max-w-prose   // readable line width
">
  {description}
</p>
```

### Responsive Table → Card on Mobile
```tsx
// Desktop: table, Mobile: stacked cards
export function DataView({ data }: { data: Item[] }) {
  return (
    <>
      {/* Desktop table */}
      <table className="hidden md:table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.score}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map(item => (
          <div key={item.id} className="bg-surface-elevated rounded-lg p-4 space-y-1">
            <p className="font-semibold">{item.name}</p>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>Score: {item.score}</span>
              <span>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

## Container Queries (CSS)

```css
/* Style based on container size, not viewport */
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

@container card (max-width: 399px) {
  .card-content {
    display: flex;
    flex-direction: column;
  }
}
```

## Responsive Images
```tsx
import Image from 'next/image';

// Responsive image with proper sizing
<Image
  src="/hero.webp"
  alt="Gavelogy dashboard"
  width={1200}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  className="rounded-xl w-full h-auto"
  priority // for above-the-fold images
/>
```

## Touch Targets

```css
/* Minimum 44x44px touch targets for mobile (WCAG) */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

# Testing Responsive Layouts

```
Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)

Test at these widths:
- 320px  — smallest phone (iPhone SE)
- 375px  — standard phone (iPhone 12)
- 414px  — large phone (iPhone Pro Max)
- 768px  — tablet (iPad)
- 1024px — small laptop
- 1280px — desktop
- 1536px — large desktop

Also test:
- Landscape orientation on mobile
- Text zoom (200%)
- Large font size in browser settings
```

# Best Practices

1. **Mobile-first always** — default styles are mobile, add breakpoints for larger
2. **Max-width containers** — `max-w-7xl mx-auto` prevents ultra-wide stretching
3. **`min-h-screen`** — prevent content from being too short on large screens
4. **Fluid typography** — `clamp()` for smooth scaling: `font-size: clamp(1rem, 2.5vw, 1.5rem)`
5. **Touch-friendly** — 44px minimum tap targets, adequate spacing between links
6. **Test on real devices** — emulators miss touch behavior and font rendering

# Common Pitfalls

1. **Fixed widths** → use `w-full max-w-...` instead of `w-[500px]`
2. **Horizontal scroll on mobile** → usually from overflow or fixed-width elements
3. **Tiny text on mobile** → minimum 14px body text
4. **Desktop hover states on mobile** → use `@media (hover: hover)` for hover-only styles
5. **Missing viewport meta** → `<meta name="viewport" content="width=device-width, initial-scale=1">`

# Related Skills
- `design-system` — Consistent spacing and layout tokens
- `tailwind-v4` — Tailwind responsive utilities
- `accessibility` — Touch targets and viewport scaling
