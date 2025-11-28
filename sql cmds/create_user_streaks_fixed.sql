-- Create user_streaks table to store user streaks and statistics
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_cases_studied INTEGER DEFAULT 0,
  total_pyq_attempted INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_username ON user_streaks(username);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak ON user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_total_score ON user_streaks(total_score DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all streaks for leaderboard" ON user_streaks
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own streak" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak" ON user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_streaks_updated_at 
  BEFORE UPDATE ON user_streaks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_streaks_updated_at();

-- Create function to initialize user streak on first activity
CREATE OR REPLACE FUNCTION initialize_user_streak(user_uuid UUID, user_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_streaks (user_id, username, current_streak, longest_streak, total_quizzes_completed, total_cases_studied, total_pyq_attempted, total_score, last_activity_date)
  VALUES (user_uuid, user_name, 0, 0, 0, 0, 0, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ language 'plpgsql';

-- Create function to update streak on activity
CREATE OR REPLACE FUNCTION update_user_streak(
  user_uuid UUID,
  activity_type TEXT,
  score_points INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  last_activity_val DATE;
  current_streak_val INTEGER;
BEGIN
  -- Get or create user streak record
  INSERT INTO user_streaks (user_id, username, current_streak, longest_streak, total_quizzes_completed, total_cases_studied, total_pyq_attempted, total_score, last_activity_date)
  VALUES (user_uuid, COALESCE((SELECT full_name FROM auth.users WHERE id = user_uuid), 'User'), 0, 0, 0, 0, 0, 0, current_date_val)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current streak data
  SELECT last_activity_date, current_streak INTO last_activity_val, current_streak_val
  FROM user_streaks WHERE user_id = user_uuid;

  -- Update streak based on activity
  IF last_activity_val = current_date_val THEN
    -- Already updated today, just update counters
    UPDATE user_streaks SET
      total_score = total_score + score_points,
      updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSIF last_activity_val = current_date_val - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      total_score = total_score + score_points,
      last_activity_date = current_date_val,
      updated_at = NOW()
    WHERE user_id = user_uuid;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_streaks SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      total_score = total_score + score_points,
      last_activity_date = current_date_val,
      updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;

  -- Update activity-specific counters
  CASE activity_type
    WHEN 'quiz' THEN
      UPDATE user_streaks SET total_quizzes_completed = total_quizzes_completed + 1 WHERE user_id = user_uuid;
    WHEN 'case_study' THEN
      UPDATE user_streaks SET total_cases_studied = total_cases_studied + 1 WHERE user_id = user_uuid;
    WHEN 'pyq' THEN
      UPDATE user_streaks SET total_pyq_attempted = total_pyq_attempted + 1 WHERE user_id = user_uuid;
  END CASE;
END;
$$ language 'plpgsql';
