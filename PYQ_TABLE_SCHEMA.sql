-- PYQ Subject-Topic Mapping Table
-- This table stores subject and topic classification for each question by year
CREATE TABLE IF NOT EXISTS pyq_subject_topic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Year and Question Identity
  year INTEGER NOT NULL, -- Year of the PYQ (2020, 2021, 2022, etc.)
  question_number INTEGER NOT NULL, -- Sequential question number (1, 2, 3...)
  
  -- Classification
  subject VARCHAR(100) NOT NULL, -- e.g., "Constitutional Law", "Criminal Law", etc.
  topic VARCHAR(200), -- e.g., "Article 16", "Contempt of Court", etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one subject-topic mapping per question
  UNIQUE(year, question_number)
);

-- PYQ Questions Table Schema
-- This table stores Previous Year Questions (PYQs) for all years

CREATE TABLE IF NOT EXISTS pyqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question Identity
  year INTEGER NOT NULL, -- Year of the PYQ (2020, 2021, 2022, etc.)
  question_number INTEGER NOT NULL, -- Sequential question number (1, 2, 3...)
  question_id VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier like "PYQ-2020-01"
  
  -- Question Content
  passage TEXT, -- The passage/context (can be null for standalone questions)
  question TEXT NOT NULL, -- The actual question
  
  -- Multiple Choice Options
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  
  -- Answer & Explanation
  correct_answer VARCHAR(10) NOT NULL, -- "(A)", "(B)", "(C)", "(D)"
 
  -- Source Information
  source_case VARCHAR(500), -- Name of the case/source
  source_page VARCHAR(50), -- Page number reference
  
  -- Metadata
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  marks INTEGER DEFAULT 1, -- Marks assigned to this question
  
  -- Mock Exam Settings
  is_mock_question BOOLEAN DEFAULT false, -- Whether this is a mock exam question
  show_explanation BOOLEAN DEFAULT true, -- Whether to show explanation after submission
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to subject-topic mapping
  FOREIGN KEY (year, question_number) REFERENCES pyq_subject_topic(year, question_number)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pyqs_year ON pyqs(year);
CREATE INDEX IF NOT EXISTS idx_pyqs_year_question_number ON pyqs(year, question_number);
CREATE INDEX IF NOT EXISTS idx_pyqs_question_id ON pyqs(question_id);

-- Indexes for subject-topic table
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic_year ON pyq_subject_topic(year);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic_year_question ON pyq_subject_topic(year, question_number);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic_subject ON pyq_subject_topic(subject);

-- PYQ User Performance Table
-- This table tracks user performance by subject and year
CREATE TABLE IF NOT EXISTS pyq_user_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Identity
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Year and Subject
  year INTEGER NOT NULL,
  subject VARCHAR(100) NOT NULL,
  
  -- Performance Metrics
  total_questions INTEGER DEFAULT 0, -- Total questions attempted in this subject
  correct_answers INTEGER DEFAULT 0, -- Correct answers in this subject
  incorrect_answers INTEGER DEFAULT 0, -- Incorrect answers in this subject
  accuracy_percentage DECIMAL(5, 2) DEFAULT 0.00, -- Accuracy percentage
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one performance record per user per subject per year
  UNIQUE(user_id, year, subject)
);

-- Indexes for user performance table
CREATE INDEX IF NOT EXISTS idx_pyq_user_performance_user_id ON pyq_user_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_user_performance_year ON pyq_user_performance(year);
CREATE INDEX IF NOT EXISTS idx_pyq_user_performance_subject ON pyq_user_performance(subject);

-- Enable Row Level Security (RLS)
ALTER TABLE pyqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_subject_topic ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_user_performance ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to pyqs
CREATE POLICY "Allow public read access to pyqs"
  ON pyqs FOR SELECT
  USING (true);

-- Create policy to allow public read access to subject-topic mapping
CREATE POLICY "Allow public read access to pyq_subject_topic"
  ON pyq_subject_topic FOR SELECT
  USING (true);

-- Create policy to allow users to view their own performance
CREATE POLICY "Allow users to view their own performance"
  ON pyq_user_performance FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own performance
CREATE POLICY "Allow users to insert their own performance"
  ON pyq_user_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own performance
CREATE POLICY "Allow users to update their own performance"
  ON pyq_user_performance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pyqs_updated_at
  BEFORE UPDATE ON pyqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pyq_subject_topic_updated_at
  BEFORE UPDATE ON pyq_subject_topic
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pyq_user_performance_updated_at
  BEFORE UPDATE ON pyq_user_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE pyq_subject_topic IS 'Maps questions to their subjects and topics for classification and performance tracking';
COMMENT ON TABLE pyqs IS 'Stores Previous Year Questions (PYQs) for CLAT PG and LL.M exams';
COMMENT ON COLUMN pyqs.year IS 'Year of the PYQ exam (2020-2025)';
COMMENT ON COLUMN pyqs.passage IS 'Optional passage/context for the question';
COMMENT ON COLUMN pyqs.question_id IS 'Unique identifier like PYQ-2020-01';
COMMENT ON TABLE pyq_user_performance IS 'Tracks user performance by subject to identify weak and strong areas';

