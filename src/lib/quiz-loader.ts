import { supabase } from "@/lib/supabase";

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[] | Record<string, string>;
  correct_answer: string;
  explanation: string;
  passage?: string; // Optional context/passage for the question
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
          } catch {
            options = [];
          }
        }

        return {
          id: q.id,
          question_text: q.question_text,
          options: options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          passage: q.passage,
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
  },

  // Get a Spaced Repetition customized quiz (Bucket-based selection)
  async getSpacedRepetitionQuiz(quizId: string, userId: string): Promise<AttachedQuiz | null> {
    try {
       // 1. Get Base Quiz Info
       const { data: quizData, error: quizError } = await supabase
        .from('attached_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) return null;

      // 2. Get question IDs from bucket-based selection API
      const response = await fetch('/api/quiz/get-recall-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ quizId, userId })
      });

      if (!response.ok) {
        let errorData: { message?: string, requiresInitialQuiz?: boolean } = {};
        try {
          const textBody = await response.text();
          try {
             errorData = JSON.parse(textBody);
          } catch {
             errorData = { message: textBody };
          }
        } catch (e) {
          console.error('[SR] Failed to read error body:', e);
        }

        if (response.status === 404) {
             console.warn(`[SR] API returned 404 (Expected for new users). Triggering fallback...`);
        } else {
             console.error(`[SR] API Error: ${response.status} ${response.statusText}`, errorData);
        }
        
        // Fallback Trigger:
        // 1. Explicit 404 (New User / No Memory States)
        // 2. Explicit flag from API
        if (response.status === 404 || errorData?.requiresInitialQuiz) {
          console.log('[SR] New user detected (404/requiresInitialQuiz). Loading standard quiz as fallback.');
          
          const { data: allQuestions, error: allQuestionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('order_index', { ascending: true });
          
          if (allQuestionsError || !allQuestions) {
            console.error('[SR] Error fetching standard questions for fallback:', allQuestionsError);
            return null;
          }
          
          console.log(`[SR] Fallback successful. Loaded ${allQuestions.length} standard questions.`);

          const parsedAllQuestions = allQuestions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
          }));
          
          return {
            id: quizData.id,
            title: quizData.title,
            passing_score: quizData.passing_score,
            note_item_id: quizData.note_item_id,
            questions: parsedAllQuestions
          };
        }
        
        return null; // Other errors (500, etc)
      }

      const { questionIds } = await response.json();

      // 3. Fetch the actual question data for selected IDs
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .in('id', questionIds)
        .order('order_index', { ascending: true });

      if (questionsError || !questions) {
        console.error('[SR] Error fetching questions:', questionsError);
        return null;
      }

      // Parse options
      const parsedQuestions = questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      return {
        id: quizData.id,
        title: `${quizData.title} (Spaced Repetition)`,
        passing_score: quizData.passing_score,
        note_item_id: quizData.note_item_id,
        questions: parsedQuestions
      };

    } catch (error) {
      console.error('[SR] Error loading bucket-based quiz:', error);
      return null;
    }
  },

  async saveQuizAttempt(
    quizId: string,
    userId: string,
    score: number,
    passed: boolean,
    answers: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>,
    totalQuestions?: number,
    isSpacedRepetition?: boolean,
    subject?: string,
    topic?: string
  ): Promise<boolean> {
    try {
      console.log(`[QuizLoader] Saving attempt for User ${userId}, Quiz ${quizId}, Passed: ${passed}`);
      const response = await fetch('/api/quiz/save-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          userId,
          score,
          passed,
          answers,
          totalQuestions: totalQuestions || answers.length,
          isSpacedRepetition: isSpacedRepetition || false,
          subject,
          topic,
          localDate: (() => {
            const now = new Date();
            const offset = now.getTimezoneOffset(); 
            const local = new Date(now.getTime() - (offset * 60 * 1000));
            return local.toISOString().split('T')[0];
          })()
        })
      });

      console.log('[QuizLoader] API Response Status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[QuizLoader] API Error Body:', errText);
        throw new Error('Failed to save attempt via API');
      }
      return true;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      return false;
    }
  },

  // Save a wrong answer to mistakes table
  async saveMistake(
    userId: string,
    question: QuizQuestion,
    userAnswer: string,
    subject: string,
    topic?: string
  ): Promise<boolean> {
    try {
      // Parse options to get individual option texts
      let optionA = '', optionB = '', optionC = '', optionD = '';
      
      if (Array.isArray(question.options)) {
        // Array format: [{letter: "A", text: "..."}, ...]
        const opts = question.options as Array<{ letter?: string; text?: string }>;
        optionA = opts.find(o => o.letter === 'A')?.text || opts[0]?.text || '';
        optionB = opts.find(o => o.letter === 'B')?.text || opts[1]?.text || '';
        optionC = opts.find(o => o.letter === 'C')?.text || opts[2]?.text || '';
        optionD = opts.find(o => o.letter === 'D')?.text || opts[3]?.text || '';
      } else if (typeof question.options === 'object') {
        // Object format: {A: "...", B: "...", ...}
        const opts = question.options as Record<string, string>;
        optionA = opts['A'] || opts['a'] || '';
        optionB = opts['B'] || opts['b'] || '';
        optionC = opts['C'] || opts['c'] || '';
        optionD = opts['D'] || opts['d'] || '';
      }

      const response = await fetch('/api/quiz/save-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          question_id: question.id,
          question_text: question.question_text,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          explanation: question.explanation,
          subject,
          topic: topic || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save mistake via API');
      }
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error saving mistake:', err?.message || error);
      return false;
    }
  },

  async saveConfidenceRating(params: {
    userId: string;
    quizId: string;
    questionId: string;
    confidenceLevel: 'confident' | '50/50' | 'fluke';
    wasCorrect: boolean;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/quiz/save-confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to save confidence via API');
      }
      return true;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error saving confidence rating:', err?.message || error);
      return false;
    }
  }
};
