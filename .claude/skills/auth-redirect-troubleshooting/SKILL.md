---
name: auth-redirect-troubleshooting
description: A comprehensive guide to troubleshooting and fixing OAuth infinite redirect loops, race conditions, and bouncing bugs.
---

# Troubleshooting Auth Redirect Loops & Bounces

When dealing with third-party authentication (like Google OAuth) in Next.js applications using Supabase and Zustand stores, there are several highly-specific but extremely common bugs that cause infinite redirect loops or instant "bounces" back to the login page.

If an AI agent or developer encounters an infinite loop after an OAuth authentication flow, immediately review the following 4 archetypes:

## 1. The "Manual Logout Override" Bug
**Symptom:** The user clicks "Continue with Google", Google successfully authenticates them, but the moment they hit the Dashboard, they are instantaneously kicked back to the login page.
**Cause:** When the user previously logged out manually, a persistence flag (e.g., `manual-logout: true` or similar) was stored in `localStorage` to prevent automatic re-authentication. The generic email/password login flow correctly cleared this flag, but the OAuth button bypassed the internal state management and talked directly to Supabase, failing to clear this flag. Upon returning with a successful session, the initialization script sees the flag, assumes the user shouldn't be here, overrides the valid Supabase session, and defensively kicks the user.
**Fix:** Ensure that *before* calling `supabase.auth.signInWithOAuth()`, you wrap the call in a shared store method (like `useAuthStore().signInWithGoogle()`) that explicitly runs `localStorage.removeItem("manual-logout")` before dispatching.

## 2. The "Impatient Callback" Bug (Shattered Tokens)
**Symptom:** Google OAuth redirects to `/auth/callback`, but the user is immediately kicked to the Dashboard and then forced back to `/login` with an empty session.
**Cause:** The callback component instantly executed a native, hard navigation (e.g., `window.location.href = "/dashboard"`) synchronously on mount. This hard-reset instantly obliterated the OAuth fragments (`#access_token` or `?code=`) from the URL before the Supabase client had time to successfully parse and ingest them. 
**Fix:** Rewrite the `/auth/callback` page to display a loading screen while patiently awaiting the `supabase.auth.onAuthStateChange` listener. Only trigger a soft `router.push("/dashboard")` when the `SIGNED_IN` event successfully fires. 

## 3. The "Tug-of-War" Bug (Conflicting Sources of Truth)
**Symptom:** `/login` continuously pushes the user to `/dashboard`, and `/dashboard` continuously kicks the user back to `/login`, creating an unending loop.
**Cause:** The `/login` page was referencing an internal React Context (e.g. `AuthContext`) which successfully intercepted the session, while `/dashboard` was referencing a Zustand store (`useAuthStore`) that failed to sync with the Context. The Context believed the user was authenticated, while the Store believed the user was not.
**Fix:** Standardize all authentication route checks across the entire application to use one single Source of Truth (e.g., exclusively rely on `useAuthStore`). If an `AuthContext` must simultaneously exist for real-time reactivity, ensure it aggressively dispatches a sync to the Zustand store (e.g. `useAuthStore.getState().checkAuth()`) the instant it detects a `SIGNED_IN` event.

## 4. The "Asynchronous Parsing" Race Condition
**Symptom:** The user is bounced out because a `useEffect` on the Dashboard checks if `isAuthenticated` is `false` before `supabase-js` has finished grabbing and validating the tokens from the URL.
**Fix:** Ensure your application's initialization `checkAuth()` method **synchronously** detects `window.location.hash.includes('access_token')` or `window.location.search.includes('code=')` at the very beginning of the function. If true, explicitly short-circuit the initialization block by trapping it in `isLoading: true`. This prevents immediate redirects and keeps the application frozen on a loading state until the real-time `onAuthStateChange` listener confirms the session.

## 5. The "Infinite Logout Deadlock" Bug
**Symptom:** When clicking the "Sign Out" button, the application freezes permanently on a loading screen (e.g., `LOADING DASHBOARD...`) and never actually redirects back to the login/landing page.
**Cause:** The application's `logout()` function awaits `supabase.auth.signOut()`. This action successfully signs out the user on the backend, but Supabase then broadcasts a `SIGNED_OUT` event across the entire application via a real-time listener (usually inside a global `AuthContext`). If `AuthContext` sees this event and aggressively calls `logout()` *again* in response, it launches a brand new logout command natively on top of the old one currently executing. The dual `logout()` commands deadlock the async function execution stack, trapping the global store eternally in `isLoading: true`.
**Fix:** Update your `logout()` function parameter to instantly set `isAuthenticated: false` *before* awaiting `supabase.auth.signOut()`. Then, configure the global `AuthContext` event listener to explicitly check the store's boolean structure (e.g., `if (store.isAuthenticated)`) before blindly blindly dispatching recursive `logout()` commands.
