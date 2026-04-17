'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchGameQuestions } from './questions';
import { deductEntryFee } from './rewards';
import { getCasualEntryFee } from '@/lib/game/economy';

/**
 * Creates a new game lobby and adds the creator as the first player.
 */
export async function createLobby(mode: 'duel' | 'arena' | 'tagteam', userId: string, displayName: string, avatarUrl?: string) {
  const supabase = await createClient();
  
  // 1. Create Lobby
  const { data: lobby, error: lobbyError } = await supabase
    .from('game_lobbies')
    .insert({
      mode,
      status: 'waiting',
      question_ids: [], // Empty initially
      max_rounds: mode === 'duel' ? 1 : mode === 'arena' ? 4 : 1
    })
    .select('id')
    .single();

  if (lobbyError) return { error: lobbyError.message };

  // 2. Add Host Player
  const { error: playerError } = await supabase
    .from('game_players')
    .insert({
      lobby_id: lobby.id,
      user_id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      is_bot: false
    });

  if (playerError) {
    // Cleanup lobby if player creation fails
    await supabase.from('game_lobbies').delete().eq('id', lobby.id);
    return { error: playerError.message };
  }

  return { success: true, lobbyId: lobby.id };
}

/**
 * Joins an existing lobby.
 */
export async function joinLobby(lobbyId: string, userId: string, displayName: string, avatarUrl?: string) {
  const supabase = await createClient();

  // Check if lobby is open
  const { data: lobby, error: checkError } = await supabase
    .from('game_lobbies')
    .select('status')
    .eq('id', lobbyId)
    .single();

  if (checkError || !lobby) return { error: 'Lobby not found' };
  if (lobby.status !== 'waiting') return { error: 'Game already started' };

  // Add Player
  const { error: joinError } = await supabase
    .from('game_players')
    .insert({
      lobby_id: lobbyId,
      user_id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      is_bot: false
    });

  if (joinError) {
      if (joinError.code === '23505') { // Unique violation
          return { success: true }; // Already in lobby, treat as success
      }
      return { error: joinError.message };
  }

  // Broadcast join event
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'player_joined',
    payload: { player: { id: userId, displayName, isBot: false, score: 0 } }
  });

  return { success: true };
}

/**
 * Starts the game atomically.
 * Prevents race conditions using 'started_at' check.
 */
export async function startGameIfReady(lobbyId: string) {
  const supabase = await createClient();

  // 1. Fetch Lobby with Lock check (update returning *)
  // We optimistically try to set status='active' where status='waiting'
  // If no rows updated, it means it's already active or finished.
  
  const { data: lobby, error: updateError } = await supabase
    .from('game_lobbies')
    .update({ 
      status: 'active', 
      started_at: new Date().toISOString() 
    })
    .eq('id', lobbyId)
    .eq('status', 'waiting')
    .select('mode')
    .single();

  if (updateError || !lobby) {
    // Already started or failed
    return { alreadyStarted: true };
  }

  // 1.5 Deduct entry fee for casual modes (arena, tagteam, speed_court)
  const casualModes = ['arena', 'tagteam', 'speed_court'];
  if (casualModes.includes(lobby.mode)) {
    const fee = getCasualEntryFee();
    // Fetch all real (non-bot) players in this lobby
    const { data: players } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('lobby_id', lobbyId)
      .eq('is_bot', false);

    if (players && players.length > 0) {
      for (const player of players) {
        if (!player.user_id) continue;
        const result = await deductEntryFee(player.user_id, lobbyId, fee);
        if (result.insufficientFunds) {
          // Revert lobby to waiting so player can see the error
          await supabase
            .from('game_lobbies')
            .update({ status: 'waiting', started_at: null })
            .eq('id', lobbyId);
          return { error: 'insufficient_funds', userId: player.user_id };
        }
      }
    }
  }

  // 2. Fetch Questions
  const questions = await fetchGameQuestions(lobby.mode as 'duel' | 'arena');
  const questionIds = questions.map(q => q.id);

  // 3. Update Lobby with Questions
  await supabase
    .from('game_lobbies')
    .update({ question_ids: questionIds })
    .eq('id', lobbyId);

  // 4. Broadcast Start
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'game_started',
    payload: { status: 'active', questions } // Send questions to clients
  });

  return { success: true, questions };
}

