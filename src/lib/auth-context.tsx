"use client";

import { createContext, useContext, useEffect } from "react";
import {
  useConvexAuth,
  useQuery,
  useMutation,
} from "convex/react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useAuthStore } from "@/lib/stores/auth";
import { usePaymentStore } from "@/lib/payment";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const createOrUpdate = useMutation(api.users.createOrUpdateUser);

  // Bridge Convex Auth state → Zustand auth store
  const convexUser = useQuery(
    api.users.getMe,
    isAuthenticated ? {} : "skip"
  );
  const { setIsAuthenticated, setUser, setProfile, setAuthToken } = useAuthStore();
  const { clearUserData, loadUserCourses } = usePaymentStore();
  const authToken = useAuthToken();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || convexUser === null) {
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      setAuthToken(null);
      clearUserData();
      return;
    }
    if (convexUser) {
      // If user switched accounts, wipe stale purchased courses before reloading
      const prevUser = useAuthStore.getState().user;
      if (prevUser && (prevUser as { _id?: string })._id !== convexUser._id) {
        clearUserData();
      }
      setIsAuthenticated(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser(convexUser as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProfile(convexUser as any);
      loadUserCourses();
    }
  }, [isAuthenticated, isLoading, convexUser, setIsAuthenticated, setUser, setProfile, setAuthToken, clearUserData, loadUserCourses]);

  useEffect(() => {
    setAuthToken(authToken ?? null);
  }, [authToken, setAuthToken]);

  const signIn = async (email: string, password: string) => {
    try {
      await convexSignIn("password", { email, password, flow: "signIn" });
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      return { success: false, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => {
    try {
      await convexSignIn("password", {
        email,
        password,
        flow: "signUp",
        name: fullName,
      });
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign up failed";
      return { success: false, error: msg };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await convexSignIn("google");
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      clearUserData();
      await convexSignOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, signIn, signUp, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
