-- Create table to track user case completion status
CREATE TABLE IF NOT EXISTS user_case_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  year TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, case_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_case_completion_user_id ON user_case_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_user_case_completion_case_number ON user_case_completion(case_number);
CREATE INDEX IF NOT EXISTS idx_user_case_completion_year ON user_case_completion(year);

-- Enable RLS
ALTER TABLE user_case_completion ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own completion data
CREATE POLICY "Users can view their own case completion"
ON user_case_completion FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own completion data
CREATE POLICY "Users can insert their own case completion"
ON user_case_completion FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own completion data
CREATE POLICY "Users can update their own case completion"
ON user_case_completion FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to delete their own completion data
CREATE POLICY "Users can delete their own case completion"
ON user_case_completion FOR DELETE
USING (auth.uid() = user_id);

