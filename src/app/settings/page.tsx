"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DottedBackground } from "@/components/DottedBackground";
import { ArrowLeft, User, Save, Check, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, profile, isAuthenticated, isLoading, updateProfile } =
    useAuthStore();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  // Check username availability when user types
  useEffect(() => {
    const checkUsername = async () => {
      const trimmedUsername = username.trim().toLowerCase();
      
      // Reset states
      setUsernameError("");
      setUsernameAvailable(null);

      // Validation
      if (!trimmedUsername) {
        return;
      }

      if (trimmedUsername.length < 3) {
        setUsernameError("Username must be at least 3 characters");
        return;
      }

      if (trimmedUsername.length > 20) {
        setUsernameError("Username must be 20 characters or less");
        return;
      }

      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        setUsernameError("Only lowercase letters, numbers, and underscores allowed");
        return;
      }

      // If same as current username, no need to check
      if (trimmedUsername === profile?.username?.toLowerCase()) {
        setUsernameAvailable(true);
        return;
      }

      // Check if username exists in database
      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .ilike("username", trimmedUsername)
          .single();

        if (error && error.code === "PGRST116") {
          // No rows returned = username available
          setUsernameAvailable(true);
        } else if (data) {
          // Username taken
          setUsernameError("Username is already taken");
          setUsernameAvailable(false);
        }
      } catch (error) {
        console.warn("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, profile?.username]);

  const handleSave = async () => {
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setUsernameError("Username cannot be empty");
      return;
    }

    if (usernameError || usernameAvailable === false) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const result = await updateProfile({
        username: trimmedUsername,
        full_name: fullName.trim(),
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // Update username in streak tables too
        if (user) {
          // Update user_streaks
          await supabase
            .from("user_streaks")
            .update({ username: trimmedUsername })
            .eq("user_id", user.id);

          // Update user_points
          await supabase
            .from("user_points")
            .update({ username: trimmedUsername })
            .eq("user_id", user.id);
        }
      } else {
        if (result.error?.includes("duplicate") || result.error?.includes("unique")) {
          setUsernameError("Username is already taken");
        } else {
          alert(result.error || "Failed to update profile");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DottedBackground />
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and profile information
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Enter your username"
                  maxLength={20}
                  className={`${
                    usernameError 
                      ? "border-red-500 focus:ring-red-500" 
                      : usernameAvailable 
                        ? "border-green-500 focus:ring-green-500" 
                        : ""
                  }`}
                />
                {isCheckingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
                {!isCheckingUsername && usernameAvailable && !usernameError && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {!isCheckingUsername && usernameError && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {usernameError ? (
                <p className="text-sm text-red-500">{usernameError}</p>
              ) : usernameAvailable ? (
                <p className="text-sm text-green-600">Username is available!</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This will be displayed on the leaderboard. Lowercase letters, numbers, underscores only.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                Your display name (only visible to you).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || !!usernameError || usernameAvailable === false}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
