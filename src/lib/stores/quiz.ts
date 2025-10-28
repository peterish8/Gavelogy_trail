import { create } from "zustand";
import { supabase } from "../supabase";

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
  // Additional fields for contemporary case quizzes
  quizId?: string;
  accuracy?: number;
  detailedAnswers?: Array<{
    questionId: string;
    selectedAnswer: string;
    confidence: "confident" | "guess" | "fluke";
    isCorrect: boolean;
    timeSpent: number;
  }>;
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
  loading: boolean;
  addAttempt: (
    attempt: Omit<QuizAttempt, "id" | "timestamp">
  ) => Promise<string>;
  loadAttempts: () => Promise<void>;
  getAttemptsBySubject: (subject: string) => QuizAttempt[];
  getAttemptsByTopic: (subject: string, topic: string) => QuizAttempt[];
  getRecentAttempts: (limit?: number) => QuizAttempt[];
  getQuizStats: () => QuizStats;
  getSubjectStats: (subject: string) => QuizStats;
  getTopicStats: (subject: string, topic: string) => QuizStats;
  resetAttempts: () => void;
}

export const useQuizStore = create<QuizStore>()((set, get) => ({
  attempts: [],
  loading: false,

  addAttempt: async (attemptData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          subject: attemptData.subject,
          topic: attemptData.topic,
          score: attemptData.score,
          total_questions: attemptData.totalQuestions,
          time_spent: attemptData.timeSpent,
          quiz_id: attemptData.quizId,
          questions_data: {
            questions: attemptData.questions,
            answers: attemptData.answers,
            correctAnswers: attemptData.correctAnswers,
            wrongQuestions: attemptData.wrongQuestions
          },
          confidence_data: attemptData.confidence
        })
        .select()
        .single();

      if (error) throw error;

      // Convert to local format and add to state
      const newAttempt: QuizAttempt = {
        id: data.id,
        subject: data.subject,
        topic: data.topic,
        questions: attemptData.questions,
        answers: attemptData.answers,
        correctAnswers: attemptData.correctAnswers,
        score: data.score,
        totalQuestions: data.total_questions,
        timestamp: new Date(data.created_at).getTime(),
        timeSpent: data.time_spent,
        wrongQuestions: attemptData.wrongQuestions,
        confidence: attemptData.confidence,
        quizId: data.quiz_id,
        accuracy: data.accuracy
      };

      // Reload attempts to get updated list
      await get().loadAttempts();

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
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const attempts: QuizAttempt[] = data.map(item => ({
        id: item.id,
        subject: item.subject,
        topic: item.topic,
        questions: item.questions_data?.questions || [],
        answers: item.questions_data?.answers || {},
        correctAnswers: item.questions_data?.correctAnswers || {},
        score: item.score,
        totalQuestions: item.total_questions,
        timestamp: new Date(item.created_at).getTime(),
        timeSpent: item.time_spent,
        wrongQuestions: item.questions_data?.wrongQuestions || [],
        confidence: item.confidence_data || {},
        quizId: item.quiz_id,
        accuracy: item.accuracy
      }));

      set({ attempts, loading: false });
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
      set({ loading: false });
    }
  },

      getAttemptsBySubject: (subject) => {
        return get().attempts.filter((attempt) => attempt.subject === subject);
      },

      getAttemptsByTopic: (subject, topic) => {
        return get().attempts.filter(
          (attempt) => attempt.subject === subject && attempt.topic === topic
        );
      },

      getRecentAttempts: (limit = 12) => {
        return get()
          .attempts.sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, Math.min(limit, 12));
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
}));
