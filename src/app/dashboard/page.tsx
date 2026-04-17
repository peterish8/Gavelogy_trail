"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth";

import { useQuizStore } from "@/lib/stores/quiz";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useLoadingStore } from "@/lib/stores/loading-store";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { LoadingSpinner } from "@/components/LoadingSpinner";
// AppHeader import removed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { BookOpen, Target, BarChart3, BookOpenCheck, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  COURSES,
  Course,
  usePaymentStore,
} from "@/lib/payment";
import { useRouter } from "next/navigation";
import { SpacedRepetitionCalendar } from "@/components/spaced-repetition/calendar-view";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { PerformancePanel } from "@/components/dashboard/performance-panel";

export default function DashboardPage() {
  const { isCollapsed, isMounted } = useSidebarState();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const { user, profile, isAuthenticated, isLoading } = useAuthStore();
  const { getUserCourses: getCourses, loadUserCourses } =
    usePaymentStore();

  const { getRecentAttempts, loadAttempts, loading: quizLoading } = useQuizStore();
  const { loadMistakes } = useMistakeStore();
  const router = useRouter();
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Enable copy protection
  useCopyProtection();

  const { setLoading } = useLoadingStore();

  const fetchAndSetCourses = useCallback(async () => {
    const courses = await getCourses();
    setUserCourses(courses);
  }, [getCourses]);

  useEffect(() => {
    // Dismiss loader when dashboard mounts
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Debug logging
  console.log('Dashboard state:', { isLoading, isAuthenticated, user: !!user, profile: !!profile });

  useEffect(() => {
    if (isAuthenticated && user && profile) {
      loadUserCourses(); // Fetch from DB to update store
      fetchAndSetCourses(); // Update local state from store
      loadMistakes();
      loadAttempts();
    }
  }, [isAuthenticated, user, profile, loadUserCourses, fetchAndSetCourses, loadMistakes, loadAttempts]);

  // Get recent activity data
  const recentAttempts = getRecentAttempts(12);
  const allAttempts = getRecentAttempts(1000); // Get all attempts for total count
  
  // Debug logging
  console.log('Quiz Store Debug:', {
    recentAttempts: recentAttempts.length,
    allAttempts: allAttempts.length,
    loading: quizLoading
  });


  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getQuizTypeIcon = (subject: string) => {
    if (subject === 'Contemporary Cases') return '📚';
    if (subject === 'PYQ') return '📝';
    if (subject === 'Mock Test') return '🎯';
    return '📖';
  };



  const getAccuracyBorderColor = (accuracy: number) => {
    if (accuracy < 35) return 'border-l-red-500';
    if (accuracy < 76) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  const formatTopicName = (subject: string, topic: string) => {
    if (subject === 'Contemporary Cases') {
      const parts = topic.split('. ');
      if (parts.length > 1) {
        const firstPart = parts[0];
        const isNumber = !isNaN(Number(firstPart));
        if (isNumber) {
          return parts.slice(1).join('. ');
        }
      }
      return topic;
    }
    return topic;
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DottedBackground />
        <LoadingSpinner size="lg" text="Loading Dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        {/* AppHeader removed */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <p>Please log in to access the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DottedBackground />
      {/* AppHeader removed */}

      <motion.div 
        className="w-full max-w-[1800px] mx-auto px-6 lg:px-10 py-6 no-copy"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="mb-4" variants={item}>
          <div className={`flex items-center justify-between transition-all duration-300 ${isMounted && isCollapsed ? 'pl-14 lg:pl-14' : ''}`}>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-1">
                Hi 👋 {profile?.full_name || "Student"}, ready to improve today?
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to continue your CLAT PG preparation journey?
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
          <div className="border-b border-border mb-6 relative">
            <nav className="flex space-x-8">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
                { id: "courses", label: "Courses", icon: BookOpenCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 py-3 px-1 font-medium text-sm transition-colors duration-300 ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-foreground hover:text-primary/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </nav>
            {/* Moving gradient line */}
            <div 
              className="absolute bottom-0 h-0.5 bg-linear-to-r from-primary via-primary to-primary/50 transition-all duration-300 ease-out"
              style={{
                width: activeTab === "overview" ? "120px" : activeTab === "analytics" ? "130px" : "115px",
                left: activeTab === "overview" ? "8px" : activeTab === "analytics" ? "112px" : "229px"
              }}
            />
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="mb-8">
                 <SpacedRepetitionCalendar />
            </div>

            {/* Two-column layout: Left = scrollable activity, Right = Performance Panel */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT — Fixed-height scrollable recent activity */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="mb-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Activity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Your last 12 quiz attempts across all subjects</p>
                </div>
                {/* Fixed height box with overflow scroll */}
                <div className="h-[420px] overflow-y-auto pr-1 space-y-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <RecentActivityList attempts={recentAttempts} />
                </div>
              </div>

              {/* RIGHT — Performance Summary Panel */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="mb-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Performance Summary</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Your overall stats and subject breakdown</p>
                </div>
                <div className="h-[420px]">
                  <PerformancePanel attempts={allAttempts} />
                </div>
              </div>

            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="rounded-full bg-orange-100 p-4">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Analytics Coming Soon
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      Advanced analytics and performance insights are under
                      development. Track your progress, identify weak areas, and
                      optimize your study strategy.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-orange-600 font-medium">
                    <span>🚀</span>
                    <span>Under Development</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {userCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="overflow-hidden border-green-200 bg-green-50/50"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{course.name}</span>
                        <span className="text-sm bg-green-600 text-white px-2 py-1 rounded-full">
                          Purchased
                        </span>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 font-medium">
                            Status
                          </span>
                          <span className="text-green-600 font-medium">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Access</span>
                          <span className="text-green-600 font-medium">
                            Lifetime
                          </span>
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            if (course.id === COURSES.STATIC_SUBJECTS.id) {
                              router.push("/subjects");
                            } else if (
                              course.id === COURSES.CONTEMPORARY_CASES.id
                            ) {
                              router.push("/subjects?tab=contemporary-cases");
                            }
                          }}
                        >
                          Continue Learning →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-full bg-blue-100 p-4">
                      <BookOpenCheck className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        No Courses Purchased Yet
                      </h3>
                      <p className="text-gray-600 max-w-md">
                        Start your learning journey by purchasing a course.
                        Access comprehensive study materials, quizzes, and track
                        your progress.
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push("/courses")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Courses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}