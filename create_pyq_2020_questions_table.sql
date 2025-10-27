-- Create pyq_2020_questions table
CREATE TABLE IF NOT EXISTS pyq_2020_questions (
    id SERIAL PRIMARY KEY,
    passage_number INTEGER NOT NULL,
    passage TEXT,
    question_no INTEGER NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(passage_number, question_no)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pyq_2020_questions_passage ON pyq_2020_questions(passage_number);
CREATE INDEX IF NOT EXISTS idx_pyq_2020_questions_number ON pyq_2020_questions(question_no);

-- Enable RLS
ALTER TABLE pyq_2020_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Allow public read access to pyq_2020_questions" ON pyq_2020_questions
    FOR SELECT USING (true);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pyq_2020_questions_updated_at 
    BEFORE UPDATE ON pyq_2020_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE pyq_2020_questions IS 'PYQ 2020 questions with passages and options';
