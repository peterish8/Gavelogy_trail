import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  },
  CONTEMPORARY_CASES: {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Contemporary Cases Course",
    description: "150 Legal Cases • 2023-2025 • Month Quizzes",
    price: 1499.0,
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
  getUserCourses: () => Course[];
  checkUserCourseAccess: (courseId: string) => boolean;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      purchasedCourses: [],
      isLoading: false,

      purchaseCourse: async (courseId: string) => {
        set({ isLoading: true });

        try {
          // Check if course exists
          const course = Object.values(COURSES).find((c) => c.id === courseId);
          if (!course) {
            set({ isLoading: false });
            return { success: false, error: "Course not found" };
          }

          // Check if user already has this course
          const currentCourses = get().purchasedCourses;
          if (currentCourses.includes(courseId)) {
            set({ isLoading: false });
            return { success: false, error: "Course already purchased" };
          }

          // Simulate payment processing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Generate mock order ID
          const orderId = `ORDER_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Add course to purchased courses
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

      getUserCourses: () => {
        const purchasedCourseIds = get().purchasedCourses;
        return Object.values(COURSES).filter((course) =>
          purchasedCourseIds.includes(course.id)
        );
      },

      checkUserCourseAccess: (courseId: string) => {
        const purchasedCourses = get().purchasedCourses;
        return purchasedCourses.includes(courseId);
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
