'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { useThemeStore } from '@/lib/stores/theme';
import { getLeague, getLeagueProgress, getNextLeague } from '@/lib/game/leagues';
import { gameAudio } from '@/lib/game/audio';
import { MuteToggle } from '@/components/game/mute-toggle';
import { Swords, Shield, Trophy, Info } from 'lucide-react';
import { GCoinIcon } from '@/components/icons/g-coin-icon';
import { GavelIcon } from '@/components/icons/gavel-icon';
import { cn } from '@/lib/utils';

interface DuelPregameProps {
  onBattle: () => void;
}

/**
 * Clash Royale-style pre-game screen.
 * Shows arena badge, league info, stats, and a BIG 3D "BATTLE" button.
 */
export function DuelPregame({ onBattle }: DuelPregameProps) {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [pressed, setPressed] = useState(false);
  const [searching, setSearching] = useState(false);

  const xp = profile?.xp ?? 0;
  const coins = profile?.total_coins ?? 500;
  const league = getLeague(xp);
  const progress = getLeagueProgress(xp);
  const nextLeague = getNextLeague(xp);
  const { isDarkMode } = useThemeStore();

  const handleBattle = () => {
    gameAudio?.playSelect();
    setSearching(true);
    // Small delay for the "searching" feel
    setTimeout(() => {
      onBattle();
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Mute toggle (top right) */}
      <div className="absolute top-4 right-4 z-10">
        <MuteToggle />
      </div>

      {/* Back button (top left) */}
      <button
        onClick={() => router.push('/arena')}
        className="absolute top-4 left-[72px] lg:left-20 z-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Arena
      </button>

      {/* Main Content */}
      <motion.div
        className="flex flex-col items-center gap-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Arena Badge */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full arena-glow"
            style={{
              boxShadow: isDarkMode
                ? `0 0 60px 15px ${league.color}30, 0 0 100px 30px ${league.color}15`
                : '0 0 60px 15px rgba(139,92,246,0.3), 0 0 100px 30px rgba(139,92,246,0.15)',
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Badge circle */}
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center border-4 relative overflow-hidden"
            style={isDarkMode ? {
              background: league.gradient,
              borderColor: league.color,
              boxShadow: `0 0 30px ${league.color}50, inset 0 -4px 10px rgba(0,0,0,0.3)`,
            } : {
              background: '#ffffff',
              borderColor: '#8b5cf6',
              boxShadow: '0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)',
            }}
          >
            <league.Icon className="h-16 w-16 drop-shadow-xl z-10 text-white" />
            {/* Inner light reflection */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/15 to-transparent rounded-t-full" />
          </div>
        </motion.div>

        {/* League Name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-black text-foreground">{league.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">{league.description}</p>

          {/* XP Progress */}
          {nextLeague && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <GavelIcon className="h-3 w-3" style={{ color: league.color }} />
              <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: league.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{xp} Gavels</span>
            </div>
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <GCoinIcon className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-xs font-bold text-slate-200 tabular-nums">{coins}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">1v1 Ranked</span>
          </div>
        </motion.div>

        {/* Mode Info */}
        <motion.div
          className="flex items-center gap-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="flex items-center gap-1">
            <Swords className="h-3.5 w-3.5" />
            10 Questions
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            Free Entry
          </span>
          <span className="flex items-center gap-1">
            <GavelIcon className="h-3.5 w-3.5 text-purple-400" />
            +Gavels
          </span>
        </motion.div>

        {/* ═══════ THE BATTLE BUTTON ═══════ */}
        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring', damping: 12 }}
        >
          <button
            onClick={handleBattle}
            disabled={searching}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl font-black text-2xl uppercase tracking-[0.15em]",
              "transition-all duration-100 select-none outline-none",
              searching && "pointer-events-none"
            )}
            style={{
              height: 72,
              color: '#000',
              // 3D depth effect: the "bottom" shadow creates the illusion of depth
              // When pressed, shadow shrinks and button moves down
              transform: pressed ? 'translateY(4px)' : 'translateY(0)',
              boxShadow: pressed
                ? '0 2px 0 0 #4c1d95, inset 0 -2px 4px rgba(0,0,0,0.2)'
                : '0 6px 0 0 #4c1d95, 0 8px 20px rgba(124, 58, 237, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1)',
              background: pressed
                ? 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)',
            }}
          >
            {/* Top highlight (3D effect) */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            />

            {/* Button content */}
            <div className="relative flex items-center justify-center gap-3 z-10 text-white">
              {searching ? (
                <>
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-white/80"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-white/90 text-lg drop-shadow-md">Searching...</span>
                </>
              ) : (
                <>
                  <Swords className="h-7 w-7" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Battle</span>
                </>
              )}
            </div>

            {/* Shine sweep */}
            {!pressed && !searching && (
              <motion.div
                className="absolute inset-0 -skew-x-12 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  width: '35%',
                }}
                animate={{ x: ['-120%', '400%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              />
            )}
          </button>
        </motion.div>

        {/* Win/Loss Info */}
        <motion.div
          className="relative flex items-center justify-center group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help p-1 hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
            <span className="underline decoration-dashed underline-offset-4 opacity-80">Hover to see Win / Loss Rewards</span>
          </div>
          
          {/* Tooltip */}
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-48 rounded-xl bg-card border border-white/10 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white/5 px-3 py-1.5 border-b border-white/5 text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Match Stakes</span>
            </div>
            
            <div className="p-3 flex flex-col gap-2">
              {/* Win Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-400">If you Win:</span>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-green-400">+15 🪙</span>
                  <span className="text-purple-400">+25 Gavels</span>
                </div>
              </div>
              
              <div className="w-full h-px bg-white/5" />
              
              {/* Lose Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-400">If you Lose:</span>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-red-400">-7 🪙</span>
                  <span className="text-purple-400">+5 Gavels</span>
                </div>
              </div>
            </div>
            
            {/* Tooltip arrow */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-card border-t border-l border-white/10 rotate-45" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
