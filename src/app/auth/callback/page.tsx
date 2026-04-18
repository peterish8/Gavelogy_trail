"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { LoadingPage } from "@/components/LoadingSpinner";

// Convex Auth handles OAuth callbacks via its HTTP router at /api/auth/callback/*
// This page exists as a fallback — redirect authenticated users to dashboard
export default function AuthCallback() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      const timer = setTimeout(() => {
        if (!isAuthenticated) router.push("/login?error=auth_failed");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  return <LoadingPage text="Securing your session..." />;
}
