import { BookOpen, ScrollText, Scale, Landmark, Star, Award, Crown } from 'lucide-react';
import { GavelIcon } from '@/components/icons/gavel-icon';

export interface League {
  level: number;
  name: string;
  Icon: any;             // React component for the SVG icon
  xpRequired: number;    // XP threshold to enter this league
  color: string;         // For UI theming
  gradient: string;      // CSS gradient for badges
  description: string;   // Flavor text
}

export const LEAGUES: League[] = [
  { 
    level: 1, name: 'Law Student', Icon: BookOpen, 
    xpRequired: 0, color: '#94a3b8', 
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    description: 'Every legend starts here' 
  },
  { 
    level: 2, name: 'Intern', Icon: ScrollText, 
    xpRequired: 150, color: '#a78bfa', 
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    description: 'Learning the ropes' 
  },
  { 
    level: 3, name: 'Advocate', Icon: Scale, 
    xpRequired: 350, color: '#60a5fa', 
    gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    description: 'Justice is your weapon' 
  },
  { 
    level: 4, name: 'Senior Advocate', Icon: Landmark, 
    xpRequired: 650, color: '#34d399', 
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    description: 'Respected in the court' 
  },
  { 
    level: 5, name: 'District Judge', Icon: GavelIcon, 
    xpRequired: 1000, color: '#fbbf24', 
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
    description: 'The gavel speaks' 
  },
  { 
    level: 6, name: 'High Court Judge', Icon: Star, 
    xpRequired: 1400, color: '#f97316', 
    gradient: 'linear-gradient(135deg, #ea580c, #f97316)',
    description: 'Architect of precedent' 
  },
  { 
    level: 7, name: 'Supreme Court Judge', Icon: Award, 
    xpRequired: 1900, color: '#ef4444', 
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    description: 'Guardian of the Constitution' 
  },
  { 
    level: 8, name: 'Chief Justice', Icon: Crown, 
    xpRequired: 2600, color: '#eab308', 
    gradient: 'linear-gradient(135deg, #ca8a04, #fde047)',
    description: 'The Apex — Crown of Law' 
  },
];

/**
 * Get the league for a given XP amount.
 */
export function getLeague(xp: number): League {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].xpRequired) return LEAGUES[i];
  }
  return LEAGUES[0];
}

/**
 * Get the next league (for progress display).
 * Returns null if already at max league.
 */
export function getNextLeague(xp: number): League | null {
  const current = getLeague(xp);
  if (current.level >= LEAGUES.length) return null;
  return LEAGUES[current.level]; // level is 1-indexed, array is 0-indexed
}

/**
 * Get progress percentage toward the next league (0-100).
 */
export function getLeagueProgress(xp: number): number {
  const current = getLeague(xp);
  const next = getNextLeague(xp);
  if (!next) return 100; // Already at max

  const range = next.xpRequired - current.xpRequired;
  const progress = xp - current.xpRequired;
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Check if XP amount crosses into a new league compared to previous XP.
 */
export function didLevelUp(oldXp: number, newXp: number): boolean {
  return getLeague(newXp).level > getLeague(oldXp).level;
}

/**
 * Get XP needed for next league.
 */
export function xpToNextLeague(xp: number): number {
  const next = getNextLeague(xp);
  if (!next) return 0;
  return next.xpRequired - xp;
}
