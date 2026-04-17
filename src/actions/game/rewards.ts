'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateDuelXP, calculateDuelCoins, calculateCasualCoins } from '@/lib/game/economy';
import { getLeague } from '@/lib/game/leagues';

/**
 * Awards XP + Coins for a DUEL match.
 * XP always goes up. Coins can go negative (floored at 0 in DB).
 */
export async function awardDuelResults(
  userId: string,
  lobbyId: string,
  rank: number,
  correctAnswers: number = 0,
  totalQuestions: number = 10,
  matchesToday: number = 0
) {
  const supabase = await createClient();
  const isWinner = rank === 1;
  
  const xpEarned = calculateDuelXP(isWinner, correctAnswers, totalQuestions, matchesToday);
  const coinsChange = calculateDuelCoins(isWinner);

  let finalXpEarned = xpEarned;

  // Enforce League Floor/Checkpoints
  if (finalXpEarned < 0) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (dbUser) {
      const currentXp = dbUser.total_xp;
      const currentLeague = getLeague(currentXp);
      
      // If the deduction pushes them below the league threshold
      if (currentXp + finalXpEarned < currentLeague.xpRequired) {
        // Cap the deduction to exactly reach the floor
        finalXpEarned = currentLeague.xpRequired - currentXp; 
        
        // Ensure we don't accidentally add XP if they were somehow below floor
        if (finalXpEarned > 0) finalXpEarned = 0; 
      }
    }
  }

  // Call RPC for atomic operation (handles idempotency)
  const { error } = await supabase.rpc('award_game_results', {
    p_user_id: userId,
    p_lobby_id: lobbyId,
    p_xp_earned: finalXpEarned,
    p_coins_change: coinsChange
  });

  if (error) {
    if (error.message?.includes('already awarded')) {
      return { error: 'Already awarded' };
    }
    console.error('[REWARDS] Award failed:', error);
    return { error: error.message };
  }

  return { success: true, xpEarned: finalXpEarned, coinsChange };
}

/**
 * Awards Coins for a CASUAL mode match (Speed Court, Battle Royale, Tag Team).
 * No XP earned from casual modes.
 */
export async function awardCasualResults(
  userId: string,
  lobbyId: string,
  isWinner: boolean
) {
  const supabase = await createClient();
  
  const coinsChange = calculateCasualCoins(isWinner);

  const { error } = await supabase.rpc('award_game_results', {
    p_user_id: userId,
    p_lobby_id: lobbyId,
    p_xp_earned: 0, // No XP from casual modes
    p_coins_change: coinsChange
  });

  if (error) {
    if (error.message?.includes('already awarded')) {
      return { error: 'Already awarded' };
    }
    return { error: error.message };
  }

  return { success: true, coinsChange };
}

/**
 * Deduct entry fee for casual mode.
 * Returns false if insufficient coins.
 */
export async function deductEntryFee(userId: string, lobbyId: string, fee: number = 10) {
  const supabase = await createClient();

  // Check balance first
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('total_coins')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) return { error: 'User not found' };
  if (userData.total_coins < fee) return { error: 'Not enough coins', insufficientFunds: true };

  // Deduct
  const { error } = await supabase
    .from('users')
    .update({ total_coins: userData.total_coins - fee })
    .eq('id', userId);

  if (error) return { error: error.message };
  return { success: true, newBalance: userData.total_coins - fee };
}

/**
 * Fetch XP + Coin balance for a user.
 */
export async function fetchEconomyBalance(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('xp, total_coins')
    .eq('id', userId)
    .single();

  if (error || !data) return { xp: 0, coins: 500 };
  return { xp: data.xp ?? 0, coins: data.total_coins ?? 500 };
}
