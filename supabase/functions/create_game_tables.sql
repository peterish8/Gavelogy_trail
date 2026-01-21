-- ============================================
-- Game Lobbies
-- ============================================
CREATE TABLE IF NOT EXISTS game_lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('duel', 'arena')),
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
  question_ids JSONB NOT NULL, -- Array of question IDs
  current_round INT DEFAULT 1,
  max_rounds INT DEFAULT 1, -- 1 for duel, 4 for arena
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_game_lobbies_status ON game_lobbies(status);
CREATE INDEX IF NOT EXISTS idx_game_lobbies_mode ON game_lobbies(mode);
CREATE INDEX IF NOT EXISTS idx_game_lobbies_created ON game_lobbies(created_at DESC);

-- ============================================
-- Game Players
-- ============================================
CREATE TABLE IF NOT EXISTS game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, 
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  current_question INT DEFAULT 0,
  eliminated_round INT, 
  final_rank INT, 
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lobby_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_players_lobby ON game_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON game_players(user_id);

-- ============================================
-- Game Answers
-- ============================================
CREATE TABLE IF NOT EXISTS game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES game_players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  round INT NOT NULL,
  question_order INT NOT NULL, 
  answer TEXT, 
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INT NOT NULL, 
  points_earned INT DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_game_answers_lobby ON game_answers(lobby_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_player ON game_answers(player_id);

-- ============================================
-- Game Events
-- ============================================
CREATE TABLE IF NOT EXISTS game_events (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_events_lobby ON game_events(lobby_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);

-- ============================================
-- Coin Transactions (Audit Log)
-- ============================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lobby_id UUID NOT NULL REFERENCES game_lobbies(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lobby_id) -- Prevent duplicate rewards per game
);

CREATE INDEX IF NOT EXISTS idx_coin_txn_user ON coin_transactions(user_id);

-- ============================================
-- Safe Realtime Enablement
-- ============================================
-- Only add to publication if not already a member to avoid 42710 error
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'game_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
    END IF;
END $$;

-- ============================================
-- Add Coins to Users (Safe)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE users ADD COLUMN coins INT DEFAULT 0;
    END IF;
END $$;
