'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/stores/game-store';
import { useAuthStore } from '@/lib/stores/auth';
import { awardCoins } from '@/actions/game/rewards';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Coins, Home, RotateCcw, Trophy, Frown } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GameResults() {
  const router = useRouter();
  const { lobbyId, players, reset } = useGameStore();
  const { profile } = useAuthStore();
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);

  // Sorting
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const myPlayer = players.find(p => p.id === profile?.id);
  const myScore = myPlayer?.score || 0;
  const myRank = sortedPlayers.findIndex(p => p.id === profile?.id) + 1;
  const winner = sortedPlayers[0];
  const isWinner = myRank === 1;

  useEffect(() => {
    if (!lobbyId || !profile) return;

    // Trigger Confetti if winner
    if (isWinner) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Award Coins
    const claimRewards = async () => {
       const res = await awardCoins(profile.id, lobbyId, myRank);
       if (res.success && res.amount) {
         setCoinsEarned(res.amount);
       }
    };
    claimRewards();
  }, [lobbyId, profile, myRank, isWinner]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 animate-in zoom-in duration-500">
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
         
         <CardContent className="space-y-6 text-center">
             <div className="space-y-1">
                 <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Your Score</p>
                 <p className="text-5xl font-black">{myScore}</p>
             </div>

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

             {/* Coin Reward */}
             {coinsEarned !== null && (
                 <motion.div 
                   className="flex items-center justify-center gap-2 text-yellow-500 font-bold text-xl bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                 >
                     <Coins className="h-6 w-6 fill-yellow-500" />
                     <span>+{coinsEarned} Coins Earned</span>
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
                 router.push('/arena'); // Or restart logic
             }}>
                 <RotateCcw className="mr-2 h-4 w-4" />
                 Play Again
             </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
