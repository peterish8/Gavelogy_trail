import { create } from "zustand";
import { getConvexClient } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface MistakeRecord {
  _id: string;
  questionId: string;
  subjectId?: string;
  review_count: number;
  source_type: "quiz" | "mock";
  source_id: string;
  is_mastered?: boolean;
}

export interface ConfidenceStats {
  subject: string;
  total_questions: number;
  correct_confident: number;
  correct_educated_guess: number;
  correct_fluke: number;
  wrong_confident: number;
  wrong_educated_guess: number;
  wrong_fluke: number;
}

interface MistakeStore {
  mistakes: MistakeRecord[];
  confidenceStats: ConfidenceStats[];
  loading: boolean;

  loadMistakes: () => Promise<void>;
  loadConfidenceStats: () => Promise<void>;
  markAsMastered: (mistakeId: string) => Promise<void>;
  addMistake: (args: {
    questionId: string;
    subjectId?: string;
    source_type: "quiz" | "mock";
    source_id: string;
  }) => Promise<void>;
  clearMistakeByQuestionId: (questionId: string) => Promise<void>;
}

export const useMistakeStore = create<MistakeStore>()((set, get) => ({
  mistakes: [],
  confidenceStats: [],
  loading: false,

  loadMistakes: async () => {
    try {
      set({ loading: true });
      const client = getConvexClient();
      const data = await client.query(api.mistakes.getMistakes, {});
      set({ mistakes: (data ?? []) as MistakeRecord[], loading: false });
    } catch (e) {
      console.error("Error loading mistakes:", e);
      set({ loading: false });
    }
  },

  loadConfidenceStats: async () => {
    try {
      const client = getConvexClient();
      const data = await client.query(api.quiz.getConfidenceData, {});
      if (!data) return;

      const map: Record<string, ConfidenceStats> = {};
      for (const row of data) {
        const level = row.confidence_level || "confident";
        if (!map[level]) {
          map[level] = {
            subject: level,
            total_questions: 0,
            correct_confident: 0,
            correct_educated_guess: 0,
            correct_fluke: 0,
            wrong_confident: 0,
            wrong_educated_guess: 0,
            wrong_fluke: 0,
          };
        }
        map[level].total_questions++;
        if (row.answer_was_correct) {
          if (level === "confident") map[level].correct_confident++;
          else if (level === "educated_guess") map[level].correct_educated_guess++;
          else map[level].correct_fluke++;
        } else {
          if (level === "confident") map[level].wrong_confident++;
          else if (level === "educated_guess") map[level].wrong_educated_guess++;
          else map[level].wrong_fluke++;
        }
      }
      set({ confidenceStats: Object.values(map) });
    } catch (e) {
      console.error("Error loading confidence stats:", e);
    }
  },

  markAsMastered: async (mistakeId: string) => {
    try {
      const client = getConvexClient();
      await client.mutation(api.mistakes.markMastered, {
        mistakeId: mistakeId as Id<"mistakes">,
      });
      set((state) => ({
        mistakes: state.mistakes.map((m) =>
          m._id === mistakeId ? { ...m, is_mastered: true } : m
        ),
      }));
    } catch (e) {
      console.error("Error marking as mastered:", e);
    }
  },

  addMistake: async (args) => {
    try {
      const client = getConvexClient();
      await client.mutation(api.mistakes.upsertMistake, args);
      await get().loadMistakes();
    } catch (e) {
      console.error("Error adding mistake:", e);
    }
  },

  clearMistakeByQuestionId: async (questionId: string) => {
    try {
      const client = getConvexClient();
      const mistake = get().mistakes.find((m) => m.questionId === questionId);
      if (mistake) {
        await client.mutation(api.mistakes.deleteMistake, {
          mistakeId: mistake._id as Id<"mistakes">,
        });
        set((state) => ({
          mistakes: state.mistakes.filter((m) => m.questionId !== questionId),
        }));
      }
    } catch (e) {
      console.error("Error clearing mistake:", e);
    }
  },
}));
