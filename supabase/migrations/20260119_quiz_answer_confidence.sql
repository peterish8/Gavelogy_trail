-- Quiz Answer Confidence Tracking Table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS quiz_answer_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES attached_quizzes(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_was_correct BOOLEAN NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('confident', '50/50', 'fluke')),
  is_initial_attempt BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_confidence_user_id ON quiz_answer_confidence(user_id);
CREATE INDEX IF NOT EXISTS idx_confidence_quiz_id ON quiz_answer_confidence(quiz_id);
CREATE INDEX IF NOT EXISTS idx_confidence_created_at ON quiz_answer_confidence(created_at DESC);

-- Row Level Security Policies
ALTER TABLE quiz_answer_confidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own confidence ratings"
  ON quiz_answer_confidence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own confidence ratings"
  ON quiz_answer_confidence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all confidence ratings"
  ON quiz_answer_confidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );
