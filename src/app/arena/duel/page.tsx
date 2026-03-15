'use client';

import { useRouter } from 'next/navigation';
import { useArenaBackground } from '@/components/game/arena-background';
import { DuelPregame } from '@/components/game/duel-pregame';

export default function DuelPage() {
  const router = useRouter();
  const arenaBackground = useArenaBackground();

  const handleBattle = () => {
    // Go to lobby/matchmaking for duel
    router.push('/arena/lobby?mode=duel');
  };

  return (
    <div className="min-h-screen relative arena-bg" style={arenaBackground}>
      <DuelPregame onBattle={handleBattle} />
    </div>
  );
}
