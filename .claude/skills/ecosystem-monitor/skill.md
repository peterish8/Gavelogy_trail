---
name: Ecosystem Monitor
description: Load to check dependency health, detect breaking changes, propose skill updates, flag deprecated patterns, or plan major version migrations
---

# Purpose
Meta-skill for keeping Gavelogy's tech stack healthy — periodic dependency audits, breaking change detection, migration planning, and skill regeneration triggers.

# When to Use
- Before a major dependency upgrade
- When a package suddenly has type errors or runtime failures
- When `npm audit` reports vulnerabilities
- When a new major version of Next.js, Supabase, Zustand, or React drops
- When adding a new dependency
- Quarterly health checks

# Core Concepts

## Dependency Health Check Protocol

Run these checks in order:

### 1. Audit Current Versions
```bash
# Check installed versions
npm list --depth=0

# Check for outdated packages
npm outdated

# Check security vulnerabilities
npm audit
npm audit --audit-level=moderate  # fail only on moderate+
```

### 2. Watch These Packages Closely
High breaking-change risk:

| Package | Current | Watch For | Changelog |
|---------|---------|-----------|-----------|
| `next` | 15.5.9 | App Router API changes, params async | https://github.com/vercel/next.js/releases |
| `react` | 19.2.3 | Compiler updates, new hooks | https://react.dev/blog |
| `@supabase/supabase-js` | 2.76.0 | Auth API changes, client renames | https://supabase.com/changelog |
| `@supabase/ssr` | 0.7.0 | Cookie handling changes | https://supabase.com/docs/guides/auth |
| `zustand` | 5.0.8 | Middleware API changes | https://github.com/pmndrs/zustand/releases |
| `framer-motion` | 12.23.24 | API renames, removed exports | https://www.framer.com/motion/changelog/ |
| `tailwindcss` | 4 | CSS config syntax, plugin changes | https://tailwindcss.com/blog |
| `pdfjs-dist` | 5.5.207 | Worker format, render API | https://github.com/mozilla/pdf.js/releases |
| `typescript` | 5 | Strict mode changes, new errors | https://devblogs.microsoft.com/typescript/ |

### 3. Check for Breaking Changes
```bash
# For each major package, read the migration guide before upgrading
# Always upgrade in a separate branch
# Run: npx tsc --noEmit && npm run build && npm run lint
```

## Breaking Change Radar

### Next.js 16 (upcoming)
- Watch for: React compiler becoming default, changes to Server Actions API
- Pre-migration: Ensure all `params` are awaited (already needed for 15)
- Skill to update: `nextjs-app-router`

### React 20 (future)
- Watch for: React compiler graduation from opt-in
- Pre-migration: Remove manual `useMemo`/`useCallback` that compiler handles
- Skill to update: All skills with React component examples

### Supabase v3 (potential)
- Watch for: Breaking changes to `@supabase/ssr` cookie patterns
- Pre-migration: Abstract Supabase client creation behind a factory
- Skill to update: `supabase-integration`, `auth-system`

### Zustand v6 (potential)
- Watch for: `create` API changes, middleware updates
- Pre-migration: Ensure all stores use named exports, not default exports
- Skill to update: `zustand-state-management`

### Tailwind v5 (potential)
- Watch for: Further CSS-native features, possible config changes
- Pre-migration: Remove any leftover v3 config patterns
- Skill to update: `tailwind-v4` → rename to `tailwind-v5`

## Deprecated Pattern Flags

Currently watch for these deprecated patterns in the codebase:

| Pattern | Deprecated Since | Replacement |
|---------|-----------------|-------------|
| `@supabase/auth-helpers-nextjs` | SSR package released | Use `@supabase/ssr` |
| `import { createClient } from '@supabase/supabase-js'` in server components | - | Use `@supabase/ssr` server client |
| `useRouter().query` | Next.js 13 | Use `useSearchParams()` |
| `getStaticProps` / `getServerSideProps` | Next.js 13 | Use App Router fetch in server components |
| `tailwind.config.js` with `theme.extend` | Tailwind v4 | Use `@theme` in CSS |
| Zustand `createStore` default export | v5 | Named `create` import |
| `framer-motion` `motion.custom()` | v11 | Use `motion()` factory |

