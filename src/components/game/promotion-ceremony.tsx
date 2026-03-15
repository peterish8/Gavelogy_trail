'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type League } from '@/lib/game/leagues';
import { gameAudio } from '@/lib/game/audio';
import confetti from 'canvas-confetti';

interface PromotionCeremonyProps {
  show: boolean;
  newLeague: League;
  onComplete: () => void;
}

/**
 * League Promotion Ceremony — the biggest retention hook.
 * Freezes screen, badge enlarges, glow burst, fanfare, celebration text.
 * Duration: ~3 seconds total.
 */
export function PromotionCeremony({ show, newLeague, onComplete }: PromotionCeremonyProps) {
  const [phase, setPhase] = useState<'enter' | 'glow' | 'text' | 'exit'>('enter');

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!show) return;

    // Phase 1: Badge enters (0ms)
    setPhase('enter');
    gameAudio?.playLevelUp();

    // Phase 2: Glow burst (600ms)
    const t1 = setTimeout(() => {
      setPhase('glow');
      // Confetti explosion
      confetti({
        particleCount: 200,
        spread: 100,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.45 },
        colors: [newLeague.color, '#fbbf24', '#ffffff', '#a855f7'],
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: [newLeague.color, '#fbbf24'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: [newLeague.color, '#fbbf24'],
        });
      }, 300);
    }, 600);

    // Phase 3: Show text (1200ms)
    const t2 = setTimeout(() => setPhase('text'), 1200);

    // Phase 4: Exit (3500ms)
    const t3 = setTimeout(() => {
      setPhase('exit');
      setTimeout(handleComplete, 500);
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [show, newLeague, handleComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-200 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.88 }}
            exit={{ opacity: 0 }}
          />

          {/* Radial glow behind badge */}
          <motion.div
            className="absolute"
            style={{
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${newLeague.color}30 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              phase === 'glow' || phase === 'text' || phase === 'exit'
                ? { scale: [0, 2, 1.5], opacity: [0, 0.8, 0.4] }
                : { scale: 0, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Rotating ring */}
          <motion.div
            className="absolute"
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: `2px solid ${newLeague.color}40`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* League Badge (BIG) */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 200,
                duration: 0.8,
              }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 60px 20px ${newLeague.color}50` }}
                animate={
                  phase === 'glow' || phase === 'text'
                    ? { scale: [1, 1.3, 1.1], opacity: [0.5, 1, 0.7] }
                    : {}
                }
                transition={{ duration: 1, ease: 'easeOut' }}
              />

              {/* Badge circle */}
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center border-4"
                style={{
                  background: newLeague.gradient,
                  borderColor: newLeague.color,
                  boxShadow: `0 0 40px ${newLeague.color}60, inset 0 0 20px rgba(255,255,255,0.1)`,
                }}
              >
                <newLeague.Icon className="h-16 w-16 drop-shadow-2xl text-white" />
              </div>
            </motion.div>

            {/* "PROMOTED" text */}
            <AnimatePresence>
              {(phase === 'text' || phase === 'exit') && (
                <motion.div
                  className="mt-6 flex flex-col items-center gap-2"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.span
                    className="text-xs font-bold uppercase tracking-[0.3em] text-white/60"
                    initial={{ letterSpacing: '0.5em', opacity: 0 }}
                    animate={{ letterSpacing: '0.3em', opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    Promoted To
                  </motion.span>

                  <motion.h2
                    className="text-3xl md:text-4xl font-black uppercase tracking-wider text-white"
                    style={{ textShadow: `0 0 30px ${newLeague.color}80` }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  >
                    {newLeague.name}
                  </motion.h2>

                  <motion.p
                    className="text-sm text-white/40 italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    &ldquo;{newLeague.description}&rdquo;
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Floating particles */}
          {(phase === 'glow' || phase === 'text') && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? newLeague.color : '#fbbf24',
                    left: `${10 + Math.random() * 80}%`,
                    bottom: 0,
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{
                    y: -(200 + Math.random() * 400),
                    opacity: [0, 1, 0],
                    x: (Math.random() - 0.5) * 100,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
