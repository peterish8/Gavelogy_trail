'use client';

import { useState } from 'react';
import { useArenaBackground } from '@/components/game/arena-background';
import { SpeedCourtConfig } from '@/components/game/speed-court-config';
import SpeedCourtScreen from '@/components/game/speed-court-screen';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MuteToggle } from '@/components/game/mute-toggle';

export default function SpeedCourtPage() {
  const router = useRouter();
  const arenaBackground = useArenaBackground();
  const [phase, setPhase] = useState<'config' | 'playing'>('config');
  const [questions, setQuestions] = useState<unknown[]>([]);

  const handleStart = (qs: unknown[]) => {
    setQuestions(qs);
    setPhase('playing');
  };

  return (
    <div className="min-h-screen relative arena-bg" style={arenaBackground}>

      {phase === 'config' && (
        <div className="min-h-screen flex flex-col">
          {/* Top Bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/5">
            <Button variant="ghost" size="sm" onClick={() => router.push('/arena')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Arena
            </Button>
            <span className="text-sm font-bold">⚡ Speed Court</span>
            <MuteToggle />
          </div>

          {/* Config */}
          <div className="flex-1 container mx-auto px-4 py-6">
            <SpeedCourtConfig onStart={handleStart} />
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <SpeedCourtScreen preloadedQuestions={questions} />
      )}
    </div>
  );
}
