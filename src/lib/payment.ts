import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "./supabase";
import { useAuthStore } from "./stores/auth";

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
}

export const COURSES = {
  STATIC_SUBJECTS: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Static Subjects Course",
    description: "13 Law Subjects • 650 Questions • 20 Mock Tests",
    price: 1999.0,
    freeContent: {
      description: "Get access to 13 free quizzes (1st quiz of each subject)",
      freeQuizzes: 13,
    },
  },
  CONTEMPORARY_CASES: {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Contemporary Cases Course",
    description: "150 Legal Cases • 2023-2025 • Month Quizzes",
    price: 1499.0,
    freeContent: {
      description:
        "Get access to 15 free study materials with quizzes (5 from each year: 2023, 2024, 2025)",
      freeCases: 15,
      freeCasesPerYear: 5,
    },
  },
};

interface PaymentState {
  purchasedCourses: string[];
  isLoading: boolean;

  // Actions
  purchaseCourse: (courseId: string) => Promise<{
    success: boolean;
    error?: string;
    orderId?: string;
  }>;
  getUserCourses: () => Promise<Course[]>;
  checkUserCourseAccess: (courseId: string) => Promise<boolean>;
  isContentFree: (courseId: string, contentIndex: number) => boolean;
  loadUserCourses: () => Promise<void>;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      purchasedCourses: [],
      isLoading: false,

      purchaseCourse: async (courseId: string) => {
        set({ isLoading: true });

        try {
          // Get current user
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ isLoading: false });
            return { success: false, error: "User not authenticated" };
          }

          // Check if course exists
          const course = Object.values(COURSES).find((c) => c.id === courseId);
          if (!course) {
            set({ isLoading: false });
            return { success: false, error: "Course not found" };
          }

          // Check if user already has this course
          const { data: existingCourse } = await supabase
            .from("user_courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .eq("status", "active")
            .single();

          if (existingCourse) {
            set({ isLoading: false });
            return { success: false, error: "Course already purchased" };
          }

          // Simulate payment processing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Generate mock order ID
          const orderId = `ORDER_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Insert course purchase into Supabase
          const { error } = await supabase.from("user_courses").insert({
            user_id: user.id,
            course_id: course.id,
            course_name: course.name,
            course_description: course.description,
            course_price: course.price,
            order_id: orderId,
            status: "active",
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: "Failed to save purchase" };
          }

          // Update local state
          set((state) => ({
            purchasedCourses: [...state.purchasedCourses, courseId],
            isLoading: false,
          }));

          return { success: true, orderId };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: "Payment failed" };
        }
      },

      getUserCourses: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return [];

          const { data: userCourses, error } = await supabase
            .from("user_courses")
            .select(
              "course_id, course_name, course_description, course_price, purchase_date"
            )
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("purchase_date", { ascending: false });

          if (error) {
            console.error("Error fetching user courses:", error);
            return [];
          }

          return (
            userCourses?.map((course) => ({
              id: course.course_id,
              name: course.course_name,
              description: course.course_description,
              price: course.course_price,
            })) || []
          );
        } catch (error) {
          console.error("Error fetching user courses:", error);
          return [];
        }
      },

      checkUserCourseAccess: async (courseId: string) => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return false;

          // For testing: Make Contemporary Cases course always accessible
          if (courseId === COURSES.CONTEMPORARY_CASES.id) {
            return true;
          }

          const { data: course, error } = await supabase
            .from("user_courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .eq("status", "active")
            .single();

          if (error) return false;
          return !!course;
        } catch (error) {
          console.error("Error checking course access:", error);
          return false;
        }
      },

      loadUserCourses: async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ purchasedCourses: [] });
            return;
          }

          const { data: userCourses, error } = await supabase
            .from("user_courses")
            .select("course_id")
            .eq("user_id", user.id)
            .eq("status", "active");

          if (error) {
            console.error("Error loading user courses:", error);
            set({ purchasedCourses: [] });
            return;
          }

          const courseIds =
            userCourses?.map((course) => course.course_id) || [];

          // For testing: Always include Contemporary Cases course
          if (!courseIds.includes(COURSES.CONTEMPORARY_CASES.id)) {
            courseIds.push(COURSES.CONTEMPORARY_CASES.id);
            console.log("Added Contemporary Cases course for testing");
          }

          set({ purchasedCourses: courseIds });
        } catch (error) {
          console.error("Error loading user courses:", error);
          set({ purchasedCourses: [] });
        }
      },

      isContentFree: (courseId: string, contentIndex: number) => {
        const course = Object.values(COURSES).find((c) => c.id === courseId);
        if (!course || !course.freeContent) return false;

        if (courseId === COURSES.STATIC_SUBJECTS.id) {
          // For static subjects, first quiz of each subject is free
          return contentIndex < course.freeContent.freeQuizzes;
        } else if (courseId === COURSES.CONTEMPORARY_CASES.id) {
          // For contemporary cases, first 5 cases of each year are free
          return contentIndex < course.freeContent.freeCasesPerYear;
        }

        return false;
      },
    }),
    {
      name: "gavalogy-payment-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        purchasedCourses: state.purchasedCourses,
      }),
    }
  )
);

// Legacy functions for backward compatibility
export async function purchaseCourse(
  userId: string,
  courseId: string
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
}> {
  const store = usePaymentStore.getState();
  return store.purchaseCourse(courseId);
}

export function getUserCourses(): Course[] {
  const store = usePaymentStore.getState();
  return store.getUserCourses();
}

export function checkUserCourseAccess(courseId: string): boolean {
  const store = usePaymentStore.getState();
  return store.checkUserCourseAccess(courseId);
}

export function generateOrderId(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
