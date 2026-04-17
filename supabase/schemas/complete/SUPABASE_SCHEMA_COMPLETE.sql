-- ============================================
-- GAVELOGY COMPLETE DATABASE SCHEMA
-- Production-ready schema for analytics and badges
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_coins INTEGER DEFAULT 100,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User courses (purchases)
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  order_index INTEGER DEFAULT 0
);

-- ============================================
-- QUIZ ATTEMPTS & ANALYTICS
-- ============================================

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  accuracy DECIMAL(5,2) NOT NULL, -- percentage
  average_time_per_question DECIMAL(5,2), -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_breakdown JSONB DEFAULT '{}'::jsonb -- {confident: count, guess: count, fluke: count}
);

-- Quiz answers (detailed breakdown)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('confident', 'guess', 'fluke')),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER -- in seconds
);

-- ============================================
-- MOCK TESTS & ATTEMPTS
-- ============================================

-- Mock tests table
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock test questions
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  subject TEXT,
  order_index INTEGER DEFAULT 0
);

-- Mock attempts table
CREATE TABLE IF NOT EXISTS public.mock_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  accuracy DECIMAL(5,2) NOT NULL,
  average_time_per_question DECIMAL(5,2),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock answers (detailed breakdown)
CREATE TABLE IF NOT EXISTS public.mock_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.mock_test_questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('confident', 'guess', 'fluke')),
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER,
  subject TEXT
);

-- ============================================
-- MISTAKES TRACKING
-- ============================================

-- Mistakes table
CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  is_cleared BOOLEAN DEFAULT false,
  cleared_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 1,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'mock')),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- ============================================
-- ACTIVITY & ENGAGEMENT TRACKING
-- ============================================

-- Daily activity table
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  quizzes_completed INTEGER DEFAULT 0,
  mocks_completed INTEGER DEFAULT 0,
  mistakes_cleared INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- User activity log (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz', 'mock', 'mistake_quiz', 'explanation_viewed')),
  activity_id UUID,
  subject TEXT,
  duration INTEGER, -- in seconds
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BADGES SYSTEM
-- ============================================

-- Badge types enum
CREATE TYPE badge_type AS ENUM ('accuracy_champ', 'speedster', 'consistent_learner', 'insight_seeker');
CREATE TYPE badge_level AS ENUM ('bronze', 'silver', 'gold');

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  badge_level badge_level NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional info like quiz count, etc.
  UNIQUE(user_id, badge_type, badge_level)
);

-- Badge progress tracking
CREATE TABLE IF NOT EXISTS public.badge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  current_value INTEGER DEFAULT 0, -- Current count/metric
  bronze_achieved BOOLEAN DEFAULT false,
  silver_achieved BOOLEAN DEFAULT false,
  gold_achieved BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ============================================
-- ANALYTICS & PERFORMANCE
-- ============================================

-- Subject performance tracking
CREATE TABLE IF NOT EXISTS public.subject_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  average_time_per_question DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- Weekly performance summary
CREATE TABLE IF NOT EXISTS public.weekly_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  quizzes_completed INTEGER DEFAULT 0,
  mocks_completed INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  coins_earned INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- ============================================
-- GAMIFICATION
-- ============================================

-- Coin transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'quiz', 'mock', 'streak', 'purchase', etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contemporary cases
CREATE TABLE IF NOT EXISTS public.contemporary_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  subject TEXT NOT NULL,
  case_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment orders
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Quiz attempt indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at);

-- Quiz answer indexes
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON public.quiz_answers(question_id);

-- Mock attempt indexes
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_id ON public.mock_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_mock_test_id ON public.mock_attempts(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_completed_at ON public.mock_attempts(completed_at);

-- Mistake indexes
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON public.mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_question_id ON public.mistakes(question_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_is_cleared ON public.mistakes(is_cleared);
CREATE INDEX IF NOT EXISTS idx_mistakes_subject_id ON public.mistakes(subject_id);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_id ON public.daily_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- Badge indexes
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON public.badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON public.badge_progress(user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subject_performance_user_id ON public.subject_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_user_id ON public.weekly_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_week_start ON public.weekly_performance(week_start);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Quiz attempts - users can only see their own
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mock attempts - users can only see their own
CREATE POLICY "Users can view own mock attempts" ON public.mock_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mock attempts" ON public.mock_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mistakes - users can only see their own
CREATE POLICY "Users can view own mistakes" ON public.mistakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes" ON public.mistakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes" ON public.mistakes
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges - users can only see their own
CREATE POLICY "Users can view own badges" ON public.badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badge progress - users can only see their own
CREATE POLICY "Users can view own badge progress" ON public.badge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own badge progress" ON public.badge_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badge progress" ON public.badge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily activity - users can only see their own
CREATE POLICY "Users can view own daily activity" ON public.daily_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activity" ON public.daily_activity
  FOR ALL USING (auth.uid() = user_id);

-- Activity log - users can only see their own
CREATE POLICY "Users can view own activity log" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subject performance - users can only see their own
CREATE POLICY "Users can view own subject performance" ON public.subject_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subject performance" ON public.subject_performance
  FOR ALL USING (auth.uid() = user_id);

-- Weekly performance - users can only see their own
CREATE POLICY "Users can view own weekly performance" ON public.weekly_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly performance" ON public.weekly_performance
  FOR ALL USING (auth.uid() = user_id);

-- Coin transactions - users can only see their own
CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin transactions" ON public.coin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment orders - users can only see their own
CREATE POLICY "Users can view own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for mistakes table
CREATE TRIGGER update_mistakes_updated_at
  BEFORE UPDATE ON public.mistakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default courses
INSERT INTO public.courses (id, name, description, price) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Static Subjects Course', '13 Law Subjects • 650 Questions • 20 Mock Tests', 1999.00),
  ('550e8400-e29b-41d4-a716-446655440001', 'Contemporary Cases Course', '150 Legal Cases • 2023-2025 • Month Quizzes', 1499.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.badges IS 'Badges earned by users with Bronze/Silver/Gold levels';
COMMENT ON TABLE public.badge_progress IS 'Tracks progress towards badge achievements';
COMMENT ON TABLE public.quiz_attempts IS 'User quiz attempts with performance metrics';
COMMENT ON TABLE public.mock_attempts IS 'User mock test attempts with performance metrics';
COMMENT ON TABLE public.mistakes IS 'User mistakes tracked for review and improvement';
COMMENT ON TABLE public.daily_activity IS 'Daily activity summary for streak and consistency tracking';
COMMENT ON TABLE public.activity_log IS 'Detailed activity log for all user actions';
COMMENT ON TABLE public.subject_performance IS 'Performance metrics per subject';
COMMENT ON TABLE public.weekly_performance IS 'Weekly performance summary for analytics';

