'use server';

import { createClient } from '@/lib/supabase/server';

interface AnswerData {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
  questionOrder: number;
}

/**
 * Batch submit ALL answers for a player at the end of the game.
 * This replaces the per-question submitAnswer approach.
 * 
 * ONE request to:
 *  1. Look up player record
 *  2. Insert all answers in batch
 *  3. Update player final score
 *  4. Broadcast score update
 */
export async function submitAllAnswers(
  lobbyId: string,
  userId: string,
  answers: AnswerData[],
  totalScore: number
) {
  const supabase = await createClient();

  // 1. Look up game_players.id from user_id (one query)
  const { data: playerRecord, error: playerError } = await supabase
    .from('game_players')
    .select('id')
    .eq('lobby_id', lobbyId)
    .eq('user_id', userId)
    .single();

  if (playerError || !playerRecord) {
    console.error('[GAME] Player lookup failed:', playerError);
    return { error: 'Player not found in lobby' };
  }

  const playerId = playerRecord.id;

  // 2. Batch insert all answers (one query)
  const answerRows = answers.map(a => ({
    lobby_id: lobbyId,
    player_id: playerId,
    question_id: a.questionId,
    round: 1,
    question_order: a.questionOrder,
    answer: a.answer,
    is_correct: a.isCorrect,
    time_taken_ms: a.timeTakenMs,
    points_earned: a.pointsEarned
  }));

  const { error: insertError } = await supabase
    .from('game_answers')
    .insert(answerRows);

  if (insertError) {
    console.error('[GAME] Batch answer insert failed:', insertError);
    return { error: insertError.message };
  }

  // 3. Update player final score + progress (one query)
  await supabase
    .from('game_players')
    .update({ 
      score: totalScore, 
      current_question: answers.length 
    })
    .eq('id', playerId);

  // 4. Broadcast final score (one broadcast)
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'answer_submitted',
    payload: {
      playerId: userId,
      questionIndex: answers.length - 1,
      score: totalScore,
      pointsEarned: totalScore,
      isFinal: true
    }
  });

  return { 
    success: true, 
    totalScore,
    correctCount: answers.filter(a => a.isCorrect).length,
    totalQuestions: answers.length
  };
}

/**
 * Marks the game as finished and handles rewards if needed.
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
}
