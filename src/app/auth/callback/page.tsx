"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LoadingPage } from "@/components/LoadingSpinner";
import { useAuthStore } from "@/lib/stores/auth";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase will automatically parse the #access_token or ?code= from the URL on this page.
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || session) {
        // Sync zustand store immediately just to be safe
        await useAuthStore.getState().checkAuth();
        router.push("/dashboard");
      }
    });

    // Fallback if the URL doesn't have an auth token (e.g., someone navigated here manually or an error occurred)
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      } else {
        router.push("/login?error=auth_callback_failed");
      }
    }, 2500);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return <LoadingPage text="Securing your session..." />;
}
