'use client';

import { motion } from 'framer-motion';
import { LEAGUES, getLeague, getLeagueProgress, getNextLeague, type League } from '@/lib/game/leagues';
import { useThemeStore } from '@/lib/stores/theme';
import { cn } from '@/lib/utils';
import { Lock, Check } from 'lucide-react';
import { GavelIcon } from '@/components/icons/gavel-icon';

interface LeagueMapProps {
  xp: number;
  className?: string;
}

export function LeagueMap({ xp, className }: LeagueMapProps) {
  const currentLeague = getLeague(xp);
  const progress = getLeagueProgress(xp);
  const nextLeague = getNextLeague(xp);
  const { isDarkMode } = useThemeStore();

  return (
    <div className={cn("w-full", className)}>
      {/* League Path */}
      {/* 
        CRITICAL FIX FOR GLOW CLIPPING: 
        overflow-x-auto forces clipping on the top/bottom edges of the container. 
        We add py-8 -my-6 to artificially expand the clipping bounds upwards and downwards 
        so the circular glow doesn't hit a "rectangular ceiling". 
      */}
      <div className="flex items-center justify-between gap-1 px-4 py-8 -my-6 overflow-x-auto scrollbar-hide relative z-10">
        {LEAGUES.map((league, i) => {
          const isActive = league.level === currentLeague.level;
          const isPast = league.level < currentLeague.level;
          const isLocked = league.level > currentLeague.level;

          return (
            <LeagueNode
              key={league.level}
              league={league}
              isActive={isActive}
              isPast={isPast}
              isLocked={isLocked}
              isLast={i === LEAGUES.length - 1}
              xp={xp}
              progress={isActive ? progress : isPast ? 100 : 0}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </div>

      {/* Current League Info */}
      <motion.div
        className="mt-4 text-center relative z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <currentLeague.Icon className="h-8 w-8 text-white mt-1" />
          <div className="text-left">
            <span className="block text-sm font-bold" style={{ color: currentLeague.color }}>
              {currentLeague.name}
            </span>
            <span className="text-[11px] text-muted-foreground">{currentLeague.description}</span>
          </div>
          <div className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <GavelIcon className="h-3.5 w-3.5" style={{ color: currentLeague.color }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: currentLeague.color }}>{xp} Gavels</span>
          </div>
        </div>
        {nextLeague && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: currentLeague.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <GavelIcon className="h-3 w-3" /> {nextLeague.xpRequired - xp} Gavels to {nextLeague.name}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function LeagueNode({
  league,
  isActive,
  isPast,
  isLocked,
  isLast,
  progress,
  isDarkMode,
}: {
  league: League;
  isActive: boolean;
  isPast: boolean;
  isLocked: boolean;
  isLast: boolean;
  xp: number;
  progress: number;
  isDarkMode: boolean;
}) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      {/* Node */}
      <motion.div 
        className="relative flex flex-col items-center group shrink-0"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: league.level * 0.05 }}
      >
        {/* Glow - separate element, NOT constrained by circle bounds */}
        {isActive && (
          <div
            className="absolute arena-glow pointer-events-none"
            style={{
              width: '80px',
              height: '80px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '9999px',
              background: isDarkMode
                ? `radial-gradient(circle, ${league.color}35 0%, ${league.color}15 40%, transparent 70%)`
                : `radial-gradient(circle, #8b5cf650 0%, #8b5cf625 40%, transparent 70%)`,
              zIndex: 0,
            }}
          />
        )}
        {/* Circle */}
        <div
          className="relative w-10 h-10 flex items-center justify-center"
          style={isActive ? (isDarkMode ? {
            borderRadius: '9999px',
            border: `2px solid ${league.color}`,
            backgroundColor: league.color + '30',
            transform: 'scale(1.1)',
            zIndex: 1,
            boxShadow: `0 0 15px ${league.color}30, inset 0 0 10px rgba(0,0,0,0.5)`,
          } : {
            borderRadius: '9999px',
            border: '3px solid #8b5cf6',
            backgroundColor: '#ffffff',
            transform: 'scale(1.1)',
            zIndex: 1,
            boxShadow: '0 0 24px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.2)',
          }) : isPast ? (isDarkMode ? {
            borderRadius: '9999px',
            border: `2px solid ${league.color}80`,
            backgroundColor: league.color + '15',
          } : {
            borderRadius: '9999px',
            border: `2px solid ${league.color}80`,
            backgroundColor: '#ffffff',
          }) : (isDarkMode ? {} : {
            borderRadius: '9999px',
            border: '2px solid rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff',
          })}
        >
          {isPast ? (
            <Check className={cn("h-4 w-4", isDarkMode ? "text-white opacity-70" : "text-black opacity-50")} />
          ) : isLocked ? (
            <league.Icon className={cn("h-4 w-4", isDarkMode ? "text-white opacity-20" : "text-black opacity-20")} />
          ) : (
            <league.Icon className="h-5 w-5 drop-shadow-md text-white" />
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            "mt-1 text-[9px] font-medium text-center leading-tight max-w-[60px] truncate",
            isActive ? "font-bold" : "text-muted-foreground"
          )}
          style={{ color: isActive ? league.color : undefined }}
        >
          {league.name}
        </span>

        {/* Tooltip on hover */}
        {isLocked && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
            <div className="px-2 py-1 rounded-lg bg-popover border border-border text-[10px] text-muted-foreground whitespace-nowrap shadow-lg">
              {league.xpRequired} Gavels to unlock
            </div>
          </div>
        )}
      </motion.div>

      {/* Connector Line */}
      {!isLast && (
        <div className="flex-1 h-0.5 mx-1 rounded-full bg-white/10 overflow-hidden min-w-[8px]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: isPast ? '100%' : isActive ? `${progress}%` : '0%',
              backgroundColor: league.color + '80',
            }}
          />
        </div>
      )}
    </div>
  );
}
