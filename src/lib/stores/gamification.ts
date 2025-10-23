import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface GamificationState {
  streak: number;
  coins: number;
  longestStreak: number;
  isLoading: boolean;
  lastActivityDate: string | null;

  // Actions
  fetchGamificationData: () => Promise<void>;
  addCoins: (
    amount: number,
    source: string,
    description: string
  ) => Promise<void>;
  updateStreak: () => Promise<void>;
  getLeaderboard: () => Promise<any[]>;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      streak: 0,
      coins: 100, // Start with 100 coins
      longestStreak: 0,
      isLoading: false,
      lastActivityDate: null,

      fetchGamificationData: async () => {
        set({ isLoading: true });

        try {
          // Simulate fetching data from localStorage
          // Data is automatically persisted by Zustand
          set({ isLoading: false });
        } catch (error) {
          console.error("Error fetching gamification data:", error);
          set({ isLoading: false });
        }
      },

      addCoins: async (amount: number, source: string, description: string) => {
        try {
          const currentCoins = get().coins;
          const newCoins = currentCoins + amount;

          set({ coins: newCoins });

          // Log coin transaction (could be stored in a separate transactions array)
          console.log(`+${amount} coins from ${source}: ${description}`);
        } catch (error) {
          console.error("Error adding coins:", error);
        }
      },

      updateStreak: async () => {
        try {
          const today = new Date().toDateString();
          const lastActivity = get().lastActivityDate;
          const currentStreak = get().streak;
          const longestStreak = get().longestStreak;

          if (lastActivity === today) {
            // Already updated today, no change needed
            return;
          }

          if (
            lastActivity ===
            new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
          ) {
            // Consecutive day - increment streak
            const newStreak = currentStreak + 1;
            const newLongestStreak = Math.max(newStreak, longestStreak);

            set({
              streak: newStreak,
              longestStreak: newLongestStreak,
              lastActivityDate: today,
            });

            // Award coins for streak
            const streakBonus = Math.min(newStreak * 5, 50); // Max 50 coins per day
            get().addCoins(
              streakBonus,
              "streak",
              `Day ${newStreak} streak bonus`
            );
          } else if (lastActivity !== today) {
            // Streak broken - reset to 1
            set({
              streak: 1,
              longestStreak: Math.max(1, longestStreak),
              lastActivityDate: today,
            });

            // Award coins for new streak
            get().addCoins(5, "streak", "New streak started");
          }
        } catch (error) {
          console.error("Error updating streak:", error);
        }
      },

      getLeaderboard: async () => {
        try {
          // Mock leaderboard data for localStorage mode
          const mockLeaderboard = [
            { id: "1", username: "LawMaster", coins: 2500, streak: 15 },
            { id: "2", username: "ConstitutionPro", coins: 2200, streak: 12 },
            { id: "3", username: "LegalEagle", coins: 2000, streak: 10 },
            { id: "4", username: "JusticeSeeker", coins: 1800, streak: 8 },
            { id: "5", username: "RightsDefender", coins: 1600, streak: 7 },
            { id: "6", username: "LawStudent99", coins: 1400, streak: 6 },
            { id: "7", username: "Constitutionalist", coins: 1200, streak: 5 },
            { id: "8", username: "LegalMind", coins: 1000, streak: 4 },
            { id: "9", username: "JusticeWarrior", coins: 800, streak: 3 },
            { id: "10", username: "LawLearner", coins: 600, streak: 2 },
          ];

          return mockLeaderboard;
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          return [];
        }
      },
    }),
    {
      name: "gavalogy-gamification-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        streak: state.streak,
        coins: state.coins,
        longestStreak: state.longestStreak,
        lastActivityDate: state.lastActivityDate,
      }),
    }
  )
);
