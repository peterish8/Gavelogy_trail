
import { supabase } from "@/lib/supabase";
import { QuizQuestion } from "./quiz-loader";

interface WeightedQuestion extends QuizQuestion {
  weight: number;
  tags: string[]; // 'mistake', 'low_confidence', 'stale'
}

/**
 * Selects questions for a Spaced Repetition session based on user history.
 * Prioritizes active mistakes and low-confidence answers.
 */
export async function getWeightedQuestions(
  quizId: string,
  userId: string,
  limit: number = 10
): Promise<QuizQuestion[]> {
  try {
    // 1. Fetch data in parallel
    const [questionsRes, mistakesRes, confidenceRes] = await Promise.all([
      // A. All Questions
      supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId),
      
      // B. Mistakes (Active)
      supabase
        .from('mistakes')
        .select('question_id, is_mastered')
        .eq('user_id', userId)
        .eq('is_mastered', false),

      // C. Confidence (Low only)
      supabase
        .from('quiz_answer_confidence')
        .select('question_id, confidence_level')
        .eq('user_id', userId)
        .in('confidence_level', ['guess', 'fluke', '50/50']) 
        // Note: '50/50' might be stored as string, key logic usually 'guess'/'fluke'
    ]);

    if (questionsRes.error) throw questionsRes.error;
    const questions = questionsRes.data || [];
    
    if (questions.length === 0) return [];

    const mistakesMap = new Set(mistakesRes.data?.map(m => m.question_id));
    const confidenceMap = new Set(confidenceRes.data?.map(c => c.question_id));

    // 2. Calculate Weights
    const weightedQuestions: WeightedQuestion[] = questions.map(q => {
      let weight = 0;
      const tags: string[] = [];

      // Logic:
      // Mistake = +50
      // Low Confidence = +30
      // Base = +Random(0-10) for variety
      
      if (mistakesMap.has(q.id)) {
        weight += 50;
        tags.push('mistake');
      }

      if (confidenceMap.has(q.id)) {
        weight += 30;
        tags.push('low_confidence');
      }

      weight += Math.random() * 10; // Jitter

      // Parse options if necessary (similar to QuizLoader)
      let parsedOptions = q.options;
      if (typeof parsedOptions === 'string') {
        try { parsedOptions = JSON.parse(parsedOptions); } catch (e) {}
      }

      return {
        ...q,
        options: parsedOptions,
        weight,
        tags
      };
    });

    // 3. Sort & Slice
    weightedQuestions.sort((a, b) => b.weight - a.weight);

    return weightedQuestions.slice(0, limit);

  } catch (error) {
    console.error('Error getting weighted questions:', error);
    return []; // Fail safe: empty or fallback?
  }
}
