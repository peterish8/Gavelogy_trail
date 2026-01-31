
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      quizId, 
      questionId, 
      confidenceLevel, 
      wasCorrect 
    } = body;

    // Use Service Role Key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from('quiz_answer_confidence').insert({
      user_id: userId,
      quiz_id: quizId,
      question_id: questionId,
      confidence_level: confidenceLevel,
      answer_was_correct: wasCorrect,
      is_initial_attempt: true
    });

    if (error) {
      console.error('Supabase Admin Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API Error saving confidence:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
