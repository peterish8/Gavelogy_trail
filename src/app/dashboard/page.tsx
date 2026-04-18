"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { useLoadingStore } from "@/lib/stores/loading-store";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { BookOpenCheck } from "lucide-react";
import { Course, usePaymentStore } from "@/lib/payment";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { SpacedRepetitionCalendar } from "@/components/spaced-repetition/calendar-view";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { PerformancePanel } from "@/components/dashboard/performance-panel";
import AnalyticsSection from "@/components/dashboard/analytics";

export default function DashboardPage() {
  const { isCollapsed: _isCollapsed, isMounted: _isMounted } = useSidebarState();
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const { user, profile } = useAuthStore();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { getUserCourses: getCourses, loadUserCourses } = usePaymentStore();
  const { loadMistakes } = useMistakeStore();
  const router = useRouter();
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useCopyProtection();

  const { setLoading } = useLoadingStore();

  // Reactive Convex query — auto-updates when new quiz attempts are saved
  const rawAttempts = useQuery(api.quiz.getAttemptsEnriched) ?? [];

  const recentAttempts = rawAttempts.slice(0, 12).map((a) => ({
    id: a._id,
    score: a.score,
    totalQuestions: a.total_questions,
    subject: a.subject,
    topic: a.quizTitle,
    completedAt: new Date(a.completed_at).getTime(),
  }));

  const allAttempts = rawAttempts.map((a) => ({
    id: a._id,
    score: a.score,
    subject: a.subject,
    completedAt: new Date(a.completed_at).getTime(),
  }));

  const fetchAndSetCourses = useCallback(async () => {
    const courses = await getCourses();
    setUserCourses(courses);
  }, [getCourses]);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user && profile) {
      loadUserCourses();
      fetchAndSetCourses();
      loadMistakes();
    }
  }, [isAuthenticated, user, profile, loadUserCourses, fetchAndSetCourses, loadMistakes]);

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
      <DashboardHeader />

      <motion.div
        className="w-full max-w-[1800px] mx-auto px-6 lg:px-10 py-6 no-copy"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="mb-6 border-b border-[var(--border-strong)]/40 dark:border-white/[0.07]">
              <nav className="flex items-center gap-6">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "analytics", label: "Analytics" },
                  { id: "courses", label: "Courses" }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative pb-3 text-sm font-semibold transition-colors duration-200 ${
                        isActive
                          ? "text-[var(--brand)]"
                          : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <motion.span
                          layoutId="tab-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--brand)]"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="mb-8">
                <SpacedRepetitionCalendar />
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 flex flex-col">
                  <div className="mb-3">
                    <h2 className="section-label">Recent Activity</h2>
                    <p className="meta-label mt-1">Your last 12 quiz attempts across all subjects</p>
                  </div>
                  <div className="h-[420px] overflow-y-auto pr-1 space-y-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <RecentActivityList attempts={recentAttempts} />
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col">
                  <div className="mb-3">
                    <h2 className="section-label">Performance Summary</h2>
                    <p className="meta-label mt-1">Your overall stats and subject breakdown</p>
                  </div>
                  <div className="h-[420px]">
                    <PerformancePanel attempts={allAttempts} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsSection />
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              {userCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userCourses.map((course) => (
                    <div key={course.id} className="feature-card card-interactive overflow-hidden p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-[var(--ink)] text-base leading-snug">{course.name}</h3>
                          <p className="text-sm text-[var(--ink-3)] mt-1">{course.description}</p>
                        </div>
                        <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-semibold shrink-0">Active</span>
                      </div>
                      <div className="border-t border-white/30 dark:border-white/[0.06] pt-4 flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider font-medium">Access</p>
                            <p className="text-[var(--gv-success)] dark:text-emerald-400 font-semibold mt-0.5">Lifetime</p>
                          </div>
                        </div>
                        <Button
                          className="bg-[var(--gv-success)] hover:bg-[#186640] text-white rounded-xl px-5"
                          onClick={() => router.push(`/course-viewer?courseId=${course.id}`)}
                        >
                          Continue →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="feature-card p-16 text-center">
                  <div className="flex flex-col items-center gap-5">
                    <div className="rounded-2xl bg-[var(--brand-soft)] dark:bg-violet-500/15 p-5">
                      <BookOpenCheck className="h-9 w-9 text-[var(--brand)]" />
                    </div>
                    <div className="space-y-3 max-w-lg">
                      <h3 className="text-2xl font-bold text-[var(--ink)]" style={{ fontFamily: 'var(--display-family)' }}>
                        No courses in your library yet.
                      </h3>
                      <p className="text-[var(--ink-3)] leading-relaxed">
                        Get access to structured CLAT PG courses — curated case notes, contemporary judgments, PYQ banks, and topic-wise quizzes with spaced repetition built in.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        onClick={() => router.push("/courses")}
                        className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl px-6 py-2.5 font-semibold"
                      >
                        Browse courses →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
