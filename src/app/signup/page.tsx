"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/header";
import { LoadingSpinner, LoadingPage } from "@/components/LoadingSpinner";
import { AuthBackground } from "@/components/AuthBackground";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateFullName,
} from "@/lib/validation";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Scale, BookOpen, Trophy, Zap } from "lucide-react";

const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const features = [
  { icon: Scale,     label: "PYQ Mock Exams",          desc: "Full-length AILET-style timed tests" },
  { icon: BookOpen,  label: "Smart Mistake Tracking",   desc: "Learn from every wrong answer" },
  { icon: Trophy,    label: "Live Leaderboards",         desc: "Compete with top aspirants" },
  { icon: Zap,       label: "Gamified Arena",            desc: "Duels, speed court & more" },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", username: "", fullName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "", username: "", fullName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup, signInWithGoogle, user, isLoading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (user || isAuthenticated)) router.push("/dashboard");
  }, [user, isAuthenticated, isLoading, router]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const message = urlParams.get("message");
    if (message) { setError(message); return; }
    if (errorParam) {
      const msgs: Record<string, string> = {
        supabase_not_configured: "Google sign-up is not configured yet.",
        auth_callback_failed: "Google sign-up failed. Please try again.",
        no_session: "No active session found. Please try signing up again.",
        unexpected_error: "An unexpected error occurred. Please try again.",
      };
      setError(msgs[errorParam] || "Sign-up failed. Please try again.");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user || isAuthenticated) { router.push("/dashboard"); return; }

    setErrors({ email: "", password: "", confirmPassword: "", username: "", fullName: "" });
    setError("");

    const emailV = validateEmail(formData.email);
    if (!emailV.isValid) { setErrors(p => ({ ...p, email: emailV.errors[0] })); return; }
    const passV = validatePassword(formData.password);
    if (!passV.isValid) { setErrors(p => ({ ...p, password: passV.errors[0] })); return; }
    const userV = validateUsername(formData.username);
    if (!userV.isValid) { setErrors(p => ({ ...p, username: userV.errors[0] })); return; }
    const nameV = validateFullName(formData.fullName);
    if (!nameV.isValid) { setErrors(p => ({ ...p, fullName: nameV.errors[0] })); return; }
    if (formData.password !== formData.confirmPassword) {
      setErrors(p => ({ ...p, confirmPassword: "Passwords do not match" })); return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup(formData.email, formData.password, formData.username, formData.fullName);
      if (result.success) {
        router.push("/login?message=Account created successfully! Please sign in.");
      } else {
        setError(result.error || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      if (!result.success) { 
        setError(result.error || "Google sign-up failed."); 
        setIsSubmitting(false); 
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed.");
      setIsSubmitting(false);
      setIsGoogleLoading(false);
    }
  };

  if (isLoading) return <LoadingPage text="Loading..." />;
  if (isGoogleLoading) return <LoadingPage text="Continuing with Google..." />;

  return (
    <div className="min-h-screen flex flex-col relative">
      <AuthBackground />
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">

          {/* ── Left branding panel ── */}
          <div className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e40af 0%, #4f46e5 50%, #7c3aed 100%)" }}
          >
            {/* Decorative orbs */}
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
                Master CLAT PG<br />the smart way
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                Join thousands of law aspirants who prepare smarter with AI-powered tools and gamified learning.
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

          {/* ── Right form panel ── */}
          <div className="bg-background/95 backdrop-blur-md p-8 lg:p-10 flex flex-col justify-center">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <span className="text-xl font-bold">Gavelogy</span>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-muted-foreground text-sm mt-1">Start your CLAT PG preparation today</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name + Username side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName" name="fullName" type="text" placeholder="Arjun Sharma"
                    value={formData.fullName} onChange={handleChange} disabled={isSubmitting}
                    className={`h-10 ${errors.fullName ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                    required
                  />
                  {errors.fullName && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fullName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username" name="username" type="text" placeholder="arjun_law"
                    value={formData.username} onChange={handleChange} disabled={isSubmitting}
                    className={`h-10 ${errors.username ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                    required
                  />
                  {errors.username && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.username}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email" name="email" type="email" placeholder="arjun@example.com"
                  value={formData.email} onChange={handleChange} disabled={isSubmitting}
                  className={`h-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                  required
                />
                {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password" name="password" type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters" value={formData.password} onChange={handleChange}
                      className={`h-10 pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                      disabled={isSubmitting} required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange}
                      className={`h-10 pr-10 ${errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"}`}
                      disabled={isSubmitting} required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword
                    ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.confirmPassword}</p>
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Passwords match</p>
                      : null
                  }
                </div>
              </div>

              <button
                type="submit" disabled={isSubmitting}
                className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)" }}
              >
                {isSubmitting ? <LoadingSpinner size="sm" text="Creating account..." /> : "Create Account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={handleGoogleSignUp} disabled={isSubmitting}
              className="w-full h-11 rounded-lg border border-border bg-background hover:bg-accent text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? <LoadingSpinner size="sm" text="Signing up..." /> : <><GoogleIcon /> Continue with Google</>}
            </button>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
