-- ============================================
-- USER_STREAKS TABLE FOR LEADERBOARD
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS)
-- ============================================

-- Create the user_streaks table (safe to re-run)
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_cases_studied INTEGER DEFAULT 0,
  total_pyq_attempted INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Drop first to avoid conflicts)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view leaderboard" ON user_streaks;
DROP POLICY IF EXISTS "Users can create own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streak" ON user_streaks;
DROP POLICY IF EXISTS "Users can delete own streak" ON user_streaks;

-- Everyone can view the leaderboard (read all streaks)
CREATE POLICY "Everyone can view leaderboard"
ON user_streaks
FOR SELECT
TO public
USING (true);

-- Users can insert their own streak
CREATE POLICY "Users can create own streak"
ON user_streaks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own streak
CREATE POLICY "Users can update own streak"
ON user_streaks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own streak
CREATE POLICY "Users can delete own streak"
ON user_streaks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- RPC FUNCTIONS (CREATE OR REPLACE is safe)
-- ============================================

-- Function to initialize user streak
CREATE OR REPLACE FUNCTION initialize_user_streak(user_uuid UUID, user_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_streaks (user_id, username)
  VALUES (user_uuid, user_name)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  user_uuid UUID,
  activity_type TEXT,
  score_points INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current streak info
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE user_id = user_uuid;

  -- Calculate new streak
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day - increment
    v_new_streak := v_current_streak + 1;
  ELSIF v_last_activity = CURRENT_DATE THEN
    -- Same day - keep streak
    v_new_streak := v_current_streak;
  ELSE
    -- Streak broken - reset
    v_new_streak := 1;
  END IF;

  -- Update longest if needed
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;

  -- Update the record
  UPDATE user_streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    total_score = total_score + score_points,
    last_activity_date = CURRENT_DATE,
    total_quizzes_completed = CASE WHEN activity_type = 'quiz' THEN total_quizzes_completed + 1 ELSE total_quizzes_completed END,
    total_cases_studied = CASE WHEN activity_type = 'case_study' THEN total_cases_studied + 1 ELSE total_cases_studied END,
    total_pyq_attempted = CASE WHEN activity_type = 'pyq' THEN total_pyq_attempted + 1 ELSE total_pyq_attempted END,
    updated_at = now()
  WHERE user_id = user_uuid;
END;
$$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak ON user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_total_score ON user_streaks(total_score DESC);
