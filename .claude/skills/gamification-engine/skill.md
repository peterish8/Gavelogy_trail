---
name: Gamification Engine
description: Load when working with game modes, XP/coins economy, bot system, league progression, or any arena feature
---

# Purpose
Gavelogy's gamification layer — dual currency (XP + Coins), 4 game modes, bot AI, league ranking, and the full game state machine.

# When to Use
- Adding a new game mode
- Modifying economy (entry costs, rewards)
- Debugging bot behavior
- Adjusting XP calculation
- Building new arena UI
- Adding achievement/badge triggers

# Setup
Key files:
| File | Purpose |
|------|---------|
| `src/lib/game/economy.ts` | Single source of truth for all costs/rewards |
| `src/lib/game/bot-system.ts` | Bot player AI with 100 named profiles |
| `src/lib/stores/game-store.ts` | Zustand game state machine |
| `src/components/game/` | All game UI components |
| `src/app/arena/` | Arena routes |

# Core Concepts

## Dual Currency System
```ts
// XP — Progression currency
// Never decreases (except soft cap after 10+ daily matches)
// Controls league advancement
// NOT spendable

// Coins — Spendable resource
// Earned by winning paid modes
// Spent on mode entry fees
// Displayed as G-Coins with custom icon
```

## Economy Config (`src/lib/game/economy.ts`)
```ts
export const GAME_ECONOMY = {
  modes: {
    duel: {
      players: 2,
      questions: 10,
      rounds: 1,
      entryCost: 0,           // Free
      xpReward: { win: [25, 30], loss: [-5, 0] },
      coinReward: { win: 15, loss: -15 },
    },
    speedCourt: {
      players: 1,
      questions: 50,
      rounds: 1,
      entryCost: 10,          // Costs 10 coins to enter
      xpReward: null,         // No XP in paid modes
      coinReward: { win: 20 },
    },
    battleRoyale: {
      players: 5,
      questions: 3,
      rounds: 4,
      entryCost: 10,
      coinReward: { win: 20 },
    },
    tagTeam: {
      players: 4,             // 2v2
      questions: 10,
      rounds: 1,
      entryCost: 10,
      coinReward: { win: 20 },
    },
  },
};
```

## XP Calculation
```ts
function calculateXP(isWin: boolean, correctAnswers: number, totalQuestions: number): number {
  const accuracy = correctAnswers / totalQuestions;
  const accuracyBonus = Math.round(accuracy * 5); // 0-5 bonus XP

  if (isWin) {
    return 25 + accuracyBonus; // 25–30 XP
  } else {
    return -5 + accuracyBonus; // -5 to 0 XP
  }
}

// Soft cap: after 10 matches/day, XP is halved
function applySoftCap(xp: number, dailyMatchCount: number): number {
  return dailyMatchCount >= 10 ? Math.round(xp / 2) : xp;
}
```

## Bot System (`src/lib/game/bot-system.ts`)
```ts
// 100 Indian names (male + female) for bots
const BOT_NAMES = ['Arjun Sharma', 'Priya Patel', 'Ravi Kumar', /* ... 97 more */];

interface BotProfile {
  name: string;
  accuracy: number;    // 0.6–0.8 typical, 0.05 very low, 0.05 very high
  responseTime: number; // 8–42 seconds with realistic distribution
}

function generateBotProfile(): BotProfile {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const roll = Math.random();

  // 5% chance very low accuracy (0.2–0.4), 5% very high (0.85–0.95)
  const accuracy = roll < 0.05 ? random(0.2, 0.4)
    : roll > 0.95 ? random(0.85, 0.95)
    : random(0.6, 0.8);

  // Response time: normally distributed around 20s
  const responseTime = clamp(gaussianRandom(20, 8), 8, 42);

  return { name, accuracy, responseTime };
}

// Simulate bot answering a question
function getBotAnswer(question: GameQuestion, profile: BotProfile): string {
  const isCorrect = Math.random() < profile.accuracy;
  if (isCorrect) return question.correct_answer;

  // Pick random wrong option
  const wrongOptions = ['A', 'B', 'C', 'D'].filter(o => o !== question.correct_answer);
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
}
```

## Game State Machine
```ts
type GameStatus = 'idle' | 'matchmaking' | 'waiting' | 'pregame' | 'active' | 'finished';
type GameMode = 'duel' | 'speed_court' | 'battle_royale' | 'tag_team';

interface GameStore {
  lobbyId: string | null;
  mode: GameMode | null;
  status: GameStatus;
  players: GamePlayer[];
  questions: GameQuestion[];
  currentQuestionIndex: number;
  userScore: number;
  userAnswers: Record<string, { answer: string; timeTaken: number }>;
  timeRemaining: number; // for speed court

  // Actions
  initGame: (mode: GameMode, questions: GameQuestion[]) => void;
  joinLobby: (lobbyId: string) => void;
  addPlayer: (player: GamePlayer) => void;
  setStatus: (status: GameStatus) => void;
  recordAnswer: (questionId: string, answer: string, timeTaken: number) => void;
  nextQuestion: () => void;
  finishGame: () => void;
  resetGame: () => void;
}
```

# Best Practices

## Game Flow
```
1. Player selects mode → ModeSelector.tsx
2. Check coins for paid modes → LowCoinsWarning.tsx if insufficient
3. Create/join lobby → API call to Supabase
4. Matchmaking → fill with bots if no real players
5. Pre-game intro → MatchIntro.tsx (countdown)
6. Active game → mode-specific screen
7. Results → ResultsScreen.tsx (score, XP delta, coin delta)
8. League check → PromotionCeremony.tsx if threshold crossed
```

