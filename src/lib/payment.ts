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
  is_free?: boolean;
  freeContent?: {
    description: string;
    freeQuizzes?: number;
    freeCases?: number;
    freeCasesPerYear?: number;
  };
  icon?: string;
  is_active?: boolean;
}

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
  isContentFree: (courseId: string) => Promise<boolean>;
  loadUserCourses: () => Promise<void>;

  // Recent Courses Feature
  recentCourses: string[];
  markCourseAsVisited: (courseId: string) => void;
}

// Dynamically loads the Razorpay checkout script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as Window & { Razorpay?: unknown }).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
        const mappedCourses: Course[] = courses.map((c: Database['public']['Tables']['courses']['Row']) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          price: c.price,
          is_active: c.is_active,
        }));
        set({ availableCourses: mappedCourses, isLoading: false });
      },

      purchaseCourse: async (courseId: string) => {
        set({ isLoading: true });

        try {
          // Get current user
          let user = useAuthStore.getState().user;
          if (!user) {
            const { data } = await supabase.auth.getUser();
            user = data.user as unknown as User;
          }

          if (!user) {
            set({ isLoading: false });
            return { success: false, error: "User not authenticated" };
          }

          // Resolve course from local state or DB
          let targetCourse = get().availableCourses.find((c) => c.id === courseId);
          if (!targetCourse) {
            await get().loadAvailableCourses();
            targetCourse = get().availableCourses.find((c) => c.id === courseId);
            if (!targetCourse) {
              set({ isLoading: false });
              return { success: false, error: "Course not found" };
            }
          }

          // Check if already purchased
          const { data: existingCourse, error: selectError } = await supabase
            .from("user_courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

          if (selectError && selectError.code !== "PGRST116") {
            console.error("Error checking existing course:", selectError);
          }

          if (existingCourse) {
            set({ isLoading: false });
            return { success: false, error: "Course already purchased" };
          }

          // ── RAZORPAY FLOW ──────────────────────────────────────────────
          // 1. Get Supabase session token
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) {
            set({ isLoading: false });
            return { success: false, error: "Session expired. Please sign in again." };
          }

          // 2. Create Razorpay order via API
          const orderRes = await fetch("/api/payment/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ courseId }),
          });

          if (!orderRes.ok) {
            const err = await orderRes.json();
            set({ isLoading: false });
            return { success: false, error: err.error || "Failed to create payment order" };
          }

          const orderData = await orderRes.json();

          // 3. Load Razorpay checkout script
          const loaded = await loadRazorpayScript();
          if (!loaded) {
            set({ isLoading: false });
            return { success: false, error: "Failed to load payment gateway. Check your internet connection." };
          }

          // 4. Open Razorpay modal — wrap in Promise so we can await it
          const paymentResult: { success: boolean; error?: string; orderId?: string } =
            await new Promise((resolve) => {
              const RazorpayCheckout = (window as Window & { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay;

              const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: "Gavelogy",
                description: `Purchase: ${orderData.courseName || targetCourse!.name}`,
                prefill: {
                  email: user!.email,
                },
                theme: { color: "#2563EB" },

                handler: async (response: {
                  razorpay_order_id: string;
                  razorpay_payment_id: string;
                  razorpay_signature: string;
                }) => {
                  // 5. Verify payment on server
                  try {
                    const verifyRes = await fetch("/api/payment/verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        courseId,
                        userId: user!.id,
                      }),
                    });

                    if (verifyRes.ok) {
                      resolve({ success: true, orderId: response.razorpay_order_id });
                    } else {
                      const errData = await verifyRes.json();
                      resolve({ success: false, error: errData.error || "Payment verification failed" });
                    }
                  } catch {
                    resolve({ success: false, error: "Payment verification request failed" });
                  }
                },

                modal: {
                  ondismiss: () => {
                    resolve({ success: false, error: "Payment cancelled" });
                  },
                },
              };

              const rzp = new RazorpayCheckout(options);
              rzp.open();
            });

          // 6. Update local state on success
          if (paymentResult.success) {
            set((state) => ({
              purchasedCourses: [...state.purchasedCourses, courseId],
              isLoading: false,
            }));
          } else {
            set({ isLoading: false });
          }

          return paymentResult;
        } catch {
          set({ isLoading: false });
          return { success: false, error: "Payment failed" };
        }
      },

      getUserCourses: async () => {
        const purchasedIds = get().purchasedCourses;
        const available = get().availableCourses;
        return available.filter((c) => purchasedIds.includes(c.id));
      },

      checkUserCourseAccess: async (courseId: string) => {
        if (get().purchasedCourses.includes(courseId)) return true;

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;

          const { data } = await supabase
            .from("user_courses")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

          if (data) {
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
          if (!user) return;
          const { data } = await supabase
            .from("user_courses")
            .select("course_id")
            .eq("user_id", user.id);
          if (data) {
            set({ purchasedCourses: data.map((c) => c.course_id) });
          }
        } catch (e) {
          console.error(e);
        }
      },

      markCourseAsVisited: (courseId: string) => {
        set((state) => {
          const currentRecent = state.recentCourses || [];
          const filtered = currentRecent.filter((id) => id !== courseId);
          const updated = [courseId, ...filtered];
          return { recentCourses: updated.slice(0, 5) };
        });
      },

      isContentFree: async (courseId: string) => {
        try {
          // Check local cache first
          const cached = get().availableCourses.find((c) => c.id === courseId);
          if (cached) return !!cached.is_free;

          // Otherwise query the DB
          const { data } = await supabase
            .from("courses")
            .select("is_free")
            .eq("id", courseId)
            .single();

          return !!(data as { is_free?: boolean } | null)?.is_free;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "gavelogy-payment-storage",
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
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  return usePaymentStore.getState().purchaseCourse(courseId);
}

export async function getUserCourses(): Promise<Course[]> {
  return usePaymentStore.getState().getUserCourses();
}

export async function checkUserCourseAccess(courseId: string): Promise<boolean> {
  return usePaymentStore.getState().checkUserCourseAccess(courseId);
}

export function generateOrderId(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
