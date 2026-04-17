'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { GCoinIcon } from '@/components/icons/g-coin-icon';
import { cn } from '@/lib/utils';

interface LowCoinsWarningProps {
  coins: number;
  threshold?: number;
  className?: string;
}

/**
 * Subtle low-coins warning banner.
 * Shows when coins ≤ threshold (default 15).
 * Not aggressive — just awareness to prevent surprise lockout.
 */
export function LowCoinsWarning({ coins, threshold = 15, className }: LowCoinsWarningProps) {
  if (coins > threshold) return null;

  const isCritical = coins < 10;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-sm",
          isCritical
            ? "bg-red-500/8 border-red-500/20"
            : "bg-amber-500/8 border-amber-500/15",
          className
        )}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* Pulsing icon */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isCritical ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <GCoinIcon className="h-4 w-4" />
          )}
        </motion.div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-xs font-medium",
            isCritical ? "text-red-300" : "text-amber-300"
          )}>
            {coins === 0
              ? "No coins — Win a Duel to restock!"
              : isCritical
                ? `Only ${coins} coins left — Win Duel to restock.`
                : `Low balance (${coins}) — Win Duel to earn more.`
            }
          </span>
        </div>

        {/* Coin count badge */}
        <div className={cn(
          "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
          isCritical
            ? "bg-red-500/15 text-red-400"
            : "bg-amber-500/15 text-amber-400"
        )}>
          🪙 {coins}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