## Skill Regeneration Triggers

Regenerate a skill when:
1. A major version bump changes > 30% of the API examples
2. A deprecated pattern was central to the skill's code examples
3. A new best practice emerges that contradicts current skill content
4. Security vulnerability discovered in a documented pattern

### How to regenerate a skill:
```
1. Read the official migration guide
2. Search the codebase for affected patterns: Grep for old API usage
3. Update the skill.md with new patterns
4. Mark old patterns as "deprecated" with replacement
5. Update the "Upgrade / Versioning Notes" section with migration steps
6. Test code examples work with new version
```

# Monitoring Schedule

## Weekly (automated check)
```bash
# Run this to check for security issues
npm audit --json > audit-report.json
# Review moderate+ severity issues
```

## Monthly
```bash
npm outdated
# Review minor/patch updates — usually safe to apply
# Check for new major versions announced
```

## Quarterly
```bash
# Full dependency review
# Check official docs for deprecation notices
# Run the project against latest minor versions
# Update skills that have stale information
```

## On Major Version Release
```
1. Read full changelog + migration guide
2. Create a branch: git checkout -b upgrade/<package>-v<major>
3. Apply automated codemods if available
4. Fix manual migration items
5. Run: npm run build && npx tsc --noEmit && npm run lint
6. Update relevant skill.md files
7. Update this ecosystem-monitor skill
8. PR with summary of changes
```

# Current Vulnerability Surface

## High-Priority Areas
1. **pdfjs-dist** — frequently patched for PDF parsing vulnerabilities
2. **Auth session handling** — keep @supabase/ssr updated for security patches
3. **Dependencies with known CVEs** — run `npm audit` before any release

## Security Checklist for Upgrades
- [ ] No new transitive dependencies with CVEs
- [ ] Auth flow still works after upgrade
- [ ] RLS policies still enforced
- [ ] Admin routes still protected
- [ ] No new console warnings in production build

# Code Examples

## Checking for Stale Deps
```bash
# Interactive update tool
npx npm-check-updates

# Update only patch versions (safest)
npx npm-check-updates -u --target patch
npm install

# Update minor versions
npx npm-check-updates -u --target minor
npm install

# Preview major updates (don't apply automatically)
npx npm-check-updates --target major
```

## Testing After Upgrade
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Dev smoke test
npm run dev
# → Navigate to: /, /login, /dashboard, /arena, /cases/*/notes
# → Confirm: auth works, PDF loads, game modes render
```

## Searching for Deprecated Patterns
```bash
# Find old Supabase auth helper usage
grep -r "auth-helpers-nextjs" src/

# Find old Tailwind config usage
grep -r "tailwind.config" src/

# Find sync params access (Next.js 15 issue)
grep -r "params\." src/app --include="*.tsx" | grep -v "await params"

# Find any 'as any' usage (TS cleanliness)
grep -r "as any" src/ --include="*.ts" --include="*.tsx"
```

# Common Pitfalls

1. **Upgrading multiple major deps at once** → hard to isolate which caused a regression
2. **Skipping patch versions** → may miss security fixes
3. **Not reading CHANGELOG** before upgrade → blindsided by breaking changes
4. **Testing only happy path** → edge cases break in subtle ways after upgrades
5. **Forgetting to update lock file** → CI uses different versions than local

# Migration Step Template

When planning a migration, use this template:

```markdown
## Migration: [Package] [old version] → [new version]

### Breaking Changes
- [ ] Change 1: description and affected files
- [ ] Change 2: ...

### Automated Codemods Available
- `npx @package/codemod@latest <codemod-name> .`

### Manual Changes Required
- File: src/...
  - Old: `old pattern`
  - New: `new pattern`

### Verification Steps
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes
- [ ] Auth flow works
- [ ] [specific feature] works

### Skills to Update
- skill-name: update section X
```

# Upgrade / Versioning Notes
This skill itself should be updated when:
- A new major version of any watched package is released
- A new critical CVE affects a dependency
- A new best practice or tooling emerges for dependency management

# Related Skills
- All other skills — this skill monitors their health
- `nextjs-app-router` — highest churn risk
- `supabase-integration` — frequent security patches
