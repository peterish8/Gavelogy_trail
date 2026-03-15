'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { useAuthStore } from '@/lib/stores/auth';
import { awardDuelResults, awardCasualResults } from '@/actions/game/rewards';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Home, RotateCcw, Trophy, Frown, TrendingUp, TrendingDown } from 'lucide-react';
import { GCoinIcon } from '@/components/icons/g-coin-icon';
import { GavelIcon } from '@/components/icons/gavel-icon';
import { getLeague, didLevelUp } from '@/lib/game/leagues';
import { gameAudio } from '@/lib/game/audio';
import { PromotionCeremony } from '@/components/game/promotion-ceremony';
import confetti from 'canvas-confetti';

export default function GameResults() {
  const router = useRouter();
  const { lobbyId, players, questions, mode, reset } = useGameStore();
  const { profile, checkAuth } = useAuthStore();
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [coinsChange, setCoinsChange] = useState<number | null>(null);
  const [showXp, setShowXp] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showLeague, setShowLeague] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);

  // Sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myPlayer = players.find(p => p.id === profile?.id);
  const myScore = myPlayer?.score || 0;
  const myRank = sortedPlayers.findIndex(p => p.id === profile?.id) + 1;
  const isWinner = myRank === 1;

  const totalQuestions = questions.length || 10;
  const estimatedCorrect = Math.min(totalQuestions, Math.round(myScore / 10));

  // Current state (before rewards)
  const currentXp = profile?.xp ?? 0;
  const currentLeague = getLeague(currentXp);
  const isDuel = mode === 'duel';

  useEffect(() => {
    if (!lobbyId || !profile) return;

    // Confetti + sounds
    if (isWinner) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      gameAudio?.playWin();
    } else {
      gameAudio?.playLose();
    }

    // Award rewards
    const claimRewards = async () => {
      if (isDuel) {
        const res = await awardDuelResults(profile.id, lobbyId, myRank, estimatedCorrect, totalQuestions);
        if (res.success) {
          setXpEarned(res.xpEarned || 0);
          setCoinsChange(res.coinsChange || 0);
        }
      } else {
        const res = await awardCasualResults(profile.id, lobbyId, isWinner);
        if (res.success) {
          setXpEarned(0); // No XP from casual
          setCoinsChange(res.coinsChange || 0);
        }
      }
      await checkAuth();
    };
    claimRewards();

    // Staggered reveal (breathing moments)
    const t1 = setTimeout(() => setShowXp(true), 800);
    const t2 = setTimeout(() => setShowCoins(true), 1400);
    const t3 = setTimeout(() => setShowLeague(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId, profile?.id, myRank, isWinner]);

  // After rewards
  const newXp = xpEarned !== null ? currentXp + xpEarned : currentXp;
  const newLeague = getLeague(newXp);
  const promoted = didLevelUp(currentXp, newXp);

  if (promoted && showLeague) {
    // Trigger ceremony instead of just playing sound
    if (!showPromotion) setShowPromotion(true);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in zoom-in duration-500">
      {/* League Promotion Ceremony */}
      <PromotionCeremony 
        show={showPromotion} 
        newLeague={newLeague} 
        onComplete={() => setShowPromotion(false)} 
      />

      <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl relative overflow-hidden bg-background/80 backdrop-blur-md">
         {/* Background Glow */}
         <div className={`absolute inset-0 opacity-10 ${isWinner ? 'bg-yellow-500' : 'bg-red-500'}`} />
         
         <CardHeader className="text-center pb-2">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="mx-auto mb-4 p-6 rounded-full bg-secondary/50 inline-flex"
            >
                {isWinner ? (
                    <Trophy className="h-16 w-16 text-yellow-500 drop-shadow-lg" />
                ) : (
                    <Frown className="h-16 w-16 text-muted-foreground" />
                )}
            </motion.div>
            <CardTitle className="text-4xl font-extrabold tracking-tight">
                {isWinner ? 'VICTORY!' : 'Defeat'}
            </CardTitle>
         </CardHeader>
         
         <CardContent className="space-y-5 text-center">
             <div className="space-y-1">
                 <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Your Score</p>
                 <p className="text-5xl font-black">{myScore}</p>
             </div>

             {/* Standings */}
             <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                 <h3 className="text-sm font-semibold opacity-70 mb-2">Final Standings</h3>
                 {sortedPlayers.map((p, idx) => (
                     <div key={p.id} className="flex items-center justify-between text-sm">
                         <div className="flex items-center gap-2">
                             <span className="font-bold w-4">{idx + 1}.</span>
                             <span>{p.displayName}</span>
                             {p.isBot && <span className="text-[10px] bg-muted px-1 rounded-sm">BOT</span>}
                         </div>
                         <span className="font-mono font-bold">{p.score}</span>
                     </div>
                 ))}
             </div>

             {/* Gavels Earned (staggered reveal) */}
             {showXp && xpEarned !== null && isDuel && (
                 <motion.div 
                   className="flex items-center justify-center gap-2 font-bold text-xl p-3 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-400"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                 >
                     <GavelIcon className="h-6 w-6" />
                     <span>+{xpEarned} Gavels</span>
                 </motion.div>
             )}

             {/* Coins Change (staggered reveal) */}
             {showCoins && coinsChange !== null && (
                 <motion.div 
                   className={`flex items-center justify-center gap-2 font-bold text-xl p-3 rounded-lg border ${
                     coinsChange >= 0 
                       ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' 
                       : 'text-red-500 bg-red-500/10 border-red-500/20'
                   }`}
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                 >
                     {coinsChange >= 0 ? (
                       <TrendingUp className="h-6 w-6" />
                     ) : (
                       <TrendingDown className="h-6 w-6" />
                     )}
                   <GCoinIcon className="h-6 w-6 text-slate-200" />
                   <span>{coinsChange >= 0 ? `+${coinsChange}` : coinsChange} Coins</span>
                 </motion.div>
             )}

             {/* League Badge (staggered reveal) */}
             {showLeague && xpEarned !== null && (
               <motion.div 
                 className="flex flex-col items-center gap-1"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
               >
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <newLeague.Icon className="h-4 w-4" />
                   <span className="font-semibold" style={{ color: newLeague.color }}>{newLeague.name}</span>
                   <span className="text-xs opacity-60">({newXp} Gavels)</span>
                 </div>
                 {promoted && (
                   <motion.span 
                     className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500"
                     initial={{ scale: 0 }} 
                     animate={{ scale: 1 }}
                   >
                     ⬆️ Promoted to {newLeague.name}!
                   </motion.span>
                 )}
               </motion.div>
             )}
         </CardContent>

         <CardFooter className="flex gap-4">
             <Button variant="outline" className="flex-1" onClick={() => {
                 reset();
                 router.push('/dashboard');
             }}>
                 <Home className="mr-2 h-4 w-4" />
                 Home
             </Button>
             <Button className="flex-1" onClick={() => {
                 reset();
                 router.push('/arena');
             }}>
                 <RotateCcw className="mr-2 h-4 w-4" />
                 Play Again
             </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
