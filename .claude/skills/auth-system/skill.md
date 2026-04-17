---
name: Gavelogy Auth System
description: Load when working with authentication, sessions, device limiting, Google OAuth, or the two-layer auth architecture (AuthContext + Zustand store)
---

# Purpose
Gavelogy's authentication is a two-layer system: a React Context for UI-level auth state and a Zustand store for persistent auth data and mutations. Understanding both layers is critical.

# When to Use
- Adding auth to a new page or component
- Debugging login/logout/session issues
- Adding new auth methods
- Understanding device limiting behavior
- Fixing hydration or redirect loops

# Setup

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Key Files
| File | Role |
|------|------|
| `src/lib/auth-context.tsx` | React Provider — mounts auth listeners, exposes `useAuth()` |
| `src/lib/stores/auth.ts` | Zustand store — state + all auth actions |
| `src/app/auth/callback/page.tsx` | OAuth callback handler |
| `src/app/login/page.tsx` | Login form |
| `src/app/signup/page.tsx` | Signup form |
| `src/middleware.ts` | Route-level auth guard (currently minimal) |

# Core Concepts

## Layer 1 — AuthContext (`auth-context.tsx`)
```ts
interface AuthContextType {
  user: User | null;
  loading: boolean;
  mounted: boolean;
}

export function useAuth(): AuthContextType
```

- Mounts Supabase `onAuthStateChange` listener
- Syncs changes to the Zustand store
- Handles localhost dev mode (mocked user from localStorage)
- Sets `mounted` flag to prevent SSR hydration mismatches

## Layer 2 — Zustand Auth Store (`stores/auth.ts`)
```ts
interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  deviceId: string | null;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email, password, username, fullName) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  reset: () => void;
}
```

# Best Practices

## Accessing Auth in Components
```tsx
// In any component — use the context hook for UI state
'use client';
import { useAuth } from '@/lib/auth-context';

function ProfileButton() {
  const { user, loading } = useAuth();
  if (loading) return <Skeleton />;
  if (!user) return <LoginButton />;
  return <Avatar src={user.avatar_url} />;
}
```

```tsx
// For mutations — use the store
import { useAuthStore } from '@/lib/stores/auth';

function LogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  return <button onClick={logout}>Sign out</button>;
}
```

## Protecting Pages
```tsx
// Client-side guard in the page component
'use client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) return <LoadingSpinner />;
  if (!user) return null; // redirect in progress

  return <DashboardContent />;
}
```

## Device Limiting Logic
```ts
// On login, call start_session RPC with deviceId
// Enforces max 3 simultaneous devices
const deviceId = localStorage.getItem('gavelogy-device-id') ?? crypto.randomUUID();
localStorage.setItem('gavelogy-device-id', deviceId);

const { data, error } = await supabase.rpc('start_session', {
  p_device_id: deviceId,
  p_user_id: user.id,
});

if (error?.code === 'DEVICE_LIMIT_EXCEEDED') {
  // Show device limit modal — user must log out another device
}
```

## Manual Logout Flag
Prevents redirect loops after intentional logout:
```ts
// Set on logout
localStorage.setItem('gavelogy-manual-logout', 'true');

// Check in auth guard — skip auto-redirect if just logged out
const didManualLogout = localStorage.getItem('gavelogy-manual-logout');
if (didManualLogout) {
  localStorage.removeItem('gavelogy-manual-logout');
  return; // don't redirect back
}
```

## Input Validation (from `src/lib/validation.ts`)
```ts
// Username: 3-20 chars, alphanumeric + underscores
// Full name: 2-50 chars, letters + spaces
validateUsername(username); // throws on invalid
validateFullName(fullName);
```

# Code Examples

## Full Login Flow
```ts
// stores/auth.ts — login action
login: async (email, password) => {
  set({ isLoading: true, error: null });
  try {
    // 1. Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // 2. Fetch or create profile
    let { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // First login — create profile
      const { data: newProfile } = await supabase
        .from('users')
        .insert({ id: data.user.id, email: data.user.email })
        .select()
        .single();
      profile = newProfile;
    }

    // 3. Start session (device limit check)
    const deviceId = getOrCreateDeviceId();
    const { error: sessionError } = await supabase.rpc('start_session', {
      p_device_id: deviceId,
      p_user_id: data.user.id,
    });
    if (sessionError) throw sessionError;

    // 4. Set state
    set({ user: data.user, profile, isAuthenticated: true, isLoading: false, deviceId });
  } catch (err) {
    set({ error: (err as Error).message, isLoading: false });
  }
},
```

## Google OAuth
```ts
signInWithGoogle: async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) set({ error: error.message });
},
```

## OAuth Callback Handler
```tsx
// app/auth/callback/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useAuthStore } from '@/lib/stores/auth';

export default function AuthCallback() {
  const router = useRouter();
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkAuth();
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };
    handleCallback();
  }, []);

  return <LoadingSpinner fullPage message="Signing you in..." />;
}
```

# Common Pitfalls

1. **Using `user` before `mounted`** → server renders without user → hydration mismatch
2. **Calling store actions in server components** → Zustand is client-only
3. **Not cleaning up `onAuthStateChange`** → memory leak if AuthProvider re-mounts
4. **Redirect loop** if manual logout flag not set → auth listener triggers re-login
5. **Profile not fetched after OAuth** → checkAuth must re-fetch profile after callback
6. **Device ID not persisted** → new UUID every visit = device limit hit quickly

# Performance Notes
- Auth state is persisted in localStorage → instant rehydration on page load
- `checkAuth()` makes an async Supabase call → show loading spinner until `mounted && !isLoading`
- Avoid calling `checkAuth()` on every render — call once on mount in AuthProvider

# Security Notes
- Store passwords are never stored — only Supabase session tokens
- `gavelogy-manual-logout` flag in localStorage — clear on logout to prevent state leaks
- Device IDs are pseudo-anonymous UUIDs — not linked to device hardware
- Session tokens in localStorage are accessible to XSS — consider `httpOnly` cookies via SSR for higher security
- Input validation prevents username injection attacks

# Testing Strategy
```ts
// Mock Supabase auth for unit tests
vi.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: mockProfile, error: null }) })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));
```

# Upgrade / Versioning Notes
- **Supabase v2**: `auth.user()` sync method removed → use `auth.getUser()` async
- **@supabase/auth-helpers-nextjs** → deprecated in favor of `@supabase/ssr`
- **@supabase/ssr**: Server client pattern changes with Next.js 15's async cookies
- Watch: https://supabase.com/docs/reference/javascript/

# Related Skills
- `supabase-integration` — Full Supabase client patterns
- `zustand-state-management` — Store patterns and persistence
- `nextjs-app-router` — Route protection and middleware
