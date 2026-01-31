-- Idempotent setup for mistakes table
-- Run this in Supabase SQL Editor

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure all columns exist (idempotent additions)
DO $$ 
BEGIN 
  -- Core fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'user_id') THEN
    ALTER TABLE mistakes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'question_id') THEN
    ALTER TABLE mistakes ADD COLUMN question_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'question_text') THEN
    ALTER TABLE mistakes ADD COLUMN question_text TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'user_answer') THEN
    ALTER TABLE mistakes ADD COLUMN user_answer TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'correct_answer') THEN
    ALTER TABLE mistakes ADD COLUMN correct_answer TEXT;
  END IF;

  -- Optional text fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'user_answer_text') THEN
    ALTER TABLE mistakes ADD COLUMN user_answer_text TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'correct_answer_text') THEN
    ALTER TABLE mistakes ADD COLUMN correct_answer_text TEXT;
  END IF;

  -- Options
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'option_a') THEN
    ALTER TABLE mistakes ADD COLUMN option_a TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'option_b') THEN
    ALTER TABLE mistakes ADD COLUMN option_b TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'option_c') THEN
    ALTER TABLE mistakes ADD COLUMN option_c TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'option_d') THEN
    ALTER TABLE mistakes ADD COLUMN option_d TEXT;
  END IF;

  -- Context fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'explanation') THEN
    ALTER TABLE mistakes ADD COLUMN explanation TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'subject') THEN
    ALTER TABLE mistakes ADD COLUMN subject TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'topic') THEN
    ALTER TABLE mistakes ADD COLUMN topic TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'confidence_level') THEN
    ALTER TABLE mistakes ADD COLUMN confidence_level TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'retake_count') THEN
    ALTER TABLE mistakes ADD COLUMN retake_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mistakes' AND column_name = 'is_mastered') THEN
    ALTER TABLE mistakes ADD COLUMN is_mastered BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can insert own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can update own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can delete own mistakes" ON mistakes;

-- 5. Re-create policies
CREATE POLICY "Users can view own mistakes" ON mistakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes" ON mistakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes" ON mistakes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mistakes" ON mistakes
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Indexes (IF NOT EXISTS is built-in)
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_question_id ON mistakes(question_id);
