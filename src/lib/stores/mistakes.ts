import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MistakeRecord {
  id: string;
  questionId: string;
  subject: string;
  topic: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: number;
  isCleared: boolean;
  clearedAt?: number;
  attempts: number;
}

export interface MistakeStats {
  totalMistakes: number;
  activeMistakes: number;
  clearedMistakes: number;
  clearanceRate: number;
  mistakesBySubject: Record<string, number>;
  mistakesByTopic: Record<string, number>;
}

interface MistakeStore {
  mistakes: MistakeRecord[];
  addMistake: (
    mistake: Omit<MistakeRecord, "id" | "timestamp" | "isCleared" | "attempts">
  ) => void;
  clearMistake: (mistakeId: string) => void;
  clearMistakeByQuestionId: (questionId: string) => void;
  getMistakesBySubject: (subject: string) => MistakeRecord[];
  getMistakesByTopic: (subject: string, topic: string) => MistakeRecord[];
  getActiveMistakes: () => MistakeRecord[];
  getClearedMistakes: () => MistakeRecord[];
  getMistakeStats: () => MistakeStats;
  incrementAttempts: (mistakeId: string) => void;
  resetMistakes: () => void;
}

export const useMistakeStore = create<MistakeStore>()(
  persist(
    (set, get) => ({
      mistakes: [],

      addMistake: (mistakeData) => {
        const newMistake: MistakeRecord = {
          ...mistakeData,
          id: `mistake_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: Date.now(),
          isCleared: false,
          attempts: 1,
        };

        set((state) => ({
          mistakes: [...state.mistakes, newMistake],
        }));
      },

      clearMistake: (mistakeId) => {
        set((state) => ({
          mistakes: state.mistakes.map((mistake) =>
            mistake.id === mistakeId
              ? { ...mistake, isCleared: true, clearedAt: Date.now() }
              : mistake
          ),
        }));
      },

      clearMistakeByQuestionId: (questionId) => {
        set((state) => ({
          mistakes: state.mistakes.map((mistake) =>
            mistake.questionId === questionId
              ? { ...mistake, isCleared: true, clearedAt: Date.now() }
              : mistake
          ),
        }));
      },

      getMistakesBySubject: (subject) => {
        return get().mistakes.filter((mistake) => mistake.subject === subject);
      },

      getMistakesByTopic: (subject, topic) => {
        return get().mistakes.filter(
          (mistake) => mistake.subject === subject && mistake.topic === topic
        );
      },

      getActiveMistakes: () => {
        return get().mistakes.filter((mistake) => !mistake.isCleared);
      },

      getClearedMistakes: () => {
        return get().mistakes.filter((mistake) => mistake.isCleared);
      },

      incrementAttempts: (mistakeId) => {
        set((state) => ({
          mistakes: state.mistakes.map((mistake) =>
            mistake.id === mistakeId
              ? { ...mistake, attempts: mistake.attempts + 1 }
              : mistake
          ),
        }));
      },

      getMistakeStats: () => {
        const mistakes = get().mistakes;
        const totalMistakes = mistakes.length;
        const activeMistakes = mistakes.filter((m) => !m.isCleared).length;
        const clearedMistakes = mistakes.filter((m) => m.isCleared).length;
        const clearanceRate =
          totalMistakes > 0 ? (clearedMistakes / totalMistakes) * 100 : 0;

        // Group by subject
        const mistakesBySubject: Record<string, number> = {};
        mistakes.forEach((mistake) => {
          mistakesBySubject[mistake.subject] =
            (mistakesBySubject[mistake.subject] || 0) + 1;
        });

        // Group by topic
        const mistakesByTopic: Record<string, number> = {};
        mistakes.forEach((mistake) => {
          const key = `${mistake.subject} - ${mistake.topic}`;
          mistakesByTopic[key] = (mistakesByTopic[key] || 0) + 1;
        });

        return {
          totalMistakes,
          activeMistakes,
          clearedMistakes,
          clearanceRate,
          mistakesBySubject,
          mistakesByTopic,
        };
      },

      resetMistakes: () => {
        set({ mistakes: [] });
      },
    }),
    {
      name: "mistake-storage",
    }
  )
);
