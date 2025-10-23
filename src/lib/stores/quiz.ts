import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  questions: string[];
  answers: Record<string, string>;
  correctAnswers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timestamp: number;
  timeSpent: number;
  wrongQuestions: string[];
  confidence: Record<string, "confident" | "guess" | "fluke">;
}

export interface QuizStats {
  totalAttempts: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number;
  averageTime: number;
  attemptsBySubject: Record<string, number>;
  attemptsByTopic: Record<string, number>;
  recentAttempts: QuizAttempt[];
}

interface QuizStore {
  attempts: QuizAttempt[];
  addAttempt: (attempt: Omit<QuizAttempt, "id" | "timestamp">) => void;
  getAttemptsBySubject: (subject: string) => QuizAttempt[];
  getAttemptsByTopic: (subject: string, topic: string) => QuizAttempt[];
  getRecentAttempts: (limit?: number) => QuizAttempt[];
  getQuizStats: () => QuizStats;
  getSubjectStats: (subject: string) => QuizStats;
  getTopicStats: (subject: string, topic: string) => QuizStats;
  resetAttempts: () => void;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      attempts: [],

      addAttempt: (attemptData) => {
        const newAttempt: QuizAttempt = {
          ...attemptData,
          id: `attempt_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          attempts: [...state.attempts, newAttempt],
        }));
      },

      getAttemptsBySubject: (subject) => {
        return get().attempts.filter((attempt) => attempt.subject === subject);
      },

      getAttemptsByTopic: (subject, topic) => {
        return get().attempts.filter(
          (attempt) => attempt.subject === subject && attempt.topic === topic
        );
      },

      getRecentAttempts: (limit = 10) => {
        return get()
          .attempts.sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      },

      getQuizStats: () => {
        const attempts = get().attempts;
        const totalAttempts = attempts.length;
        const totalQuestions = attempts.reduce(
          (sum, attempt) => sum + attempt.totalQuestions,
          0
        );
        const totalCorrect = attempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        const averageScore =
          totalAttempts > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const averageTime =
          totalAttempts > 0
            ? attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) /
              totalAttempts
            : 0;

        // Group by subject
        const attemptsBySubject: Record<string, number> = {};
        attempts.forEach((attempt) => {
          attemptsBySubject[attempt.subject] =
            (attemptsBySubject[attempt.subject] || 0) + 1;
        });

        // Group by topic
        const attemptsByTopic: Record<string, number> = {};
        attempts.forEach((attempt) => {
          const key = `${attempt.subject} - ${attempt.topic}`;
          attemptsByTopic[key] = (attemptsByTopic[key] || 0) + 1;
        });

        return {
          totalAttempts,
          totalQuestions,
          totalCorrect,
          averageScore,
          averageTime,
          attemptsBySubject,
          attemptsByTopic,
          recentAttempts: attempts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10),
        };
      },

      getSubjectStats: (subject) => {
        const subjectAttempts = get().attempts.filter(
          (attempt) => attempt.subject === subject
        );
        const totalAttempts = subjectAttempts.length;
        const totalQuestions = subjectAttempts.reduce(
          (sum, attempt) => sum + attempt.totalQuestions,
          0
        );
        const totalCorrect = subjectAttempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        const averageScore =
          totalAttempts > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const averageTime =
          totalAttempts > 0
            ? subjectAttempts.reduce(
                (sum, attempt) => sum + attempt.timeSpent,
                0
              ) / totalAttempts
            : 0;

        return {
          totalAttempts,
          totalQuestions,
          totalCorrect,
          averageScore,
          averageTime,
          attemptsBySubject: { [subject]: totalAttempts },
          attemptsByTopic: {},
          recentAttempts: subjectAttempts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10),
        };
      },

      getTopicStats: (subject, topic) => {
        const topicAttempts = get().attempts.filter(
          (attempt) => attempt.subject === subject && attempt.topic === topic
        );
        const totalAttempts = topicAttempts.length;
        const totalQuestions = topicAttempts.reduce(
          (sum, attempt) => sum + attempt.totalQuestions,
          0
        );
        const totalCorrect = topicAttempts.reduce(
          (sum, attempt) => sum + attempt.score,
          0
        );
        const averageScore =
          totalAttempts > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const averageTime =
          totalAttempts > 0
            ? topicAttempts.reduce(
                (sum, attempt) => sum + attempt.timeSpent,
                0
              ) / totalAttempts
            : 0;

        return {
          totalAttempts,
          totalQuestions,
          totalCorrect,
          averageScore,
          averageTime,
          attemptsBySubject: { [subject]: totalAttempts },
          attemptsByTopic: { [`${subject} - ${topic}`]: totalAttempts },
          recentAttempts: topicAttempts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10),
        };
      },

      resetAttempts: () => {
        set({ attempts: [] });
      },
    }),
    {
      name: "quiz-storage",
    }
  )
);
