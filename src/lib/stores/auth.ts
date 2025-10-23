import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateFullName,
  sanitizeInput,
} from "@/lib/validation";
import { supabase } from "@/lib/supabase";
import type { User, Profile, AuthState } from "@/types";

interface AuthStoreState extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // Validate inputs
          const emailValidation = validateEmail(email);
          if (!emailValidation.isValid) {
            set({ isLoading: false, error: emailValidation.errors[0] });
            return { success: false, error: emailValidation.errors[0] };
          }

          const passwordValidation = validatePassword(password);
          if (!passwordValidation.isValid) {
            set({ isLoading: false, error: passwordValidation.errors[0] });
            return { success: false, error: passwordValidation.errors[0] };
          }

          // Use Supabase authentication
          const { data, error: authError } =
            await supabase.auth.signInWithPassword({
              email: sanitizeInput(email),
              password: password,
            });

          if (authError) {
            set({ isLoading: false, error: authError.message });
            return { success: false, error: authError.message };
          }

          if (data.user) {
            // Try to fetch user profile, but don't fail if table doesn't exist yet
            let profileData = null;
            try {
              const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
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
                    id: data.user.id,
                    email: data.user.email!,
                    username: data.user.email!.split("@")[0],
                    full_name: data.user.user_metadata?.full_name || "User",
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
                console.log(
                  "Users table not available - using default profile"
                );
              }
            }

            // Create user and profile objects
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              username: profileData?.username || data.user.email!.split("@")[0],
              full_name:
                profileData?.full_name ||
                data.user.user_metadata?.full_name ||
                "User",
              avatar_url: data.user.user_metadata?.avatar_url,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at || data.user.created_at,
            };

            const profile: Profile = {
              id: data.user.id,
              user_id: data.user.id,
              username: user.username,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              total_coins: profileData?.total_coins || 100,
              streak_count: profileData?.streak_count || 0,
              longest_streak: profileData?.longest_streak || 0,
              dark_mode: profileData?.dark_mode || false,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at || data.user.created_at,
            };

            set({
              user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return { success: true };
          }

          set({ isLoading: false, error: "No user data received" });
          return { success: false, error: "No user data received" };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      signup: async (
        email: string,
        password: string,
        username: string,
        fullName: string
      ) => {
        try {
          set({ isLoading: true, error: null });

          // Validate all inputs
          const emailValidation = validateEmail(email);
          if (!emailValidation.isValid) {
            set({ isLoading: false, error: emailValidation.errors[0] });
            return { success: false, error: emailValidation.errors[0] };
          }

          const passwordValidation = validatePassword(password);
          if (!passwordValidation.isValid) {
            set({ isLoading: false, error: passwordValidation.errors[0] });
            return { success: false, error: passwordValidation.errors[0] };
          }

          const usernameValidation = validateUsername(username);
          if (!usernameValidation.isValid) {
            set({ isLoading: false, error: usernameValidation.errors[0] });
            return { success: false, error: usernameValidation.errors[0] };
          }

          const fullNameValidation = validateFullName(fullName);
          if (!fullNameValidation.isValid) {
            set({ isLoading: false, error: fullNameValidation.errors[0] });
            return { success: false, error: fullNameValidation.errors[0] };
          }

          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Create mock user with proper types
          const mockUser: User = {
            id: "user-" + Date.now(),
            email: sanitizeInput(email),
            username: sanitizeInput(username),
            full_name: sanitizeInput(fullName),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const mockProfile: Profile = {
            id: mockUser.id,
            user_id: mockUser.id,
            username: mockUser.username,
            full_name: mockUser.full_name,
            total_coins: 100, // New users start with 100 coins
            streak_count: 0,
            longest_streak: 0,
            dark_mode: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          set({
            user: mockUser,
            profile: mockProfile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Signup failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });

          // Use Supabase Google OAuth
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }

          // The OAuth flow will redirect to callback page
          // This function will return success and the callback will handle the rest
          return { success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Google sign-in failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Simulate logout delay
          await new Promise((resolve) => setTimeout(resolve, 500));

          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error("Logout error:", error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });

          const currentProfile = get().profile;
          if (!currentProfile) {
            set({ isLoading: false, error: "No profile found" });
            return { success: false, error: "No profile found" };
          }

          // Validate inputs if provided
          if (data.username) {
            const usernameValidation = validateUsername(data.username);
            if (!usernameValidation.isValid) {
              set({ isLoading: false, error: usernameValidation.errors[0] });
              return { success: false, error: usernameValidation.errors[0] };
            }
          }

          if (data.full_name) {
            const fullNameValidation = validateFullName(data.full_name);
            if (!fullNameValidation.isValid) {
              set({ isLoading: false, error: fullNameValidation.errors[0] });
              return { success: false, error: fullNameValidation.errors[0] };
            }
          }

          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const updatedProfile: Profile = {
            ...currentProfile,
            username: data.username
              ? sanitizeInput(data.username)
              : currentProfile.username,
            full_name: data.full_name
              ? sanitizeInput(data.full_name)
              : currentProfile.full_name,
            avatar_url: data.avatar_url
              ? sanitizeInput(data.avatar_url)
              : currentProfile.avatar_url,
            updated_at: new Date().toISOString(),
          };

          set({
            profile: updatedProfile,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Profile update failed";
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });

          // Simulate auth check delay
          await new Promise((resolve) => setTimeout(resolve, 500));

          // With localStorage persistence, auth state is automatically restored
          set({ isLoading: false, error: null });
        } catch (error) {
          console.error("Auth check error:", error);
          set({ isLoading: false, error: "Auth check failed" });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Setter functions for external use
      setUser: (user: User | null) => set({ user }),
      setProfile: (profile: Profile | null) => set({ profile }),
      setIsAuthenticated: (isAuthenticated: boolean) =>
        set({ isAuthenticated }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: "gavalogy-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
