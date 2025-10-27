import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface UserStreak {
  id: string;
  user_id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  total_quizzes_completed: number;
  total_cases_studied: number;
  total_pyq_attempted: number;
  total_score: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

interface StreakState {
  userStreak: UserStreak | null;
  leaderboard: UserStreak[];
  isLoading: boolean;

  // Actions
  initializeUserStreak: (userId: string, username: string) => Promise<void>;
  updateStreak: (
    activityType: "quiz" | "case_study" | "pyq",
    scorePoints?: number
  ) => Promise<void>;
  loadUserStreak: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  userStreak: null,
  leaderboard: [],
  isLoading: false,

  initializeUserStreak: async (userId: string, username: string) => {
    try {
      console.log("Initializing user streak for:", { userId, username });

      // First check if user streak already exists
      const { data: existingStreak, error: checkError } = await supabase
        .from("user_streaks")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingStreak) {
        console.log("User streak already exists, skipping initialization");
        return;
      }

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is expected for new users
        console.error("Error checking existing streak:", checkError);
      }

      // First try the RPC function
      const { error: rpcError } = await supabase.rpc("initialize_user_streak", {
        user_uuid: userId,
        user_name: username,
      });

      if (rpcError) {
        console.log(
          "RPC function failed, trying direct insert:",
          rpcError.message
        );

        // Fallback: Direct table insert with conflict handling
        const { error: insertError } = await supabase
          .from("user_streaks")
          .insert({
            user_id: userId,
            username: username,
            current_streak: 0,
            longest_streak: 0,
            total_quizzes_completed: 0,
            total_cases_studied: 0,
            total_pyq_attempted: 0,
            total_score: 0,
            last_activity_date: new Date().toISOString().split("T")[0],
          });

        if (insertError) {
          // Check if it's a duplicate key error
          if (
            insertError.code === "23505" ||
            insertError.message.includes("duplicate")
          ) {
            console.log("User streak already exists (duplicate key), skipping");
          } else {
            console.error("Error with direct insert:", insertError);
            console.error("Error details:", {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code,
            });
          }
        } else {
          console.log("User streak initialized successfully via direct insert");
        }
      } else {
        console.log("User streak initialized successfully via RPC");
      }
    } catch (error) {
      console.error("Error initializing user streak:", error);
    }
  },

  updateStreak: async (
    activityType: "quiz" | "case_study" | "pyq",
    scorePoints: number = 0
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      set({ isLoading: true });

      // First try the RPC function
      const { error: rpcError } = await supabase.rpc("update_user_streak", {
        user_uuid: user.id,
        activity_type: activityType,
        score_points: scorePoints,
      });

      if (rpcError) {
        console.log("RPC function failed, trying direct update:", rpcError);

        // Fallback: Direct database update
        const today = new Date().toISOString().split("T")[0];

        // Get current streak data
        const { data: currentStreak, error: fetchError } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching current streak:", fetchError);
          return;
        }

        if (!currentStreak) {
          console.error("No streak found for user");
          return;
        }

        // Calculate new streak values
        const lastActivityDate = currentStreak.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newCurrentStreak = currentStreak.current_streak;
        let newLongestStreak = currentStreak.longest_streak;

        // Check if this is a consecutive day
        if (lastActivityDate === yesterdayStr || lastActivityDate === today) {
          // Consecutive day - increment streak
          if (lastActivityDate === yesterdayStr) {
            newCurrentStreak = currentStreak.current_streak + 1;
          }
        } else {
          // Not consecutive - reset streak
          newCurrentStreak = 1;
        }

        // Update longest streak if current is higher
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }

        // Update counters based on activity type
        const updates: any = {
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          total_score: currentStreak.total_score + scorePoints,
          last_activity_date: today,
        };

        if (activityType === "quiz") {
          updates.total_quizzes_completed =
            currentStreak.total_quizzes_completed + 1;
        } else if (activityType === "case_study") {
          updates.total_cases_studied = currentStreak.total_cases_studied + 1;
        } else if (activityType === "pyq") {
          updates.total_pyq_attempted = currentStreak.total_pyq_attempted + 1;
        }

        // Update the streak record
        const { error: updateError } = await supabase
          .from("user_streaks")
          .update(updates)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating streak directly:", updateError);
        } else {
          console.log("Streak updated successfully via direct update");
        }
      } else {
        console.log("Streak updated successfully via RPC");
      }

      // Reload user streak after update
      await get().loadUserStreak();
    } catch (error) {
      console.error("Error updating streak:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadUserStreak: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ userStreak: null });
        return;
      }

      const { data: streak, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error loading user streak:", error);
      }

      set({ userStreak: streak });
    } catch (error) {
      console.error("Error loading user streak:", error);
      set({ userStreak: null });
    }
  },

  loadLeaderboard: async () => {
    try {
      const { data: leaderboard, error } = await supabase
        .from("user_streaks")
        .select("*")
        .order("current_streak", { ascending: false })
        .order("total_score", { ascending: false })
        .limit(10); // Show only top 10

      if (error) {
        console.error("Error loading leaderboard:", error);
        set({ leaderboard: [] });
        return;
      }

      set({ leaderboard: leaderboard || [] });
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      set({ leaderboard: [] });
    }
  },
}));
