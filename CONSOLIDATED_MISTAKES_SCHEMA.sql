-- ============================================
-- CONSOLIDATED MISTAKES SCHEMA
-- A single, normalized table for tracking all user mistakes
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE mistake_source AS ENUM ('static_quiz', 'contemporary_quiz', 'pyq_quiz', 'mock_test');
CREATE TYPE confidence_level AS ENUM ('confident', 'educated_guess', 'fluke');

-- ============================================
-- CONSOLIDATED MISTAKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.consolidated_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL, -- Flexible to handle different question ID types
  source_type mistake_source NOT NULL,
  source_id TEXT, -- ID of the quiz, mock, etc.
  subject TEXT,
  topic TEXT,

  -- Core Mistake Data
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence confidence_level,

  -- Tracking & Remediation
  is_mastered BOOLEAN DEFAULT false,
  mastered_at TIMESTAMP WITH TIME ZONE,
  retake_count INTEGER DEFAULT 0,
  last_retake_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consolidated_mistakes_user_id ON public.consolidated_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_mistakes_question_id ON public.consolidated_mistakes(question_id);
CREATE INDEX IF NOT EXISTS idx_consolidated_mistakes_subject ON public.consolidated_mistakes(subject);
CREATE INDEX IF NOT EXISTS idx_consolidated_mistakes_topic ON public.consolidated_mistakes(topic);
CREATE INDEX IF NOT EXISTS idx_consolidated_mistakes_is_mastered ON public.consolidated_mistakes(is_mastered);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.consolidated_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mistakes"
ON public.consolidated_mistakes
FOR ALL
USING (auth.uid() = user_id);

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

-- Trigger for consolidated_mistakes table
CREATE TRIGGER update_consolidated_mistakes_updated_at
  BEFORE UPDATE ON public.consolidated_mistakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.consolidated_mistakes IS 'A unified table for tracking user mistakes across all types of questions.';
COMMENT ON COLUMN public.consolidated_mistakes.question_id IS 'Can reference questions from various tables (static, contemporary, PYQ).';
COMMENT ON COLUMN public.consolidated_mistakes.source_type IS 'The type of quiz or test where the mistake occurred.';
