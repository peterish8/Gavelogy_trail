"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DottedBackground } from "@/components/DottedBackground";
import { validateEmail, validatePassword } from "@/lib/validation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth";

export default function LoginPage() {
  // Hardcoded credentials for localhost testing
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));
  
  const [email, setEmail] = useState(isLocalhost ? "test@localhost.com" : "");
  const [password, setPassword] = useState(isLocalhost ? "Test1234!" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { user, loading } = useAuth();
  const router = useRouter();
  const { isAuthenticated: isAuthFromStore, isLoading: isAuthLoading, setUser, setProfile, setIsAuthenticated } = useAuthStore();

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    // Wait for auth check to complete
    if (!isAuthLoading) {
      // Check both auth context and auth store
      if (user || isAuthFromStore) {
        router.push("/dashboard");
      }
    }
  }, [user, isAuthFromStore, isAuthLoading, router]);

  // Check if user is already logged in and redirect on form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user is already logged in, redirect to dashboard
    if (user || isAuthFromStore) {
      window.location.href = "/dashboard?t=" + Date.now();
      return;
    }
    
    // Continue with normal login flow
    await handleSubmit(e);
  };

  // Handle URL error parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const message = urlParams.get("message");

    if (message) {
      setError(message);
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "Google sign-in failed. Please try again.",
        callback_failed: "Authentication callback failed. Please try again.",
        supabase_not_configured: "Authentication service not configured.",
        auth_failed: "Authentication failed. Please try again.",
        no_session: "No active session found. Please sign in again.",
      };

      setError(
        errorMessages[errorParam] || "An error occurred during authentication."
      );
    }
  }, []);

  // Clear errors when user starts typing
  useEffect(() => {
    if (email && emailError) {
      setEmailError("");
    }
  }, [email, emailError]);

  useEffect(() => {
    if (password && passwordError) {
      setPasswordError("");
    }
  }, [password, passwordError]);



  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value).isValid) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value && !validatePassword(value).isValid) {
      setPasswordError(
        "Password must be at least 8 characters with uppercase, lowercase, and number"
      );
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For localhost: auto-login without Supabase check
      if (isLocalhost && email === "test@localhost.com" && password === "Test1234!") {
        // Create a mock session for localhost
        const mockUser = {
          id: "localhost-user-id",
          email: "test@localhost.com",
          user_metadata: {},
        };
        
        // Store in localStorage for auth context and auth store
        if (typeof window !== 'undefined') {
          localStorage.setItem('gavalogy-localhost-auth', JSON.stringify(mockUser));
        }
        
        // Directly set auth store state
        const user = {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.email.split("@")[0],
          full_name: "Test User",
          avatar_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const profile = {
          id: mockUser.id,
          user_id: mockUser.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          total_coins: 0,
          streak_count: 0,
          longest_streak: 0,
          dark_mode: false,
          xp: 0,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
        
        setUser(user);
        setProfile(profile);
        setIsAuthenticated(true);
        
        // Redirect to dashboard
        router.push("/dashboard");
        return;
      }

      // Try login first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data.user) {
        // Login successful - go to dashboard
        window.location.href = "/dashboard";
      } else if (error?.message.includes('Invalid login credentials')) {
        // Try signup if login fails
        const { data: signupData, error: _signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupData.user) {
          // Signup successful - go to dashboard
          window.location.href = "/dashboard";
        } else {
          setError(_signupError?.message || "Authentication failed");
        }
      } else {
        setError(error?.message || "Authentication failed");
      }
    } catch {
      setError("Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Google OAuth handles both login and signup automatically
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        setError(error.message);
      }
      // If successful, user will be redirected to dashboard
    } catch {
      setError("Google authentication failed");
    }
  };

  // Show loading while checking authentication
  if (loading || isAuthLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <div className="min-h-screen relative">
      <DottedBackground />
      <Header />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your Gavelogy account to continue learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className={emailError ? "border-red-500" : ""}
                    disabled={isSubmitting}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-500">{emailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      className={
                        passwordError ? "border-red-500 pr-10" : "pr-10"
                      }
                      disabled={isSubmitting}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    if (!email) {
                      e.preventDefault();
                      setEmailError("Please enter your email");
                    }
                    if (!password) {
                      e.preventDefault();
                      setPasswordError("Please enter your password");
                    }
                  }}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" text="Signing in..." />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="text-center text-sm mt-4">
                <span className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="/signup"
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
