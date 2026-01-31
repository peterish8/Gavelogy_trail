-- Drop existing table if exists
DROP TABLE IF EXISTS quiz_attempts CASCADE;

-- Create quiz_attempts table for storing all quiz attempts
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Quiz identification
  subject TEXT NOT NULL, -- "Contemporary Cases", "PYQ", "Demo Quiz"
  topic TEXT NOT NULL,   -- Case name or topic name
  quiz_type TEXT DEFAULT 'quiz', -- 'quiz', 'mock', 'practice'
  
  -- Quiz results
  score INTEGER NOT NULL,           -- Number of correct answers
  total_questions INTEGER NOT NULL, -- Total questions in quiz
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions > 0 THEN (score::DECIMAL / total_questions * 100)
      ELSE 0 
    END
  ) STORED, -- Auto-calculated percentage
  
  -- Timing
  time_spent INTEGER NOT NULL, -- Time in seconds
  
  -- Metadata
  quiz_id TEXT,           -- Optional quiz identifier
  questions_data JSONB,   -- Store question IDs and answers
  confidence_data JSONB,  -- Store confidence levels
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at DESC);
CREATE INDEX idx_quiz_attempts_subject ON quiz_attempts(subject);

-- Enable RLS (Row Level Security)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-delete old quiz attempts (keep only latest 30 per user)
CREATE OR REPLACE FUNCTION cleanup_old_quiz_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old attempts, keeping only the latest 30 for the user
  DELETE FROM quiz_attempts 
  WHERE user_id = NEW.user_id 
    AND id NOT IN (
      SELECT id FROM quiz_attempts 
      WHERE user_id = NEW.user_id 
      ORDER BY created_at DESC 
      LIMIT 30
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup after each insert
CREATE TRIGGER trigger_cleanup_quiz_attempts
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_quiz_attempts();