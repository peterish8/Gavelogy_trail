
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      question_id, 
      question_text, 
      user_answer, 
      correct_answer, 
      option_a, 
      option_b, 
      option_c, 
      option_d, 
      explanation, 
      subject, 
      topic 
    } = body;

    // Use Service Role Key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from('mistakes').upsert({
      user_id,
      question_id,
      question_text,
      user_answer,
      correct_answer,
      option_a,
      option_b,
      option_c,
      option_d,
      explanation,
      subject,
      topic: topic || null
    }, { onConflict: 'user_id, question_id' });

    if (error) {
      console.error('Supabase Admin Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API Error saving mistake:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
