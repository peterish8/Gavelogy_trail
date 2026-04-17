---
name: Testing Strategy
description: Load when setting up tests, writing unit/integration/E2E tests, configuring Jest or Playwright, or debugging test failures
---

# Purpose
Establish a comprehensive testing strategy for Gavelogy using Vitest for unit/integration tests and Playwright for end-to-end browser tests.

# When to Use
- Setting up the testing infrastructure
- Writing tests for new features
- Debugging failing tests
- Adding test coverage for existing code
- Pre-release quality assurance

# Setup

## Install Dependencies
```bash
# Unit & integration tests
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# E2E tests
npm install -D @playwright/test
npx playwright install
```

## Vitest Configuration
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Test Setup File
```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));
```

## Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

# Test Patterns

## Unit Tests — Pure Functions
```ts
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateXP, formatScore } from './utils';

describe('calculateXP', () => {
  it('returns base XP for correct answer', () => {
    expect(calculateXP({ correct: true, timeTakenMs: 5000, streak: 0 })).toBe(10);
  });

  it('applies streak bonus', () => {
    expect(calculateXP({ correct: true, timeTakenMs: 5000, streak: 5 })).toBe(15);
  });

  it('returns 0 for incorrect answer', () => {
    expect(calculateXP({ correct: false, timeTakenMs: 5000, streak: 3 })).toBe(0);
  });
});
```

## Component Tests
```tsx
// src/components/ui/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Submit').closest('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByText('Delete')).toHaveClass('bg-error');
  });
});
```

## Zustand Store Tests
```ts
// src/lib/stores/game.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './game';

describe('Game Store', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('starts a new game', () => {
    useGameStore.getState().startGame({ mode: 'classic', difficulty: 'easy' });
    expect(useGameStore.getState().isPlaying).toBe(true);
  });

  it('increments score on correct answer', () => {
    useGameStore.getState().startGame({ mode: 'classic', difficulty: 'easy' });
    useGameStore.getState().submitAnswer({ correct: true });
    expect(useGameStore.getState().score).toBeGreaterThan(0);
  });
});
```

## Playwright E2E Config
```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

## E2E Test Example
```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('shows validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test('redirects to dashboard on success', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('Password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

# Test Organization

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx     ← co-located with component
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts           ← co-located with util
│   └── stores/
│       ├── game.ts
│       └── game.test.ts
├── test/
│   ├── setup.ts                ← global test setup
│   └── mocks/                  ← shared mocks
e2e/
├── login.spec.ts
├── dashboard.spec.ts
└── game.spec.ts
```

# Best Practices

1. **Test behavior, not implementation** — test what the user sees/does
2. **Co-locate tests** — `button.test.tsx` next to `button.tsx`
3. **Use `getByRole` over `getByTestId`** — more accessible and resilient
4. **Mock external deps** — Supabase, router, but not your own components
5. **One assertion per test** — keeps tests focused and failure messages clear
6. **Name tests like sentences** — `it('shows error when password is too short')`

# Common Pitfalls

1. **Not mocking Supabase** → tests make real API calls
2. **Testing CSS classes** → brittle, test visible behavior instead
3. **Missing `cleanup`** → state leaks between tests
4. **Async tests without `await`** → tests pass but assertions never run
5. **Testing implementation details** → checking internal state instead of rendered output

# Related Skills
- `input-validation` — Schema validation to test
- `error-handling` — Error states to verify
- `ci-cd-pipeline` — Running tests in CI
