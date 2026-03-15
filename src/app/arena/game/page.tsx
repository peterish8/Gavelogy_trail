'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';
import { subscribeToLobby, unsubscribeFromLobby } from '@/lib/game/realtime';
import { GameErrorBoundary } from '@/components/game/error-boundary';
import DuelGameScreen from '@/components/game/duel-game-screen';
import BattleRoyaleScreen from '@/components/game/battle-royale-screen';
import TagTeamScreen from '@/components/game/tag-team-screen';
import GameResults from '@/components/game/results-screen';
import { useArenaBackground } from "@/components/game/arena-background";

export default function GamePage() {
  const router = useRouter();
  const { lobbyId, status, mode } = useGameStore();
  const arenaBackground = useArenaBackground();

  // Redirect if no active game
  useEffect(() => {
    if (!lobbyId) {
      router.push('/arena');
    }
  }, [lobbyId, router]);

  // Ensure subscription stays active
  useEffect(() => {
    if (!lobbyId) return;
    const channel = subscribeToLobby(lobbyId); 
    return () => { unsubscribeFromLobby(channel); };
  }, [lobbyId]);

  if (!lobbyId) return null;

  return (
    <GameErrorBoundary>
      <div className="min-h-screen relative flex flex-col arena-bg" style={arenaBackground}>
        
        <main className="container flex grow flex-col py-6 mx-auto">
          {status === 'active' && mode === 'duel' && <DuelGameScreen />}
          {status === 'active' && mode === 'arena' && <BattleRoyaleScreen />}
          {status === 'active' && mode === 'tagteam' && <TagTeamScreen />}
          {status === 'finished' && <GameResults />}
        </main>
      </div>
    </GameErrorBoundary>
  );
}
