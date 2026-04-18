'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { useGameStore } from '@/lib/stores/game-store';
import { findMatch, addBot, startGameIfReady } from '@/actions/game/matchmaking';
import { useLobbySync } from '@/lib/game/realtime';
import { generateBotPlayer } from '@/lib/game/bot-system';
import { Loader2, User, Play, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// AppHeader import removed
import { useArenaBackground } from "@/components/game/arena-background";

export default function LobbyPage() {
  const arenaBackground = useArenaBackground();
  return (
    <Suspense fallback={
      <div className="min-h-screen relative flex flex-col arena-bg" style={arenaBackground}>
        {/* AppHeader removed */}
        <main className="container flex grow items-center justify-center p-4 mx-auto">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    }>
      <LobbyContent arenaBackground={arenaBackground} />
    </Suspense>
  );
}

function LobbyContent({ arenaBackground }: { arenaBackground: React.CSSProperties }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'duel' | 'arena' | 'tagteam') || 'duel';
  
  const { profile } = useAuthStore();
  const { lobbyId, status, players, setLobbyId, setStatus, setPlayers, setQuestions, reset } = useGameStore();

  const [searching, setSearching] = useState(true);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [secondsWaiting, setSecondsWaiting] = useState(0);
  const [botJoinTime] = useState(9); // Fixed 9s wait time as requested

  // Matchmaking effect - ALWAYS search fresh
  const initialMatchRun = useRef(false);
  useEffect(() => {
    if (!profile) return;
    if (initialMatchRun.current) return;
    initialMatchRun.current = true;
    
    // Reset previous game state to ensure fresh matchmaking
    reset();

    // Show user immediately
    setPlayers([{ 
      id: profile.id, 
      displayName: profile.full_name || 'Player', 
      avatarUrl: profile.avatar_url || undefined,
      isBot: false, 
      score: 0, 
      currentQuestion: 0 
    }]);

    async function initMatch() {
       setSearching(true);
       try {
         const res = await findMatch(mode, profile!.id, profile!.full_name || 'Player', profile!.avatar_url || undefined);
         
         if (res.error) {
           setMatchingError(res.error);
           setSearching(false);
           return;
         }
         
         if (res.success && res.lobbyId) {
           setLobbyId(res.lobbyId);
           setIsHost(!!res.isCreator);
           setStatus('waiting');
           setSearching(false);

           // Players are loaded reactively via useLobbySync below
         }
       } catch {
         setMatchingError('Failed to join matchmaking.');
         setSearching(false);
       }
    }
    
    if (profile) {
      initMatch();
    }
  }, [profile, lobbyId, mode, setLobbyId, setPlayers, setStatus, reset]);

  // Reactive lobby sync via Convex (replaces Supabase realtime channel)
  useLobbySync(lobbyId as any);

  // Timer & Bot Logic
  useEffect(() => {
    if (!lobbyId || status !== 'waiting') return;
    
    const interval = setInterval(() => {
      setSecondsWaiting(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [lobbyId, status]);

  // Auto-Start Game when 2 players are present (Human or Bot)
  useEffect(() => {
    if (isHost && status === 'waiting' && players.length >= 2) {
       console.log("Auto-starting game with players:", players);
       
       // Call server and capture questions for host (broadcasts don't self-echo)
       (async () => {
           const res = await startGameIfReady(lobbyId!);
           if (res.success && res.questions) {
               setQuestions(res.questions as unknown as []); // Type assertion: server returns compatible shape
               setStatus('active');
           }
       })();
    }
  }, [isHost, status, players, lobbyId, setQuestions, setStatus]);

  // Auto-fill Bot if no human joins
  const isAddingBot = useRef(false);

  useEffect(() => {
    if (!isHost || status !== 'waiting' || players.length >= 2) return;
    if (isAddingBot.current) return;

    // Wait strictly for the defined botJoinTime (9s)
    if (secondsWaiting >= botJoinTime) {
      const fillBot = async () => {
        isAddingBot.current = true;
        
        // Final check to prevent race condition if human joined at last second
        if (players.length >= 2) return;

        const existingNames = players.map(p => p.displayName);
        const botProfile = generateBotPlayer(existingNames);
        
        // Call server to add bot
        await addBot(lobbyId!, botProfile);
      };
      fillBot();
    }
  }, [secondsWaiting, isHost, status, players, lobbyId, botJoinTime]);

  // Game Start Redirect
  useEffect(() => {
    if (status === 'active') {
      router.push('/arena/game');
    }
  }, [status, router]);

  // Manual Start (if applicable)
  const handleStart = () => {
    if (lobbyId && players.length >= 2) {
      startGameIfReady(lobbyId);
    }
  };

  if (matchingError) {
    return (
      <div className="min-h-screen relative flex flex-col arena-bg" style={arenaBackground}>
        {/* AppHeader removed */}
        <main className="container flex grow items-center justify-center p-4 mx-auto">
          <Card className="w-full max-w-md border-destructive shadow-lg">
             <CardHeader>
               <CardTitle className="text-destructive flex items-center gap-2">
                 <Info className="h-5 w-5" /> Matchmaking Error
               </CardTitle>
               <CardDescription>{matchingError}</CardDescription>
             </CardHeader>
             <div className="p-6">
               <Button onClick={() => router.push('/arena')} className="w-full">Back to Arena</Button>
             </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col arena-bg" style={arenaBackground}>
      {/* AppHeader removed */}
      
      <main className="container flex grow flex-col items-center justify-center p-4 mx-auto max-w-lg">
        <div className="text-center mb-8 space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold tracking-tight">Game Lobby</h1>
          <p className="text-muted-foreground font-medium">{mode === 'duel' ? '⚔️ 1v1 Duel' : '🏟️ Arena'}</p>
        </div>

        <Card className="w-full shadow-xl border-primary/20 bg-background/80 backdrop-blur-md animate-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2 border-b border-border/50">
            {searching ? (
              <CardTitle className="flex items-center justify-center gap-3 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                Finding opponent...
              </CardTitle>
            ) : (
              <CardTitle className="flex items-center justify-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>Waiting for players ({secondsWaiting}s)</span>
              </CardTitle>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Players List */}
            <div className="space-y-3">
               {players.slice(0, mode === 'duel' ? 2 : mode === 'tagteam' ? 4 : 5).map((player) => (
                 <div key={player.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 animate-in fade-in slide-in-from-bottom-2">
                   <Avatar className="h-10 w-10 border-2 border-background shadow-xs">
                     <AvatarImage src={player.avatarUrl} />
                     <AvatarFallback className="bg-primary/10 text-primary font-bold">
                       {player.displayName ? player.displayName.substring(0, 2).toUpperCase() : '??'}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex-1">
                     <p className="font-semibold text-sm">{player.displayName}</p>
                   </div>
                   {player.id === profile?.id && (
                     <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">YOU</span>
                   )}
                 </div>
               ))}
               
               {/* Empty Slots */}
               {Array.from({ length: Math.max(0, (mode === 'duel' ? 2 : mode === 'tagteam' ? 4 : 5) - players.length) }).map((_, i) => (
                 <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50 bg-muted/20">
                   <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                     <User className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <p className="text-sm italic text-muted-foreground">Searching for player...</p>
                 </div>
               ))}
            </div>

            {/* Actions */}
            {players.length >= 2 && isHost && (
              <div className="pt-2">
                <Button 
                  className="w-full text-lg py-6 shadow-lg shadow-primary/20 animate-pulse" 
                  size="lg"
                  onClick={async () => {
                      // Prevent multiple clicks
                      const btn = document.activeElement as HTMLButtonElement;
                      if (btn) btn.disabled = true;
                      await handleStart();
                  }}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Start Game Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Button variant="ghost" className="mt-8 text-muted-foreground hover:text-destructive" onClick={() => router.push('/arena')}>
            Cancel Matchmaking
        </Button>
      </main>
    </div>
  );
}
