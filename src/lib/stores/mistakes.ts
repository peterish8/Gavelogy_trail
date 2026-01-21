import { create } from "zustand";
import { supabase } from "../supabase";

export interface MistakeRecord {
  id: string;
  question_id: string;
  subject: string;
  quiz_type?: string;
  topic?: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  confidence_level: 'confident' | 'educated_guess' | 'fluke';
  explanation?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  is_mastered: boolean;
  retake_count: number;
  created_at: string;
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
  addMistake: (mistake: {
    questionId: string;
    question: string;
    correctAnswer: string;
    userAnswer: string;
    userAnswerText?: string;
    correctAnswerText?: string;
    explanation?: string;
    subject: string;
    topic?: string;
  }) => Promise<void>;
  clearMistakeByQuestionId: (questionId: string) => Promise<void>;
  saveQuizAttempt: (attempt: {
    question_id: string;
    quiz_id?: string;
    quiz_type?: string;
    subject: string;
    topic?: string;
    question_text: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    confidence_level: 'confident' | 'educated_guess' | 'fluke';
    time_spent?: number;
    explanation?: string;
  }) => Promise<void>;
}

export const useMistakeStore = create<MistakeStore>()((set, get) => ({
  mistakes: [],
  confidenceStats: [],
  loading: false,

  loadMistakes: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("loadMistakes: No user found");
        set({ mistakes: [], loading: false });
        return;
      }
      
      console.log("loadMistakes: Fetching for user", user.id);

      const { data, error } = await supabase
        .from('mistakes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
         console.error("loadMistakes: Supabase error", {
             message: error.message,
             details: error.details,
             hint: error.hint,
             code: error.code
         });
         throw error;
      };

      console.log(`loadMistakes: Fetched ${data?.length || 0} records`);
      set({ mistakes: data || [], loading: false });
    } catch (error: any) {
      if (error?.code === '42P01') {
        console.warn('Mistakes table not found (42P01), skipping load.');
      } else {
        console.error('Error loading mistakes:', error);
      }
      set({ loading: false });
    }
  },

  loadConfidenceStats: async () => {
    try {
      set({ confidenceStats: [] });
    } catch (error) {
      console.error('Error loading confidence stats:', error);
    }
  },

  markAsMastered: async (mistakeId: string) => {
    try {
      console.log('Toggling mistake mastery:', mistakeId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Get current state to toggle
      const currentMistake = get().mistakes.find(m => m.id === mistakeId);
      const newMasteredState = !currentMistake?.is_mastered;

      const { data, error } = await supabase
        .from('mistakes')
        .update({ is_mastered: newMasteredState })
        .eq('id', mistakeId)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Updated mistake:', data);

      set(state => ({
        mistakes: state.mistakes.map(mistake =>
          mistake.id === mistakeId
            ? { ...mistake, is_mastered: newMasteredState }
            : mistake
        )
      }));
    } catch (error: any) {
      console.error('Error toggling mastery:', error?.message || error);
    }
  },

  addMistake: async (mistake) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mistakes')
        .upsert({
          user_id: user.id,
          question_id: mistake.questionId,
          question_text: mistake.question,
          user_answer: mistake.userAnswer,
          user_answer_text: mistake.userAnswerText,
          correct_answer: mistake.correctAnswer,
          correct_answer_text: mistake.correctAnswerText,
          explanation: mistake.explanation,
          subject: mistake.subject,
          topic: mistake.topic,
          confidence_level: 'confident',
          is_mastered: false
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error adding mistake:', error?.message || error);
    }
  },

  clearMistakeByQuestionId: async (questionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mistakes')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      if (error) throw error;

      set(state => ({
        mistakes: state.mistakes.filter(mistake => mistake.question_id !== questionId)
      }));
    } catch (error: any) {
      console.error('Error clearing mistake:', error?.message || error);
    }
  },

  saveQuizAttempt: async (attempt) => {
    // Not implemented for current schema
  },
}));
