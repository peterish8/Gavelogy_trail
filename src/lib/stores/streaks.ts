import { create } from "zustand";
import { supabase } from "@/lib/supabase";

// Streak bonuses from database
export interface StreakBonus {
  streak_days: number;
  bonus_points: number;
  badge_name: string;
  badge_emoji: string;
}

// User's current streak info
export interface UserStreak {
  id: string;
  user_id: string;
  username: string;
  current_streak: number;
  last_activity_date: string;
  bonuses_claimed: number[];
}

// Leaderboard entry
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  monthly_points: number;
  all_time_points: number;
  current_streak: number;
  rank: number;
}

// Point award result
export interface PointAwardResult {
  points_awarded: number;
  bonus_awarded: number;
  new_streak: number;
  badge_earned: string | null;
}

interface StreakState {
  userStreak: UserStreak | null;
  leaderboard: LeaderboardEntry[];
  bonuses: StreakBonus[];
  isLoading: boolean;
  lastAwardResult: PointAwardResult | null;

  // Actions
  loadBonuses: () => Promise<void>;
  loadUserStreak: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  awardDailyPoint: () => Promise<PointAwardResult | null>;
  initializeUserStreak: (userId: string, username: string) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  userStreak: null,
  leaderboard: [],
  bonuses: [],
  isLoading: false,
  lastAwardResult: null,

  loadBonuses: async () => {
    try {
      const { data, error } = await supabase
        .from("streak_bonuses")
        .select("*")
        .order("streak_days", { ascending: true });

      if (error) {
        if (error.code !== '42P01') {
          console.warn("Error loading streak bonuses:", error.message);
        }
        return;
      }

      set({ bonuses: data || [] });
    } catch (error) {
      console.warn("Error loading bonuses:", error);
    }
  },

  loadUserStreak: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        // Table might not exist yet
        if (error.code === '42P01') {
          console.warn("user_streaks table not found. Run the SQL setup.");
        } else if (Object.keys(error).length > 0) {
          console.warn("Error loading user streak:", error.message);
        }
        set({ userStreak: null });
        return;
      }

      set({ userStreak: streak });
    } catch (error) {
      console.warn("Error loading user streak:", error);
      set({ userStreak: null });
    }
  },

  loadLeaderboard: async () => {
    try {
      set({ isLoading: true });

      // Try using the RPC function first
      const { data, error } = await supabase.rpc("get_monthly_leaderboard", {
        p_limit: 10
      });

      if (error) {
        // Fallback to direct query if function doesn't exist
        if (error.code === '42883' || error.message?.includes('does not exist')) {
          // Function doesn't exist, try direct query
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const monthStr = monthStart.toISOString().split('T')[0];

          const { data: fallbackData, error: fallbackError } = await supabase
            .from("user_points")
            .select("*")
            .eq("month", monthStr)
            .order("monthly_points", { ascending: false })
            .limit(10);

          if (fallbackError) {
            if (Object.keys(fallbackError).length > 0) {
              console.warn("Error loading leaderboard:", fallbackError.message);
            }
            set({ leaderboard: [], isLoading: false });
            return;
          }

          // Map to LeaderboardEntry format
          const entries: LeaderboardEntry[] = (fallbackData || []).map((item, index) => ({
            user_id: item.user_id,
            username: item.username,
            monthly_points: item.monthly_points,
            all_time_points: item.all_time_points,
            current_streak: 0, // Not available in fallback
            rank: index + 1
          }));

          set({ leaderboard: entries, isLoading: false });
          return;
        }

        if (Object.keys(error).length > 0) {
          console.warn("Error loading leaderboard:", error.message);
        }
        set({ leaderboard: [], isLoading: false });
        return;
      }

      set({ leaderboard: data || [], isLoading: false });
    } catch (error) {
      console.warn("Error loading leaderboard:", error);
      set({ leaderboard: [], isLoading: false });
    }
  },

  awardDailyPoint: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get username from users table
      const { data: userData } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';

      // Call the award function
      const { data, error } = await supabase.rpc("award_streak_point", {
        p_user_id: user.id,
        p_username: username
      });

      if (error) {
        console.error("Error awarding point:", error);
        return null;
      }

      const result = data?.[0] as PointAwardResult;
      set({ lastAwardResult: result });

      // Reload user streak after award
      await get().loadUserStreak();
      await get().loadLeaderboard();

      return result;
    } catch (error) {
      console.error("Error awarding daily point:", error);
      return null;
    }
  },

  initializeUserStreak: async (userId: string, username: string) => {
    try {
      // Check if streak already exists
      const { data: existingStreak } = await supabase
        .from("user_streaks")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingStreak) {
        return; // Already initialized
      }

      // Create new streak record
      const { error } = await supabase
        .from("user_streaks")
        .insert({
          user_id: userId,
          username: username,
          current_streak: 0,
          bonuses_claimed: []
        });

      if (error && error.code !== "23505") {
        // 23505 = duplicate key (already exists)
        console.warn("Error initializing streak:", error.message);
      }
    } catch (error) {
      console.warn("Error initializing user streak:", error);
    }
  }
}));
