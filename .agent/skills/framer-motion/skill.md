---
name: Framer Motion
description: Load when adding animations, page transitions, gesture interactions, scroll effects, or layout animations using Framer Motion 12
---

# Purpose
Framer Motion 12 patterns used across Gavelogy — landing page reveals, game mode transitions, arena backgrounds, promotional ceremony animations, and dashboard motion effects.

# When to Use
- Animating component entrance/exit
- Page transitions between routes
- Gesture-based interactions (drag, hover, tap)
- Scroll-driven animations
- Complex orchestrated sequences (promotion ceremony, match intro)
- Layout animations (shared element transitions)

# Setup
```bash
# Already installed
npm install framer-motion  # v12.23.24
```

Always import from `framer-motion`:
```ts
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from 'framer-motion';
```

# Core Concepts

## motion.* Components
```tsx
// Any HTML element becomes animatable
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

## Variants (Orchestrated animations)
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,   // each child animates 100ms after the previous
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Parent controls children via propagation
<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

## AnimatePresence (Exit animations)
```tsx
// Wrap conditional/list renders for exit animations to work
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    />
  )}
</AnimatePresence>
```

`mode="wait"` — exit animation completes before enter animation starts (good for page transitions).

# Best Practices

## Page Transitions
```tsx
// Wrap page content with this pattern
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export default function ArenaPage() {
  return (
    <motion.main
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {/* page content */}
    </motion.main>
  );
}
```

## Hover & Tap (Game Cards)
```tsx
<motion.div
  whileHover={{ scale: 1.03, y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  <GameModeCard mode="duel" />
</motion.div>
```

## Scroll Animations (Landing Page)
```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function FeatureSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <ImmersiveFeatures />
    </motion.section>
  );
}
```

## Promotion Ceremony (Complex Sequence)
```tsx
// Orchestrated entrance: badge → rays → confetti → text
const ceremonySequence = {
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0, transition: { type: 'spring', delay: 0.3, duration: 0.8 } },
  },
  rays: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.9, duration: 0.5 } },
  },
  title: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { delay: 1.2, duration: 0.4 } },
  },
};
```

## MotionValue for Dynamic Values
```tsx
import { useMotionValue, useTransform, motion } from 'framer-motion';

function XPBar({ xpPercent }: { xpPercent: number }) {
  const progress = useMotionValue(0);
  const width = useTransform(progress, [0, 100], ['0%', '100%']);

  useEffect(() => {
    animate(progress, xpPercent, { duration: 1, ease: 'easeOut' });
  }, [xpPercent]);

  return (
    <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
      <motion.div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width }} />
    </div>
  );
}
```

## Layout Animations (Sidebar)
```tsx
<motion.aside
  animate={{ width: isCollapsed ? 64 : 256 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* sidebar content */}
</motion.aside>
```

# Code Examples

## Arena Background Floating Particles
```tsx
function ArenaBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
```

## Match Intro Countdown
```tsx
function MatchIntro({ onComplete }) {
  const [count, setCount] = useState(3);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={count}
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
        onAnimationComplete={() => {
          if (count > 1) setCount(c => c - 1);
          else onComplete();
        }}
      >
        <span className="text-8xl font-black text-white">{count === 0 ? 'GO!' : count}</span>
      </motion.div>
    </AnimatePresence>
  );
}
```

# Common Pitfalls

1. **AnimatePresence not wrapping conditional render** → exit animation never fires
2. **Missing `key` prop in AnimatePresence** → Framer Motion can't distinguish between elements
3. **Animating layout without `layoutId`** → shared element transition won't work
4. **`initial={false}` not set** on first load when you don't want entrance animation
5. **Server Components** — `motion.*` components are client-only; mark file `'use client'`
6. **Heavy animations on low-end devices** — use `useReducedMotion()` to respect accessibility

```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedCard({ children }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
```

# Performance Notes
- Use `transform` and `opacity` properties — they are GPU-accelerated (no layout reflow)
- Avoid animating `width`, `height`, `top`, `left` directly — use `scaleX/scaleY` or `x/y`
- Use `will-change: transform` CSS on elements with continuous animations
- `layoutId` shared element animations cause layout recalculations — use sparingly
- Framer Motion v12 has lazy loading; only import what you use

```ts
// Tree-shake by importing specific exports
import { motion } from 'framer-motion';          // OK for most cases
import { AnimatePresence } from 'framer-motion'; // Import what you need
```

# Security Notes
- No security implications — purely UI animation library
- Avoid user-controlled animation values (could cause visual glitches)

# Testing Strategy
```ts
// Mock framer-motion in unit tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    // ... other elements
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useInView: () => true,
}));
```

# Upgrade / Versioning Notes
- **v12**: New `animate()` function API, improved layout animations, React 19 compatibility
- **v11**: `useAnimate` hook for imperative animations
- **v10**: `motion` values are now lazy — better performance
- Watch: https://www.framer.com/motion/changelog/

# Related Skills
- `tailwind-v4` — Combine Tailwind CSS with Framer Motion for hybrid animations
- `gamification-engine` — Promotion ceremony, match intro, results screen animations
