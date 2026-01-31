'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';
import { subscribeToLobby, unsubscribeFromLobby } from '@/lib/game/realtime';
import { GameErrorBoundary } from '@/components/game/error-boundary';
import DuelGameScreen from '@/components/game/duel-game-screen';
import GameResults from '@/components/game/results-screen';
// AppHeader import removed
import { DottedBackground } from "@/components/DottedBackground";

export default function GamePage() {
  const router = useRouter();
  const { lobbyId, status } = useGameStore();

  // Redirect if no active game
  useEffect(() => {
    if (!lobbyId) {
      router.push('/arena');
    }
  }, [lobbyId, router]);

  // Ensure subscription stays active (in case of page refresh if we persisted lobbyId)
  useEffect(() => {
    if (!lobbyId) return;
    const channel = subscribeToLobby(lobbyId); 
    return () => { unsubscribeFromLobby(channel); };
  }, [lobbyId]);

  if (!lobbyId) return null;

  return (
    <GameErrorBoundary>
      <div className="min-h-screen relative flex flex-col">
        <DottedBackground />
        {/* AppHeader removed */}
        
        <main className="container flex grow flex-col py-6 mx-auto">
          {status === 'active' && <DuelGameScreen />}
          {status === 'finished' && <GameResults />}
        </main>
      </div>
    </GameErrorBoundary>
  );
}
