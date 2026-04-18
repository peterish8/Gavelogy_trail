"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useConvexAuth } from "convex/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/header";
import { LoadingSpinner, LoadingPage } from "@/components/LoadingSpinner";
import { AuthBackground } from "@/components/AuthBackground";
import { validateEmail, validatePassword } from "@/lib/validation";
import { Eye, EyeOff, AlertCircle, Scale, BookOpen, Trophy, Zap, FlaskConical } from "lucide-react";

const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_TEST_EMAIL ?? "";
const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_TEST_PASSWORD ?? "";

const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const features = [
  { icon: Scale,    label: "PYQ Mock Exams",        desc: "Full-length AILET-style timed tests" },
  { icon: BookOpen, label: "Smart Mistake Tracking", desc: "Learn from every wrong answer" },
  { icon: Trophy,   label: "Live Leaderboards",       desc: "Compete with top aspirants" },
  { icon: Zap,      label: "Gamified Arena",          desc: "Duels, speed court & more" },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const message = urlParams.get("message");
    if (message) { setError(message); return; }
    if (errorParam) {
      const msgs: Record<string, string> = {
        oauth_failed: "Google sign-in failed. Please try again.",
        callback_failed: "Authentication callback failed. Please try again.",
        auth_failed: "Authentication failed. Please try again.",
        no_session: "No active session found. Please sign in again.",
      };
      setError(msgs[errorParam] || "An error occurred during authentication.");
    }
  }, []);

  useEffect(() => { if (email && emailError) setEmailError(""); }, [email, emailError]);
  useEffect(() => { if (password && passwordError) setPasswordError(""); }, [password, passwordError]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !validateEmail(e.target.value).isValid)
      setEmailError("Please enter a valid email address");
    else setEmailError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value && !validatePassword(e.target.value).isValid)
      setPasswordError("Password must be at least 8 characters with uppercase, lowercase, and number");
    else setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) { router.push("/dashboard"); return; }
    if (!email) { setEmailError("Please enter your email"); return; }
    if (!password) { setPasswordError("Please enter your password"); return; }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await signIn(email, password);
      if (result.success) {
        router.push("/dashboard");
        return;
      }
      // If sign-in fails (new user), try sign-up with derived username
      if (result.error?.toLowerCase().includes("invalid") || result.error?.toLowerCase().includes("not found")) {
        const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        const signUpResult = await signUp(email, password, username, "");
        if (signUpResult.success) {
          router.push("/dashboard");
        } else {
          setError(signUpResult.error || "Authentication failed");
        }
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch {
      setError("Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevLogin = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await signIn(DEV_EMAIL, DEV_PASSWORD);
      if (result.success) { router.push("/dashboard"); return; }
      // Account doesn't exist yet — create it
      const signUpResult = await signUp(DEV_EMAIL, DEV_PASSWORD, "dev_test_user", "");
      if (signUpResult.success) router.push("/dashboard");
      else setError(signUpResult.error || "Dev login failed");
    } catch {
      setError("Dev login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || "Google sign-in failed");
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) return <LoadingPage text="Loading..." />;
  if (isGoogleLoading) return <LoadingPage text="Continuing with Google..." />;

  return (
    <div className="min-h-screen flex flex-col relative">
      <AuthBackground />
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">

          <div className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e40af 0%, #4f46e5 50%, #7c3aed 100%)" }}
          >
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-purple-400/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
                <span className="text-2xl font-bold tracking-tight">Gavelogy</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight mb-3">
                Welcome back,<br />counselor
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Continue your CLAT PG journey. Your progress, streak, and rank are waiting.
              </p>
            </div>

            <div className="relative z-10 space-y-3 my-8">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-blue-200">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="relative z-10 text-xs text-blue-300">© 2025 Gavelogy. All rights reserved.</p>
          </div>

          <div className="bg-background/95 backdrop-blur-md p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="text-xl font-bold">Gavelogy</span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold">Sign in</h1>
              <p className="text-muted-foreground text-sm mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email" type="email" placeholder="arjun@example.com"
                  value={email} onChange={handleEmailChange} disabled={isSubmitting}
                  className={`h-11 ${emailError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                  required
                />
                {emailError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline underline-offset-4">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" value={password}
                    onChange={handlePasswordChange} disabled={isSubmitting}
                    className={`h-11 pr-10 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{passwordError}</p>}
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)" }}
              >
                {isSubmitting ? <LoadingSpinner size="sm" text="Signing in..." /> : "Sign In"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={handleGoogleSignIn} disabled={isSubmitting}
              className="w-full h-11 rounded-lg border border-border bg-background hover:bg-accent text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <GoogleIcon /> Continue with Google
            </button>

            {process.env.NODE_ENV === "development" && DEV_EMAIL && (
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={isSubmitting}
                className="w-full h-9 rounded-lg border border-dashed border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium transition-colors flex items-center justify-center gap-2 mt-3 disabled:opacity-60"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Dev: login as test user
              </button>
            )}

            <p className="text-center text-sm text-muted-foreground mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline underline-offset-4">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
