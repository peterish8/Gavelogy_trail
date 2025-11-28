-- Normalized PYQ Schema for 2020
-- Separate tables for passages and questions to avoid duplication

-- 1. Passages table (one row per passage)
CREATE TABLE IF NOT EXISTS pyq_2020_passages (
    id SERIAL PRIMARY KEY,
    passage_number INTEGER NOT NULL UNIQUE,
    passage TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Questions table (one row per question)
CREATE TABLE IF NOT EXISTS pyq_2020_questions (
    id SERIAL PRIMARY KEY,
    passage_number INTEGER NOT NULL,
    question_no INTEGER NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (passage_number) REFERENCES pyq_2020_passages(passage_number) ON DELETE CASCADE,
    UNIQUE(passage_number, question_no)
);

-- 3. Subject-Topic mapping (unchanged)
CREATE TABLE IF NOT EXISTS pyq_subject_topic (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    question_number INTEGER NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, question_number)
);

-- 4. User Performance (unchanged)
CREATE TABLE IF NOT EXISTS pyq_user_performance (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    year INTEGER NOT NULL,
    subject TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, year, subject)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pyq_2020_passages_number ON pyq_2020_passages(passage_number);
CREATE INDEX IF NOT EXISTS idx_pyq_2020_questions_passage ON pyq_2020_questions(passage_number);
CREATE INDEX IF NOT EXISTS idx_pyq_2020_questions_number ON pyq_2020_questions(question_no);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic_year ON pyq_subject_topic(year);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic_question ON pyq_subject_topic(question_number);
CREATE INDEX IF NOT EXISTS idx_pyq_user_performance_user ON pyq_user_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_user_performance_year ON pyq_user_performance(year);

-- Enable RLS
ALTER TABLE pyq_2020_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_2020_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_subject_topic ENABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_user_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read access for passages and questions
CREATE POLICY "Allow public read access to pyq_2020_passages" ON pyq_2020_passages
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to pyq_2020_questions" ON pyq_2020_questions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to pyq_subject_topic" ON pyq_subject_topic
    FOR SELECT USING (true);

-- User-specific access for performance tracking
CREATE POLICY "Allow user-specific access to pyq_user_performance" ON pyq_user_performance
    FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pyq_2020_passages_updated_at 
    BEFORE UPDATE ON pyq_2020_passages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pyq_2020_questions_updated_at 
    BEFORE UPDATE ON pyq_2020_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pyq_subject_topic_updated_at 
    BEFORE UPDATE ON pyq_subject_topic 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pyq_user_performance_updated_at 
    BEFORE UPDATE ON pyq_user_performance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE pyq_2020_passages IS 'Passages for PYQ 2020 - one row per passage to avoid duplication';
COMMENT ON TABLE pyq_2020_questions IS 'Questions for PYQ 2020 - linked to passages via passage_number';
COMMENT ON TABLE pyq_subject_topic IS 'Subject-topic mapping for PYQ questions';
COMMENT ON TABLE pyq_user_performance IS 'User performance tracking for PYQ subjects';
