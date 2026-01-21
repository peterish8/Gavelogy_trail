'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Swords, Users, Trophy, Zap, Info } from 'lucide-react';
import { AppHeader } from "@/components/app-header";
import { DottedBackground } from "@/components/DottedBackground";

export default function ArenaPage() {
  const router = useRouter();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <DottedBackground />
      <AppHeader />
      
      <main className="container py-10 max-w-5xl mx-auto px-4 grow flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            GameArena
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Real-time legal battles. Test your knowledge against peers and bots.
          </motion.p>
        </div>

        {/* Modes Grid */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Duel Mode */}
          <motion.div variants={item} className="h-full">
            <Card className="h-full border-primary/20 bg-card hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden group flex flex-col">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Swords className="h-8 w-8" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                  </div>
                </div>
                <CardTitle className="text-2xl">Head-to-Head Duel</CardTitle>
                <CardDescription>
                  1v1 Rapid Fire • 10 Questions
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 grow">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span>Speed bonuses apply (answer fast!)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Trophy className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span>Winner takes 50 coins</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Users className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>Instant matchmaking ( &lt; 10s )</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-6">
                <Button 
                  size="lg" 
                  className="w-full text-lg font-semibold shadow-lg shadow-primary/20"
                  onClick={() => router.push('/arena/lobby?mode=duel')}
                >
                  Enter Arena
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Arena Mode (Coming Soon) */}
          <motion.div variants={item} className="h-full">
            <Card className="h-full opacity-75 border-dashed relative overflow-hidden flex flex-col">
               {/* Coming Soon Overlay */}



              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    Phase 2
                  </div>
                </div>
                <CardTitle className="text-2xl text-muted-foreground">Battle Royale</CardTitle>
                <CardDescription>
                  5-Player Elimination • 4 Rounds
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 grow grayscale opacity-60">
                 <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <Zap className="h-4 w-4" />
                    <span>Survival of the fittest</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <Trophy className="h-4 w-4" />
                    <span>Top 3 prizes (up to 100 coins)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg border">
                    <Users className="h-4 w-4" />
                    <span>Massive multiplayer chaos</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-6">
                <Button disabled variant="secondary" className="w-full cursor-not-allowed">
                  Under Construction
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
