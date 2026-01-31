# 🎮 Gavelogy Live Play Mode — Product Requirements Document (PRD)
    
**Version:** 1.0  
**Date:** January 17, 2026  
**Product:** Gavelogy Platform  
**Feature:** Real-time Competitive Quiz System  
**Status:** Pre-Development

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Technical Architecture](#technical-architecture)
4. [Feature Specifications](#feature-specifications)
5. [User Flows](#user-flows)
6. [Data Models](#data-models)
7. [API & Realtime Specifications](#api--realtime-specifications)
8. [Bot System Architecture](#bot-system-architecture)
9. [UI/UX Specifications](#uiux-specifications)
10. [Performance Requirements](#performance-requirements)
11. [Security & Anti-Cheat](#security--anti-cheat)
12. [Success Metrics](#success-metrics)
13. [Implementation Phases](#implementation-phases)
14. [Risk Mitigation](#risk-mitigation)

---

## 📊 Executive Summary

### The Problem
Law students need engaging, competitive ways to test their knowledge. Traditional quiz systems lack:
- Real-time competition
- Social engagement
- Instant gratification
- Always-available opponents

### The Solution
A **live, multiplayer quiz system** that:
- Matches players in real-time
- Provides instant bot opponents when needed
- Rewards performance with coins
- Creates addictive, competitive gameplay

### Key Metrics (6-Month Targets)
- **50%** of active users play at least once per week
- **3.5** average games per session
- **<200ms** p95 realtime latency
- **>90%** positive gameplay feedback

---

## 🎯 Product Vision

### Core Philosophy

> **"Never wait. Always compete. Win with skill."**

**Three Pillars:**

1. **Instant Availability** — Play anytime, 24/7
2. **Fair Competition** — Skill + speed both matter
3. **Authentic Feel** — Bots indistinguishable from humans

### Success Looks Like
- Users open the app thinking "I have 5 minutes, let's play"
- Leaderboards discussed in WhatsApp groups
- "One more game" addiction loop
- Organic social sharing of wins

---

## 🏗️ Technical Architecture

### Tech Stack (Aligned with Codebase)

#### Frontend
- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **State Management:** Zustand
- **Animations:** Framer Motion + tailwindcss-animate
- **Icons:** Lucide React
- **Celebrations:** canvas-confetti

#### Backend
- **Platform:** Supabase (Postgres + Realtime + Auth)
- **SDK:** @supabase/supabase-js, @supabase/ssr
- **Realtime:** Supabase Realtime Channels

#### Utilities
- **Class Management:** clsx + tailwind-merge
- **Command Palette:** cmdk (for quick navigation)

### Architecture Principles

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  Next.js 15 App Router + React 19 + Zustand         │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Supabase Client SDK
                   ↓
┌─────────────────────────────────────────────────────┐
│              Supabase Backend Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │
│  │ Postgres │  │ Realtime │  │ RPC/Edge Fn  │      │
│  └──────────┘  └──────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────┘
                   │
                   │ Database Triggers + Functions
                   ↓
┌─────────────────────────────────────────────────────┐
│              Game Logic Layer                        │
│  • Matchmaking     • Bot Assignment                 │
│  • Scoring         • Elimination                     │
│  • Rewards         • Anti-Cheat                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎮 Feature Specifications

### Feature Name & Navigation

**Selected Name:** **"Arena"** (Legal + Competitive connotation)

**Alternative Names (for A/B testing):**
- Verdict
- BarArena
- LexPlay
- JustiPlay
- Courtroom Live
- TrialZone

**Route:** `/arena`

**Header Position:** Between "Quiz" and "Profile"

---

### Game Modes

#### Mode A: ⚔️ Duel (1v1)

**Concept:** Head-to-head legal knowledge battle

**Rules:**
- 2 players total (1 human + 1 opponent)
- 10 questions from the same category
- 45 seconds per question
- Scoring: Correctness (70%) + Speed (30%)
- Winner determined by final score
- Loser must wait for winner to finish

**Matchmaking:**
- User clicks "Play Duel"
- System searches for human opponent (max 10 seconds)
- If no human found → Assign bot
- If human found → Lock lobby and start

**Rewards:**
- 🥇 Winner: **50 coins**
- 🥈 Loser: **10 coins** (participation)

---

#### Mode B: 🏛️ Arena (5 Players, Battle Royale)

**Concept:** Multi-round elimination tournament

**Rules:**
- 5 players total (humans + bots)
- 4 rounds
- 3 questions per round (12 total)
- Last place eliminated after each round
- Final standings: 1st, 2nd, 3rd

**Round Structure:**

| Round | Players | Questions | Eliminated |
|-------|---------|-----------|------------|
| 1     | 5       | 3         | 1 (5th)    |
| 2     | 4       | 3         | 1 (4th)    |
| 3     | 3       | 3         | 1 (3rd)    |
| 4     | 2       | 3         | 1 (2nd)    |

**Scoring Per Round:**
- Correct Answer: **10 points**
- Speed Bonus: **0-5 points** (faster = more)
- Wrong Answer: **0 points**

**Elimination Logic:**
- After each round, player with **lowest cumulative score** is eliminated
- Eliminated players still see/answer remaining questions (UI shows "ELIMINATED" badge)
- Final results shown ONLY after all 12 questions completed

**Matchmaking:**
- User clicks "Play Arena"
- System searches for 4 other humans (max 10 seconds)
- Fill remaining slots with bots
- Lock lobby when 5 players ready

**Rewards:**
- 🥇 1st Place: **100 coins**
- 🥈 2nd Place: **50 coins**
- 🥉 3rd Place: **25 coins**
- 4th-5th: **0 coins**

---

### Question System

**Question Selection:**
- Questions fetched **once per lobby** at game start
- Same questions in same order for all players
- Category: Random or user-selected (future)
- Difficulty: Mixed (Easy 40%, Medium 40%, Hard 20%)

**Question Format:**
- Reuse existing quiz component (`QuizCard` or equivalent)
- 4 multiple-choice options
- 45-second timer per question
- Auto-submit on timeout

**Question Pool:**
- Minimum **500 questions** in database for variety
- No repeated questions in same game
- Track recently asked questions per user (prevent repeats across games)

---

## 🔄 User Flows

### Flow 1: Duel Mode (Human vs Bot)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks "Arena" in header                         │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Mode selection screen                                 │
│    [⚔️ Duel]    [🏛️ Arena]                              │
└────────────────┬────────────────────────────────────────┘
                 ↓ User selects Duel
┌─────────────────────────────────────────────────────────┐
│ 3. Matchmaking screen                                    │
│    "Finding opponent..." (animated)                      │
│    [Cancel] button                                       │
│    Max wait: 10 seconds                                  │
└────────────────┬────────────────────────────────────────┘
                 ↓
         ┌───────┴────────┐
         │                │
    Human found      No human (10s elapsed)
         │                │
         ↓                ↓
┌────────────────┐  ┌─────────────────┐
│ Human opponent │  │ Bot assigned    │
│ Display name   │  │ Random name     │
└────────┬───────┘  └────────┬────────┘
         │                   │
         └────────┬──────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Pre-game screen (3 seconds)                           │
│    [Your Avatar]  VS  [Opponent Avatar]                  │
│    "Get Ready..."                                        │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Game screen                                           │
│    ┌─────────────────────────────────────────────────┐  │
│    │  [You] ████░░░░ 40%  |  [Opp] ██████░░ 60%     │  │
│    └─────────────────────────────────────────────────┘  │
│                                                          │
│    Question 3 of 10                      ⏱️ 0:32       │
│                                                          │
│    [Question text here...]                               │
│                                                          │
│    [A] Option 1                                          │
│    [B] Option 2   ← User clicks                          │
│    [C] Option 3                                          │
│    [D] Option 4                                          │
│                                                          │
│    (Realtime: See opponent's progress bar moving)        │
└────────────────┬────────────────────────────────────────┘
                 ↓ After 10 questions
┌─────────────────────────────────────────────────────────┐
│ 6. Waiting screen (if user finishes first)               │
│    "Waiting for opponent..."                             │
│    [Opponent progress: 8/10 questions]                   │
└────────────────┬────────────────────────────────────────┘
                 ↓ Both finished
┌─────────────────────────────────────────────────────────┐
│ 7. Results screen (animated)                             │
│    🎉 WINNER! 🎉                                         │
│                                                          │
│    You: 820 points  |  Opponent: 650 points             │
│                                                          │
│    +50 coins earned                                      │
│                                                          │
│    [Play Again]  [View Stats]  [Exit]                    │
└─────────────────────────────────────────────────────────┘
```

---

### Flow 2: Arena Mode (5 Players)

```
┌─────────────────────────────────────────────────────────┐
│ 1. User selects Arena mode                               │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Matchmaking lobby (max 10 seconds)                    │
│    Players: [You] [Player 2] [...]                       │
│    "Waiting for players..." 3/5                          │
└────────────────┬────────────────────────────────────────┘
                 ↓ 5 players ready
┌─────────────────────────────────────────────────────────┐
│ 3. Pre-game screen                                       │
│    [5 player avatars in circle]                          │
│    "Round 1 starting..."                                 │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Round 1 (3 questions)                                 │
│    ┌─────────────────────────────────────────────────┐  │
│    │ P1 ████  P2 ██████  P3 ███  P4 █  P5 ████████  │  │
│    └─────────────────────────────────────────────────┘  │
│                                                          │
│    Question 1 of 3  (Round 1)            ⏱️ 0:28       │
│    [Question and options...]                             │
└────────────────┬────────────────────────────────────────┘
                 ↓ After 3 questions
┌─────────────────────────────────────────────────────────┐
│ 5. Round 1 results                                       │
│    Standings:                                            │
│    1. Player 2 - 45 pts                                  │
│    2. You - 40 pts                                       │
│    3. Player 5 - 38 pts                                  │
│    4. Player 3 - 35 pts                                  │
│    5. Player 4 - 20 pts ❌ ELIMINATED                    │
│                                                          │
│    "Round 2 starting in 3..."                            │
└────────────────┬────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Rounds 2-4 (same structure)                           │
│    Eliminated players still see questions                │
│    (UI shows "ELIMINATED - Spectating")                  │
└────────────────┬────────────────────────────────────────┘
                 ↓ After Round 4
┌─────────────────────────────────────────────────────────┐
│ 7. Final results (animated podium)                       │
│                                                          │
│           🥇                                             │
│         Player 2                                         │
│        150 pts                                           │
│                                                          │
│    🥈        🥉                                          │
│   You      Player 5                                      │
│  140 pts   130 pts                                       │
│                                                          │
│    +50 coins earned                                      │
│                                                          │
│    [Play Again]  [Exit]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Models

### Database Schema (Supabase Postgres)

```sql
-- ============================================
-- Game Lobbies
-- ============================================
CREATE TABLE game_lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('duel', 'arena')),
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  question_ids JSONB NOT NULL, -- Array of question IDs
  current_round INT DEFAULT 1,
  max_rounds INT DEFAULT 1, -- 1 for duel, 4 for arena
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  INDEX idx_game_lobbies_status ON game_lobbies(status),
  INDEX idx_game_lobbies_mode ON game_lobbies(mode),
  INDEX idx_game_lobbies_created ON game_lobbies(created_at DESC)
);

-- ============================================
-- Game Players
-- ============================================
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for bots
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  current_question INT DEFAULT 0,
  eliminated_round INT, -- NULL if not eliminated
  final_rank INT, -- 1, 2, 3, etc.
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lobby_id, user_id), -- One user per lobby
  INDEX idx_game_players_lobby ON game_players(lobby_id),
  INDEX idx_game_players_user ON game_players(user_id)
);

-- ============================================
-- Game Answers (For scoring & analytics)
-- ============================================
CREATE TABLE game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  round INT NOT NULL,
  question_order INT NOT NULL, -- 1-3 within round
  answer TEXT, -- A, B, C, D
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INT NOT NULL, -- Milliseconds to answer
  points_earned INT DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, question_id),
  INDEX idx_game_answers_lobby ON game_answers(lobby_id),
  INDEX idx_game_answers_player ON game_answers(player_id)
);

-- ============================================
-- Game Events (Realtime broadcast log)
-- ============================================
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'player_joined',
    'player_left',
    'game_started',
    'question_started',
    'answer_submitted',
    'round_ended',
    'player_eliminated',
    'game_finished'
  )),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_game_events_lobby ON game_events(lobby_id),
  INDEX idx_game_events_type ON game_events(event_type)
);

-- ============================================
-- Questions Table (Existing, but ensure compatibility)
-- ============================================
-- Assumes you already have a questions table with:
-- id, question_text, options (JSONB), correct_answer, category, difficulty

-- ============================================
-- Users Table (Existing, add coins if missing)
-- ============================================
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INT DEFAULT 0;
```

---

### Zustand State Store (Client-Side)

```typescript
// store/useGameStore.ts
import { create } from 'zustand';

interface GamePlayer {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isBot: boolean;
  score: number;
  currentQuestion: number;
  eliminated?: boolean;
}

interface GameQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

interface GameState {
  // Lobby state
  lobbyId: string | null;
  mode: 'duel' | 'arena' | null;
  status: 'matchmaking' | 'waiting' | 'playing' | 'finished';
  
  // Players
  players: GamePlayer[];
  currentUserId: string;
  
  // Questions
  questions: GameQuestion[];
  currentQuestionIndex: number;
  currentRound: number;
  
  // Scoring
  userScore: number;
  userAnswers: Record<string, { answer: string; timeTaken: number }>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  showResults: boolean;
  
  // Actions
  setLobbyId: (id: string) => void;
  setMode: (mode: 'duel' | 'arena') => void;
  setStatus: (status: GameState['status']) => void;
  addPlayer: (player: GamePlayer) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerProgress: (playerId: string, progress: Partial<GamePlayer>) => void;
  setQuestions: (questions: GameQuestion[]) => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string, timeTaken: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  lobbyId: null,
  mode: null,
  status: 'matchmaking',
  players: [],
  currentUserId: '',
  questions: [],
  currentQuestionIndex: 0,
  currentRound: 1,
  userScore: 0,
  userAnswers: {},
  isLoading: false,
  error: null,
  showResults: false,
  
  // Actions
  setLobbyId: (id) => set({ lobbyId: id }),
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),
  
  updatePlayerProgress: (playerId, progress) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, ...progress } : p
    )
  })),
  
  setQuestions: (questions) => set({ questions }),
  
  nextQuestion: () => set((state) => ({
    currentQuestionIndex: state.currentQuestionIndex + 1
  })),
  
  submitAnswer: (answer, timeTaken) => set((state) => ({
    userAnswers: {
      ...state.userAnswers,
      [state.questions[state.currentQuestionIndex].id]: { answer, timeTaken }
    }
  })),
  
  reset: () => set({
    lobbyId: null,
    mode: null,
    status: 'matchmaking',
    players: [],
    questions: [],
    currentQuestionIndex: 0,
    currentRound: 1,
    userScore: 0,
    userAnswers: {},
    showResults: false
  })
}));
```

---

## 🔌 API & Realtime Specifications

### Supabase Realtime Channel Protocol

**Channel Naming Convention:**
```
game-lobby:{lobby_id}
```

**Event Types:**

```typescript
// 1. Player Joined
{
  type: 'player_joined',
  payload: {
    playerId: string,
    displayName: string,
    isBot: boolean,
    timestamp: string
  }
}

// 2. Game Started
{
  type: 'game_started',
  payload: {
    questionIds: string[],
    startTime: string
  }
}

// 3. Answer Submitted (Broadcast progress only, not answer)
{
  type: 'answer_submitted',
  payload: {
    playerId: string,
    questionIndex: number,
    timestamp: string
  }
}

// 4. Round Ended (Arena mode only)
{
  type: 'round_ended',
  payload: {
    round: number,
    standings: Array<{
      playerId: string,
      score: number,
      rank: number
    }>,
    eliminatedPlayerId?: string
  }
}

// 5. Game Finished
{
  type: 'game_finished',
  payload: {
    finalStandings: Array<{
      playerId: string,
      displayName: string,
      score: number,
      rank: number,
      coinsEarned: number
    }>
  }
}
```

---

### API Endpoints (Supabase Edge Functions)

#### 1. **POST** `/api/game/create-lobby`

**Request:**
```json
{
  "mode": "duel" | "arena",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "lobbyId": "lobby-uuid",
  "status": "waiting",
  "channelName": "game-lobby:lobby-uuid"
}
```

**Logic:**
- Create new lobby in `game_lobbies`
- Add user to `game_players`
- Check for existing waiting lobbies first (join instead of create)

---

#### 2. **POST** `/api/game/join-lobby`

**Request:**
```json
{
  "lobbyId": "lobby-uuid",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "players": [...],
  "status": "waiting"
}
```

**Logic:**
- Add user to existing lobby
- If lobby full → Trigger game start
- Broadcast `player_joined` event

---

#### 3. **POST** `/api/game/start-game`

**Triggered by:** Matchmaking timeout or lobby full

**Logic:**
1. Check player count
2. Fill empty slots with bots (if needed)
3. Fetch random questions
4. Update lobby status to `active`
5. Broadcast `game_started` event

**Bot Assignment:**
```typescript
const botNames = [
  'Aditi Sharma', 'Rohan Verma', 'Priya Patel', 'Arjun Singh',
  'Neha Gupta', 'Vikram Reddy', 'Kavya Iyer', 'Aarav Mehta',
  // ... 100+ names
];

const assignBots = (neededCount: number, existingNames: string[]) => {
  const availableNames = botNames.filter(n => !existingNames.includes(n));
  return availableNames
    .sort(() => Math.random() - 0.5)
    .slice(0, neededCount)
    .map(name => ({
      displayName: name,
      isBot: true,
      accuracy: 0.5 + Math.random() * 0.3, // 50-80%
      avgResponseTime: 15000 + Math.random() * 15000 // 15-30s
    }));
};
```

---

#### 4. **POST** `/api/game/submit-answer`

**Request:**
```json
{
  "lobbyId": "lobby-uuid",
  "playerId": "player-uuid",
  "questionId": "question-uuid",
  "answer": "A",
  "timeTaken": 12500
}
```

**Response:**
```json
{
  "correct": true,
  "points": 12,
  "newScore": 85
}
```

**Logic:**
- Validate answer
- Calculate points (base + speed bonus)
- Update `game_players.score`
- Insert into `game_answers`
- Broadcast `answer_submitted` event

**Scoring Formula:**
```typescript
const calculatePoints = (isCorrect: boolean, timeTaken: number) => {
  if (!isCorrect) return 0;
  
  const basePoints = 10;
  const maxSpeedBonus = 5;
  const questionTime = 45000; // 45 seconds
  
  const speedBonus = Math.max(0, 
    maxSpeedBonus * (1 - timeTaken / questionTime)
  );
  
  return Math.round(basePoints + speedBonus);
};
```

---

#### 5. **POST** `/api/game/end-round` (Arena only)

**Triggered by:** All players answered all questions in round

**Logic:**
1. Calculate round standings
2. Identify last place player
3. Mark as eliminated
4. Broadcast `round_ended` event
5. If final round → Trigger game finish

---

#### 6. **POST** `/api/game/finish-game`

**Logic:**
1. Calculate final rankings
2. Determine coin rewards
3. Update `users.coins` (atomic operation)
4. Update `game_lobbies.status = 'finished'`
5. Broadcast `game_finished` event

**Coin Distribution:**
```typescript
const getCoinsEarned = (mode: string, rank: number) => {
  if (mode === 'duel') {
    return rank === 1 ? 50 : 10;
  }
  
  if (mode === 'arena') {
    const rewards = { 1: 100, 2: 50, 3: 25 };
    return rewards[rank] || 0;
  }
  
  return 0;
};
```

---

## 🤖 Bot System Architecture

### Bot Behavior Engine

**Core Principle:** Bots must feel human

**Bot Decision Logic:**

```typescript
interface BotProfile {
  name: string;
  accuracy: number; // 0.5 - 0.8
  avgResponseTime: number; // 15000 - 30000 ms
  variance: number; // ±5000 ms
}

class BotPlayer {
  profile: BotProfile;
  
  async answerQuestion(question: Question): Promise<BotAnswer> {
    // 1. Decide correctness
    const willAnswerCorrectly = Math.random() < this.profile.accuracy;
    
    // 2. Calculate response time
    const baseTime = this.profile.avgResponseTime;
    const variance = (Math.random() - 0.5) * 2 * this.profile.variance;
    let responseTime = baseTime + variance;
    
    // 3. Rare outliers (10% chance)
    if (Math.random() < 0.1) {
      responseTime = Math.random() < 0.5
        ? 8000 + Math.random() * 2000   // Fast: 8-10s
        : 38000 + Math.random() * 4000; // Slow: 38-42s
    }
    
    // 4. Clamp to question time
    responseTime = Math.max(3000, Math.min(42000, responseTime));
    
    // 5. Select answer
    const answer = willAnswerCorrectly
      ? question.correctAnswer
      : this.getWrongAnswer(question);
    
    // 6. Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    return { answer, timeTaken: responseTime };
  }
  
  private getWrongAnswer(question: Question): string {
    const options = ['A', 'B', 'C', 'D'];
    const wrongOptions = options.filter(o => o !== question.correctAnswer);
    return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
  }
}
```

---

### Bot Name Pool (100+ Names)

```typescript
const botNames = [
  // Male names
  'Aarav Sharma', 'Arjun Patel', 'Rohan Verma', 'Vikram Singh',
  'Aditya Gupta', 'Arnav Reddy', 'Dhruv Iyer', 'Kabir Mehta',
  'Karthik Nair', 'Nikhil Joshi', 'Rahul Kumar', 'Siddharth Rao',
  'Varun Desai', 'Yash Agarwal', 'Ankit Malhotra', 'Ashwin Pillai',
  
  // Female names
  'Aditi Sharma', 'Ananya Patel', 'Diya Verma', 'Ishita Singh',
  'Kavya Gupta', 'Meera Reddy', 'Neha Iyer', 'Pooja Mehta',
  'Priya Nair', 'Riya Joshi', 'Shreya Kumar', 'Tanvi Rao',
  'Vanya Desai', 'Zara Agarwal', 'Aarohi Malhotra', 'Bhavya Pillai',
  
  // Gender-neutral / More names
  'Arya Bose', 'Avni Chatterjee', 'Devansh Shah', 'Eshaan Kapoor',
  'Gargi Das', 'Hrithik Bhatt', 'Ira Mishra', 'Jiya Thakur',
  'Kiaan Saxena', 'Larisa Bansal', 'Moksh Jain', 'Naina Chopra',
  'Ojas Pandey', 'Parth Sinha', 'Qavi Tripathi', 'Radhika Menon',
  'Saanvi Kulkarni', 'Tara Bhatia', 'Uday Khanna', 'Vihaan Sethi',
  
  // Additional 60+ names for variety
  'Aarush Srivastava', 'Advait Tiwari', 'Amaira Dutta', 'Arnavi Roy',
  'Atharv Ghosh', 'Charvi Mukherjee', 'Darsh Sen', 'Divya Bakshi',
  'Eshan Varma', 'Gaurav Bhardwaj', 'Hriday Khurana', 'Inaya Saini',
  'Krish Arora', 'Lavanya Bajaj', 'Manav Kohli', 'Myra Ahuja',
  'Navya Tandon', 'Reyansh Mittal', 'Samar Ganguly', 'Siya Chawla',
  // ... (expand to 100+)
];
```

**Rules:**
- Never reuse names within same lobby
- Randomly shuffle on each game
- Track recently used names per user to avoid patterns

---

### Bot Timing Patterns

**Distribution:**
```
8-10s:    5% of answers (rare fast)
15-20s:   35% of answers (normal fast)
20-30s:   40% of answers (normal mid)
30-38s:   15% of answers (normal slow)
38-42s:   5% of answers (rare slow)
```

**Implementation:**
```typescript
const getBotResponseTime = () => {
  const rand = Math.random();
  
  if (rand < 0.05) return 8000 + Math.random() * 2000;   // 8-10s
  if (rand < 0.40) return 15000 + Math.random() * 5000;  // 15-20s
  if (rand < 0.80) return 20000 + Math.random() * 10000; // 20-30s
  if (rand < 0.95) return 30000 + Math.random() * 8000;  // 30-38s
  return 38000 + Math.random() * 4000;                   // 38-42s
};
```

---

## 🎨 UI/UX Specifications

### Design System (Tailwind + shadcn/ui)

**Color Palette:**
```typescript
// tailwind.config.ts
{
  colors: {
    game: {
      primary: '#6366f1',    // Indigo-500
      secondary: '#8b5cf6',  // Violet-500
      success: '#10b981',    // Green-500
      danger: '#ef4444',     // Red-500
      warning: '#f59e0b',    // Amber-500
      neutral: '#6b7280',    // Gray-500
    }
  }
}
```

---

### Component Specifications

#### 1. **Mode Selection Screen**

```tsx
// app/arena/page.tsx
<div className="min-h-screen bg-linear-to-br from-indigo-50 to-violet-50 p-8">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-4xl font-bold text-center mb-12">
      Choose Your Battle
    </h1>
    
    <div className="grid md:grid-cols-2 gap-6">
      {/* Duel Card */}
      <Card 
        className="cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => startMatchmaking('duel')}
      >
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-2xl font-bold mb-2">Duel</h2>
          <p className="text-gray-600 mb-4">
            1v1 head-to-head battle
          </p>
          <Badge variant="secondary">10 Questions</Badge>
          <div className="mt-6">
            <p className="text-sm text-gray-500">Rewards</p>
            <p className="text-lg font-semibold">🥇 50 coins</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Arena Card */}
      <Card 
        className="cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => startMatchmaking('arena')}
      >
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h2 className="text-2xl font-bold mb-2">Arena</h2>
          <p className="text-gray-600 mb-4">
            5-player elimination battle
          </p>
          <Badge variant="secondary">12 Questions</Badge>
          <div className="mt-6">
            <p className="text-sm text-gray-500">Top Rewards</p>
            <p className="text-lg font-semibold">🥇 100 coins</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

---

#### 2. **Matchmaking Screen**

```tsx
// components/MatchmakingScreen.tsx
<div className="min-h-screen flex items-center justify-center">
  <Card className="w-full max-w-md">
    <CardContent className="p-8 text-center">
      {/* Animated search icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="mb-6"
      >
        <Search className="w-16 h-16 mx-auto text-indigo-500" />
      </motion.div>
      
      <h2 className="text-2xl font-bold mb-2">Finding Opponents...</h2>
      <p className="text-gray-600 mb-6">
        {playersFound}/{maxPlayers} players ready
      </p>
      
      {/* Player avatars */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: maxPlayers }).map((_, i) => (
          <Avatar key={i} className={i < playersFound ? '' : 'opacity-30'}>
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        ))}
      </div>
      
      {/* Timer */}
      <Progress value={(timer / 10) * 100} className="mb-4" />
      <p className="text-sm text-gray-500">
        Starting in {10 - timer} seconds...
      </p>
      
      <Button variant="outline" onClick={cancelMatchmaking}>
        Cancel
      </Button>
    </CardContent>
  </Card>
</div>
```

---

#### 3. **Game Screen (Live Progress)**

```tsx
// components/GameScreen.tsx
<div className="min-h-screen bg-gray-50 p-4">
  {/* Top Bar - Player Progress */}
  <div className="max-w-4xl mx-auto mb-6">
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {players.map(player => (
            <div key={player.id} className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {player.displayName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">
                    {player.displayName}
                    {player.eliminated && (
                      <Badge variant="destructive" className="ml-2">
                        OUT
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm text-gray-600">
                    {player.currentQuestion}/{totalQuestions}
                  </span>
                </div>
                
                <Progress 
                  value={(player.currentQuestion / totalQuestions) * 100}
                  className="h-2"
                />
              </div>
              
              <div className="text-right min-w-[60px]">
                <p className="text-lg font-bold">{player.score}</p>
                <p className="text-xs text-gray-500">pts</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
  
  {/* Question Card */}
  <div className="max-w-2xl mx-auto">
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Question {currentQuestionIndex + 1} of {totalQuestions}
            {mode === 'arena' && (
              <Badge className="ml-2">Round {currentRound}</Badge>
            )}
          </CardTitle>
          
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className={`text-xl font-mono ${
              timeLeft < 10 ? 'text-red-500 animate-pulse' : ''
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Question Text */}
        <p className="text-lg mb-6">
          {currentQuestion.text}
        </p>
        
        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start text-left p-4 h-auto"
              onClick={() => handleAnswer(String.fromCharCode(65 + idx))}
              disabled={answered}
            >
              <span className="font-bold mr-3">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

---

#### 4. **Results Screen (Animated)**

```tsx
// components/ResultsScreen.tsx
<div className="min-h-screen bg-linear-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="w-full max-w-2xl"
  >
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardContent className="p-8">
        {/* Winner Badge */}
        {userRank === 1 && (
          <>
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className="text-5xl font-bold text-white mb-2">
                🎉 WINNER! 🎉
              </h1>
              <p className="text-xl text-white/80">
                Congratulations!
              </p>
            </motion.div>
            
            {/* Confetti effect */}
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
            />
          </>
        )}
        
        {/* Podium (Arena only) */}
        {mode === 'arena' && (
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Avatar className="w-16 h-16 mx-auto mb-2">
                <AvatarFallback>
                  {standings[1]?.displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-400 rounded-t-lg p-4 h-24 flex flex-col justify-end">
                <div className="text-4xl mb-1">🥈</div>
                <p className="text-white font-bold">
                  {standings[1]?.displayName}
                </p>
                <p className="text-white/80 text-sm">
                  {standings[1]?.score} pts
                </p>
              </div>
            </motion.div>
            
            {/* 1st Place */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Avatar className="w-20 h-20 mx-auto mb-2">
                <AvatarFallback>
                  {standings[0]?.displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="bg-yellow-500 rounded-t-lg p-4 h-32 flex flex-col justify-end">
                <div className="text-5xl mb-1">🥇</div>
                <p className="text-white font-bold text-lg">
                  {standings[0]?.displayName}
                </p>
                <p className="text-white/90">
                  {standings[0]?.score} pts
                </p>
              </div>
            </motion.div>
            
            {/* 3rd Place */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Avatar className="w-16 h-16 mx-auto mb-2">
                <AvatarFallback>
                  {standings[2]?.displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="bg-orange-600 rounded-t-lg p-4 h-20 flex flex-col justify-end">
                <div className="text-4xl mb-1">🥉</div>
                <p className="text-white font-bold">
                  {standings[2]?.displayName}
                </p>
                <p className="text-white/80 text-sm">
                  {standings[2]?.score} pts
                </p>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Coin Reward */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring' }}
          className="text-center mb-6"
        >
          <div className="text-6xl mb-2">🪙</div>
          <p className="text-3xl font-bold text-white">
            +{coinsEarned} Coins
          </p>
        </motion.div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {userStats.correct}
            </p>
            <p className="text-sm text-white/70">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {userStats.avgTime}s
            </p>
            <p className="text-sm text-white/70">Avg Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {userStats.accuracy}%
            </p>
            <p className="text-sm text-white/70">Accuracy</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            className="flex-1"
            size="lg"
            onClick={playAgain}
          >
            Play Again
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={viewStats}
          >
            View Stats
          </Button>
          <Button 
            variant="ghost"
            size="lg"
            onClick={exit}
          >
            Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
</div>
```

---

### Animation Specifications (Framer Motion)

**Key Animations:**

```typescript
// 1. Player Join Animation
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 100 }}
>
  {/* Player card */}
</motion.div>

// 2. Progress Bar Pulse
<motion.div
  animate={{ scale: [1, 1.02, 1] }}
  transition={{ repeat: Infinity, duration: 1.5 }}
>
  <Progress value={progress} />
</motion.div>

// 3. Elimination Effect
<motion.div
  animate={{ 
    opacity: 0.5,
    filter: 'grayscale(100%)'
  }}
  transition={{ duration: 0.5 }}
>
  {/* Eliminated player */}
</motion.div>

// 4. Coin Reward Pop
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ 
    type: 'spring',
    stiffness: 200,
    damping: 15
  }}
>
  🪙 +{coins}
</motion.div>
```

---

## ⚡ Performance Requirements

### Latency Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Matchmaking Time | <5s | 10s (hard limit) |
| Question Load Time | <500ms | 1s |
| Answer Submission | <200ms | 500ms |
| Realtime Event Propagation | <100ms | 300ms |
| Total Game Duration (Duel) | 8-10 min | - |
| Total Game Duration (Arena) | 12-15 min | - |

---

### Scalability Targets

**Concurrent Users:**
- Phase 1 (Launch): 1,000 concurrent games
- Phase 2 (3 months): 5,000 concurrent games
- Phase 3 (6 months): 10,000+ concurrent games

**Database Queries:**
- Question fetch: <100ms (indexed by category/difficulty)
- Player update: <50ms (optimistic updates)
- Leaderboard query: <200ms (materialized views)

---

### Optimization Strategies

#### 1. **Question Pre-fetching**
```typescript
// Pre-load next question while user answers current
const prefetchNextQuestion = async (nextIndex: number) => {
  if (nextIndex < questions.length) {
    // Warm cache
    await supabase
      .from('questions')
      .select('*')
      .eq('id', questions[nextIndex].id)
      .single();
  }
};
```

#### 2. **Realtime Channel Optimization**
```typescript
// Only subscribe to relevant events
const channel = supabase.channel(`game-lobby:${lobbyId}`, {
  config: {
    broadcast: { self: false }, // Don't echo own events
    presence: { key: userId }
  }
});
```

#### 3. **Database Indexing**
```sql
-- Critical indexes
CREATE INDEX idx_questions_category_difficulty 
  ON questions(category, difficulty);

CREATE INDEX idx_game_lobbies_active 
  ON game_lobbies(status) 
  WHERE status IN ('waiting', 'active');

CREATE INDEX idx_game_players_lobby_score 
  ON game_players(lobby_id, score DESC);
```

#### 4. **Client-Side Caching**
```typescript
// Cache bot names, question categories
const questionCache = new Map<string, Question>();
const botNamePool = shuffleArray(BOT_NAMES); // Pre-shuffle once
```

---

## 🔒 Security & Anti-Cheat

### Threat Model

**Potential Exploits:**
1. Answer submission manipulation (sending correct answer without viewing question)
2. Time manipulation (instant answers)
3. Score tampering (manual database edits)
4. Bot detection (pattern analysis)
5. Duplicate game participation

---

### Security Measures

#### 1. **Server-Side Answer Validation**

```sql
-- Supabase RPC function
CREATE OR REPLACE FUNCTION validate_answer(
  p_lobby_id UUID,
  p_player_id UUID,
  p_question_id UUID,
  p_answer TEXT,
  p_time_taken INT
) RETURNS JSONB AS $$
DECLARE
  v_correct_answer TEXT;
  v_is_correct BOOLEAN;
  v_points INT;
  v_question_started_at TIMESTAMPTZ;
BEGIN
  -- 1. Get correct answer (server-side only)
  SELECT correct_answer INTO v_correct_answer
  FROM questions
  WHERE id = p_question_id;
  
  -- 2. Validate timing (must be >2s, <46s)
  IF p_time_taken < 2000 OR p_time_taken > 46000 THEN
    RAISE EXCEPTION 'Invalid answer timing';
  END IF;
  
  -- 3. Check if already answered
  IF EXISTS (
    SELECT 1 FROM game_answers 
    WHERE player_id = p_player_id AND question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'Question already answered';
  END IF;
  
  -- 4. Validate correctness
  v_is_correct := (p_answer = v_correct_answer);
  
  -- 5. Calculate points
  v_points := calculate_points(v_is_correct, p_time_taken);
  
  -- 6. Insert answer
  INSERT INTO game_answers (
    lobby_id, player_id, question_id,
    answer, is_correct, time_taken_ms, points_earned
  ) VALUES (
    p_lobby_id, p_player_id, p_question_id,
    p_answer, v_is_correct, p_time_taken, v_points
  );
  
  -- 7. Update player score
  UPDATE game_players
  SET score = score + v_points,
      current_question = current_question + 1
  WHERE id = p_player_id;
  
  RETURN jsonb_build_object(
    'correct', v_is_correct,
    'points', v_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 2. **Rate Limiting**

```typescript
// Supabase Edge Function middleware
const rateLimiter = new Map<string, number[]>();

const checkRateLimit = (userId: string, maxRequests = 20, windowMs = 60000) => {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Filter recent requests
  const recentRequests = userRequests.filter(t => now - t < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
};
```

---

#### 3. **Bot Indistinguishability**

**Measures:**
- Randomized names from 100+ pool
- Varied accuracy (50-80%, not fixed)
- Human-like timing distribution
- Occasional "mistakes" in easy questions
- No predictable patterns

**Red Flags to Avoid:**
- ❌ Bot always answers in exactly 20s
- ❌ Bot has 75% accuracy every game
- ❌ Bot never gets first question wrong
- ❌ Bot name follows pattern (Bot1, Bot2)

---

#### 4. **Coin Reward Protection**

```sql
-- Atomic coin update with audit trail
CREATE OR REPLACE FUNCTION award_coins(
  p_user_id UUID,
  p_lobby_id UUID,
  p_amount INT
) RETURNS VOID AS $$
BEGIN
  -- Prevent duplicate rewards
  IF EXISTS (
    SELECT 1 FROM coin_transactions
    WHERE user_id = p_user_id AND lobby_id = p_lobby_id
  ) THEN
    RAISE EXCEPTION 'Coins already awarded for this game';
  END IF;
  
  -- Update user coins
  UPDATE users
  SET coins = coins + p_amount
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO coin_transactions (user_id, lobby_id, amount, reason)
  VALUES (p_user_id, p_lobby_id, p_amount, 'game_reward');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### 5. **Question Integrity**

```typescript
// Never send correct answer to client
const sanitizeQuestion = (question: Question) => ({
  id: question.id,
  text: question.text,
  options: question.options,
  // ❌ correctAnswer: question.correctAnswer // NEVER SEND THIS
});
```

---

## 📊 Success Metrics

### Primary KPIs (6-Month Targets)

| Metric | Baseline | Target | Measure |
|--------|----------|--------|---------|
| **Engagement** |
| Weekly Active Players | - | 50% of users | % of total users |
| Avg Games per Session | - | 3.5 | Median games played |
| Repeat Play Rate | - | 60% | % playing >1 game/day |
| **Retention** |
| D1 Retention | - | 40% | % return next day |
| D7 Retention | - | 25% | % return after 7 days |
| **Performance** |
| Avg Matchmaking Time | - | <5s | p95 latency |
| Game Completion Rate | - | 85% | % games not abandoned |
| **Satisfaction** |
| Player Satisfaction | - | 4.2/5 | Post-game survey |
| Bot Detection Rate | - | <10% | % correctly identify bot |

---

### Secondary Metrics

- **Coin Economy:** Avg coins earned per player per week
- **Peak Concurrency:** Max simultaneous games
- **Error Rate:** % games with technical errors
- **Virality:** % users sharing results
- **Support Tickets:** Game-related issues per 1000 games

---

### Analytics Events

```typescript
// Track these events in analytics
const gameEvents = {
  // Funnel
  'game_mode_selected': { mode: 'duel' | 'arena' },
  'matchmaking_started': { mode },
  'matchmaking_cancelled': { mode, waitTime },
  'game_started': { mode, lobbyId, playerCount, botCount },
  
  // Gameplay
  'question_answered': { questionId, correct, timeTaken },
  'round_completed': { round, rank, score },
  'player_eliminated': { round },
  
  // Outcomes
  'game_completed': { mode, rank, score, coinsEarned, duration },
  'game_abandoned': { mode, questionNumber, reason },
  
  // Social
  'result_shared': { platform },
  'play_again_clicked': { source: 'results' | 'lobby' }
};
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Core infrastructure + Duel mode

**Tasks:**
- [ ] Database schema creation
- [ ] Supabase Realtime setup
- [ ] Matchmaking logic (human + bot)
- [ ] Question fetching system
- [ ] Zustand store setup
- [ ] Basic UI components (shadcn)
- [ ] Answer validation RPC
- [ ] Scoring algorithm
- [ ] Coin reward system

**Deliverable:** Working 1v1 Duel mode (MVP)

---

### Phase 2: Arena Mode (Week 3-4)

**Goal:** Multi-player elimination

**Tasks:**
- [ ] Arena matchmaking (5 players)
- [ ] Round progression logic
- [ ] Elimination algorithm
- [ ] Round transition UI
- [ ] Spectator mode (eliminated players)
- [ ] Podium results screen
- [ ] Enhanced animations

**Deliverable:** Full Arena mode

---

### Phase 3: Polish & Optimization (Week 5-6)

**Goal:** Production-ready quality

**Tasks:**
- [ ] Performance optimization
- [ ] Error handling & edge cases
- [ ] Anti-cheat measures
- [ ] Bot behavior refinement
- [ ] Analytics integration
- [ ] A/B test framework
- [ ] Responsive design (mobile)
- [ ] Accessibility (WCAG AA)

**Deliverable:** Production-ready feature

---

### Phase 4: Launch & Iterate (Week 7+)

**Goal:** Public release + feedback loop

**Tasks:**
- [ ] Soft launch (10% users)
- [ ] Monitor metrics
- [ ] Bug fixes
- [ ] Feature flags for toggles
- [ ] Gradual rollout (50%, 100%)
- [ ] Post-launch optimizations

**Deliverable:** Fully rolled out to all users

---

## ⚠️ Risk Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Realtime lag (>500ms) | High | Medium | Use Supabase Presence + fallback polling |
| Database overload | High | Low | Connection pooling + read replicas |
| Bot detection | Medium | Medium | Extensive testing + pattern analysis |
| Answer manipulation | High | Low | Server-side validation only |
| Question exhaustion | Medium | Low | Minimum 500 questions + rotation |

---

### Product Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption | High | Medium | A/B test names, UI, rewards |
| Bot complaints | Medium | Medium | User education + transparent FAQ |
| Addiction concerns | Medium | Low | Daily play limits + responsible gaming |
| Coin inflation | Medium | Medium | Economic modeling + adjustable rewards |
| Cheating reports | Low | Low | Anti-cheat measures + reporting system |

---

### Contingency Plans

**If Realtime fails:**
- Fallback to 5-second polling
- Graceful degradation message
- Queue games for later retry

**If matchmaking too slow:**
- Reduce wait time to 5 seconds
- Increase bot probability
- Cross-mode matching (future)

**If bot detection high:**
- Survey users for patterns
- Adjust bot behavior
- Add more human-like quirks

---

## 📝 Appendix

### A. Database Migration Scripts

```sql
-- migrations/001_create_game_tables.sql
-- (See full schema in Data Models section)
```

### B. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Game Config
GAME_MATCHMAKING_TIMEOUT=10000 # 10 seconds
GAME_QUESTION_TIME=45000 # 45 seconds
GAME_MIN_QUESTIONS_POOL=500
GAME_BOT_ACCURACY_MIN=0.5
GAME_BOT_ACCURACY_MAX=0.8

# Feature Flags
FEATURE_ARENA_MODE=true
FEATURE_DUEL_MODE=true
FEATURE_LEADERBOARD=false # Future
```

### C. API Rate Limits

```typescript
// Per user rate limits
const RATE_LIMITS = {
  createLobby: { max: 10, window: 60000 }, // 10/min
  submitAnswer: { max: 50, window: 60000 }, // 50/min
  joinLobby: { max: 20, window: 60000 }, // 20/min
};
```

### D. Testing Checklist

**Unit Tests:**
- [ ] Bot decision logic
- [ ] Scoring algorithm
- [ ] Elimination logic
- [ ] Coin calculation

**Integration Tests:**
- [ ] Matchmaking flow
- [ ] Realtime events
- [ ] Database operations
- [ ] RPC functions

**E2E Tests:**
- [ ] Complete Duel game
- [ ] Complete Arena game
- [ ] Bot vs Human game
- [ ] Disconnection handling

**Load Tests:**
- [ ] 100 concurrent games
- [ ] 1000 concurrent users
- [ ] Database query performance

---

### E. Future Enhancements (Post-Launch)

**Phase 2 Features:**
- Private lobbies (invite friends)
- Custom categories
- Daily tournaments
- Global leaderboard
- Achievement badges
- Replay system
- Practice mode
- Difficulty selection

**Phase 3 Features:**
- Team battles (2v2, 3v3)
- Seasonal rankings
- Premium cosmetics
- Spectator mode
- Live commentary
- Social sharing improvements

---

## 🎯 Final Checklist

Before marking this PRD as complete:

- [ ] All stakeholders reviewed
- [ ] Technical feasibility confirmed
- [ ] Design mockups approved
- [ ] Database schema finalized
- [ ] Security review completed
- [ ] Performance benchmarks set
- [ ] Analytics events defined
- [ ] Launch timeline agreed
- [ ] Success metrics locked
- [ ] Risk mitigation planned

---

**Document Version:** 1.0  
**Last Updated:** January 17, 2026  
**Next Review:** After Phase 1 completion  
**Owner:** Gavelogy Product Team

---

## 🙏 Acknowledgments

This PRD synthesizes best practices from:
- Real-time gaming platforms (Kahoot, Quizizz)
- Battle royale mechanics (PUBG, Fortnite)
- Legal education platforms
- Supabase Realtime documentation

**Ready to build the future of legal education gaming. 🚀**



bot names:
Here you go 👍
Below is a **clean, realistic, teenage-style Indian name pool** suitable for bots.
These names are **common enough to feel real**, **neutral across regions**, and **not celebrity-coded**, so users won’t suspect bots.

You can store them as a static array or seed table.

---

## 🇮🇳 Indian Bot Names (Teen / College-Age Style)

### 👦 Male Names (50)

1. Aarav
2. Vivaan
3. Aditya
4. Arjun
5. Karthik
6. Rohan
7. Sarthak
8. Nikhil
9. Anirudh
10. Yash
11. Varun
12. Siddharth
13. Akshay
14. Pranav
15. Abhishek
16. Rahul
17. Shubham
18. Aman
19. Mohit
20. Kunal
21. Harsh
22. Ayush
23. Dev
24. Aryan
25. Sanjay
26. Manish
27. Vinay
28. Tejas
29. Omkar
30. Tanmay
31. Rajat
32. Piyush
33. Naveen
34. Sumanth
35. Ritesh
36. Sandeep
37. Vishal
38. Aravind
39. Hemant
40. Lalit
41. Suyash
42. Abhinav
43. Chirag
44. Gaurav
45. Pratik
46. Ankit
47. Sameer
48. Mayank
49. Keshav
50. Rohith

---

### 👧 Female Names (50)

51. Ananya
52. Aishwarya
53. Kavya
54. Pooja
55. Nandini
56. Riya
57. Sanya
58. Sneha
59. Shreya
60. Aditi
61. Isha
62. Neha
63. Tanvi
64. Diya
65. Kritika
66. Shruti
67. Muskan
68. Palak
69. Radhika
70. Sakshi
71. Bhavya
72. Meera
73. Vaishnavi
74. Keerthana
75. Swathi
76. Harini
77. Priyanka
78. Anusha
79. Poonam
80. Divya
81. Chaitra
82. Soumya
83. Preethi
84. Anjali
85. Mansi
86. Apeksha
87. Nisha
88. Lavanya
89. Simran
90. Jyoti
91. Pallavi
92. Ritu
93. Shalini
94. Namrata
95. Gayathri
96. Suman
97. Sharmila
98. Reema
99. Kiran
100. Shilpa

---

## ✅ Usage Recommendation (Important)

* **Randomly pick**
* **Ensure no duplicates per lobby**
* **Never reuse same name in same match**
* Mix male/female naturally (not 50-50 always)

Example:

```ts
const botName = BOT_NAMES.filter(n => !usedNames.has(n))
                         .sort(() => 0.5 - Math.random())[0];
```

---

If you want next:

* Add **region-flavored names** (Tamil / Hindi / Telugu mix)
* Add **username-style variants** (Aarav_Law, Riya_Juris)
* Add **avatar matching logic**
* Add **confidence-based name behavior**

Just say the word 🔥


Got it 👍
Here’s **another fresh set of 100 Indian names**, same vibe: **teen / college-age**, realistic, non-celebrity, bot-safe, and mixable across regions.

---

## 🇮🇳 Indian Bot Names – Set 2 (Teen / College Style)

### 👦 Male Names (50)

1. Ayaan
2. Reyansh
3. Ishaan
4. Madhav
5. Neil
6. Hrithik
7. Shaurya
8. Lakshay
9. Uday
10. Darshan
11. Krishna
12. Atharv
13. Parth
14. Raghav
15. Tushar
16. Sahil
17. Jayesh
18. Sagar
19. Deepak
20. Kiran
21. Ajay
22. Vikas
23. Nitesh
24. Armaan
25. Samar
26. Kabir
27. Rakesh
28. Sunil
29. Prashant
30. Naresh
31. Roshan
32. Bharat
33. Dinesh
34. Mukesh
35. Pankaj
36. Ashwin
37. Koushik
38. Tarun
39. Lokesh
40. Mahesh
41. Santhosh
42. Balaji
43. Ranjith
44. Gautam
45. Arvind
46. Jagadeesh
47. Ramesh
48. Bhanu
49. Sreekanth
50. Naren

---

### 👧 Female Names (50)

51. Aarohi
52. Kiara
53. Myra
54. Ira
55. Tanuja
56. Nivedita
57. Anika
58. Srilakshmi
59. Ruchika
60. Komal
61. Payal
62. Aarna
63. Sushma
64. Priti
65. Shweta
66. Rupal
67. Monika
68. Renu
69. Vidya
70. Sunita
71. Shanta
72. Indira
73. Latha
74. Rekha
75. Seema
76. Archana
77. Kalpana
78. Sandhya
79. Usha
80. Madhuri
81. Kalyani
82. Bharti
83. Uma
84. Sangeeta
85. Padmini
86. Shobha
87. Malini
88. Poornima
89. Chandra
90. Sujata
91. Janani
92. Meenakshi
93. Ahalya
94. Revathi
95. Aparna
96. Sharmila
97. Rohini
98. Leela
99. Yamini
100. Charu

---

## 🔒 Bot-Realism Best Practices (Quick Reminder)

* ❌ Never reuse a name inside the same match
* 🎲 Shuffle before assignment
* ⏱ Pair name randomness with **answer timing randomness**
* 🧠 Tie performance (50–80%) to name invisibly (never deterministic)

If you want next:

* 100 **South-India-heavy** names only
* 100 **North-India-heavy** names only
* 100 **gender-neutral usernames**
* Name → avatar → reaction mapping
* Bot personality tiers (Aggressive / Average / Slow thinker)

Just say 🚀
