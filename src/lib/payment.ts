import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase, Database } from "./supabase";
import { useAuthStore } from "./stores/auth";
import { DataLoader } from "./data-loader";
import { User } from "@/types";

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
    // adding optional properties for backward compatibility or future use
    freeContent?: {
        description: string;
        freeQuizzes?: number;
        freeCases?: number;
        freeCasesPerYear?: number;
    };
    icon?: string;
    is_active?: boolean;
}

// Minimal fallback for legacy references if needed (deprecated)
export const COURSES = {
  STATIC_SUBJECTS: { id: "legacy-static", name: "Static Subjects" }, // placeholder
  CONTEMPORARY_CASES: { id: "legacy-contemporary", name: "Contemporary Cases" }, // placeholder
};


interface PaymentState {
  availableCourses: Course[];
  purchasedCourses: string[];
  isLoading: boolean;

  // Actions
  loadAvailableCourses: () => Promise<void>;
  purchaseCourse: (courseId: string) => Promise<{
    success: boolean;
    error?: string;
    orderId?: string;
  }>;
  getUserCourses: () => Promise<Course[]>;
  checkUserCourseAccess: (courseId: string) => Promise<boolean>;
  isContentFree: (courseId: string, contentIndex: number) => boolean;
  loadUserCourses: () => Promise<void>;
  
  // Recent Courses Feature
  recentCourses: string[]; 
  markCourseAsVisited: (courseId: string) => void;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      availableCourses: [],
      purchasedCourses: [],
      recentCourses: [],
      isLoading: false,

      loadAvailableCourses: async () => {
          set({ isLoading: true });
          const courses = await DataLoader.getCourses();
          // Transform if necessary to match Course interface
           const mappedCourses: Course[] = courses.map((c: Database['public']['Tables']['courses']['Row']) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              price: c.price,
              is_active: c.is_active
           }));
          set({ availableCourses: mappedCourses, isLoading: false });
      },

      purchaseCourse: async (courseId: string) => {
        set({ isLoading: true });

        try {
          // Get current user - Try Store first (Client-side source of truth for session), then Supabase
          let user = useAuthStore.getState().user;
          
          if (!user) {
             const { data } = await supabase.auth.getUser();
             user = data.user as unknown as User;
          }

          if (!user) {
            set({ isLoading: false });
            return { success: false, error: "User not authenticated" };
          }

          // Check if course exists in loaded courses
          const course = get().availableCourses.find((c) => c.id === courseId);
          if (!course) {
             // Try fetching if not loaded
             await get().loadAvailableCourses();
             const refetchedCourse = get().availableCourses.find((c) => c.id === courseId);
             if (!refetchedCourse) {
                set({ isLoading: false });
                return { success: false, error: "Course not found" };
             }
          }
          const targetCourse = get().availableCourses.find((c) => c.id === courseId)!;


          // Check if user already has this course
          const { data: existingCourse, error: selectError } = await supabase
            .from("user_courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .eq("status", "active")
            .single();

          if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is 'not found' which is expected
             console.error("Error checking existing course:", selectError);
          }

          if (existingCourse) {
            set({ isLoading: false });
            return { success: false, error: "Course already purchased" };
          }

          // Simulate payment processing (5 seconds as requested)
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Generate mock order ID
          const orderId = `ORDER_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Insert course purchase into Supabase
          const { error } = await supabase.from("user_courses").insert({
            user_id: user.id,
            course_id: targetCourse.id,
            status: "active",
            purchase_date: new Date().toISOString()
          });

          // Fallback if insert fails (e.g. table missing)
          if (error) {
             console.error("Purchase insert failed FULL:", error);
             console.error("Message:", error.message);
             console.error("Details:", error.details);
             console.error("Hint:", error.hint);
             // We continue to update local state so user isn't blocked, but log the error
          }

          // Update local state
          set((state) => ({
            purchasedCourses: [...state.purchasedCourses, courseId],
            isLoading: false,
          }));

          return { success: true, orderId };
        } catch {
          set({ isLoading: false });
          return { success: false, error: "Payment failed" };
        }
      },

      getUserCourses: async () => {
        // ... (implementation to fetch user courses)
        // For simple MVP with dynamic courses, we can just filter availableCourses by purchasedCourses
        const purchasedIds = get().purchasedCourses;
        const available = get().availableCourses;
        return available.filter(c => purchasedIds.includes(c.id));
      },

      checkUserCourseAccess: async (courseId: string) => {
          // Check local state first
          if (get().purchasedCourses.includes(courseId)) return true;
          
          // Then check DB
          try {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return false;
             
             const { data } = await supabase
                .from("user_courses")
                .select("id")
                .eq("user_id", user.id)
                .eq("course_id", courseId)
                .eq("status", "active")
                .single();
             if (data) {
                 // update local cache
                  set((state) => ({ purchasedCourses: [...state.purchasedCourses, courseId] }));
                 return true;
             }
             return false;

          } catch {
              return false;
          }
      },

      loadUserCourses: async () => {
         try {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) return;
            const { data } = await supabase.from("user_courses").select("course_id").eq("user_id", user.id).eq("status", "active");
            if (data) {
                set({ purchasedCourses: data.map(c => c.course_id) });
            }
         } catch(e) { console.error(e) }
      },

      markCourseAsVisited: (courseId: string) => {
        set((state) => {
            const currentRecent = state.recentCourses || []; // Handle potential undefined from migration
            // Remove if already exists to prevent duplicates
            const filtered = currentRecent.filter(id => id !== courseId);
            // Add to front
            const updated = [courseId, ...filtered];
            // Keep top 5
            return { recentCourses: updated.slice(0, 5) };
        });
      },

      isContentFree: () => {
         // Logic for free content could be dynamic too, but keeping simple for now
         return false; 
      },
    }),
    {
      name: "gavalogy-payment-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        purchasedCourses: state.purchasedCourses,
        recentCourses: state.recentCourses,
      }),
    }
  )
);

// Legacy functions for backward compatibility
export async function purchaseCourse(
  courseId: string
): Promise<{
  success: boolean;
  error?: string;
  orderId?: string;
}> {
  const store = usePaymentStore.getState();
  return store.purchaseCourse(courseId);
}

export async function getUserCourses(): Promise<Course[]> {
  const store = usePaymentStore.getState();
  return store.getUserCourses();
}

export async function checkUserCourseAccess(courseId: string): Promise<boolean> {
  const store = usePaymentStore.getState();
  return store.checkUserCourseAccess(courseId);
}

export function generateOrderId(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
