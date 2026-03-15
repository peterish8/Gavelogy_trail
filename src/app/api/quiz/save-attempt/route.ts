
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculateNextIntervalDays, MAX_STAGE_INDEX } from '@/lib/spaced-repetition-config';
import { 
  classifyQuestionsAfterInitialQuiz, 
  hasMemoryStates,
  Confidence
} from '@/lib/spaced-repetition-bucket-system';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      quizId, 
      userId, 
      score, 
      passed, 
      answers,
      totalQuestions,
      localDate,
      isSpacedRepetition, // NEW: Flag to indicate SR mode
      subject,
      topic
    } = body;

    // Use Service Role Key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const completionTime = new Date();

    // 1. Save the Attempt
    const { error: attemptError } = await supabaseAdmin.from('quiz_attempts').insert({
      quiz_id: quizId,
      user_id: userId,
      score: Math.round(score),
      passed,
      answers, // JSONB column
      total_questions: totalQuestions || (Array.isArray(answers) ? answers.length : 0),
      completed_at: completionTime.toISOString(),
      subject,
      topic
    });

    if (attemptError) {
      console.error('Supabase Admin Error (Attempt):', attemptError);
      throw attemptError;
    }

    // 1.5. Handle Bucket System (Initial Quiz or SR Update)
    if (isSpacedRepetition) {
      // Check if this is the first quiz (no memory states exist)
      const hasStates = await hasMemoryStates(userId, quizId);
      
      if (!hasStates) {
        // Initial quiz - classify all questions into buckets
        console.log('[BucketSystem] Initial quiz - classifying questions');
        
        // Fetch confidence ratings for all questions
        const { data: confidenceData, error: confError } = await supabaseAdmin
          .from('quiz_answer_confidence')
          .select('question_id, confidence_level, answer_was_correct')
          .eq('user_id', userId)
          .eq('quiz_id', quizId)
          .eq('is_initial_attempt', true);
        
        if (!confError && confidenceData && confidenceData.length > 0) {
          // Map to QuestionAnswer format
          const questionAnswers = confidenceData.map(c => ({
            questionId: c.question_id,
            isCorrect: c.answer_was_correct,
            confidence: c.confidence_level as Confidence
          }));
          
          // Classify questions into buckets
          const result = await classifyQuestionsAfterInitialQuiz(userId, quizId, questionAnswers);
          
          if (result.success) {
            console.log(`[BucketSystem] Successfully classified ${questionAnswers.length} questions`);
          } else {
            console.error('[BucketSystem] Classification failed:', result.error);
          }
        }
      } else {
        // SR attempt - update memory states
        console.log('[BucketSystem] SR attempt - updating memory states');
        
        // Fetch confidence ratings for this SR attempt
        const { data: srConfidenceData, error: srConfError } = await supabaseAdmin
          .from('quiz_answer_confidence')
          .select('question_id, confidence_level, answer_was_correct')
          .eq('user_id', userId)
          .eq('quiz_id', quizId)
          .eq('is_initial_attempt', false)
          .order('created_at', { ascending: false })
          .limit(answers.length);
        
        if (!srConfError && srConfidenceData && srConfidenceData.length > 0) {
          // Update memory states for each question
          for (const conf of srConfidenceData) {
            await supabaseAdmin.rpc('update_memory_state_after_sr', {
              p_user_id: userId,
              p_quiz_id: quizId,
              p_question_id: conf.question_id,
              p_is_correct: conf.answer_was_correct,
              p_confidence: conf.confidence_level
            });
          }
          console.log(`[BucketSystem] Updated ${srConfidenceData.length} memory states`);
        }
      }
    }

    // 2. Handle Spaced Repetition (Pass or Fail)
    // Always check existing schedule to update or initialize
    const { data: existingSchedule, error: fetchError } = await supabaseAdmin
      .from('spaced_repetition_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .single();

    // 2.5 Update Daily Activity
    // Use client provided localDate or fallback to UTC date from server time
    const dateStr = localDate || completionTime.toISOString().split('T')[0]; 
    
    // Check if this user has ALREADY completed THIS quiz on THIS day.
    // If so, we do NOT increment the daily count (unique quizzes only).
    
    // Create start/end for the day in UTC context or just use date string matching if possible?
    // Postgres Date type matches YYYY-MM-DD.
    // But quiz_attempts uses timestamp.
    // Let's verify by querying quiz_attempts for this user, quiz, and approximate time range?
    // OR simpler: Query quiz_attempts.
    
    // Actually, we just inserted the NEW attempt. So count will be at least 1.
    // If count > 1, then it's a repeat.
    
    // We need to define "Today" for the query.
    // Since we accepted localDate, let's trust it defines "Today".
    
    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const { count: attemptsToday, error: countError } = await supabaseAdmin
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .gte('completed_at', startOfDay.toISOString())
        .lte('completed_at', endOfDay.toISOString());

    // attemptsToday should be at least 1 (the one we just saved).
    // If attemptsToday == 1, it's the first time -> Increment.
    // If attemptsToday > 1, it's a repeat -> Do nothing.
    
    if (!countError && attemptsToday === 1) {
        const { data: existingDaily } = await supabaseAdmin
            .from('daily_activity')
            .select('quizzes_completed')
            .eq('user_id', userId)
            .eq('activity_date', dateStr)
            .single();
        
        const newCount = (existingDaily?.quizzes_completed || 0) + 1;

        const { error: dailyError } = await supabaseAdmin
            .from('daily_activity')
            .upsert({
                user_id: userId,
                activity_date: dateStr,
                quizzes_completed: newCount
            }, { onConflict: 'user_id, activity_date' });

        if (dailyError) {
            console.error('Error updating daily activity:', dailyError);
        }
    } else {
        console.log(`[Daily Activity] Skipping increment for User ${userId}, Quiz ${quizId} on ${dateStr} (Attempt Count: ${attemptsToday})`);
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching schedule:', fetchError);
    } else {
      let nextStageIndex = 0;
      let nextDueAt: Date | null = null;
      let newStatus = 'active';

      if (passed) {
        // --- PASSED: Advance State ---
        if (!existingSchedule) {
          // Initial Success -> Start Sequence (Stage 0, Due Tomorrow)
          const gap = calculateNextIntervalDays(-1); // Returns 1
          if (gap !== null) {
            nextDueAt = new Date(completionTime);
            nextDueAt.setDate(nextDueAt.getDate() + gap);
            nextStageIndex = 0; 
          }
        } else {
          const currentStage = existingSchedule.current_stage_index;
          if (currentStage >= MAX_STAGE_INDEX) {
            newStatus = 'completed'; // Done forever
          } else {
            const gap = calculateNextIntervalDays(currentStage);
            if (gap === null) {
              newStatus = 'completed';
            } else {
              nextStageIndex = currentStage + 1;
              nextDueAt = new Date(completionTime);
              nextDueAt.setDate(nextDueAt.getDate() + gap);
            }
          }
        }
      } else {
        // --- FAILED: Reset/Init State ---
        // If failed, we want them to review it soon (Tomorrow).
        // Reset to Stage 0 (Day 1 interval).
        nextStageIndex = 0;
        const gap = 1; // Fixed 1-day interval for retry
        nextDueAt = new Date(completionTime);
        nextDueAt.setDate(nextDueAt.getDate() + gap);
        // Status remains 'active'
      }

      // Prepare Upsert Payload
      // If completed, we don't strictly need nextDueAt, but keeping it null is fine.
      const schedulePayload = {
        user_id: userId,
        quiz_id: quizId,
        last_completed_at: completionTime.toISOString(),
        status: newStatus,
        // Update stage/due date if active
        ...(newStatus === 'active' && nextDueAt ? {
            current_stage_index: nextStageIndex,
            next_due_at: nextDueAt.toISOString()
        } : {})
      };

      const { error: scheduleError } = await supabaseAdmin
        .from('spaced_repetition_schedules')
        .upsert(schedulePayload, { onConflict: 'user_id,quiz_id' });

      if (scheduleError) {
        console.error('Error updating schedule:', scheduleError);
      } else {
        console.log(`[SR] Schedule updated for User ${userId}, Quiz ${quizId}. Passed: ${passed}, Status: ${newStatus}, Stage: ${nextStageIndex}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API Error saving quiz attempt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
