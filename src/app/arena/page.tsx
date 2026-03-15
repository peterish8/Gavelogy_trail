'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Lilita_One } from 'next/font/google';
import { GCoinIcon } from '@/components/icons/g-coin-icon';
import { Button } from '@/components/ui/button';
import { useArenaBackground } from "@/components/game/arena-background";
import { useAuthStore } from '@/lib/stores/auth';
import { LeagueMap } from '@/components/game/league-map';
import { ModeSelector } from '@/components/game/mode-selector';
import { MuteToggle } from '@/components/game/mute-toggle';
import { LowCoinsWarning } from '@/components/game/low-coins-warning';
import { gameAudio } from '@/lib/game/audio';

const lilita = Lilita_One({ weight: '400', subsets: ['latin'] });

export default function ArenaPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const arenaBackground = useArenaBackground();
  
  const xp = profile?.xp ?? 0;
  const coins = profile?.total_coins ?? 500;

  // Start background music when entering arena
  useEffect(() => {
    gameAudio?.startBgMusic();
    return () => { gameAudio?.stopBgMusic(); };
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col arena-bg" style={arenaBackground}>
      
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground gap-2"
          onClick={() => { gameAudio?.playClick(); router.push('/'); }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <h1 
          className={`text-2xl md:text-3xl font-black tracking-widest ${lilita.className}`}
          style={{ 
            fontFamily: `${lilita.style.fontFamily}, "Lilita One", Impact, sans-serif`,
            marginTop: '4px',
            color: '#ffffff',
            WebkitTextFillColor: '#ffffff',
            WebkitTextStroke: '1.5px #1e293b',
            filter: 'drop-shadow(0px 3px 0px #9333ea) drop-shadow(0px 4px 0px #1e293b) drop-shadow(0px 6px 4px rgba(0,0,0,0.6))',
            letterSpacing: '2px',
            position: 'relative',
            zIndex: 50
          }}
        >
          GAME ARENA
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <GCoinIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-bold text-slate-200 tabular-nums">{coins}</span>
          </div>
          <MuteToggle />
        </div>
      </div>

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
        
        {/* League Progression Map */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <LeagueMap xp={xp} />
        </motion.section>

        {/* Low Coins Warning */}
        <LowCoinsWarning coins={coins} />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Mode</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Game Mode Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ModeSelector coins={coins} />
        </motion.section>

      </main>

    </div>
  );
}
