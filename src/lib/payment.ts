import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getConvexHttpClient, getConvexClient } from "./convex-client";
import { useAuthStore } from "./stores/auth";
import { api } from "@/convex/_generated/api";
import { DataLoader } from "./data-loader";
import { Id } from "@/convex/_generated/dataModel";

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  is_free?: boolean;
  icon?: string;
  is_active?: boolean;
}

interface PaymentState {
  availableCourses: Course[];
  purchasedCourses: string[];
  recentCourses: string[];
  isLoading: boolean;

  loadAvailableCourses: () => Promise<void>;
  purchaseCourse: (courseId: string) => Promise<{ success: boolean; error?: string; orderId?: string }>;
  getUserCourses: () => Promise<Course[]>;
  checkUserCourseAccess: (courseId: string) => Promise<boolean>;
  isContentFree: (courseId: string) => Promise<boolean>;
  loadUserCourses: () => Promise<void>;
  markCourseAsVisited: (courseId: string) => void;
  clearUserData: () => void;
}

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
        const mappedCourses: Course[] = courses.map((c) => ({
          id: c._id,
          name: c.name,
          description: c.description ?? "",
          price: c.price ?? 0,
          is_active: c.is_active,
          is_free: c.is_free,
        }));
        set({ availableCourses: mappedCourses, isLoading: false });
      },

      purchaseCourse: async (courseId: string) => {
        set({ isLoading: true });
        try {
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
          const client = getConvexHttpClient();
          const hasAccess = await client.query(api.payments.hasCourseAccess, {
            courseId: courseId as Id<"courses">,
          }).catch(() => false);

          if (hasAccess) {
            set({ isLoading: false });
            return { success: false, error: "Course already purchased" };
          }

          // --- FAKE PURCHASE (Razorpay commented out below) ---
          // Simulate a short delay, then grant access directly
          await new Promise((r) => setTimeout(r, 800));
          const fakeOrderId = `DEMO_${Date.now()}`;
          // Write to Convex using the authenticated React client so the sidebar
          // useQuery subscription fires immediately (HTTP client has no auth token)
          try {
            const authedClient = getConvexClient();
            await authedClient.mutation(api.payments.recordPurchase, {
              courseId: courseId as Id<"courses">,
              course_name: targetCourse.name,
              course_price: targetCourse.price,
              order_id: fakeOrderId,
            });
          } catch { /* ignore duplicate */ }
          set((state) => ({
            purchasedCourses: [...state.purchasedCourses, courseId],
            isLoading: false,
          }));
          return { success: true, orderId: fakeOrderId };

          /* --- RAZORPAY (uncomment when ready) ---
          const token = useAuthStore.getState().authToken;
          const orderRes = await fetch("/api/payment/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ courseId }),
          });

          if (!orderRes.ok) {
            const err = await orderRes.json();
            set({ isLoading: false });
            return { success: false, error: err.error || "Failed to create payment order" };
          }

          const orderData = await orderRes.json();

          const loaded = await loadRazorpayScript();
          if (!loaded) {
            set({ isLoading: false });
            return { success: false, error: "Failed to load payment gateway." };
          }

          const paymentResult: { success: boolean; error?: string; orderId?: string } =
            await new Promise((resolve) => {
              const RazorpayCheckout = (
                window as Window & { Razorpay: new (opts: unknown) => { open(): void } }
              ).Razorpay;

              const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.orderId,
                name: "Gavelogy",
                description: `Purchase: ${orderData.courseName || targetCourse!.name}`,
                theme: { color: "#2563EB" },
                handler: async (response: {
                  razorpay_order_id: string;
                  razorpay_payment_id: string;
                  razorpay_signature: string;
                }) => {
                  try {
                    const verifyRes = await fetch("/api/payment/verify", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        courseId,
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
                modal: { ondismiss: () => resolve({ success: false, error: "Payment cancelled" }) },
              };

              new RazorpayCheckout(options).open();
            });

          if (paymentResult.success) {
            set((state) => ({
              purchasedCourses: [...state.purchasedCourses, courseId],
              isLoading: false,
            }));
          } else {
            set({ isLoading: false });
          }
          return paymentResult;
          --- END RAZORPAY --- */
        } catch {
          set({ isLoading: false });
          return { success: false, error: "Payment failed" };
        }
      },

      getUserCourses: async () => {
        const purchasedIds = get().purchasedCourses;
        return get().availableCourses.filter((c) => purchasedIds.includes(c.id));
      },

      checkUserCourseAccess: async (courseId: string) => {
        if (get().purchasedCourses.includes(courseId)) return true;
        try {
          const client = getConvexClient();
          const hasAccess = await client.query(api.payments.hasCourseAccess, {
            courseId: courseId as Id<"courses">,
          });
          if (hasAccess) {
            set((state) => ({ purchasedCourses: [...state.purchasedCourses, courseId] }));
          }
          return hasAccess;
        } catch {
          return false;
        }
      },

      loadUserCourses: async () => {
        try {
          const client = getConvexClient();
          const userCourses = await client.query(api.payments.getUserCourses, {});
          set({ purchasedCourses: userCourses.map((uc: { courseId: string }) => uc.courseId) });
        } catch {
          // silent
        }
      },

      isContentFree: async (courseId: string) => {
        const cached = get().availableCourses.find((c) => c.id === courseId);
        if (cached) return !!cached.is_free;
        try {
          const client = getConvexHttpClient();
          const course = await client.query(api.content.getCourses, { activeOnly: false });
          const found = course.find((c) => c._id === courseId);
          return !!found?.is_free;
        } catch {
          return false;
        }
      },

      markCourseAsVisited: (courseId: string) => {
        set((state) => {
          const filtered = (state.recentCourses || []).filter((id) => id !== courseId);
          return { recentCourses: [courseId, ...filtered].slice(0, 5) };
        });
      },

      clearUserData: () => {
        set({ purchasedCourses: [], recentCourses: [] });
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

export async function purchaseCourse(courseId: string) {
  return usePaymentStore.getState().purchaseCourse(courseId);
}

export async function getUserCourses() {
  return usePaymentStore.getState().getUserCourses();
}

export async function checkUserCourseAccess(courseId: string) {
  return usePaymentStore.getState().checkUserCourseAccess(courseId);
}

export function generateOrderId(): string {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
