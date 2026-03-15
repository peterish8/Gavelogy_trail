'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getModeConfig, type GameMode } from '@/lib/game/economy';
import { useEffect } from 'react';
import { gameAudio } from '@/lib/game/audio';

interface MatchIntroProps {
  mode: GameMode;
  show: boolean;
  onComplete: () => void;
}

/**
 * Match start animation overlay.
 * 0.8s dramatic intro before the game screen loads.
 */
export function MatchIntro({ mode, show, onComplete }: MatchIntroProps) {
  const config = getModeConfig(mode);

  useEffect(() => {
    if (show) {
      gameAudio?.playClick();
      // Auto-dismiss after animation
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Dark overlay */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
          />

          {/* Center content */}
          <motion.div
            className="relative flex flex-col items-center gap-4 z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Mode emoji (large) */}
            <motion.span
              className="text-7xl drop-shadow-2xl"
              initial={{ scale: 3, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {config.emoji}
            </motion.span>

            {/* Mode name */}
            <motion.h2
              className="text-3xl font-black uppercase tracking-widest text-white"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{ textShadow: `0 0 30px ${config.color}60` }}
            >
              {config.name}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-sm text-white/60 font-medium uppercase tracking-wider"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              {config.subtitle}
            </motion.p>

            {/* Loading pulse */}
            <motion.div
              className="mt-4 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${config.color}10 0%, transparent 60%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
