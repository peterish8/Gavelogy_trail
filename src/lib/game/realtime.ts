import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/stores/game-store';

/**
 * Subscribes to a game lobby channel using Supabase Realtime.
 * Handles events: player_joined, game_started, answer_submitted, game_finished.
 */
export const subscribeToLobby = (lobbyId: string) => {
  const channelName = `game-lobby:${lobbyId}`;
  const channel = supabase.channel(channelName);
  
  channel
    .on('broadcast', { event: 'player_joined' }, (payload) => {
      console.log('Realtime: player_joined', payload);
      const { player } = payload.payload; // Payload structure: { payload: { player: ... } }
      if (player) {
        useGameStore.getState().addPlayer(player);
      }
    })
    .on('broadcast', { event: 'game_started' }, (payload) => {
      console.log('Realtime: game_started', payload);
      const { status, questions } = payload.payload;
      if (status) {
        useGameStore.getState().setStatus(status);
        if (questions && Array.isArray(questions)) {
             useGameStore.getState().setQuestions(questions);
        }
      }
    })
    .on('broadcast', { event: 'answer_submitted' }, (payload) => {
      console.log('Realtime: answer_submitted', payload);
      const { playerId, questionIndex, score } = payload.payload;
      
      // Update player progress UI
      useGameStore.getState().updatePlayerProgress(playerId, {
        currentQuestion: questionIndex + 1,
        score: score // If we want to show live score
      });
    })
    .on('broadcast', { event: 'game_finished' }, (payload) => {
      console.log('Realtime: game_finished', payload);
      useGameStore.getState().setStatus('finished');
      // Could also load final standings here
    })
    .subscribe((status) => {
      console.log(`Realtime subscription status for ${channelName}:`, status);
      if (status === 'SUBSCRIBED') {
        // success
      }
      if (status === 'CHANNEL_ERROR') {
        useGameStore.getState().setError('Connection lost. Reconnecting...');
      }
    });
    
  return channel;
};

export const unsubscribeFromLobby = (channel: ReturnType<typeof supabase.channel>) => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
