---
name: RLS Audit
description: Load when auditing Supabase Row Level Security policies, checking for data exposure, testing RLS bypass vectors, or hardening database access rules
---

# Purpose
Systematically audit and harden Row Level Security (RLS) policies on Gavelogy's Supabase tables to prevent unauthorized data access, privilege escalation, and data leaks.

# When to Use
- Before a production launch or major release
- After adding a new table or modifying existing ones
- When users report seeing other users' data
- When adding admin-only features
- Quarterly security audits
- After modifying auth or role logic

# Core Concepts

## RLS Audit Checklist

### Step 1: List All Tables & RLS Status
```sql
-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Tables with rowsecurity = false are WIDE OPEN
```

### Step 2: List All Policies
```sql
-- See all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 3: Identify Missing Policies
Every table should have policies for ALL operations it supports:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | ✅ Own profile | ✅ On signup | ✅ Own profile | ❌ Never |
| `quiz_answers` | ✅ Own answers | ✅ Own answers | ❌ Immutable | ❌ Never |
| `game_sessions` | ✅ Own sessions | ✅ System creates | ✅ Own session | ❌ Never |
| `cases` | ✅ All (public) | ✅ Admin only | ✅ Admin only | ✅ Admin only |
| `user_progress` | ✅ Own progress | ✅ Own progress | ✅ Own progress | ❌ Never |

## Common RLS Patterns

### User-Owns-Row Pattern
```sql
-- Users can only access their own rows
CREATE POLICY "Users read own data"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own data"
ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own data"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Public-Read, Admin-Write Pattern
```sql
-- Anyone can read, only admins can write
CREATE POLICY "Public read cases"
ON public.cases
FOR SELECT
USING (true);

CREATE POLICY "Admin insert cases"
ON public.cases
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Admin Check Helper Function
```sql
-- Create a reusable function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Use in policies
CREATE POLICY "Admin full access"
ON public.questions
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

## Security Testing Queries

### Test 1: Cross-User Data Access
```sql
-- As user A, try to read user B's data
-- This should return 0 rows if RLS works
SELECT * FROM user_progress WHERE user_id = '<other-user-uuid>';
```

### Test 2: Privilege Escalation
```sql
-- As regular user, try to set role to admin
UPDATE users SET role = 'admin' WHERE id = auth.uid();
-- Should fail or only update allowed fields
```

### Test 3: Insert with Wrong user_id
```sql
-- Try to insert data for another user
INSERT INTO quiz_answers (user_id, question_id, selected_option)
VALUES ('<other-user-uuid>', '<question-id>', 1);
-- Should fail with RLS error
```

### Test 4: Service Role Bypass
```sql
-- IMPORTANT: service_role key bypasses ALL RLS
-- Never expose service_role key to client
-- Only use in server-side code (Server Actions, API routes)
```

## Red Flags to Check

| Red Flag | Risk | Fix |
|----------|------|-----|
| Table with RLS disabled | Full data exposure | Enable RLS immediately |
| No DELETE policy | Data can't be deleted by users | Add restrictive DELETE policy |
| `USING (true)` on sensitive tables | Anyone can read all data | Restrict to `auth.uid() = user_id` |
| Missing `WITH CHECK` on UPDATE | Users can update any column | Add column-level restrictions |
| `service_role` key in client code | Full DB bypass | Move to server-only code |
| No admin check function | Admin checks scattered/inconsistent | Create `is_admin()` function |

## Audit Report Template

```markdown
## RLS Audit Report — [Date]

### Summary
- Tables audited: X
- Policies reviewed: X
- Issues found: X (critical: X, moderate: X, low: X)

### Critical Issues
- [ ] [Table name]: [Description of vulnerability]

### Moderate Issues
- [ ] [Table name]: [Missing policy for operation]

### Recommendations
- [ ] [Action item]

### Tables Verified Secure
- [x] users — own-row access only
- [x] quiz_answers — own-row, immutable
```

# Best Practices

1. **Enable RLS on EVERY table** — no exceptions
2. **Deny by default** — RLS with no policies = no access (safe default)
3. **Use `auth.uid()` not request headers** — headers can be spoofed
4. **Test as different users** — verify cross-user access is blocked
5. **Use `SECURITY DEFINER` sparingly** — runs as function owner, bypasses RLS
6. **Audit after schema changes** — new columns may need policy updates
7. **Never expose `service_role` key** — it bypasses all RLS

# Common Pitfalls

1. **Forgetting RLS on junction tables** → `user_achievements`, `user_coins` exposed
2. **`USING (true)` on user table** → any authenticated user reads all profiles
3. **Missing `WITH CHECK` on INSERT** → users can insert rows for other users
4. **Admin function not `SECURITY DEFINER`** → fails if user can't read `users` table
5. **Testing only with service_role** → policies never actually validated
6. **Joins bypass row-level** → if table A is restricted but joined table B isn't, data leaks via B

# Related Skills
- `supabase-integration` — Supabase client patterns and RPC
- `auth-system` — Auth state that RLS depends on
- `content-security-policy` — Application-level security
