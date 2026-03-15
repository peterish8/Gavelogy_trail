import { supabase } from './supabase-client';

// Admin emails — extend via NEXT_PUBLIC_ADMIN_EMAILS env var (comma-separated)
// Falls back to hardcoded list for local dev safety
const ADMIN_EMAILS: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdmin(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  return isAdmin();
}
