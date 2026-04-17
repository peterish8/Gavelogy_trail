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
  user_answer_text?: string;
  correct_answer_text?: string;
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
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === '42P01') {
        console.warn('Mistakes table not found (42P01), skipping load.');
      } else {
        console.error('Error loading mistakes:', error);
      }
      set({ loading: false });
    }
  },

  loadConfidenceStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quiz_answer_confidence')
        .select('confidence_level, answer_was_correct, question_id')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01') return; // table not yet created
        console.error('Error loading confidence stats:', error);
        return;
      }

      // Group by confidence_level, compute correct/wrong counts
      const map: Record<string, ConfidenceStats> = {};
      for (const row of data || []) {
        const level = row.confidence_level || 'confident';
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
          if (level === 'confident') map[level].correct_confident++;
          else if (level === 'educated_guess') map[level].correct_educated_guess++;
          else map[level].correct_fluke++;
        } else {
          if (level === 'confident') map[level].wrong_confident++;
          else if (level === 'educated_guess') map[level].wrong_educated_guess++;
          else map[level].wrong_fluke++;
        }
      }

      set({ confidenceStats: Object.values(map) });
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error toggling mastery:', err?.message || error);
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error adding mistake:', err?.message || error);
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error clearing mistake:', err?.message || error);
    }
  },

}));
