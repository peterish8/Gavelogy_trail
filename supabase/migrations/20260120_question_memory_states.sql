-- =============================================
-- ADVANCED SPACED REPETITION: question_memory_states
-- =============================================
-- This table tracks question-level memory state for the 6-bucket SR system.
-- EXECUTION CONTRACT: See implementation_plan.md for rules.
-- 
-- LOCKED RULES:
-- 1. Bucket is IMMUTABLE after creation
-- 2. Priority is DYNAMIC (computed at runtime)
-- 3. Confidence captured every attempt, but only initial defines bucket
-- =============================================

CREATE TABLE IF NOT EXISTS question_memory_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  quiz_id UUID REFERENCES attached_quizzes(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  
  -- IMMUTABLE: Diagnostic bucket (A-F), set once on initial quiz
  -- A=Confident+Correct, B=50-50+Correct, C=Fluke+Correct
  -- D=Confident+Wrong, E=50-50+Wrong, F=Fluke+Wrong
  bucket TEXT NOT NULL CHECK (bucket IN ('A','B','C','D','E','F')),
  
  -- DYNAMIC: Updated each spaced repetition
  times_shown INT DEFAULT 0,           -- Incremented only when shown in SR (not initial quiz)
  times_correct INT DEFAULT 0,          -- Count of correct SR answers
  last_was_wrong BOOLEAN DEFAULT false, -- For recent-wrong priority boost
  last_shown_at TIMESTAMPTZ,            -- For recency priority calculation
  last_confidence TEXT,                 -- Most recent SR confidence (for priority calc only)
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one memory state per user/quiz/question
  UNIQUE(user_id, quiz_id, question_id)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE question_memory_states ENABLE ROW LEVEL SECURITY;

-- Users can only access their own memory states
CREATE POLICY "Users can view own memory states"
  ON question_memory_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory states"
  ON question_memory_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory states"
  ON question_memory_states FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================
-- Primary lookup: get all memory states for a user+quiz
CREATE INDEX IF NOT EXISTS idx_question_memory_states_user_quiz 
  ON question_memory_states(user_id, quiz_id);

-- For waterfall selection: bucket-based ordering
CREATE INDEX IF NOT EXISTS idx_question_memory_states_bucket 
  ON question_memory_states(user_id, quiz_id, bucket);

-- For recency calculations
CREATE INDEX IF NOT EXISTS idx_question_memory_states_recency 
  ON question_memory_states(user_id, quiz_id, last_shown_at);

-- =============================================
-- COMMENTS (For future developers)
-- =============================================
COMMENT ON TABLE question_memory_states IS 
  'Question-level memory tracking for advanced spaced repetition. 
   Bucket is IMMUTABLE (set once). Priority is DYNAMIC (computed at runtime).';

COMMENT ON COLUMN question_memory_states.bucket IS 
  'IMMUTABLE. Set once based on initial quiz confidence + correctness. NEVER changes.';

COMMENT ON COLUMN question_memory_states.last_confidence IS 
  'Most recent SR confidence rating. Used ONLY for priority weighting, not bucket assignment.';

COMMENT ON COLUMN question_memory_states.times_shown IS 
  'Incremented only during SR recalls, not initial quiz. Starts at 0.';
