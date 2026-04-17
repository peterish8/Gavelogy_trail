"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useAuthStore } from '@/lib/stores/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const initAuth = async () => {
      // Check for localhost auth first (DEV ONLY)
      if (typeof window !== 'undefined') {
        const isLocalhost = process.env.NODE_ENV === 'development' &&
                           (window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost'));
        
        if (isLocalhost) {
          const localhostAuth = localStorage.getItem('gavelogy-localhost-auth');
          if (localhostAuth) {
            try {
              const mockUser = JSON.parse(localhostAuth);
              setUser(mockUser as User);
              setLoading(false);
              return;
            } catch {
              // Invalid localhost auth, continue to Supabase check
            }
          }
        }
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const state = useAuthStore.getState();
        if (!state.isAuthenticated) {
          state.checkAuth();
        }
      }
    };

    initAuth();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Don't override localhost auth with Supabase changes (DEV ONLY)
        if (typeof window !== 'undefined') {
          const isLocalhost = process.env.NODE_ENV === 'development' &&
                             (window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname.includes('localhost'));
          
          if (isLocalhost && localStorage.getItem('gavelogy-localhost-auth')) {
            // Keep localhost auth, don't update from Supabase
            return;
          }
        }
        
        setUser(session?.user ?? null);
        setLoading(false);

        // Sync with useAuthStore to prevent redirect loops between dashboard and login
        if (session?.user && event === 'SIGNED_IN') {
          const state = useAuthStore.getState();
          if (!state.isAuthenticated) {
            state.checkAuth();
          }
        } else if (event === 'SIGNED_OUT') {
           const state = useAuthStore.getState();
           if (state.isAuthenticated) {
             state.logout();
           }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Signup failed' };
    }
  };

  const signOut = async () => {
    try {
      // Clear localhost auth if present (dev environments only)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        localStorage.removeItem('gavelogy-localhost-auth');
      }
      
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    }
  };

  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, loading: true, signIn, signUp, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}