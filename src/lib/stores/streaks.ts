import { create } from "zustand";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";

export interface StreakBonus {
  streak_days: number;
  bonus_points: number;
  badge_name: string;
  badge_emoji: string;
}

export interface UserStreak {
  _id: string;
  userId: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  bonuses_claimed?: number[];
  total_score: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  monthly_points: number;
  all_time_points: number;
  rank: number;
}

export interface PointAwardResult {
  points_awarded: number;
  new_streak: number;
  badge_earned?: string | null;
}

interface StreakState {
  userStreak: UserStreak | null;
  leaderboard: LeaderboardEntry[];
  bonuses: StreakBonus[];
  isLoading: boolean;
  lastAwardResult: PointAwardResult | null;

  loadBonuses: () => Promise<void>;
  loadUserStreak: () => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  awardDailyPoint: (username: string) => Promise<PointAwardResult | null>;
  initializeUserStreak: (username: string) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  userStreak: null,
  leaderboard: [],
  bonuses: [],
  isLoading: false,
  lastAwardResult: null,

  loadBonuses: async () => {
    try {
      const client = getConvexClient();
      const data = await client.query(api.streaks.getStreakBonuses, {});
      set({ bonuses: (data ?? []) as StreakBonus[] });
    } catch (e) {
      console.warn("Error loading streak bonuses:", e);
    }
  },

  loadUserStreak: async () => {
    try {
      const client = getConvexClient();
      const data = await client.query(api.streaks.getUserStreak, {});
      set({ userStreak: data ? (data as unknown as UserStreak) : null });
    } catch (e) {
      console.warn("Error loading user streak:", e);
      set({ userStreak: null });
    }
  },

  loadLeaderboard: async () => {
    try {
      set({ isLoading: true });
      const client = getConvexClient();
      const data = await client.query(api.streaks.getMonthlyLeaderboard, { limit: 10 });
      set({ leaderboard: (data ?? []) as LeaderboardEntry[], isLoading: false });
    } catch (e) {
      console.warn("Error loading leaderboard:", e);
      set({ leaderboard: [], isLoading: false });
    }
  },

  awardDailyPoint: async (username: string) => {
    try {
      const client = getConvexClient();
      const result = await client.mutation(api.streaks.awardStreakPoint, { username });
      const award: PointAwardResult = {
        points_awarded: result.points_awarded,
        new_streak: result.new_streak,
        badge_earned: result.badge_earned ?? null,
      };
      set({ lastAwardResult: award });
      await get().loadUserStreak();
      await get().loadLeaderboard();
      return award;
    } catch (e) {
      console.error("Error awarding daily point:", e);
      return null;
    }
  },

  initializeUserStreak: async (username: string) => {
    try {
      const client = getConvexClient();
      await client.mutation(api.streaks.initUserStreak, { username });
    } catch (e) {
      console.warn("Error initializing user streak:", e);
    }
  },
}));