/**
 * Finds an open lobby or creates a new one.
 */
export async function findMatch(mode: 'duel' | 'arena' | 'tagteam', userId: string, displayName: string, avatarUrl?: string) {
  const supabase = await createClient();
  
  // Ignore lobbies older than 30 seconds (they are likely abandoned since bots auto-fill in 9s)
  const recentThreshold = new Date(Date.now() - 30 * 1000).toISOString();
  
  // 0. Check if user is ALREADY in a waiting lobby
  const { data: existingLobby } = await supabase
    .from('game_players')
    .select('lobby_id, game_lobbies!inner(status, mode, created_at)')
    .eq('user_id', userId)
    .eq('game_lobbies.status', 'waiting')
    .eq('game_lobbies.mode', mode)
    .gte('game_lobbies.created_at', recentThreshold)
    .single();

  if (existingLobby && existingLobby.game_lobbies) {
     // User is already waiting in a lobby. Return it.
     // We assume they created it or joined it previously.
     // To determine isCreator, we could check, but for UI 'false' is safer so we don't show Start button if not host.
     // Actually, let's just query if they are the first player to determine isCreator?
     // For now, let's just return success. The UI will reload players list and determine host status implicitly by order (if we rely on that)
     // or we can query it.
     
     // Let's check if they are the creator (first player)
     const { data: firstPlayer } = await supabase
       .from('game_players')
       .select('user_id')
       .eq('lobby_id', existingLobby.lobby_id)
       .order('joined_at', { ascending: true })
       .limit(1)
       .single();
       
     const isCreator = firstPlayer?.user_id === userId;
     
     return { success: true, lobbyId: existingLobby.lobby_id, isCreator };
  }
  
  // 1. Find open lobby
  const { data: lobbies } = await supabase
    .from('game_lobbies')
    .select('id')
    .eq('mode', mode)
    .eq('status', 'waiting')
    .gte('created_at', recentThreshold)
    .order('created_at', { ascending: true }) // FIFO
    .limit(1);
    
  if (lobbies && lobbies.length > 0) {
    const lobbyId = lobbies[0].id;
    // Join it
    const joinRes = await joinLobby(lobbyId, userId, displayName, avatarUrl);
    if (joinRes.error) return { error: joinRes.error };
    return { success: true, lobbyId, isCreator: false };
  }
  
  // 2. Create new
  const res = await createLobby(mode, userId, displayName, avatarUrl);
  if (res.error) return { error: res.error };
  return { success: true, lobbyId: res.lobbyId, isCreator: true };
}

/**
 * Adds a bot to the lobby.
 */
export async function addBot(lobbyId: string, botProfile: { displayName: string, avatarUrl?: string }) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('game_players')
    .insert({
      lobby_id: lobbyId,
      display_name: botProfile.displayName,
      avatar_url: botProfile.avatarUrl,
      is_bot: true,
      user_id: null
    });

  if (error) return { error: error.message };

  // Generate fake ID for consistent referencing in UI
  const fakeBotId = `bot-${Date.now()}`; 

  // Broadcast join event
  const channel = supabase.channel(`game-lobby:${lobbyId}`);
  await channel.send({
    type: 'broadcast',
    event: 'player_joined',
    payload: { 
      player: { 
        id: fakeBotId, 
        displayName: botProfile.displayName, 
        avatarUrl: botProfile.avatarUrl,
        isBot: true, 
        score: 0,
        currentQuestion: 0 
      }  
    }
  });

  return { success: true };
}
