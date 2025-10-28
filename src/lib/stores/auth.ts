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
      isLoading: true, // Start with loading true
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // Clear manual logout flag when user logs in
          localStorage.removeItem("gavalogy-manual-logout");

          console.log("Attempting login with email:", email);

          // Use Supabase authentication
          const { data, error: authError } =
            await supabase.auth.signInWithPassword({
              email: email,
              password: password,
            });

          if (authError) {
            console.error("Supabase auth error:", authError);

            // Handle specific error cases
            let errorMessage = authError.message;

            if (
              authError.message.includes("Invalid login credentials") ||
              authError.message.includes("Invalid credentials")
            ) {
              errorMessage =
                "Invalid email or password. Please check your credentials and try again.";
            } else if (authError.message.includes("Email not confirmed")) {
              errorMessage =
                "Please check your email and click the confirmation link before signing in.";
            } else if (authError.message.includes("Too many requests")) {
              errorMessage =
                "Too many login attempts. Please wait a moment and try again.";
            } else if (authError.message.includes("User not found")) {
              errorMessage =
                "No account found with this email address. Please sign up first.";
            }

            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }

          if (data.user) {
            console.log("Login successful for user:", data.user.id);

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
                console.log("Profile found:", profileData);
              } else {
                console.log("No profile found, will create one");
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
                } else {
                  console.log("Profile created successfully");
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

            console.log("Login completed successfully");
            return { success: true };
          }

          set({ isLoading: false, error: "No user data received" });
          return { success: false, error: "No user data received" };
        } catch (error) {
          console.error("Login error:", error);
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

          // Clear manual logout flag when user signs up
          localStorage.removeItem("gavalogy-manual-logout");

          console.log("Attempting signup with email:", email);

          // Basic validation
          if (!email || !password || !username || !fullName) {
            set({ isLoading: false, error: "All fields are required" });
            return { success: false, error: "All fields are required" };
          }

          if (password.length < 6) {
            set({
              isLoading: false,
              error: "Password must be at least 6 characters",
            });
            return {
              success: false,
              error: "Password must be at least 6 characters",
            };
          }

          // Use Supabase authentication
          const { data, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                username: username,
                full_name: fullName,
              },
            },
          });

          if (authError) {
            console.error("Supabase signup error:", authError);

            // Handle specific error cases
            let errorMessage = authError.message;

            if (authError.message.includes("User already registered")) {
              errorMessage =
                "An account with this email already exists. Please try logging in instead.";
            } else if (authError.message.includes("Password should be")) {
              errorMessage =
                "Password does not meet requirements. Please use a stronger password.";
            } else if (authError.message.includes("Invalid email")) {
              errorMessage = "Please enter a valid email address.";
            } else if (authError.message.includes("Signup is disabled")) {
              errorMessage =
                "Account creation is currently disabled. Please contact support.";
            }

            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }

          if (data.user) {
            console.log("Signup successful for user:", data.user.id);

            // Try to create user profile in our users table
            try {
              const { error: insertError } = await supabase
                .from("users")
                .insert({
                  id: data.user.id,
                  email: data.user.email!,
                  username: sanitizeInput(username),
                  full_name: sanitizeInput(fullName),
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
              } else {
                console.log("Profile created successfully");
              }
            } catch (error) {
              console.log("Users table not available - using default profile");
            }

            // Create user and profile objects
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              username: sanitizeInput(username),
              full_name: sanitizeInput(fullName),
              avatar_url: data.user.user_metadata?.avatar_url,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at || data.user.created_at,
            };

            const profile: Profile = {
              id: data.user.id,
              user_id: data.user.id,
              username: sanitizeInput(username),
              full_name: sanitizeInput(fullName),
              avatar_url: data.user.user_metadata?.avatar_url,
              total_coins: 100,
              streak_count: 0,
              longest_streak: 0,
              dark_mode: false,
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

            console.log("Signup completed successfully");
            return { success: true };
          }

          set({ isLoading: false, error: "No user data received" });
          return { success: false, error: "No user data received" };
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

          // Sign out from Supabase
          await supabase.auth.signOut();

          // Clear all localStorage stores including auth
          try {
            localStorage.removeItem("gavalogy-auth-storage");
            localStorage.removeItem("gavalogy-payment-storage");
            localStorage.removeItem("gavalogy-gamification-storage");
            localStorage.removeItem("gavalogy-quiz-storage");
            localStorage.removeItem("gavalogy-mistakes-storage");
            localStorage.setItem("gavalogy-manual-logout", "true");
          } catch (error) {
            console.log("Could not clear storage");
          }

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

          // Check if user manually logged out
          if (typeof window !== 'undefined') {
            const manualLogout = localStorage.getItem("gavalogy-manual-logout");
            if (manualLogout === "true") {
              set({
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              return;
            }

            // First check if we have stored auth data
            const storedAuth = localStorage.getItem("gavalogy-auth-storage");
            if (storedAuth) {
              try {
                const parsedAuth = JSON.parse(storedAuth);
                if (parsedAuth.state?.user && parsedAuth.state?.isAuthenticated) {
                  console.log('Found stored auth data, setting user as authenticated');
                  set({
                    user: parsedAuth.state.user,
                    profile: parsedAuth.state.profile,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                  });
                  return;
                }
              } catch (e) {
                console.log("Could not parse stored auth data");
              }
            }
          }

          // Check Supabase session
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // User is authenticated in Supabase
            // Try to fetch user profile
            let profileData = null;
            try {
              const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .single();

              if (!profileError) {
                profileData = profile;
              }
            } catch (error) {
              console.log("Users table not found - using default profile");
            }

            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              username:
                profileData?.username || session.user.email!.split("@")[0],
              full_name:
                profileData?.full_name ||
                session.user.user_metadata?.full_name ||
                "User",
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            };

            const profile: Profile = {
              id: session.user.id,
              user_id: session.user.id,
              username: user.username,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              total_coins: profileData?.total_coins || 100,
              streak_count: profileData?.streak_count || 0,
              longest_streak: profileData?.longest_streak || 0,
              dark_mode: profileData?.dark_mode || false,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            };

            set({
              user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // No session found
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
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
      onRehydrateStorage: () => (state) => {
        // After rehydration, check auth if we have stored data
        if (state?.user && state?.isAuthenticated) {
          console.log('Rehydrated auth state, user is authenticated');
          state.isLoading = false;
        } else {
          // If no stored auth, check Supabase session
          state?.checkAuth();
        }
      },
    }
  )
);
