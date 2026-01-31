-- Add total_questions column to quiz_attempts table
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;

-- Optional: Update existing records to calculate total_questions based on answers array length if possible, or leave as 0
-- Using a safe update:
UPDATE public.quiz_attempts
SET total_questions = jsonb_array_length(answers)
WHERE total_questions = 0 AND answers IS NOT NULL AND jsonb_typeof(answers) = 'array';
