import { create } from "zustand";
import { supabase } from "../supabase";

// New schema-aligned interfaces
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  subject?: string;
  topic?: string;
  totalQuestions: number;
  answers: Record<string, string>; // jsonb stored as object
  completedAt: number; // timestamp
}

export interface QuizStats {
  totalAttempts: number;
  totalScore: number;
  averageScore: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  recentAttempts: QuizAttempt[];
}

interface QuizStore {
  attempts: QuizAttempt[];
  loading: boolean;
  addAttempt: (attempt: {
    quizId: string;
    score: number;
    passed: boolean;
    subject?: string;
    topic?: string;
    totalQuestions?: number;
    answers: Record<string, string>;
    correctAnswers?: Record<string, string>;
    timeSpent?: number;
    wrongQuestions?: string[];
    confidence?: Record<string, string>;
    questions?: string[];
  }) => Promise<string>;
  loadAttempts: () => Promise<void>;
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getRecentAttempts: (limit?: number) => QuizAttempt[];
  getQuizStats: () => QuizStats;
  resetAttempts: () => void;
}

export const useQuizStore = create<QuizStore>()((set, get) => ({
  attempts: [],
  loading: false,

  addAttempt: async (attemptData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Prepare data for insertion - mapping to likely DB column names or storing in a flexible column if needed
      // Assuming columns exist for now based on usage patterns
      const dbPayload: any = {
        user_id: user.id,
        quiz_id: attemptData.quizId,
        score: attemptData.score,
        passed: attemptData.passed,
        answers: attemptData.answers,
        // Optional fields if table supports them
        subject: attemptData.subject,
        topic: attemptData.topic,
        total_questions: attemptData.totalQuestions || Object.keys(attemptData.answers).length
      };

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;

      // Convert to local format and add to state
      const newAttempt: QuizAttempt = {
        id: data.id,
        userId: data.user_id,
        quizId: data.quiz_id,
        score: data.score,
        passed: data.passed,
        subject: data.subject,
        topic: data.topic,
        totalQuestions: data.total_questions || attemptData.totalQuestions || 0,
        answers: data.answers || {},
        completedAt: new Date(data.completed_at).getTime()
      };

      set(state => ({
        attempts: [newAttempt, ...state.attempts]
      }));

      return data.id;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      return 'error';
    }
  },

  loadAttempts: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) {
        // Silently handle missing table or empty results
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Quiz attempts table not found, skipping load.');
        } else if (Object.keys(error).length === 0) {
          // Empty error object - likely no data
          console.warn('No quiz attempts found.');
        } else {
          console.error('Error loading quiz attempts:', error);
        }
        set({ loading: false });
        return;
      }

      const attempts: QuizAttempt[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        quizId: item.quiz_id,
        score: item.score || 0,
        passed: item.passed || false,
        subject: item.subject,
        topic: item.topic,
        totalQuestions: item.total_questions || 0,
        answers: item.answers || {},
        completedAt: new Date(item.completed_at).getTime()
      }));

      set({ attempts, loading: false });
    } catch (error: any) {
      // Suppress empty errors
      if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        console.warn('Quiz attempts: empty error, likely no data.');
      } else {
        console.error('Error loading quiz attempts:', error);
      }
      set({ loading: false });
    }
  },

  getAttemptsByQuiz: (quizId) => {
    return get().attempts.filter(attempt => attempt.quizId === quizId);
  },

  getRecentAttempts: (limit = 10) => {
    return get()
      .attempts
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  },

  getQuizStats: () => {
    const attempts = get().attempts;
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const passedCount = attempts.filter(a => a.passed).length;
    const failedCount = totalAttempts - passedCount;
    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

    return {
      totalAttempts,
      totalScore,
      averageScore,
      passedCount,
      failedCount,
      passRate,
      recentAttempts: attempts.slice(0, 10)
    };
  },

  resetAttempts: () => {
    set({ attempts: [] });
  }
}));
