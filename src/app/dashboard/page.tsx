"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useGamificationStore } from "@/lib/stores/gamification";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame,
  Coins,
  BookOpen,
  Target,
  BarChart3,
  BookOpenCheck,
  Trophy,
} from "lucide-react";
import AnalyticsSection from "@/components/dashboard/analytics";
import {
  purchaseCourse,
  COURSES,
  getUserCourses,
  Course,
  usePaymentStore,
} from "@/lib/payment";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, profile, isAuthenticated, isLoading } = useAuthStore();
  const { coins, streak, longestStreak, fetchGamificationData } =
    useGamificationStore();
  const { getUserCourses: getCourses, purchaseCourse: buyCourse } =
    usePaymentStore();
  const router = useRouter();
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadUserCourses = useCallback(async () => {
    const courses = getCourses();
    setUserCourses(courses);
  }, [getCourses]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGamificationData();
      loadUserCourses();
    }
  }, [isAuthenticated, fetchGamificationData, loadUserCourses]);

  const handlePurchase = async (
    courseId: string,
    courseName: string,
    price: number
  ) => {
    setPurchasing(courseId);

    try {
      const result = await buyCourse(courseId);

      if (result.success) {
        // Reload courses after successful purchase
        loadUserCourses();
        alert(`Successfully purchased ${courseName}!`);
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Hi 👋 {profile?.full_name || "Student"}, ready to improve today?
              </h1>
              <p className="text-muted-foreground">
                Ready to continue your CLAT PG preparation journey?
              </p>
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Mock
            </Button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Combined Stats Card - Mobile App Style */}
            <Card className="bg-gradient-to-br from-blue-50 to-orange-50 border-blue-200">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Top Row - Streak and Score Trend */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Flame className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-800">
                          {streak}-day streak 🔥
                        </p>
                        <p className="text-sm text-orange-600">
                          Longest: {longestStreak} days
                        </p>
                      </div>
                    </div>

                    {/* Score Trend Mini Chart */}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        Score Trend
                      </p>
                      <div className="flex items-end space-x-1">
                        {[65, 68, 72, 75, 78].map((score, index) => (
                          <div
                            key={index}
                            className="bg-blue-400 rounded-t"
                            style={{
                              width: "4px",
                              height: `${(score / 100) * 20}px`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row - Accuracy and Weak Topics */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="text-2xl font-bold text-blue-600">72%</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-2">
                        Weak Topics
                      </p>
                      <div className="flex flex-wrap gap-1 justify-end">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Evidence
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          TPA 🏠
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Constitution ⚖️
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row - Coins and Courses */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center">
                            <Coins className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              +
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold">+{coins} coins</p>
                          <p className="text-xs text-muted-foreground">
                            Keep earning!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">Courses</p>
                      <p className="text-lg font-bold text-blue-600">
                        {userCourses.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userCourses.length === 0
                          ? "Purchase to get started"
                          : `${userCourses.length} owned`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task of the Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Task of the Day ✔
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Attempt 1 Evidence Quiz
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "90%" }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">90%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Upload 1 mock</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "50%" }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">50%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Watch 2 mistake-based reels
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-300 h-2 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Static Subjects Course</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    13 Law Subjects • 650 Questions • 20 Mock Tests
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-4">
                    ₹1,999
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handlePurchase(
                        COURSES.STATIC_SUBJECTS.id,
                        COURSES.STATIC_SUBJECTS.name,
                        COURSES.STATIC_SUBJECTS.price
                      )
                    }
                    disabled={purchasing === COURSES.STATIC_SUBJECTS.id}
                  >
                    {purchasing === COURSES.STATIC_SUBJECTS.id
                      ? "Processing..."
                      : "Purchase Course"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contemporary Cases Course</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    150 Legal Cases • 2023-2025 • Month Quizzes
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-4">
                    ₹1,499
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      handlePurchase(
                        COURSES.CONTEMPORARY_CASES.id,
                        COURSES.CONTEMPORARY_CASES.name,
                        COURSES.CONTEMPORARY_CASES.price
                      )
                    }
                    disabled={purchasing === COURSES.CONTEMPORARY_CASES.id}
                  >
                    {purchasing === COURSES.CONTEMPORARY_CASES.id
                      ? "Processing..."
                      : "Purchase Course"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your learning progress and achievements
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet. Start by purchasing a course!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsSection />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="text-center py-8">
              <BookOpenCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Course Management</h3>
              <p className="text-muted-foreground">
                Manage your purchased courses and track progress
              </p>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Achievements</h3>
              <p className="text-muted-foreground">
                Track your milestones and accomplishments
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
