"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DottedBackground } from "@/components/DottedBackground";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setProfile, setIsAuthenticated, setError } = useAuthStore();
  const { initializeUserStreak } = useStreakStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          router.push("/login?error=auth_failed");
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;

          // Try to fetch user profile, but don't fail if table doesn't exist yet
          let profileData = null;
          try {
            const { data: profile, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();

            if (!profileError) {
              profileData = profile;
            }
          } catch (error) {
            console.log("Users table not found - using default profile");
          }

          // Create profile if it doesn't exist (only if users table exists)
          if (!profileData) {
            try {
              const { error: insertError } = await supabase
                .from("users")
                .insert({
                  id: user.id,
                  email: user.email!,
                  username: user.email!.split("@")[0],
                  full_name: user.user_metadata?.full_name || "User",
                  total_coins: 100,
                  streak_count: 0,
                  longest_streak: 0,
                  dark_mode: false,
                });

              if (insertError) {
                console.log(
                  "Could not create profile (table may not exist):",
                  insertError.message
                );
              }
            } catch (error) {
              console.log("Users table not available - using default profile");
            }
          }

          // Set user and profile in store
          setUser({
            id: user.id,
            email: user.email!,
            username: profileData?.username || user.email!.split("@")[0],
            full_name:
              profileData?.full_name || user.user_metadata?.full_name || "User",
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
          });

          setProfile({
            id: user.id,
            user_id: user.id,
            username: profileData?.username || user.email!.split("@")[0],
            full_name:
              profileData?.full_name || user.user_metadata?.full_name || "User",
            avatar_url: user.user_metadata?.avatar_url,
            total_coins: profileData?.total_coins || 100,
            streak_count: profileData?.streak_count || 0,
            longest_streak: profileData?.longest_streak || 0,
            dark_mode: profileData?.dark_mode || false,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
          });

          setIsAuthenticated(true);
          
          // Initialize user streak
          const username = profileData?.username || user.email!.split("@")[0];
          const fullName = profileData?.full_name || user.user_metadata?.full_name || "User";
          await initializeUserStreak(user.id, username);

          router.push("/dashboard");
        } else {
          router.push("/login?error=no_session");
        }
      } catch (error) {
        console.error("Callback error:", error);
        setError("Authentication failed");
        router.push("/login?error=callback_failed");
      }
    };

    handleAuthCallback();
  }, [router, setUser, setProfile, setIsAuthenticated, setError]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <DottedBackground />
      <LoadingSpinner text="Processing authentication..." />
    </div>
  );
}
