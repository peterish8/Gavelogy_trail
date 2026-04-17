"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Calendar,
  Trophy,
  Settings,
  Save,
  Edit3,
  Flame,

  Award,
} from "lucide-react";
import { GavelIcon } from '@/components/icons/gavel-icon';
import { DottedBackground } from "@/components/DottedBackground";
import Link from "next/link";

export default function ProfilePage() {
  const { user, profile, updateProfile, isAuthenticated } = useAuthStore();
  const { userStreak, leaderboard, loadUserStreak, loadLeaderboard } = useStreakStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile && user) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        email: user.email || "",
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStreak();
      loadLeaderboard();
    }
  }, [isAuthenticated, loadUserStreak, loadLeaderboard]);

  // Find current user's position in leaderboard
  const currentUserEntry = leaderboard.find(entry => entry.user_id === user?.id);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile({
        username: formData.username,
        full_name: formData.full_name,
      });

      if (result.success) {
        setIsEditing(false);
      } else {
        alert("Failed to update profile: " + result.error);
      }
    } catch {
      alert("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || "",
      full_name: profile?.full_name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        {/* AppHeader removed */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your profile.
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      {/* AppHeader removed */}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        @{profile?.username || "user"}
                      </h3>
                      <p className="text-muted-foreground">
                        {profile?.full_name || ""}
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        disabled={!isEditing}
                        placeholder="Enter username"
                      />
                      <p className="text-xs text-muted-foreground">
                        Displayed on leaderboard
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        placeholder="Enter full name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Only visible to you
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  {/* Save/Cancel Buttons */}
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Streak Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Your Streak Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-orange-100/60 dark:bg-orange-500/10 dark:border dark:border-orange-500/50">
                      <div className="flex items-center justify-center mb-2">
                        <Flame className="h-6 w-6 text-orange-500 mr-1" />
                        <span className="text-2xl font-bold text-orange-600">
                          {userStreak?.current_streak || 0}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Current Streak
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-purple-100/60 dark:bg-purple-500/10 dark:border dark:border-purple-500/50">
                      <div className="flex items-center justify-center mb-2">
                        <GavelIcon className="h-6 w-6 text-purple-500 mr-1" />
                        <span className="text-2xl font-bold text-purple-600">
                          {currentUserEntry?.monthly_points || 0}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Monthly Points
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-green-100/60 dark:bg-green-500/10 dark:border dark:border-green-500/50">
                      <div className="flex items-center justify-center mb-2">
                        <Award className="h-6 w-6 text-green-500 mr-1" />
                        <span className="text-2xl font-bold text-green-600">
                          {currentUserEntry?.all_time_points || 0}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        All-Time Points
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-yellow-100/60 dark:bg-yellow-500/10 dark:border dark:border-yellow-500/50">
                      <div className="flex items-center justify-center mb-2">
                        <Trophy className="h-6 w-6 text-yellow-500 mr-1" />
                        <span className="text-2xl font-bold text-yellow-600">
                          #{currentUserEntry?.rank || '-'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Leaderboard Rank
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Trophy className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/courses" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Courses
                    </Button>
                  </Link>
                  <Link href="/leaderboard" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Trophy className="h-4 w-4 mr-2" />
                      Leaderboard
                    </Button>
                  </Link>
                  <Link href="/settings" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
