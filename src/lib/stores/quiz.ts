import { create } from "zustand";
import { getConvexHttpClient } from "../convex-client";
import { api } from "@/convex/_generated/api";

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  subject?: string;
  topic?: string;
  totalQuestions: number;
  answers: Record<string, string>;
  completedAt: number;
}

export interface SubjectStats {
  subject: string;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  passedCount: number;
}

export interface QuizStats {
  totalAttempts: number;
  totalScore: number;
  averageScore: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  recentAttempts: QuizAttempt[];
  attemptsBySubject: Record<string, SubjectStats>;
  weeklyChange: number;
}

interface QuizStore {
  attempts: QuizAttempt[];
  loading: boolean;
  loadAttempts: () => Promise<void>;
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getRecentAttempts: (limit?: number) => QuizAttempt[];
  getQuizStats: () => QuizStats;
  getSubjectStats: (subject: string) => SubjectStats;
  resetAttempts: () => void;
}

export const useQuizStore = create<QuizStore>()((set, get) => ({
  attempts: [],
  loading: false,

  loadAttempts: async () => {
    try {
      set({ loading: true });
      const client = getConvexHttpClient();
      const data = await client.query(api.quiz.getAttempts, {});
      const attempts: QuizAttempt[] = (data || []).map((item) => ({
        id: item._id,
        userId: item.userId,
        quizId: item.quizId,
        score: item.score,
        passed: item.score >= 60,
        totalQuestions: item.total_questions,
        answers: {},
        completedAt: new Date(item.completed_at).getTime(),
      }));
      set({ attempts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  getAttemptsByQuiz: (quizId) =>
    get().attempts.filter((a) => a.quizId === quizId),

  getRecentAttempts: (limit = 10) =>
    get()
      .attempts.sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit),

  getQuizStats: () => {
    const attempts = get().attempts;
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const passedCount = attempts.filter((a) => a.passed).length;
    const failedCount = totalAttempts - passedCount;
    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

    const subjectMap: Record<string, QuizAttempt[]> = {};
    for (const a of attempts) {
      const key = a.subject || "General";
      if (!subjectMap[key]) subjectMap[key] = [];
      subjectMap[key].push(a);
    }
    const attemptsBySubject: Record<string, SubjectStats> = {};
    for (const [subject, subAttempts] of Object.entries(subjectMap)) {
      const subPassed = subAttempts.filter((a) => a.passed).length;
      const subAvg = subAttempts.reduce((s, a) => s + a.score, 0) / subAttempts.length;
      attemptsBySubject[subject] = {
        subject,
        totalAttempts: subAttempts.length,
        averageScore: subAvg,
        passRate: (subPassed / subAttempts.length) * 100,
        passedCount: subPassed,
      };
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = attempts.filter((a) => now - a.completedAt <= oneWeek);
    const lastWeek = attempts.filter(
      (a) => now - a.completedAt > oneWeek && now - a.completedAt <= 2 * oneWeek
    );
    const thisAvg =
      thisWeek.length > 0
        ? thisWeek.reduce((s, a) => s + a.score, 0) / thisWeek.length
        : 0;
    const lastAvg =
      lastWeek.length > 0
        ? lastWeek.reduce((s, a) => s + a.score, 0) / lastWeek.length
        : 0;
    const weeklyChange = lastAvg > 0 ? Math.round(thisAvg - lastAvg) : 0;

    return {
      totalAttempts,
      totalScore,
      averageScore,
      passedCount,
      failedCount,
      passRate,
      recentAttempts: attempts.slice(0, 10),
      attemptsBySubject,
      weeklyChange,
    };
  },

  getSubjectStats: (subject: string): SubjectStats => {
    const attempts = get().attempts.filter(
      (a) => (a.subject || "General") === subject
    );
    if (attempts.length === 0) {
      return { subject, totalAttempts: 0, averageScore: 0, passRate: 0, passedCount: 0 };
    }
    const passedCount = attempts.filter((a) => a.passed).length;
    return {
      subject,
      totalAttempts: attempts.length,
      averageScore: attempts.reduce((s, a) => s + a.score, 0) / attempts.length,
      passRate: (passedCount / attempts.length) * 100,
      passedCount,
    };
  },

  resetAttempts: () => set({ attempts: [] }),
}));
