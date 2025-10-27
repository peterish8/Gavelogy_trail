-- Enable RLS and create policies for PYQ tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on pyqs_2020 table
ALTER TABLE pyqs_2020 ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to pyqs_2020" ON pyqs_2020;

-- Create policy to allow public read access to pyqs_2020
CREATE POLICY "Allow public read access to pyqs_2020"
  ON pyqs_2020 FOR SELECT
  USING (true);

-- Enable RLS on pyq_subject_topic table
ALTER TABLE pyq_subject_topic ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access to pyq_subject_topic" ON pyq_subject_topic;

-- Create policy to allow public read access to subject-topic mapping
CREATE POLICY "Allow public read access to pyq_subject_topic"
  ON pyq_subject_topic FOR SELECT
  USING (true);

-- Enable RLS on pyq_user_performance table
ALTER TABLE pyq_user_performance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their own performance" ON pyq_user_performance;
DROP POLICY IF EXISTS "Allow users to insert their own performance" ON pyq_user_performance;
DROP POLICY IF EXISTS "Allow users to update their own performance" ON pyq_user_performance;

-- Create policies for user performance
CREATE POLICY "Allow users to view their own performance"
  ON pyq_user_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own performance"
  ON pyq_user_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own performance"
  ON pyq_user_performance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify policies are created
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('pyqs_2020', 'pyq_subject_topic', 'pyq_user_performance');

