---
name: CI/CD Pipeline
description: Load when setting up GitHub Actions, automated testing, deployment pipelines, or configuring continuous integration for the project
---

# Purpose
Automate Gavelogy's quality gates — linting, type-checking, testing, and deployment — using GitHub Actions so every push and PR is validated before merge.

# When to Use
- Setting up CI/CD from scratch
- Adding new checks to the pipeline
- Debugging failing CI builds
- Configuring deployment to Vercel
- Adding preview deployments for PRs

# Core Concepts

## Basic CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npm run test:run

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Security Audit Job

```yaml
  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=moderate
        continue-on-error: true  # Don't block on low severity

      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified
```

## Vercel Deployment

```yaml
# Vercel auto-deploys from GitHub, but you can add:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Required GitHub Settings

```markdown
### Branch Protection Rules (Settings → Branches → main)
- [x] Require a pull request before merging
- [x] Require status checks to pass (select: quality, e2e)
- [x] Require branches to be up to date
- [ ] Require approvals (optional for solo dev)

### Secrets (Settings → Secrets → Actions)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- VERCEL_TOKEN (optional)
- VERCEL_ORG_ID (optional)
- VERCEL_PROJECT_ID (optional)
```

## Package.json Scripts for CI

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 3001",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "ci": "npm run lint && npm run typecheck && npm run test:run && npm run build"
  }
}
```

# Pipeline Flowchart

```
Push/PR
  ↓
┌─────────────┐
│  npm ci      │  Install deps (cached)
└──────┬──────┘
       ↓
┌─────────────┐
│  Lint        │  ESLint checks
│  Typecheck   │  tsc --noEmit
│  Unit Tests  │  vitest run
│  Build       │  next build
└──────┬──────┘
       ↓ (if all pass)
┌─────────────┐
│  E2E Tests   │  Playwright (optional)
└──────┬──────┘
       ↓ (if all pass)
┌─────────────┐
│  Deploy      │  Vercel auto-deploy or manual
└─────────────┘
```

# Best Practices

1. **Cache `node_modules`** — speeds up CI by 30-60s
2. **Run quality checks before E2E** — fast fail on lint/typecheck
3. **Use `npm ci`** — deterministic installs from lockfile
4. **Upload artifacts on failure** — Playwright reports help debug
5. **Protect main branch** — require CI checks to pass before merge
6. **Keep CI under 5 minutes** — optimize slow steps

# Common Pitfalls

1. **Missing env vars in CI** → build fails with undefined Supabase URL
2. **Using `npm install` instead of `npm ci`** → non-deterministic
3. **No branch protection** → broken code can be pushed directly to main
4. **E2E tests too slow** → run only critical flows, parallelize
5. **Not caching** → every run downloads all deps from scratch

# Related Skills
- `testing-strategy` — Test setup that CI runs
- `ecosystem-monitor` — Dependency auditing in CI
