import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { sanitizeInput, validateUsername, validateFullName } from "@/lib/validation";
import type { User, Profile, AuthState } from "@/types";

// Device ID helper — used for session limiting
const getDeviceId = () => {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("gavelogy-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("gavelogy-device-id", id);
  }
  return id;
};

const getDeviceInfo = () => {
  if (typeof window === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenParams: window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : "unknown",
  };
};

interface AuthStoreState extends AuthState {
  sessionId: string | null;
  deviceId: string | null;
  authToken: string | null;
  // These setters are called by components after Convex Auth resolves
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setIsAuthenticated: (v: boolean) => void;
  setSessionId: (id: string | null) => void;
  setAuthToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateProfile: (data: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getDeviceId: () => string;
  getDeviceInfo: () => Record<string, string>;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      sessionId: null,
      deviceId: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setSessionId: (sessionId) => set({ sessionId }),
      setAuthToken: (authToken) => set({ authToken }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      getDeviceId,
      getDeviceInfo,

      updateProfile: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const currentProfile = get().profile;
          if (!currentProfile) {
            set({ isLoading: false, error: "No profile found" });
            return { success: false, error: "No profile found" };
          }

          if (data.username) {
            const v = validateUsername(data.username);
            if (!v.isValid) {
              set({ isLoading: false, error: v.errors[0] });
              return { success: false, error: v.errors[0] };
            }
          }
          if (data.full_name) {
            const v = validateFullName(data.full_name);
            if (!v.isValid) {
              set({ isLoading: false, error: v.errors[0] });
              return { success: false, error: v.errors[0] };
            }
          }

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

          set({ profile: updatedProfile, isLoading: false, error: null });
          return { success: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Profile update failed";
          set({ isLoading: false, error: msg });
          return { success: false, error: msg };
        }
      },
    }),
    {
      name: "gavelogy-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        sessionId: state.sessionId,
        deviceId: state.deviceId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
