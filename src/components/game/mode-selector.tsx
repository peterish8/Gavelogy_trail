'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GAME_MODES, canAffordCasual, type GameMode, type ModeConfig } from '@/lib/game/economy';
import { gameAudio } from '@/lib/game/audio';
import { cn } from '@/lib/utils';
import { Lock, Zap, Users, Trophy, Swords, UserCheck } from 'lucide-react';
import { GavelIcon } from '@/components/icons/gavel-icon';
import { GCoinIcon } from '@/components/icons/g-coin-icon';

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  duel: <Swords className="h-7 w-7" />,
  speed_court: <Zap className="h-7 w-7" />,
  arena: <Trophy className="h-7 w-7" />,
  tagteam: <Users className="h-7 w-7" />,
};

interface ModeSelectorProps {
  coins: number;
  className?: string;
}

export function ModeSelector({ coins, className }: ModeSelectorProps) {
  const router = useRouter();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const handleSelect = (mode: ModeConfig) => {
    gameAudio?.playSelect();

    if (mode.costCoins && !canAffordCasual(coins)) {
      // Can't afford — show message
      return;
    }

    if (mode.id === 'duel') {
      router.push('/arena/duel');
    } else if (mode.id === 'speed_court') {
      router.push('/arena/speed-court');
    } else {
      router.push(`/arena/lobby?mode=${mode.id}`);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAME_MODES.map((mode) => {
          const canAfford = !mode.costCoins || canAffordCasual(coins);
          const isHovered = hoveredMode === mode.id;

          return (
            <ModeCard
              key={mode.id}
              mode={mode}
              canAfford={canAfford}
              coins={coins}
              isHovered={isHovered}
              onHover={() => setHoveredMode(mode.id)}
              onLeave={() => setHoveredMode(null)}
              onSelect={() => handleSelect(mode)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ModeCard({
  mode,
  canAfford,
  coins,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: {
  mode: ModeConfig;
  canAfford: boolean;
  coins: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // 3D tilt effect on mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    onLeave();
  };

  const isDuel = mode.id === 'duel';

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative group cursor-pointer rounded-2xl border overflow-hidden",
        "transition-all duration-300",
        canAfford
          ? "border-white/10 hover:border-white/25"
          : "border-white/5 opacity-60 cursor-not-allowed"
      )}
      style={{
        perspective: '1000px',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        boxShadow: isHovered && canAfford
          ? `0 0 30px ${mode.color}25, 0 10px 40px rgba(0,0,0,0.3)`
          : '0 2px 10px rgba(0,0,0,0.1)',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={onHover}
      onMouseLeave={handleMouseLeave}
      onClick={canAfford ? onSelect : undefined}
      whileTap={canAfford ? { scale: 0.98 } : undefined}
    >
      {/* Glass background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: mode.gradient }}
      />
      <div className="absolute inset-0 backdrop-blur-[1px] bg-background" />

      {/* Content */}
      <div className="relative p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="p-3 rounded-xl border border-white/10"
            style={{ background: `${mode.color}15` }}
          >
            <div style={{ color: mode.color }}>{MODE_ICONS[mode.id]}</div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isDuel && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-500 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                Ranked
              </span>
            )}
            {!isDuel && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: `${mode.color}15`, color: mode.color }}>
                Casual
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {mode.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{mode.subtitle}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          {mode.description}
        </p>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {mode.playerCount === 1 ? 'Solo' : `${mode.playerCount}P`}
            </span>
            {mode.givesXP && (
              <span className="flex items-center gap-1 text-purple-400">
                <GavelIcon className="h-3 w-3" />
                +Gavels
              </span>
            )}
            {mode.givesCoins && (
              <span className="flex items-center gap-1 text-slate-300">
                <GCoinIcon className="h-3 w-3" />
                +Coins
              </span>
            )}
          </div>

          {/* Entry Fee or Free */}
          {mode.costCoins ? (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold",
              canAfford
                ? "bg-yellow-500/10 text-yellow-500"
                : "bg-red-500/10 text-red-400"
            )}>
              {canAfford ? (
                <>
                  <GCoinIcon className="h-3 w-3" />
                  <span>10</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>Need 10 coins</span>
                </>
              )}
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-500">
              Free
            </span>
          )}
        </div>
      </div>

      {/* Locked Overlay */}
      {!canAfford && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] z-10">
          <Lock className="h-6 w-6 text-muted-foreground mb-2" />
          <span className="text-xs font-medium text-muted-foreground">Earn coins in Duel</span>
        </div>
      )}

      {/* Hover Glow Border */}
      <AnimatePresence>
        {isHovered && canAfford && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 1px ${mode.color}40` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
