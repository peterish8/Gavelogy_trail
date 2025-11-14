-- ============================================
-- NORMALIZED QUIZ_ATTEMPTS SCHEMA
-- Refactoring quiz_attempts to normalize JSON data
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE confidence_level AS ENUM ('confident', 'educated_guess', 'fluke');

-- ============================================
-- NORMALIZED QUIZ_ATTEMPTS TABLES
-- ============================================

-- Main quiz_attempts table (summary data)
CREATE TABLE IF NOT EXISTS public.quiz_attempts_normalized (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE, -- Assuming a quizzes table exists
  subject TEXT,
  topic TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  time_spent INTEGER, -- Total time in seconds

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed quiz_answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers_detailed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES public.quiz_attempts_normalized(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  confidence confidence_level,
  time_spent INTEGER -- Time per question in seconds
);


-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_normalized_user_id ON public.quiz_attempts_normalized(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_normalized_quiz_id ON public.quiz_attempts_normalized(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_detailed_attempt_id ON public.quiz_answers_detailed(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_detailed_question_id ON public.quiz_answers_detailed(question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.quiz_attempts_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers_detailed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz attempts"
ON public.quiz_attempts_normalized
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own detailed answers"
ON public.quiz_answers_detailed
FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.quiz_attempts_normalized WHERE id = attempt_id));

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.quiz_attempts_normalized IS 'Stores summary data for each quiz attempt.';
COMMENT ON TABLE public.quiz_answers_detailed IS 'Stores detailed, per-question data for each quiz attempt, normalizing the previous JSON structure.';
