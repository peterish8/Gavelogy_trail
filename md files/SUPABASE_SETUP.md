# Gavelogy Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password
4. Wait for the project to be created

## 2. Get Your Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy your Project URL and anon public key
3. Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Set Up Database Schema

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  total_coins INTEGER DEFAULT 100,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_courses table
CREATE TABLE user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create subjects table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('confident', 'guess', 'fluke')) NOT NULL,
  is_correct BOOLEAN NOT NULL
);

-- Create mistakes table
CREATE TABLE mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  source_type TEXT CHECK (source_type IN ('quiz', 'mock')) NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mock_tests table
CREATE TABLE mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create mock_attempts table
CREATE TABLE mock_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contemporary_cases table
CREATE TABLE contemporary_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  subject TEXT NOT NULL,
  case_summary TEXT NOT NULL
);

-- Create coin_transactions table
CREATE TABLE coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_orders table
CREATE TABLE payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own courses" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON quiz_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own answers" ON quiz_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own mistakes" ON mistakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistakes" ON mistakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistakes" ON mistakes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mock attempts" ON mock_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock attempts" ON mock_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contemporary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX idx_mistakes_question_id ON mistakes(question_id);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON payment_orders(order_id);
```

## 4. Set Up Google OAuth

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Set redirect URL to: `https://your-project-id.supabase.co/auth/v1/callback`

## 5. Insert Sample Data

After setting up the schema, you can insert sample courses and subjects:

```sql
-- Insert sample courses
INSERT INTO courses (id, name, description, price) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Static Subjects Course', '13 Law Subjects • 650 Questions • 20 Mock Tests', 1999.00),
('550e8400-e29b-41d4-a716-446655440002', 'Contemporary Cases Course', '150 Legal Cases • 2023-2025 • Month Quizzes', 1499.00);

-- Insert sample subjects
INSERT INTO subjects (id, name, description, course_id, order_index) VALUES
('subj-001', 'Constitutional Law', 'Fundamental Rights, DPSP, Constitutional Provisions', '550e8400-e29b-41d4-a716-446655440001', 1),
('subj-002', 'Jurisprudence', 'Legal Theory, Sources of Law, Legal Concepts', '550e8400-e29b-41d4-a716-446655440001', 2),
('subj-003', 'Administrative Law', 'Administrative Actions, Judicial Review', '550e8400-e29b-41d4-a716-446655440001', 3),
('subj-004', 'Contract Law', 'Indian Contract Act, Breach of Contract', '550e8400-e29b-41d4-a716-446655440001', 4),
('subj-005', 'Tort Law', 'Negligence, Nuisance, Defamation', '550e8400-e29b-41d4-a716-446655440001', 5),
('subj-006', 'Criminal Law', 'IPC, CrPC, Evidence Act', '550e8400-e29b-41d4-a716-446655440001', 6),
('subj-007', 'Family Law', 'Hindu Law, Muslim Law, Special Marriage Act', '550e8400-e29b-41d4-a716-446655440001', 7),
('subj-008', 'Property Law', 'Transfer of Property Act, Succession Laws', '550e8400-e29b-41d4-a716-446655440001', 8),
('subj-009', 'Company Law', 'Companies Act, Corporate Governance', '550e8400-e29b-41d4-a716-446655440001', 9),
('subj-010', 'Labour Law', 'Industrial Disputes Act, Labour Welfare', '550e8400-e29b-41d4-a716-446655440001', 10),
('subj-011', 'Tax Law', 'Income Tax Act, GST, Corporate Tax', '550e8400-e29b-41d4-a716-446655440001', 11),
('subj-012', 'Environmental Law', 'Environmental Protection, Forest Conservation', '550e8400-e29b-41d4-a716-446655440001', 12),
('subj-013', 'International Law', 'Public International Law, Treaties', '550e8400-e29b-41d4-a716-446655440001', 13);
```

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Try signing up with email/password
3. Try Google sign-in
4. Check if data is being saved to Supabase

## 7. Production Deployment

1. Update your environment variables in production
2. Set up proper domain in Google OAuth settings
3. Update redirect URLs for production domain
4. Enable email confirmations if needed

## Next Steps

Once Supabase is set up, you can:

1. Add questions for each subject
2. Set up mock tests
3. Configure payment processing
4. Add analytics and reporting features
