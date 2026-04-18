"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { usePaymentStore } from "@/lib/payment";
// AppHeader import removed
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";
import { BookOpen, CheckCircle2 } from "lucide-react";

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
    // purchaseCourse, // commented — purchase happens on dedicated course page now
    checkUserCourseAccess,
    availableCourses,
    loadAvailableCourses
  } = usePaymentStore();

  // Enable copy protection
  useCopyProtection();
  const router = useRouter();
  // const [purchasing, setPurchasing] = useState<string | null>(null); // commented — no longer triggers purchase here
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

  /* --- handlePurchase commented — purchase now lives on /courses/[id] page ---
  const handlePurchase = async (courseId: string) => {
    setPurchasing(courseId);
    const result = await purchaseCourse(courseId);
    setPurchasing(null);

    if (result.success) {
      const access: Record<string, boolean> = { ...courseAccess };
      access[courseId] = true;
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
  --- end handlePurchase --- */

  const handleLearnNow = (courseId: string) => {
    router.push(`/course-viewer?courseId=${courseId}`);
  };

  if (isLoading || (loadingAccess && availableCourses.length > 0)) {
    return (
      <div className="min-h-screen relative transition-colors duration-300">
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
          <Badge variant="outline" className="mb-4 px-4 py-1 text-sm border-[#D7CEFA] bg-[#EBE6FD] text-[#4B2AD6]">
            Academic Excellence
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Explore Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Master CLAT PG with our comprehensively designed curriculum and expert-led modules.
          </p>
        </motion.div>

        {/* Unified Grid Layout — Prototype card design */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto" 
          variants={item}
        >
          {availableCourses.map((course, idx) => {
            const hasAccess = courseAccess[course.id] || false;
            const courseName = course.name?.toLowerCase() || "";
            
            // Derive card metadata from course name
            const isBundle = courseName.includes("bundle") || courseName.includes("combo") || courseName.includes("full");
            const isContemporary = courseName.includes("contemporary") || courseName.includes("current");
            const isStatic = !isBundle && !isContemporary;
            
            const categoryLabel = isBundle ? "FULL PREP" : isContemporary ? "CURRENT AFFAIRS" : "CORE CURRICULUM";
            const badgeText = isBundle ? "Best value" : (idx === 0 || isStatic) ? "Most popular" : null;
            const badgeStyle = isBundle
              ? "bg-[#4B2AD6] text-white text-[11px] font-semibold px-3 py-1 rounded-full"
              : "border border-[#4B2AD6] text-[#4B2AD6] text-[11px] font-semibold px-3 py-1 rounded-full";

            // Stats & features per course type
            const stats = isBundle
              ? [{ value: "13", label: "SUBJECTS" }, { value: "150", label: "CASES" }, { value: "20", label: "MOCKS" }]
              : isContemporary
              ? [{ value: "150", label: "CASES" }, { value: "2023–25", label: "YEARS" }, { value: "36", label: "QUIZZES" }]
              : [{ value: "13", label: "SUBJECTS" }, { value: "650", label: "QUESTIONS" }, { value: "20", label: "MOCKS" }];
            
            const features = isBundle
              ? ["Everything in Static", "Everything in Contemporary", "Priority mentor (48h)", "1:1 mock review"]
              : isContemporary
              ? ["Month-wise quizzes", "Landmark headnotes", "Citation map", "Ratio explainer", "Mentor Q&A"]
              : ["Judgment PDF reader", "Concept maps", "Case notes", "Quizzes & flashcards", "Mistake tracker"];

            const originalPrice = isBundle ? "3,498" : null;

            // Card-specific smooth pastel gradients — exact prototype colors
            // Static = Lavender-Blue/Periwinkle, Contemporary = Sage Green/Mint, Bundle = Warm Peach/Amber
            const cardGradientStyle = isBundle
              ? { background: "linear-gradient(180deg, #F3EBE0 0%, rgba(245,237,228,0.5) 40%, rgba(251,248,244,0.15) 70%, transparent 100%)" }
              : isContemporary
              ? { background: "linear-gradient(180deg, #E2EDE6 0%, rgba(226,237,230,0.5) 40%, rgba(245,250,247,0.15) 70%, transparent 100%)" }
              : { background: "linear-gradient(180deg, #E8E3F6 0%, rgba(232,227,246,0.5) 40%, rgba(249,248,252,0.15) 70%, transparent 100%)" };

            return (
              <motion.div 
                key={course.id} 
                variants={item}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <div className={`h-full flex flex-col bg-white dark:bg-card rounded-xl overflow-hidden transition-all duration-300 ${
                  isBundle 
                    ? "border-2 border-[#4B2AD6]/20 shadow-lg shadow-[#4B2AD6]/5 relative" 
                    : "border border-[#CDC6DC] dark:border-border shadow-sm hover:shadow-md"
                }`}>
                  {/* Subtle violet left accent for bundle */}
                  {isBundle && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4B2AD6] rounded-l-xl" />
                  )}

                  <div className="p-6 pb-0 flex flex-col flex-1 relative">
                    {/* Gradient strip at top */}
                    <div 
                      className="absolute inset-x-0 top-0 h-40 pointer-events-none rounded-t-xl"
                      style={cardGradientStyle}
                    />

                    {/* Category + Badge row */}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-[11px] font-semibold tracking-[0.12em] text-[#857FA0] uppercase">
                        {categoryLabel}
                      </span>
                      {badgeText && (
                        <span className={badgeStyle}>
                          {badgeText}
                        </span>
                      )}
                      {hasAccess && (
                        <Badge className="bg-[#1F7A52] text-white text-[11px] gap-1 pl-1.5 pr-2.5">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-[#130F2A] dark:text-white mb-1.5 leading-snug">
                      {course.name}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-[#857FA0] leading-relaxed mb-5 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Divider */}
                    <div className="h-px bg-[#E2DEEC] dark:bg-border mb-5" />

                    {/* Stats row */}
                    <div className="flex items-baseline gap-6 mb-5">
                      {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-2xl font-bold text-[#130F2A] dark:text-white leading-none tracking-tight">
                            {stat.value}
                          </span>
                          <span className="text-[10px] font-semibold tracking-[0.1em] text-[#857FA0] uppercase mt-1">
                            {stat.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#E2DEEC] dark:bg-border mb-5" />

                    {/* Feature checklist */}
                    <div className="space-y-2.5 mb-6 flex-1">
                      {features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5 text-sm text-[#434056] dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-[#4B2AD6] shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    {/* Bottom: Price + CTA */}
                    <div className="mt-auto pb-6">
                      <div className="flex items-end justify-between">
                        <div>
                          {originalPrice && (
                            <span className="text-sm text-[#CDC6DC] line-through block mb-0.5">
                              ₹{originalPrice}
                            </span>
                          )}
                          <span className="text-2xl font-bold text-[#130F2A] dark:text-white tracking-tight">
                            ₹{course.price?.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {hasAccess ? (
                          <Button
                            variant="outline"
                            className="border-[#1F7A52] text-[#1F7A52] hover:bg-[#E6F2EC] font-semibold gap-2"
                            onClick={() => handleLearnNow(course.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Continue
                          </Button>
                        ) : (
                          <Button
                            className="bg-[#4B2AD6] hover:bg-[#3A1EB0] text-white font-semibold gap-2 shadow-md shadow-[#4B2AD6]/20"
                            onClick={() => router.push(`/courses/${course.id}`)}
                          >
                            Buy now
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        
        {/* Empty State */}
        {availableCourses.length === 0 && (
             <div className="text-center py-20">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#EFECF5] dark:bg-slate-800 mb-4">
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
