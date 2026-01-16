-- ============================================
-- STREAK POINTS GAMIFICATION SYSTEM
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS)
-- ============================================

-- ============================================
-- 1. STREAK BONUSES TABLE (Milestone rewards)
-- ============================================
CREATE TABLE IF NOT EXISTS streak_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streak_days INTEGER UNIQUE NOT NULL,
  bonus_points INTEGER NOT NULL,
  badge_name TEXT,
  badge_emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert bonus milestones (upsert to avoid duplicates)
INSERT INTO streak_bonuses (streak_days, bonus_points, badge_name, badge_emoji) VALUES
  (3, 5, 'Getting Started', '🌱'),
  (7, 15, 'Week Warrior', '⚡'),
  (14, 30, 'Fortnight Fighter', '🔥'),
  (21, 50, 'Three Week Champion', '💪'),
  (30, 100, 'Monthly Master', '👑')
ON CONFLICT (streak_days) DO UPDATE SET
  bonus_points = EXCLUDED.bonus_points,
  badge_name = EXCLUDED.badge_name,
  badge_emoji = EXCLUDED.badge_emoji;

-- Enable RLS
ALTER TABLE streak_bonuses ENABLE ROW LEVEL SECURITY;

-- Everyone can view bonuses (read-only reference data)
DROP POLICY IF EXISTS "Everyone can view bonuses" ON streak_bonuses;
CREATE POLICY "Everyone can view bonuses"
ON streak_bonuses FOR SELECT TO public USING (true);

-- ============================================
-- 2. USER POINTS TABLE (Monthly & All-time)
-- ============================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  month DATE NOT NULL, -- First day of month (e.g., 2026-01-01)
  monthly_points INTEGER DEFAULT 0,
  all_time_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view leaderboard points" ON user_points;
DROP POLICY IF EXISTS "Users can insert own points" ON user_points;
DROP POLICY IF EXISTS "Users can update own points" ON user_points;

-- Everyone can view leaderboard (public)
CREATE POLICY "Everyone can view leaderboard points"
ON user_points FOR SELECT TO public USING (true);

-- Users can insert their own points
CREATE POLICY "Users can insert own points"
ON user_points FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own points
CREATE POLICY "Users can update own points"
ON user_points FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. UPDATE USER_STREAKS TABLE
-- ============================================
-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_streaks' AND column_name = 'bonuses_claimed') THEN
    ALTER TABLE user_streaks ADD COLUMN bonuses_claimed INTEGER[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- 4. FUNCTION: Award Daily Point & Check Bonuses
-- ============================================
CREATE OR REPLACE FUNCTION award_streak_point(
  p_user_id UUID,
  p_username TEXT
)
RETURNS TABLE(
  points_awarded INTEGER,
  bonus_awarded INTEGER,
  new_streak INTEGER,
  badge_earned TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak INTEGER;
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_base_points INTEGER := 1;
  v_bonus_points INTEGER := 0;
  v_badge TEXT := NULL;
  v_bonuses_claimed INTEGER[];
BEGIN
  -- Get or create user streak
  SELECT current_streak, last_activity_date, COALESCE(bonuses_claimed, '{}')
  INTO v_current_streak, v_last_activity, v_bonuses_claimed
  FROM user_streaks
  WHERE user_id = p_user_id;

  -- If no record, create one
  IF v_current_streak IS NULL THEN
    INSERT INTO user_streaks (user_id, username, current_streak, last_activity_date, bonuses_claimed)
    VALUES (p_user_id, p_username, 0, NULL, '{}');
    v_current_streak := 0;
    v_bonuses_claimed := '{}';
  END IF;

  -- Check if already logged today
  IF v_last_activity = v_today THEN
    -- Already logged today, return zeros
    RETURN QUERY SELECT 0, 0, v_current_streak, NULL::TEXT;
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_activity = v_today - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_activity IS NULL OR v_last_activity < v_today - INTERVAL '1 day' THEN
    -- Streak broken or first activity - reset to 1
    v_current_streak := 1;
    v_bonuses_claimed := '{}'; -- Reset claimed bonuses for new streak
  END IF;

  -- Check for bonus milestone
  SELECT bonus_points, badge_emoji || ' ' || badge_name
  INTO v_bonus_points, v_badge
  FROM streak_bonuses
  WHERE streak_days = v_current_streak
    AND streak_days != ALL(v_bonuses_claimed);

  -- Mark bonus as claimed if earned
  IF v_bonus_points > 0 THEN
    v_bonuses_claimed := array_append(v_bonuses_claimed, v_current_streak);
  ELSE
    v_bonus_points := 0;
  END IF;

  -- Update user streak
  UPDATE user_streaks
  SET current_streak = v_current_streak,
      last_activity_date = v_today,
      bonuses_claimed = v_bonuses_claimed,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Update or insert user points for this month
  INSERT INTO user_points (user_id, username, month, monthly_points, all_time_points)
  VALUES (p_user_id, p_username, v_month_start, v_base_points + v_bonus_points, v_base_points + v_bonus_points)
  ON CONFLICT (user_id, month) DO UPDATE SET
    monthly_points = user_points.monthly_points + v_base_points + v_bonus_points,
    all_time_points = user_points.all_time_points + v_base_points + v_bonus_points,
    updated_at = now();

  -- Return results
  RETURN QUERY SELECT v_base_points, v_bonus_points, v_current_streak, v_badge;
END;
$$;

-- ============================================
-- 5. FUNCTION: Get Current Month Leaderboard
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  monthly_points INTEGER,
  all_time_points INTEGER,
  current_streak INTEGER,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.username,
    up.monthly_points,
    up.all_time_points,
    COALESCE(us.current_streak, 0) as current_streak,
    ROW_NUMBER() OVER (ORDER BY up.monthly_points DESC, up.all_time_points DESC) as rank
  FROM user_points up
  LEFT JOIN user_streaks us ON up.user_id = us.user_id
  WHERE up.month = v_month_start
  ORDER BY up.monthly_points DESC, up.all_time_points DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_points_month ON user_points(month);
CREATE INDEX IF NOT EXISTS idx_user_points_monthly_points ON user_points(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_user_month ON user_points(user_id, month);
