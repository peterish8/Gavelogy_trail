"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { usePaymentStore, COURSES } from "@/lib/payment";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DottedBackground } from "@/components/DottedBackground";
import { useCopyProtection } from "@/hooks/useCopyProtection";

export default function CoursesPage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { purchasedCourses, purchaseCourse, checkUserCourseAccess } =
    usePaymentStore();

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

  // Load course access status
  useEffect(() => {
    const loadCourseAccess = async () => {
      if (!isAuthenticated) return;

      setLoadingAccess(true);
      const access: Record<string, boolean> = {};

      for (const course of Object.values(COURSES)) {
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
  }, [isAuthenticated, checkUserCourseAccess]);

  const handlePurchase = async (
    courseId: string,
    courseName: string,
    price: number
  ) => {
    setPurchasing(courseId);
    const result = await purchaseCourse(courseId);
    setPurchasing(null);

    if (result.success) {
      // Refresh course access after successful purchase
      const access: Record<string, boolean> = {};
      for (const course of Object.values(COURSES)) {
        try {
          access[course.id] = await checkUserCourseAccess(course.id);
        } catch (error) {
          console.error(`Error checking access for ${course.id}:`, error);
          access[course.id] = false;
        }
      }
      setCourseAccess(access);

      router.push(`/purchase-success?orderId=${result.orderId}`);
    } else {
      alert(result.error || "Purchase failed");
    }
  };

  const handleLearnNow = (courseId: string) => {
    if (courseId === COURSES.STATIC_SUBJECTS.id) {
      router.push("/subjects?tab=static-subjects");
    } else if (courseId === COURSES.CONTEMPORARY_CASES.id) {
      router.push("/subjects?tab=contemporary-cases");
    }
  };

  if (isLoading || loadingAccess) {
    return (
      <div className="min-h-screen">
        <DottedBackground />
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const allCourses = Object.values(COURSES);

  return (
    <div className="min-h-screen">
      <DottedBackground />
      <Header />

      <div className="container mx-auto px-4 py-8 no-copy">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Courses</h1>
          <p className="text-muted-foreground">
            Explore our comprehensive CLAT PG preparation courses
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {allCourses.map((course) => {
            const hasAccess = courseAccess[course.id] || false;
            const isPurchasing = purchasing === course.id;

            return (
              <Card key={course.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Course Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-bold">{course.name}</h2>
                      {hasAccess && (
                        <Badge className="bg-green-600 text-white">
                          Purchased
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {course.description}
                    </p>
                  </div>

                  {/* Free Content Info */}
                  {!hasAccess && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        🎁 Try Free Before You Buy
                      </p>
                      {course.id === COURSES.STATIC_SUBJECTS.id ? (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Get access to <strong>13 free quizzes</strong> (1st
                          quiz of each subject)
                        </p>
                      ) : (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          Get access to <strong>15 free study materials</strong>{" "}
                          with quizzes (5 from each year: 2023, 2024, 2025)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        ₹{course.price}
                      </span>
                      <span className="text-muted-foreground line-through">
                        ₹{(course.price * 1.5).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      One-time payment • Lifetime access
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {hasAccess ? (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleLearnNow(course.id)}
                    >
                      Learn Now →
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {/* Try Free Content Button */}
                      <Button
                        variant="outline"
                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          if (course.id === COURSES.CONTEMPORARY_CASES.id) {
                            router.push("/subjects?tab=contemporary-cases");
                          } else if (course.id === COURSES.STATIC_SUBJECTS.id) {
                            router.push("/subjects?tab=static-subjects");
                          }
                        }}
                      >
                        Try Free Content →
                      </Button>
                      {/* Buy Now Button */}
                      <Button
                        className="w-full"
                        onClick={() =>
                          handlePurchase(course.id, course.name, course.price)
                        }
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? "Processing..." : "Buy Now"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Purchased Courses Section */}
        {purchasedCourses.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">My Courses</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.values(COURSES)
                .filter((course) => purchasedCourses.includes(course.id))
                .map((course) => (
                  <Card
                    key={course.id}
                    className="overflow-hidden border-green-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">{course.name}</h3>
                        <Badge className="bg-green-600 text-white">
                          Active
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {course.description}
                      </p>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleLearnNow(course.id)}
                      >
                        Continue Learning →
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
