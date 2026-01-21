'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Awards coins to a user for game performance.
 * Calls a secure RPC function to ensure idempotency and atomicity.
 */
export async function awardCoins(userId: string, lobbyId: string, rank: number) {
  const supabase = await createClient();

  // Determine amount based on rank (Phase 1 rules)
  // Duel: Winner (Rank 1) = 50, Loser (Rank 2) = 10
  // Arena: 1st=100, 2nd=50, 3rd=25
  
  let amount = 10; // Participation default
  
  if (rank === 1) amount = 50;
  // We can expand logic for Arena later (rank 2 = 50? Wait, Duel winner is rank 1)
  
  // Call RPC
  const { error } = await supabase.rpc('award_coins', {
    p_user_id: userId,
    p_lobby_id: lobbyId,
    p_amount: amount
  });

  if (error) {
    if (error.message?.includes('already awarded')) {
      return { error: 'Coins already awarded' };
    }
    return { error: error.message };
  }

  return { success: true, amount };
}
