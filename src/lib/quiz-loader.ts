import { supabase } from "@/lib/supabase";

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[] | Record<string, string>;
  correct_answer: string;
  explanation: string;
  question_type: 'single_choice' | 'multiple_choice';
  order_index: number;
}

export interface AttachedQuiz {
  id: string;
  title: string;
  passing_score: number;
  note_item_id: string;
  questions: QuizQuestion[];
}

export const QuizLoader = {
  // Check if a note has an attached quiz (lightweight check for UI)
  async hasQuiz(noteItemId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('attached_quizzes')
        .select('id', { count: 'exact', head: true })
        .eq('note_item_id', noteItemId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking for quiz:', error);
      return false;
    }
  },

  // Get the full quiz with questions for a note
  async getQuizForNote(noteItemId: string): Promise<AttachedQuiz | null> {
    try {
      // 1. Get the quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('attached_quizzes')
        .select('*')
        .eq('note_item_id', noteItemId)
        .single();

      if (quizError) {
        if (quizError.code === 'PGRST116') return null; // No quiz found
        throw quizError;
      }

      if (!quizData) return null;

      // 2. Get questions for this quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      // 3. Format questions (handle different JSONB structures for options)
      const formattedQuestions: QuizQuestion[] = (questionsData || []).map(q => {
        let options = q.options;
        
        // Ensure options is arrays or object, handle string parsing if needed
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options);
          } catch (e) {
            options = [];
          }
        }

        return {
          id: q.id,
          question_text: q.question_text,
          options: options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          question_type: q.question_type || 'single_choice',
          order_index: q.order_index || 0
        };
      });

      return {
        id: quizData.id,
        title: quizData.title || 'Lesson Quiz',
        passing_score: quizData.passing_score || 70,
        note_item_id: quizData.note_item_id,
        questions: formattedQuestions
      };

    } catch (error) {
      console.error('Error loading quiz:', error);
      return null;
    }
  }
};
