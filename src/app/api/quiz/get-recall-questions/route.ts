/**
 * GET /api/quiz/get-recall-questions
 * 
 * Returns the question IDs to show in a spaced repetition recall.
 * Uses the bucket-based waterfall selection algorithm.
 */

import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { selectRecallQuestions, hasMemoryStates } from "@/lib/spaced-repetition-bucket-system";

// Create admin client
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { quizId } = body;
    
    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId" }, { status: 400 });
    }
    
    // Check if memory states exist (initial quiz completed)
    const hasStates = await hasMemoryStates(user.id, quizId);
    
    if (!hasStates) {
      return NextResponse.json({
        error: "No memory states found",
        message: "Complete the initial quiz first to enable spaced repetition",
        requiresInitialQuiz: true
      }, { status: 404 });
    }
    
    // Select questions using waterfall algorithm
    const questionIds = await selectRecallQuestions(user.id, quizId);
    
    if (questionIds.length === 0) {
      return NextResponse.json({
        error: "No questions available",
        message: "Could not select questions for recall"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      questionIds,
      recallSize: questionIds.length,
      message: `Selected ${questionIds.length} questions for recall`
    });
    
  } catch (error) {
    console.error("[get-recall-questions] Error:", error);
    return NextResponse.json({
      error: "Internal server error",
      message: String(error)
    }, { status: 500 });
  }
}
