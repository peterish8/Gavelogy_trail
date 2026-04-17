-- Gavelogy Database Schema
-- This file contains all the tables needed for the CLAT PG preparation platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  total_coins INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User courses (purchases)
CREATE TABLE user_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Subjects table
CREATE TABLE subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL
);

-- Questions table
CREATE TABLE questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz answers table
CREATE TABLE quiz_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  confidence TEXT NOT NULL CHECK (confidence IN ('confident', 'guess', 'fluke')),
  is_correct BOOLEAN NOT NULL
);

-- Mistakes table (core feature)
CREATE TABLE mistakes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  review_count INTEGER NOT NULL DEFAULT 1,
  source_type TEXT NOT NULL CHECK (source_type IN ('quiz', 'mock')),
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Mock tests table
CREATE TABLE mock_tests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Mock test questions (many-to-many relationship)
CREATE TABLE mock_test_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE(mock_test_id, question_id)
);

-- Mock attempts table
CREATE TABLE mock_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock answers table
CREATE TABLE mock_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  attempt_id UUID REFERENCES mock_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  confidence TEXT CHECK (confidence IN ('confident', 'guess', 'fluke')),
  is_correct BOOLEAN,
  is_attempted BOOLEAN DEFAULT false
);

-- Contemporary cases table
CREATE TABLE contemporary_cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  subject TEXT NOT NULL,
  case_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contemporary case questions
CREATE TABLE contemporary_case_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES contemporary_cases(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Coin transactions table
CREATE TABLE coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'quiz', 'mock', 'streak', etc.
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment orders table
CREATE TABLE payment_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT DEFAULT 'placeholder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard view (for performance)
CREATE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.total_coins,
  u.streak_count,
  RANK() OVER (ORDER BY u.total_coins DESC) as rank
FROM users u
WHERE u.total_coins > 0
ORDER BY u.total_coins DESC;

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_coins ON users(total_coins DESC);
CREATE INDEX idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX idx_quiz_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_mistakes_user_subject ON mistakes(user_id, subject_id);
CREATE INDEX idx_mistakes_review_count ON mistakes(review_count) WHERE review_count > 0;
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_mock_attempts_user ON mock_attempts(user_id);
CREATE INDEX idx_contemporary_cases_year_month ON contemporary_cases(year, month);
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_payment_orders_user ON payment_orders(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own courses" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz answers" ON quiz_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own quiz answers" ON quiz_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own mistakes" ON mistakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistakes" ON mistakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistakes" ON mistakes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mock attempts" ON mock_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock attempts" ON mock_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own mock answers" ON mock_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM mock_attempts WHERE id = mock_answers.attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own mock answers" ON mock_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM mock_attempts WHERE id = mock_answers.attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own mock answers" ON mock_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM mock_attempts WHERE id = mock_answers.attempt_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coin transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public tables (no RLS needed)
-- courses, subjects, quizzes, questions, mock_tests, contemporary_cases, contemporary_case_questions

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mistakes_updated_at BEFORE UPDATE ON mistakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user coins
CREATE OR REPLACE FUNCTION add_user_coins(user_uuid UUID, coin_amount INTEGER, source_text TEXT, description_text TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert transaction record
    INSERT INTO coin_transactions (user_id, amount, source, description)
    VALUES (user_uuid, coin_amount, source_text, description_text);
    
    -- Update user's total coins
    UPDATE users 
    SET total_coins = total_coins + coin_amount
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    last_activity DATE;
    current_streak INTEGER;
    longest_streak INTEGER;
    new_streak INTEGER := 1;
BEGIN
    -- Get user's current streak data
    SELECT last_activity_date, streak_count, longest_streak
    INTO last_activity, current_streak, longest_streak
    FROM users
    WHERE id = user_uuid;
    
    -- Calculate new streak
    IF last_activity IS NOT NULL THEN
        IF last_activity = today_date THEN
            -- Already counted today, no change
            new_streak := current_streak;
        ELSIF last_activity = today_date - INTERVAL '1 day' THEN
            -- Continuing streak
            new_streak := current_streak + 1;
        ELSE
            -- Streak broken, start new one
            new_streak := 1;
        END IF;
    END IF;
    
    -- Update longest streak if needed
    IF new_streak > longest_streak THEN
        longest_streak := new_streak;
    END IF;
    
    -- Update user record
    UPDATE users
    SET 
        streak_count = new_streak,
        longest_streak = longest_streak,
        last_activity_date = today_date
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial courses
INSERT INTO courses (id, name, description, price) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Static Subjects Course', '13 Law Subjects • 650 Questions • 20 Mock Tests', 1999.00),
('550e8400-e29b-41d4-a716-446655440002', 'Contemporary Cases Course', '150 Legal Cases • 2023-2025 • Month Quizzes', 1499.00);

-- Insert subjects for Static Subjects Course
INSERT INTO subjects (id, name, description, course_id, order_index) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Constitutional Law', 'Fundamental rights, directive principles, and constitutional provisions', '550e8400-e29b-41d4-a716-446655440001', 1),
('650e8400-e29b-41d4-a716-446655440002', 'Criminal Law', 'IPC, CrPC, and criminal jurisprudence', '550e8400-e29b-41d4-a716-446655440001', 2),
('650e8400-e29b-41d4-a716-446655440003', 'Contract Law', 'Indian Contract Act and related provisions', '550e8400-e29b-41d4-a716-446655440001', 3),
('650e8400-e29b-41d4-a716-446655440004', 'Torts', 'Law of torts and civil wrongs', '550e8400-e29b-41d4-a716-446655440001', 4),
('650e8400-e29b-41d4-a716-446655440005', 'Administrative Law', 'Administrative actions and judicial review', '550e8400-e29b-41d4-a716-446655440001', 5),
('650e8400-e29b-41d4-a716-446655440006', 'Jurisprudence', 'Legal theory and philosophy of law', '550e8400-e29b-41d4-a716-446655440001', 6),
('650e8400-e29b-41d4-a716-446655440007', 'Environmental Law', 'Environmental protection and conservation laws', '550e8400-e29b-41d4-a716-446655440001', 7),
('650e8400-e29b-41d4-a716-446655440008', 'Property Law', 'Transfer of Property Act and related laws', '550e8400-e29b-41d4-a716-446655440001', 8),
('650e8400-e29b-41d4-a716-446655440009', 'Family Law', 'Hindu Marriage Act, Muslim law, and family relations', '550e8400-e29b-41d4-a716-446655440001', 9),
('650e8400-e29b-41d4-a716-446655440010', 'Labour Law', 'Industrial disputes and labor relations', '550e8400-e29b-41d4-a716-446655440001', 10),
('650e8400-e29b-41d4-a716-446655440011', 'Tax Law', 'Income Tax Act and GST provisions', '550e8400-e29b-41d4-a716-446655440001', 11),
('650e8400-e29b-41d4-a716-446655440012', 'Corporate Law', 'Companies Act and corporate governance', '550e8400-e29b-41d4-a716-446655440001', 12),
('650e8400-e29b-41d4-a716-446655440013', 'Intellectual Property Rights', 'Copyright, trademark, and patent laws', '550e8400-e29b-41d4-a716-446655440001', 13);
