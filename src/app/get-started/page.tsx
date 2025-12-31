"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Header } from "@/components/header";
import { DottedBackground } from "@/components/DottedBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function GetStartedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Redirecting to dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Sky-like gradient background with enhanced clouds */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-200 via-blue-100 to-blue-50 -z-10">
        {/* Large cloud decorations - MUCH more visible */}
        <div className="absolute top-10 left-0 w-[600px] h-[400px] bg-purple-200/60 rounded-full blur-2xl"></div>
        <div className="absolute top-20 right-10 w-[550px] h-[350px] bg-blue-300/50 rounded-full blur-2xl"></div>
        <div className="absolute top-40 left-1/3 w-[500px] h-[450px] bg-white/85 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-10 w-[600px] h-[400px] bg-purple-300/50 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[300px] bg-white/70 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-1/3 w-[550px] h-[400px] bg-blue-300/45 rounded-full blur-2xl"></div>
        <div className="absolute top-32 left-1/2 w-[500px] h-[350px] bg-white/75 rounded-full blur-2xl"></div>
        <div className="absolute bottom-60 right-0 w-[600px] h-[450px] bg-blue-200/55 rounded-full blur-2xl"></div>
        {/* Additional smaller clouds for depth */}
        <div className="absolute top-60 left-20 w-[400px] h-[250px] bg-white/60 rounded-full blur-xl"></div>
        <div className="absolute top-80 right-20 w-[380px] h-[280px] bg-blue-200/50 rounded-full blur-xl"></div>
        <div className="absolute bottom-60 left-1/4 w-[420px] h-[300px] bg-purple-200/55 rounded-full blur-xl"></div>
        {/* Even more clouds for ultra dreamy effect */}
        <div className="absolute top-20 left-1/4 w-[450px] h-[300px] bg-white/70 rounded-full blur-xl"></div>
        <div className="absolute bottom-80 right-1/4 w-[400px] h-[320px] bg-blue-300/40 rounded-full blur-xl"></div>
        <div className="absolute top-60 right-1/3 w-[380px] h-[280px] bg-white/60 rounded-full blur-xl"></div>

        {/* Cloud-like shapes using multiple circles */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2">
          <div className="w-[200px] h-[100px] bg-white/75 rounded-full blur-xl"></div>
          <div className="w-[150px] h-[80px] bg-white/75 rounded-full blur-xl -mt-16 ml-8"></div>
          <div className="w-[180px] h-[90px] bg-white/75 rounded-full blur-xl -mt-12 -ml-12"></div>
        </div>

        <div className="absolute bottom-40 right-1/3">
          <div className="w-[180px] h-[90px] bg-blue-300/50 rounded-full blur-xl"></div>
          <div className="w-[140px] h-[70px] bg-blue-300/50 rounded-full blur-xl -mt-14 ml-6"></div>
          <div className="w-[160px] h-[80px] bg-blue-300/50 rounded-full blur-xl -mt-10 -ml-10"></div>
        </div>
      </div>

      {/* Dotted background with scroll-reactive motion */}
      <DottedBackground />

      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-[#2C2C2C]">
                  Get Started
                </h1>
                <p className="text-[#6C6C6C]">
                  Create your free account to start your CLAT PG preparation
                  journey.
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Create Free Account
                  </Button>
                </Link>

                <div className="text-center text-sm text-[#6C6C6C]">
                  Already registered?{" "}
                  <Link
                    href="/login"
                    className="text-purple-600 hover:text-purple-700 font-medium underline underline-offset-4"
                  >
                    Log in here
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
