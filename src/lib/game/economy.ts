/**
 * Game Economy — Dual XP + Coins System
 * 
 * XP  = progression (never decreases, determines league)
 * Coins = spendable currency (used to enter casual modes)
 */

// ─── XP REWARDS ───────────────────────────────────────────

const DUEL_WIN_XP_BASE = 25;
const DUEL_WIN_XP_BONUS = 5;     // +5 max based on accuracy
const DUEL_LOSE_XP_BASE = -5;
const DUEL_LOSE_XP_BONUS = 5;    // Up to +5 to offset loss if they do well
const DAILY_XP_CAP_MATCHES = 10; // After this, XP halved
const XP_CAP_MULTIPLIER = 0.5;

/**
 * Calculate XP earned from a Duel match.
 * Win:  25 + round((correct/total) * 5) = 25–30
 * Lose: -5 + round((correct/total) * 5) = -5 to 0
 * After daily cap: halved.
 */
export function calculateDuelXP(
  isWinner: boolean,
  correctAnswers: number,
  totalQuestions: number,
  matchesToday: number = 0
): number {
  if (totalQuestions === 0) return 0;

  const accuracy = correctAnswers / totalQuestions;
  let xp: number;

  if (isWinner) {
    xp = DUEL_WIN_XP_BASE + Math.round(accuracy * DUEL_WIN_XP_BONUS);
  } else {
    xp = DUEL_LOSE_XP_BASE + Math.round(accuracy * DUEL_LOSE_XP_BONUS);
  }

  // Daily soft cap
  if (matchesToday >= DAILY_XP_CAP_MATCHES) {
    xp = Math.round(xp * XP_CAP_MULTIPLIER);
  }

  return xp;
}

// ─── COIN REWARDS ─────────────────────────────────────────

const DUEL_WIN_COINS = 15;
const DUEL_LOSE_COINS = -7;
const CASUAL_ENTRY_FEE = 10;
const CASUAL_WIN_REWARD = 20;
const CASUAL_LOSE_REWARD = 0;

/**
 * Calculate coins change from a Duel match.
 */
export function calculateDuelCoins(isWinner: boolean): number {
  return isWinner ? DUEL_WIN_COINS : DUEL_LOSE_COINS;
}

/**
 * Calculate coins change from a casual mode match.
 * Entry fee is deducted separately before the match.
 */
export function calculateCasualCoins(isWinner: boolean): number {
  return isWinner ? CASUAL_WIN_REWARD : CASUAL_LOSE_REWARD;
}

/**
 * Get entry fee for casual modes.
 */
export function getCasualEntryFee(): number {
  return CASUAL_ENTRY_FEE;
}

/**
 * Check if player can afford to enter a casual mode.
 */
export function canAffordCasual(coins: number): boolean {
  return coins >= CASUAL_ENTRY_FEE;
}

/**
 * Apply coins change with floor at 0.
 */
export function applyCoinsChange(currentCoins: number, change: number): number {
  return Math.max(0, currentCoins + change);
}

// ─── MODE CONFIG ──────────────────────────────────────────

export type GameMode = 'duel' | 'speed_court' | 'arena' | 'tagteam';

export interface ModeConfig {
  id: GameMode;
  name: string;
  emoji?: string;
  description: string;
  subtitle: string;
  costCoins: boolean;
  givesXP: boolean;
  givesCoins: boolean;
  playerCount: number;
  questionsPerRound: number;
  totalRounds: number;
  color: string;
  gradient: string;
}

export const GAME_MODES: ModeConfig[] = [
  {
    id: 'duel', name: 'Head-to-Head Duel',
    description: 'Ranked 1v1 battle. Win Gavels & coins, climb leagues.',
    subtitle: '1v1 Ranked • 10 Questions',
    costCoins: false, givesXP: true, givesCoins: true,
    playerCount: 2, questionsPerRound: 10, totalRounds: 1,
    color: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)'
  },
  {
    id: 'speed_court', name: 'Speed Court',
    description: '60 seconds. Answer fast. Beat your record.',
    subtitle: 'Solo Time Attack • 60s',
    costCoins: true, givesXP: false, givesCoins: true,
    playerCount: 1, questionsPerRound: 50, totalRounds: 1,
    color: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)'
  },
  {
    id: 'arena', name: 'Battle Royale',
    description: '5 players enter. 1 survives. Elimination rounds.',
    subtitle: '5 Players • 4 Rounds',
    costCoins: true, givesXP: false, givesCoins: true,
    playerCount: 5, questionsPerRound: 3, totalRounds: 4,
    color: '#ef4444', gradient: 'linear-gradient(135deg, #dc2626, #f87171)'
  },
  {
    id: 'tagteam', name: 'Tag Team',
    description: 'Team up 2v2. Combined score wins.',
    subtitle: '2v2 Teams • 10 Questions',
    costCoins: true, givesXP: false, givesCoins: true,
    playerCount: 4, questionsPerRound: 10, totalRounds: 1,
    color: '#06b6d4', gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)'
  }
];

export function getModeConfig(mode: GameMode): ModeConfig {
  return GAME_MODES.find(m => m.id === mode) || GAME_MODES[0];
}
