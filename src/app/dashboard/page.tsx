"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useStreakStore } from "@/lib/stores/streaks";
import { useQuizStore } from "@/lib/stores/quiz";
import { useMistakeStore } from "@/lib/stores/mistakes";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { BookOpen, Target, BarChart3, BookOpenCheck, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
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
  const { getUserCourses: getCourses, purchaseCourse: buyCourse } =
    usePaymentStore();

  const { getRecentAttempts, addAttempt, attempts } = useQuizStore();
  const { mistakes, loadMistakes } = useMistakeStore();
  const router = useRouter();
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Enable copy protection
  useCopyProtection();

  const loadUserCourses = useCallback(async () => {
    const courses = getCourses();
    setUserCourses(courses);
  }, [getCourses]);

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
      loadUserCourses();
      loadMistakes();

    }
  }, [isAuthenticated, user, profile, loadUserCourses, loadMistakes]);

  // Get recent activity data
  const recentAttempts = getRecentAttempts(12);
  const allAttempts = getRecentAttempts(1000); // Get all attempts for total count
  
  // Debug logging
  console.log('Quiz Store Debug:', {
    attemptsArray: attempts,
    attemptsLength: attempts.length,
    recentAttempts: recentAttempts.length,
    allAttempts: allAttempts.length,
    localStorage: typeof window !== 'undefined' ? localStorage.getItem('quiz-storage') : 'SSR'
  });
  // Count all unmastered mistakes (wrong answers)
  const totalMistakes = mistakes.filter(m => !m.is_mastered && m.user_answer !== m.correct_answer.replace(/[()]/g, "").trim()).length;
  
  // Count all unmastered unsure answers (correct but guessed/fluke)
  const totalUnsures = mistakes.filter(m => !m.is_mastered && (m.confidence_level === 'educated_guess' || m.confidence_level === 'fluke')).length;

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

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 35) return 'destructive';
    if (accuracy < 76) return 'outline';
    return 'default';
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

  const handlePurchase = async (
    courseId: string,
    courseName: string,
    price: number
  ) => {
    setPurchasing(courseId);

    try {
      const result = await buyCourse(courseId);

      if (result.success) {
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
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
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
      <Header />

      <div className="container mx-auto px-4 py-8 no-copy">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                Hi 👋 {profile?.full_name || "Student"}, ready to improve today?
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to continue your CLAT PG preparation journey?
              </p>
            </div>
          </div>
        </div>

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
              ].map((tab, index) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-1 font-medium text-sm transition-colors duration-300 ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-foreground hover:text-primary/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            {/* Moving gradient line */}
            <div 
              className="absolute bottom-0 h-0.5 bg-gradient-to-r from-primary via-primary to-primary/50 transition-all duration-300 ease-out"
              style={{
                width: activeTab === "overview" ? "120px" : activeTab === "analytics" ? "130px" : "115px",
                left: activeTab === "overview" ? "8px" : activeTab === "analytics" ? "112px" : "229px"
              }}
            />
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-3 gap-3 mb-8 mt-2">
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Total Quizzes</p>
                    <div className="flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <p className="text-lg font-bold">{allAttempts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Mistakes</p>
                    <div className="flex items-center justify-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <p className="text-lg font-bold">{totalMistakes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Unsure</p>
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-lg font-bold">{totalUnsures}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your last 12 quiz attempts across all subjects
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Debug info */}
                  <div className="text-xs text-muted-foreground mb-4">
                    Found {recentAttempts.length} recent attempts, {allAttempts.length} total attempts
                    <br />Store has {attempts.length} attempts total
                    {attempts.length === 0 && (
                      <>
                        <br />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={async () => {
                            await addAttempt({
                              subject: "Test Subject",
                              topic: "Test Topic",
                              questions: ["1", "2", "3"],
                              answers: { "1": "A", "2": "B", "3": "C" },
                              correctAnswers: { "1": "A", "2": "B", "3": "D" },
                              score: 2,
                              totalQuestions: 3,
                              timeSpent: 120,
                              wrongQuestions: ["3"],
                              confidence: { "1": "confident", "2": "confident", "3": "guess" }
                            });
                          }}
                        >
                          Add Test Attempt
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {recentAttempts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentAttempts.map((attempt) => {
                        const accuracy = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        const displayTopic = formatTopicName(attempt.subject, attempt.topic);
                        return (
                          <Card key={attempt.id} className={`border-l-4 ${getAccuracyBorderColor(accuracy)}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getQuizTypeIcon(attempt.subject)}</span>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{attempt.subject}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2" title={displayTopic}>
                                      {displayTopic}
                                    </p>
                                  </div>
                                </div>
                                <Badge 
                                  variant={accuracy < 35 ? 'destructive' : 'outline'}
                                  className={accuracy >= 76 ? 'bg-green-500 text-white border-green-500' : accuracy >= 35 ? 'bg-yellow-500 text-white border-yellow-500' : ''}
                                >
                                  {accuracy}%
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(attempt.timestamp)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {attempt.score}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    {attempt.totalQuestions - attempt.score}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quiz attempts found. Start by taking a quiz!</p>
                      <Button 
                        onClick={() => router.push('/subjects')}
                        className="mt-4"
                        variant="outline"
                      >
                        Browse Subjects
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
}