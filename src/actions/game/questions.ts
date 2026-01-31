'use server';

import { createClient } from '@/lib/supabase/server';
import { QuizQuestion } from '@/lib/quiz-loader';

/**
 * Fetches random questions for the game.
 * Filters out sensitive fields like 'correct_answer' and 'explanation'.
 */
export async function fetchGameQuestions(mode: 'duel' | 'arena'): Promise<Partial<QuizQuestion>[]> {
  const supabase = await createClient();
  const count = mode === 'duel' ? 10 : 12;

  // Ideally use RPC for random, but for Phase 1 we fetch a batch and shuffle in JS
  // Assumes we have enough questions in 'quiz_questions' table
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('id, question_text, options, question_type, order_index, quiz_id, correct_answer, explanation')
    .limit(50); // Fetch pool

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Shuffle and slice
  const shuffled = data.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // 2. Fetch Context (Quiz -> Note -> Content)
  const quizIds = Array.from(new Set(selected.map(q => q.quiz_id))).filter(Boolean);
  
  // Map to store context
  const contextMap: Record<string, { title: string; passage: string }> = {};
  
  if (quizIds.length > 0) {
     // A. Get Note Item IDs from Quizzes
     const { data: quizzes } = await supabase
       .from('attached_quizzes')
       .select('id, note_item_id')
       .in('id', quizIds);
       
     if (quizzes) {
         const noteItemIds = quizzes.map(q => q.note_item_id).filter(Boolean) as string[];
         
         // B. Get Title and Content
         if (noteItemIds.length > 0) {
             const [{ data: items }, { data: contents }] = await Promise.all([
                 supabase.from('structure_items').select('id, title').in('id', noteItemIds),
                 supabase.from('note_contents').select('item_id, content_html').in('item_id', noteItemIds)
             ]);
             
             const itemMap = (items || []).reduce((acc, item) => {
                 acc[item.id] = item.title;
                 return acc;
             }, {} as Record<string, string>);
             
             const contentMap = (contents || []).reduce((acc, c) => {
                 // Simple strip tags for now, or keep HTML if rich text needed. 
                 // User requested "Para", so let's try to get clean text or just pass HTML.
                 // For now, let's simple strip to plain text to match the "Case Passage" look.
                 // Regex to strip tags:
                 const text = c.content_html?.replace(/<[^>]*>?/gm, '') || '';
                 acc[c.item_id] = text.substring(0, 1000); // Limit length if needed
                 return acc;
             }, {} as Record<string, string>);
             
             // Populate contextMap by Quiz ID
             quizzes.forEach(q => {
                 if (q.note_item_id) {
                     contextMap[q.id] = {
                         title: itemMap[q.note_item_id] || 'Unknown Case',
                         passage: contentMap[q.note_item_id] || ''
                     };
                 }
             });
         }
     }
  }

  // Parse options if string (JSON) & Attach Context
  return selected.map(q => {
    let options = q.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch {
        options = [];
      }
    }
    
    // Retrieve context using quiz_id
    const context = q.quiz_id ? contextMap[q.quiz_id] : null;

    return {
      ...q,
      text: q.question_text, // Map for client store compatibility
      options,
      title: context?.title,
      passage: context?.passage,
      correctAnswer: q.correct_answer,
      explanation: q.explanation
    };
  });
}
