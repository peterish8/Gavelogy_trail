"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { usePaymentStore } from "@/lib/payment";
// AppHeader import removed
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { BookOpen, CheckCircle2, Lock, Sparkles } from "lucide-react";

export default function CoursesPage() {
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

  const { isAuthenticated, isLoading } = useAuthStore();
  const { 
    purchaseCourse, 
    checkUserCourseAccess, 
    availableCourses, 
    loadAvailableCourses 
  } = usePaymentStore();

  // Enable copy protection
  useCopyProtection();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [courseAccess, setCourseAccess] = useState<Record<string, boolean>>({});
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load courses
  useEffect(() => {
    loadAvailableCourses();
  }, [loadAvailableCourses]);

  // Load course access status
  useEffect(() => {
    const loadCourseAccess = async () => {
      if (!isAuthenticated || availableCourses.length === 0) return;

      setLoadingAccess(true);
      const access: Record<string, boolean> = {};

      for (const course of availableCourses) {
        try {
          access[course.id] = await checkUserCourseAccess(course.id);
        } catch (error) {
          console.error(`Error checking access for ${course.id}:`, error);
          access[course.id] = false;
        }
      }

      setCourseAccess(access);
      setLoadingAccess(false);
    };

    if (isAuthenticated) {
      loadCourseAccess();
    }
  }, [isAuthenticated, checkUserCourseAccess, availableCourses]);

  const handlePurchase = async (
    courseId: string
  ) => {
    setPurchasing(courseId);
    const result = await purchaseCourse(courseId);
    setPurchasing(null);

    if (result.success) {
      // Refresh course access after successful purchase
      const access: Record<string, boolean> = { ...courseAccess };
      // Optimistic update
      access[courseId] = true; 
      
      // Re-check just to be sure
      try {
         const verified = await checkUserCourseAccess(courseId);
         access[courseId] = verified;
      } catch (e) {
          console.error("Verification failed but purchase was successful", e);
      }
      
      setCourseAccess(access);
      router.push(`/purchase-success?orderId=${result.orderId}`);
    } else {
      alert(result.error || "Purchase failed");
    }
  };

  const handleLearnNow = (courseId: string) => {
      router.push(`/course-viewer?courseId=${courseId}`);
  };

  if (isLoading || (loadingAccess && availableCourses.length > 0)) {
    return (
      <div className="min-h-screen relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <DottedBackground />
        {/* AppHeader removed */}
        <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground animate-pulse">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      <DottedBackground />
      {/* AppHeader removed */}

      <motion.div 
        className="container mx-auto px-4 py-12 relative z-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Modern Header Section */}
        <motion.div className="mb-12 text-center max-w-2xl mx-auto" variants={item}>
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-primary/20 bg-primary/5 text-primary">
            Academic Excellence
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Explore Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Master CLAT PG with our comprehensively designed curriculum and expert-led modules.
          </p>
        </motion.div>

        {/* Unified Grid Layout */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
          variants={item}
        >
          {availableCourses.map((course) => {
            const hasAccess = courseAccess[course.id] || false;
            const isPurchasing = purchasing === course.id;
            
            // Dynamic styling based on purchase status
            const cardBorderColor = hasAccess 
                ? "border-green-500/50 dark:border-green-400/50" 
                : "border-slate-200 dark:border-slate-800";
            
            const cardShadow = hasAccess
                ? "shadow-lg shadow-green-500/10"
                : "hover:shadow-xl hover:shadow-primary/5";

            return (
              <motion.div 
                key={course.id} 
                variants={item}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className={`h-full flex flex-col overflow-hidden transition-all duration-300 border ${cardBorderColor} ${cardShadow} bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm`}>
                  
                  {/* Card Banner / Visual Header */}
                  <div className={`h-32 w-full relative overflow-hidden ${hasAccess ? 'bg-linear-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30' : 'bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'}`}>
                    <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div>
                    <div className="absolute top-4 right-4 z-10">
                        {hasAccess ? (
                             <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-1 pl-1.5 pr-2.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active
                             </Badge>
                        ) : (
                             <Badge variant="secondary" className="backdrop-blur-md bg-white/50 dark:bg-black/50">
                                <Lock className="w-3 h-3 mr-1" /> Premium
                             </Badge>
                        )}
                    </div>
                    {/* Icon placeholder since we don't have real images yet */}
                    <div className="absolute -bottom-6 left-6 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        <BookOpen className={`w-8 h-8 ${hasAccess ? 'text-green-600' : 'text-primary'}`} />
                    </div>
                  </div>

                  <CardContent className="pt-10 p-6 flex flex-col flex-1">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold mb-2 line-clamp-1" title={course.name}>{course.name}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 space-y-4">
                        {/* Price Section */}
                        {!hasAccess && (
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Price</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold tracking-tight">₹{course.price}</span>
                                        <span className="text-sm text-muted-foreground/60 line-through decoration-slate-400">
                                            ₹{(course.price * 1.5).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                                {course.freeContent && (
                                     <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                                        <Sparkles className="w-3 h-3 mr-1" /> Trial available
                                     </Badge>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            {hasAccess ? (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200 dark:shadow-none transition-all"
                                    onClick={() => handleLearnNow(course.id)}
                                >
                                    Continue Learning
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        className="w-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                                        onClick={() => handlePurchase(course.id)}
                                        disabled={isPurchasing}
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <span className="animate-spin mr-2">•</span> Processing...
                                            </>
                                        ) : (
                                            "Unlock Full Access"
                                        )}
                                    </Button>
                                    
                                    {course.freeContent && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                                            onClick={() => router.push(`/course-viewer?courseId=${course.id}&free=true`)}
                                        >
                                            Preview Free Content
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Empty State */}
        {availableCourses.length === 0 && (
             <div className="text-center py-20">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No courses available yet</h3>
                <p className="text-muted-foreground mt-2">Check back soon for new content.</p>
             </div>
        )}
      </motion.div>
    </div>
  );
}
