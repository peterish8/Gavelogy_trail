-- Add unique constraint to user_streaks table to prevent duplicates
-- This will prevent duplicate user_id entries

-- First, clean up any existing duplicates
DELETE FROM user_streaks 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_streaks 
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint
ALTER TABLE user_streaks ADD CONSTRAINT unique_user_id UNIQUE (user_id);
