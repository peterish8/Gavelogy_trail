-- DROP ALL EXISTING TABLES FIRST
-- Run this BEFORE running COMPLETE_DATABASE.sql

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS payment_orders CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS contemporary_cases CASCADE;
DROP TABLE IF EXISTS mock_attempts CASCADE;
DROP TABLE IF EXISTS mock_tests CASCADE;
DROP TABLE IF EXISTS mistakes CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS user_courses CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing policies (they will be recreated)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own courses" ON user_courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON user_courses;
DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own answers" ON quiz_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON quiz_answers;
DROP POLICY IF EXISTS "Users can view own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can insert own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can update own mistakes" ON mistakes;
DROP POLICY IF EXISTS "Users can view own mock attempts" ON mock_attempts;
DROP POLICY IF EXISTS "Users can insert own mock attempts" ON mock_attempts;
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can view own orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON payment_orders;

-- Drop any existing indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_quiz_attempts_user_id;
DROP INDEX IF EXISTS idx_quiz_attempts_quiz_id;
DROP INDEX IF EXISTS idx_mistakes_user_id;
DROP INDEX IF EXISTS idx_mistakes_question_id;
DROP INDEX IF EXISTS idx_coin_transactions_user_id;
DROP INDEX IF EXISTS idx_payment_orders_user_id;
DROP INDEX IF EXISTS idx_payment_orders_order_id;

-- Now you can run COMPLETE_DATABASE.sql
