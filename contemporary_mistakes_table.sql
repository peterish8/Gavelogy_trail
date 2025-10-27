-- Create contemporary_mistakes table for storing quiz mistakes
CREATE TABLE contemporary_mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  user_answer_text TEXT,
  correct_answer TEXT NOT NULL,
  correct_answer_text TEXT,
  explanation TEXT,
  subject TEXT NOT NULL,
  topic TEXT,
  confidence_level TEXT DEFAULT 'confident',
  is_mastered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE contemporary_mistakes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own mistakes" ON contemporary_mistakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistakes" ON contemporary_mistakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistakes" ON contemporary_mistakes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mistakes" ON contemporary_mistakes FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_contemporary_mistakes_user_id ON contemporary_mistakes(user_id);
CREATE INDEX idx_contemporary_mistakes_question_id ON contemporary_mistakes(question_id);