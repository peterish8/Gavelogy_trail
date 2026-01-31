'use server';

import { createClient } from '@/lib/supabase/server';
import { calculatePoints } from '@/lib/game/scoring';

/**
 * Validates answer server-side, calculates points, stores result, and broadcasts.
 */
export async function submitAnswer(
  lobbyId: string, 
  userId: string, // Changed: Now accepts user_id, not game_players.id
  questionId: string, 
  answer: string, 
  timeTakenMs: number,
  round: number,
  questionOrder: number
) {
  const supabase = await createClient();

  // 0. Look up the actual game_players.id from user_id
  const { data: playerRecord, error: playerError } = await supabase
    .from('game_players')
    .select('id, score, current_question')
    .eq('lobby_id', lobbyId)
    .eq('user_id', userId)
    .single();

  if (playerError || !playerRecord) {
    console.error('[GAME] Player lookup failed:', playerError);
    return { error: 'Player not found in lobby' };
  }

  const playerId = playerRecord.id; // The actual game_players primary key

  // 1. Fetch Question Correctness
  const { data: question, error: qError } = await supabase
    .from('quiz_questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single();

  if (qError || !question) return { error: 'Invalid question' };

  // Normalize both answers: handle non-string values, strip parentheses, trim, uppercase
  const normalizeAnswer = (ans: unknown): string => {
    if (ans === null || ans === undefined) return '';
    const str = typeof ans === 'string' ? ans : String(ans);
    return str.replace(/[()]/g, '').trim().toUpperCase();
  };
  
  const isCorrect = normalizeAnswer(question.correct_answer) === normalizeAnswer(answer);
  const points = calculatePoints(isCorrect, timeTakenMs);

  // 2. Store Answer
  const { error: ansError } = await supabase
    .from('game_answers')
    .insert({
      lobby_id: lobbyId,
      player_id: playerId, // Now using correct game_players.id
      question_id: questionId,
      round,
      question_order: questionOrder,
      answer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_earned: points
    });

  if (ansError) {
    console.error('[GAME] Answer insert failed:', ansError);
    return { error: ansError.message };
  }

  // 3. Update Player Score & Progress
  const newScore = (playerRecord.score || 0) + points;
  const newQ = (playerRecord.current_question || 0) + 1;
  
  await supabase
    .from('game_players')
    .update({ score: newScore, current_question: newQ })
    .eq('id', playerId);
    
  // 4. Broadcast Answer & Score Update
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'answer_submitted',
    payload: { 
      playerId: userId, // Keep using userId for client consistency
      questionIndex: newQ - 1,
      score: newScore,
      pointsEarned: points
    }
  });

  return { success: true, isCorrect, points, correctAnswer: String(question.correct_answer) };
}

/**
 * Marks the game as finished and handles rewards if needed.
 * This is usually called by the host or triggered when everyone finishes.
 * For Phase 1 Duel: Triggered by client when they finish 10 questions.
 */
export async function finishGame(lobbyId: string) {
  const supabase = await createClient();
  
  await supabase
    .from('game_lobbies')
    .update({ 
      status: 'finished', 
      finished_at: new Date().toISOString() 
    })
    .eq('id', lobbyId);

  // Broadcast finish
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'game_finished',
    payload: { status: 'finished' }
  });
  
  // Note: Coin awards are handled separately via awardCoins
  // usually called by the client showing the Results screen
}