## Adding a New Game Mode
```ts
// 1. Add to economy.ts
export const GAME_ECONOMY = {
  modes: {
    ...existingModes,
    blitz: {
      players: 1,
      questions: 20,
      rounds: 1,
      entryCost: 5,
      xpReward: null,
      coinReward: { win: 10 },
    },
  },
};

// 2. Add to GameMode type in game-store.ts
type GameMode = 'duel' | 'speed_court' | 'battle_royale' | 'tag_team' | 'blitz';

// 3. Create screen component src/components/game/blitz-screen.tsx
// 4. Add route src/app/arena/blitz/page.tsx
// 5. Add card to ModeSelector.tsx
```

## Coin Balance Check
```tsx
function ModeCard({ mode }: { mode: GameMode }) {
  const profile = useAuthStore((s) => s.profile);
  const cost = GAME_ECONOMY.modes[mode].entryCost;
  const hasCoins = (profile?.total_coins ?? 0) >= cost;

  return (
    <motion.button
      disabled={!hasCoins}
      className={cn('game-card', !hasCoins && 'opacity-50 cursor-not-allowed')}
      onClick={() => hasCoins ? startGame(mode) : showLowCoinsWarning()}
    >
      {/* mode card content */}
    </motion.button>
  );
}
```

## Real-Time Game Events
```ts
// Insert game event (triggers real-time for other players)
async function broadcastAnswer(lobbyId: string, questionId: string, answer: string) {
  await supabase.from('game_events').insert({
    lobby_id: lobbyId,
    event_type: 'answer',
    payload: { question_id: questionId, answer, player_id: userId },
  });
}

// Subscribe to opponent answers
const channel = supabase.channel(`game:${lobbyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'game_events',
    filter: `lobby_id=eq.${lobbyId}`,
  }, handleEvent)
  .subscribe();
```

# Code Examples

## Results Screen with Animations
```tsx
function ResultsScreen({ won, xpGained, coinsGained }: ResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3, stiffness: 200 }}
      >
        {won ? <TrophyIcon className="h-24 w-24 text-yellow-400" /> : <SkullIcon />}
      </motion.div>

      <XPDelta value={xpGained} />
      <CoinDelta value={coinsGained} />

      {won && <canvas-confetti />}
    </motion.div>
  );
}
```

## League Progression Display
```tsx
const LEAGUES = [
  { name: 'Iron', minXP: 0, color: '#9CA3AF', icon: '⚔️' },
  { name: 'Bronze', minXP: 100, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', minXP: 300, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', minXP: 700, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', minXP: 1500, color: '#E5E4E2', icon: '💎' },
  { name: 'Diamond', minXP: 3000, color: '#B9F2FF', icon: '💠' },
];

function getCurrentLeague(xp: number) {
  return LEAGUES.slice().reverse().find(l => xp >= l.minXP) ?? LEAGUES[0];
}
```

# Common Pitfalls

1. **Not deducting coins before game starts** → user could disconnect and avoid payment
2. **Bot answers too fast** → unrealistic; always add response time delay
3. **XP soft cap not applied** → users farm XP with 100+ daily matches
4. **Game state not reset after game** → stale state bleeds into next match
5. **Missing real-time unsubscribe** → duplicate events in next match

```ts
// Always reset game store after navigating away
useEffect(() => {
  return () => resetGame(); // cleanup on unmount
}, []);
```

# Performance Notes
- Game questions should be pre-fetched before match starts (no loading during game)
- Bot answer timeouts use `setTimeout` — clear all on game end
- Real-time channels: one channel per lobby, not per player
- Speed Court (50 questions) — pre-render all question cards, just hide/show

# Security Notes
- Server-side validate coin deduction — don't trust client-reported costs
- Bot answers should be generated server-side or hashed to prevent manipulation
- Game results (scores) should be re-validated server-side before saving XP/coins
- Anti-cheat: server tracks answer times — flag answers < 2 seconds as suspicious

# Testing Strategy
```ts
// Test economy calculations
describe('XP calculation', () => {
  it('win with perfect score gives 30 XP', () => {
    expect(calculateXP(true, 10, 10)).toBe(30);
  });
  it('loss with 0% accuracy gives -5 XP', () => {
    expect(calculateXP(false, 0, 10)).toBe(-5);
  });
  it('soft cap halves XP after 10 matches', () => {
    expect(applySoftCap(30, 10)).toBe(15);
  });
});

// Test bot accuracy distribution
describe('bot system', () => {
  it('generates realistic accuracy range', () => {
    const bots = Array.from({ length: 1000 }, generateBotProfile);
    const avgAccuracy = bots.reduce((s, b) => s + b.accuracy, 0) / 1000;
    expect(avgAccuracy).toBeCloseTo(0.7, 1); // ~70% average
  });
});
```

# Upgrade / Versioning Notes
- Economy values in `economy.ts` should be reviewed each major content update
- Bot names list can be expanded for diversity
- Consider moving economy to Supabase config table for hot-reload without deploy

# Related Skills
- `supabase-integration` — Game lobby/events tables
- `framer-motion` — Match intro, promotion ceremony, results screen animations
- `zustand-state-management` — Game store patterns
