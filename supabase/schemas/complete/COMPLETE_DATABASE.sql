-- GAVALOGY COMPLETE DATABASE SETUP
-- Paste this entire file into your Supabase SQL Editor and run it
-- This creates everything: tables, data, and questions

-- ==============================================
-- PART 1: CREATE ALL TABLES
-- ==============================================

-- Create users table (without referencing auth.users directly)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  total_coins INTEGER DEFAULT 100,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_courses table
CREATE TABLE user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Create subjects table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('confident', 'guess', 'fluke')) NOT NULL,
  is_correct BOOLEAN NOT NULL
);

-- Create mistakes table
CREATE TABLE mistakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  source_type TEXT CHECK (source_type IN ('quiz', 'mock')) NOT NULL,
  source_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mock_tests table
CREATE TABLE mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create mock_attempts table
CREATE TABLE mock_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contemporary_cases table
CREATE TABLE contemporary_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  subject TEXT NOT NULL,
  case_summary TEXT NOT NULL
);

-- Create coin_transactions table
CREATE TABLE coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_orders table
CREATE TABLE payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PART 2: ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contemporary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PART 3: CREATE RLS POLICIES
-- ==============================================

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view own courses" ON user_courses FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own courses" ON user_courses FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own attempts" ON quiz_attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own answers" ON quiz_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND auth.uid()::text = user_id::text)
);
CREATE POLICY "Users can insert own answers" ON quiz_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND auth.uid()::text = user_id::text)
);

CREATE POLICY "Users can view own mistakes" ON mistakes FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own mistakes" ON mistakes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own mistakes" ON mistakes FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own mock attempts" ON mock_attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own mock attempts" ON mock_attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own orders" ON payment_orders FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ==============================================
-- PART 4: CREATE INDEXES
-- ==============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX idx_mistakes_question_id ON mistakes(question_id);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_id ON payment_orders(order_id);

-- ==============================================
-- PART 5: INSERT SAMPLE DATA
-- ==============================================

-- Insert sample courses
INSERT INTO courses (id, name, description, price) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Static Subjects Course', '13 Law Subjects • 650 Questions • 20 Mock Tests', 1999.00),
('550e8400-e29b-41d4-a716-446655440002', 'Contemporary Cases Course', '150 Legal Cases • 2023-2025 • Month Quizzes', 1499.00);

-- Insert sample subjects
INSERT INTO subjects (id, name, description, course_id, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'Constitutional Law', 'Fundamental Rights, DPSP, Constitutional Provisions', '550e8400-e29b-41d4-a716-446655440001', 1),
('550e8400-e29b-41d4-a716-446655440102', 'Jurisprudence', 'Legal Theory, Sources of Law, Legal Concepts', '550e8400-e29b-41d4-a716-446655440001', 2),
('550e8400-e29b-41d4-a716-446655440103', 'Administrative Law', 'Administrative Actions, Judicial Review', '550e8400-e29b-41d4-a716-446655440001', 3),
('550e8400-e29b-41d4-a716-446655440104', 'Contract Law', 'Indian Contract Act, Breach of Contract', '550e8400-e29b-41d4-a716-446655440001', 4),
('550e8400-e29b-41d4-a716-446655440105', 'Tort Law', 'Negligence, Nuisance, Defamation', '550e8400-e29b-41d4-a716-446655440001', 5),
('550e8400-e29b-41d4-a716-446655440106', 'Criminal Law', 'IPC, CrPC, Evidence Act', '550e8400-e29b-41d4-a716-446655440001', 6),
('550e8400-e29b-41d4-a716-446655440107', 'Family Law', 'Hindu Law, Muslim Law, Special Marriage Act', '550e8400-e29b-41d4-a716-446655440001', 7),
('550e8400-e29b-41d4-a716-446655440108', 'Property Law', 'Transfer of Property Act, Succession Laws', '550e8400-e29b-41d4-a716-446655440001', 8),
('550e8400-e29b-41d4-a716-446655440109', 'Company Law', 'Companies Act, Corporate Governance', '550e8400-e29b-41d4-a716-446655440001', 9),
('550e8400-e29b-41d4-a716-446655440110', 'Labour Law', 'Industrial Disputes Act, Labour Welfare', '550e8400-e29b-41d4-a716-446655440001', 10),
('550e8400-e29b-41d4-a716-446655440111', 'Tax Law', 'Income Tax Act, GST, Corporate Tax', '550e8400-e29b-41d4-a716-446655440001', 11),
('550e8400-e29b-41d4-a716-446655440112', 'Environmental Law', 'Environmental Protection, Forest Conservation', '550e8400-e29b-41d4-a716-446655440001', 12),
('550e8400-e29b-41d4-a716-446655440113', 'International Law', 'Public International Law, Treaties', '550e8400-e29b-41d4-a716-446655440001', 13);

-- ==============================================
-- PART 6: INSERT QUIZZES
-- ==============================================

-- Constitutional Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'Fundamental Rights', 'Questions on Articles 14-32 of the Indian Constitution', 1),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440101', 'Directive Principles', 'Questions on Articles 36-51 of the Indian Constitution', 2),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', 'Fundamental Duties', 'Questions on Article 51A of the Indian Constitution', 3),
('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', 'Constitutional Amendments', 'Questions on important constitutional amendments', 4),
('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440101', 'Emergency Provisions', 'Questions on Articles 352-360 of the Indian Constitution', 5);

-- Jurisprudence Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440102', 'Introduction to Jurisprudence', 'Basic concepts and definitions in jurisprudence', 1),
('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440102', 'Sources of Law', 'Custom, precedent, legislation as sources of law', 2),
('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440102', 'Legal Concepts', 'Rights, duties, ownership, possession', 3),
('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440102', 'Schools of Jurisprudence', 'Analytical, Historical, Sociological schools', 4),
('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440102', 'Modern Jurisprudence', 'Contemporary legal theories and concepts', 5);

-- Administrative Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440103', 'Administrative Actions', 'Types and classification of administrative actions', 1),
('550e8400-e29b-41d4-a716-446655440212', '550e8400-e29b-41d4-a716-446655440103', 'Judicial Review', 'Scope and limitations of judicial review', 2),
('550e8400-e29b-41d4-a716-446655440213', '550e8400-e29b-41d4-a716-446655440103', 'Administrative Tribunals', 'Constitution and functioning of tribunals', 3),
('550e8400-e29b-41d4-a716-446655440214', '550e8400-e29b-41d4-a716-446655440103', 'Delegated Legislation', 'Rules, regulations, and subordinate legislation', 4),
('550e8400-e29b-41d4-a716-446655440215', '550e8400-e29b-41d4-a716-446655440103', 'Administrative Discretion', 'Exercise and control of administrative discretion', 5);

-- Contract Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440216', '550e8400-e29b-41d4-a716-446655440104', 'Formation of Contract', 'Offer, acceptance, consideration, capacity', 1),
('550e8400-e29b-41d4-a716-446655440217', '550e8400-e29b-41d4-a716-446655440104', 'Performance and Discharge', 'Performance, breach, and discharge of contracts', 2),
('550e8400-e29b-41d4-a716-446655440218', '550e8400-e29b-41d4-a716-446655440104', 'Remedies for Breach', 'Damages, specific performance, injunction', 3),
('550e8400-e29b-41d4-a716-446655440219', '550e8400-e29b-41d4-a716-446655440104', 'Special Contracts', 'Indemnity, guarantee, bailment, pledge', 4),
('550e8400-e29b-41d4-a716-446655440220', '550e8400-e29b-41d4-a716-446655440104', 'Quasi Contracts', 'Contracts implied in law', 5);

-- Tort Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440221', '550e8400-e29b-41d4-a716-446655440105', 'General Principles', 'Definition, elements, and general principles of tort', 1),
('550e8400-e29b-41d4-a716-446655440222', '550e8400-e29b-41d4-a716-446655440105', 'Negligence', 'Duty of care, breach, causation, damages', 2),
('550e8400-e29b-41d4-a716-446655440223', '550e8400-e29b-41d4-a716-446655440105', 'Intentional Torts', 'Assault, battery, false imprisonment, defamation', 3),
('550e8400-e29b-41d4-a716-446655440224', '550e8400-e29b-41d4-a716-446655440105', 'Strict Liability', 'Absolute liability, Rylands v Fletcher rule', 4),
('550e8400-e29b-41d4-a716-446655440225', '550e8400-e29b-41d4-a716-446655440105', 'Defenses and Remedies', 'Defenses to tort and available remedies', 5);

-- Criminal Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440226', '550e8400-e29b-41d4-a716-446655440106', 'General Principles', 'Crime, mens rea, actus reus, stages of crime', 1),
('550e8400-e29b-41d4-a716-446655440227', '550e8400-e29b-41d4-a716-446655440106', 'Offenses Against Person', 'Murder, culpable homicide, assault, kidnapping', 2),
('550e8400-e29b-41d4-a716-446655440228', '550e8400-e29b-41d4-a716-446655440106', 'Offenses Against Property', 'Theft, robbery, dacoity, criminal breach of trust', 3),
('550e8400-e29b-41d4-a716-446655440229', '550e8400-e29b-41d4-a716-446655440106', 'Criminal Procedure', 'Arrest, bail, trial procedure, appeals', 4),
('550e8400-e29b-41d4-a716-446655440230', '550e8400-e29b-41d4-a716-446655440106', 'Evidence Law', 'Relevancy, admissibility, burden of proof', 5);

-- Family Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440231', '550e8400-e29b-41d4-a716-446655440107', 'Hindu Marriage', 'Conditions, ceremonies, void and voidable marriages', 1),
('550e8400-e29b-41d4-a716-446655440232', '550e8400-e29b-41d4-a716-446655440107', 'Muslim Marriage', 'Nikah, dower, divorce, maintenance', 2),
('550e8400-e29b-41d4-a716-446655440233', '550e8400-e29b-41d4-a716-446655440107', 'Succession Laws', 'Hindu Succession Act, Muslim inheritance', 3),
('550e8400-e29b-41d4-a716-446655440234', '550e8400-e29b-41d4-a716-446655440107', 'Adoption and Guardianship', 'Hindu Adoption Act, Guardianship laws', 4),
('550e8400-e29b-41d4-a716-446655440235', '550e8400-e29b-41d4-a716-446655440107', 'Special Marriage Act', 'Inter-religious marriages, registration', 5);

-- Property Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440236', '550e8400-e29b-41d4-a716-446655440108', 'Transfer of Property', 'General principles, modes of transfer', 1),
('550e8400-e29b-41d4-a716-446655440237', '550e8400-e29b-41d4-a716-446655440108', 'Sale and Mortgage', 'Sale deed, mortgage types, redemption', 2),
('550e8400-e29b-41d4-a716-446655440238', '550e8400-e29b-41d4-a716-446655440108', 'Lease and Gift', 'Lease agreements, gift deeds, registration', 3),
('550e8400-e29b-41d4-a716-446655440239', '550e8400-e29b-41d4-a716-446655440108', 'Succession Laws', 'Hindu Succession Act, testamentary succession', 4),
('550e8400-e29b-41d4-a716-446655440240', '550e8400-e29b-41d4-a716-446655440108', 'Easements', 'Right of way, easement rights, prescription', 5);

-- Company Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440241', '550e8400-e29b-41d4-a716-446655440109', 'Company Formation', 'Incorporation, memorandum, articles of association', 1),
('550e8400-e29b-41d4-a716-446655440242', '550e8400-e29b-41d4-a716-446655440109', 'Corporate Governance', 'Board of directors, meetings, resolutions', 2),
('550e8400-e29b-41d4-a716-446655440243', '550e8400-e29b-41d4-a716-446655440109', 'Share Capital', 'Types of shares, issue, transfer, dividends', 3),
('550e8400-e29b-41d4-a716-446655440244', '550e8400-e29b-41d4-a716-446655440109', 'Winding Up', 'Voluntary and compulsory winding up procedures', 4),
('550e8400-e29b-41d4-a716-446655440245', '550e8400-e29b-41d4-a716-446655440109', 'Corporate Restructuring', 'Merger, acquisition, demerger, schemes', 5);

-- Labour Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440246', '550e8400-e29b-41d4-a716-446655440110', 'Industrial Relations', 'Trade unions, collective bargaining, disputes', 1),
('550e8400-e29b-41d4-a716-446655440247', '550e8400-e29b-41d4-a716-446655440110', 'Employment Laws', 'Contract of employment, termination, retrenchment', 2),
('550e8400-e29b-41d4-a716-446655440248', '550e8400-e29b-41d4-a716-446655440110', 'Wages and Benefits', 'Minimum wages, bonus, provident fund', 3),
('550e8400-e29b-41d4-a716-446655440249', '550e8400-e29b-41d4-a716-446655440110', 'Workplace Safety', 'Factories Act, safety measures, compensation', 4),
('550e8400-e29b-41d4-a716-446655440250', '550e8400-e29b-41d4-a716-446655440110', 'Social Security', 'ESI, EPF, maternity benefits, gratuity', 5);

-- Tax Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440251', '550e8400-e29b-41d4-a716-446655440111', 'Income Tax Basics', 'Heads of income, residential status, tax rates', 1),
('550e8400-e29b-41d4-a716-446655440252', '550e8400-e29b-41d4-a716-446655440111', 'GST Framework', 'Supply, place of supply, time of supply', 2),
('550e8400-e29b-41d4-a716-446655440253', '550e8400-e29b-41d4-a716-446655440111', 'Corporate Tax', 'Company taxation, MAT, advance tax', 3),
('550e8400-e29b-41d4-a716-446655440254', '550e8400-e29b-41d4-a716-446655440111', 'Tax Planning', 'Deductions, exemptions, tax saving instruments', 4),
('550e8400-e29b-41d4-a716-446655440255', '550e8400-e29b-41d4-a716-446655440111', 'Tax Administration', 'Assessment, appeals, penalties, prosecution', 5);

-- Environmental Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440256', '550e8400-e29b-41d4-a716-446655440112', 'Environmental Protection', 'EPA Act, pollution control, environmental clearance', 1),
('550e8400-e29b-41d4-a716-446655440257', '550e8400-e29b-41d4-a716-446655440112', 'Forest Conservation', 'Forest Conservation Act, wildlife protection', 2),
('550e8400-e29b-41d4-a716-446655440258', '550e8400-e29b-41d4-a716-446655440112', 'Water and Air Laws', 'Water Act, Air Act, pollution control boards', 3),
('550e8400-e29b-41d4-a716-446655440259', '550e8400-e29b-41d4-a716-446655440112', 'Climate Change', 'International agreements, carbon credits', 4),
('550e8400-e29b-41d4-a716-446655440260', '550e8400-e29b-41d4-a716-446655440112', 'Environmental Impact', 'EIA process, public participation, judicial activism', 5);

-- International Law Quizzes
INSERT INTO quizzes (id, subject_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440261', '550e8400-e29b-41d4-a716-446655440113', 'Sources of International Law', 'Treaties, custom, general principles', 1),
('550e8400-e29b-41d4-a716-446655440262', '550e8400-e29b-41d4-a716-446655440113', 'State Responsibility', 'State liability, diplomatic protection', 2),
('550e8400-e29b-41d4-a716-446655440263', '550e8400-e29b-41d4-a716-446655440113', 'International Organizations', 'UN, WTO, ICJ, specialized agencies', 3),
('550e8400-e29b-41d4-a716-446655440264', '550e8400-e29b-41d4-a716-446655440113', 'Human Rights Law', 'Universal Declaration, ICCPR, ICESCR', 4),
('550e8400-e29b-41d4-a716-446655440265', '550e8400-e29b-41d4-a716-446655440113', 'International Disputes', 'Peaceful settlement, arbitration, ICJ', 5);

-- ==============================================
-- PART 7: INSERT SAMPLE QUESTIONS
-- ==============================================

-- Constitutional Law Questions

-- Fundamental Rights Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', 'Which Article of the Indian Constitution guarantees the right to equality?', 'Article 14', 'Article 15', 'Article 16', 'Article 17', 'A. Article 14', 'Article 14 guarantees equality before law and equal protection of laws.', 1),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440201', 'The right to freedom of speech and expression is guaranteed under which Article?', 'Article 19(1)(a)', 'Article 19(1)(b)', 'Article 19(1)(c)', 'Article 19(1)(d)', 'A. Article 19(1)(a)', 'Article 19(1)(a) guarantees freedom of speech and expression.', 2),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440201', 'Which case established the doctrine of basic structure?', 'Kesavananda Bharati v. State of Kerala', 'Minerva Mills v. Union of India', 'Golak Nath v. State of Punjab', 'Sajjan Singh v. State of Rajasthan', 'A. Kesavananda Bharati v. State of Kerala', 'Kesavananda Bharati case (1973) established the basic structure doctrine.', 3),
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440201', 'The right to life and personal liberty is guaranteed under which Article?', 'Article 20', 'Article 21', 'Article 22', 'Article 23', 'B. Article 21', 'Article 21 guarantees protection of life and personal liberty.', 4),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440201', 'Which Article prohibits discrimination on grounds of religion, race, caste, sex or place of birth?', 'Article 14', 'Article 15', 'Article 16', 'Article 17', 'B. Article 15', 'Article 15 prohibits discrimination on various grounds.', 5);

-- Directive Principles Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440202', 'Which Article directs the State to secure a social order for the promotion of welfare of the people?', 'Article 38', 'Article 39', 'Article 40', 'Article 41', 'A. Article 38', 'Article 38 directs the State to promote welfare of the people.', 1),
('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440202', 'The directive for equal pay for equal work is mentioned in which Article?', 'Article 39(a)', 'Article 39(b)', 'Article 39(c)', 'Article 39(d)', 'D. Article 39(d)', 'Article 39(d) provides for equal pay for equal work.', 2),
('550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440202', 'Which Article directs the State to organize village panchayats?', 'Article 40', 'Article 41', 'Article 42', 'Article 43', 'A. Article 40', 'Article 40 directs organization of village panchayats.', 3),
('550e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440202', 'The directive for free and compulsory education is mentioned in which Article?', 'Article 41', 'Article 42', 'Article 45', 'Article 46', 'C. Article 45', 'Article 45 provides for free and compulsory education for children.', 4),
('550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440202', 'Which Article directs the State to promote international peace and security?', 'Article 48', 'Article 49', 'Article 50', 'Article 51', 'D. Article 51', 'Article 51 directs promotion of international peace and security.', 5);

-- Jurisprudence Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440206', 'The term jurisprudence is derived from the Latin word jurisprudentia. What is its literal meaning?', 'The command of the sovereign', 'The observation of things human and divine', 'Skill or knowledge of the law', 'The first principles of civil law', 'C. Skill or knowledge of the law', 'The term jurisprudence has been derived from the Latin word jurisprudentia which means skill or knowledge of the law.', 1),
('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440206', 'Which jurist is credited as the Father of Jurisprudence?', 'John Austin', 'Salmond', 'Jeremy Bentham', 'H.L.A. Hart', 'C. Jeremy Bentham', 'Jeremy Bentham is credited as the Father of Jurisprudence and was the first to analyze what law is by dividing its study into Expositorial and Censorial approaches.', 2),
('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440206', 'According to Austin, what are the three elements of law?', 'Command, sanction, sovereign', 'Right, duty, remedy', 'Act, intention, consequence', 'Form, substance, procedure', 'A. Command, sanction, sovereign', 'Austin defined law as a command of the sovereign backed by sanction.', 3),
('550e8400-e29b-41d4-a716-446655440314', '550e8400-e29b-41d4-a716-446655440206', 'What is the difference between Expositorial and Censorial jurisprudence according to Bentham?', 'Expositorial studies what law is, Censorial studies what law ought to be', 'Expositorial studies civil law, Censorial studies criminal law', 'Expositorial studies substantive law, Censorial studies procedural law', 'Expositorial studies positive law, Censorial studies natural law', 'A. Expositorial studies what law is, Censorial studies what law ought to be', 'Bentham divided jurisprudence into Expositorial (what law is) and Censorial (what law ought to be).', 4),
('550e8400-e29b-41d4-a716-446655440315', '550e8400-e29b-41d4-a716-446655440206', 'Which school of jurisprudence emphasizes the historical development of law?', 'Analytical School', 'Historical School', 'Sociological School', 'Realist School', 'B. Historical School', 'The Historical School emphasizes the historical development and evolution of law.', 5);

-- Administrative Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440316', '550e8400-e29b-41d4-a716-446655440211', 'What is the primary source of administrative law in India?', 'Constitution of India', 'Administrative Procedure Act', 'Government of India Act, 1935', 'Indian Administrative Service Rules', 'A. Constitution of India', 'The Constitution of India is the primary source of administrative law.', 1),
('550e8400-e29b-41d4-a716-446655440317', '550e8400-e29b-41d4-a716-446655440211', 'Which case established the principle of natural justice in administrative law?', 'Ridge v. Baldwin', 'Cooper v. Wandsworth Board of Works', 'Board of Education v. Rice', 'Local Government Board v. Arlidge', 'A. Ridge v. Baldwin', 'Ridge v. Baldwin established the principle of natural justice.', 2),
('550e8400-e29b-41d4-a716-446655440318', '550e8400-e29b-41d4-a716-446655440211', 'What are the two main principles of natural justice?', 'Audi alteram partem and Nemo judex in causa sua', 'Proportionality and Legitimate expectation', 'Reasonableness and Fairness', 'Transparency and Accountability', 'A. Audi alteram partem and Nemo judex in causa sua', 'The two main principles are audi alteram partem (hear the other side) and nemo judex in causa sua (no one should be judge in their own cause).', 3),
('550e8400-e29b-41d4-a716-446655440319', '550e8400-e29b-41d4-a716-446655440211', 'Which writ is used to quash an administrative decision?', 'Habeas Corpus', 'Mandamus', 'Certiorari', 'Prohibition', 'C. Certiorari', 'Certiorari is used to quash administrative decisions.', 4),
('550e8400-e29b-41d4-a716-446655440320', '550e8400-e29b-41d4-a716-446655440211', 'What is the doctrine of legitimate expectation?', 'Expectation based on past practice', 'Expectation based on promise', 'Expectation based on law', 'Expectation based on custom', 'B. Expectation based on promise', 'Legitimate expectation arises from a promise or representation made by the authority.', 5);

-- Contract Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440321', '550e8400-e29b-41d4-a716-446655440216', 'What are the essential elements of a valid contract?', 'Offer, acceptance, consideration', 'Agreement, consideration, capacity', 'Offer, acceptance, consideration, capacity, free consent, lawful object', 'Agreement, consideration, intention to create legal relations', 'C. Offer, acceptance, consideration, capacity, free consent, lawful object', 'All these elements are essential for a valid contract under Indian Contract Act.', 1),
('550e8400-e29b-41d4-a716-446655440322', '550e8400-e29b-41d4-a716-446655440216', 'What is consideration in contract law?', 'Something in return for a promise', 'The price paid for goods', 'The benefit received', 'The detriment suffered', 'A. Something in return for a promise', 'Consideration is something given in return for a promise.', 2),
('550e8400-e29b-41d4-a716-446655440323', '550e8400-e29b-41d4-a716-446655440216', 'Which section of Indian Contract Act deals with capacity to contract?', 'Section 10', 'Section 11', 'Section 12', 'Section 13', 'B. Section 11', 'Section 11 deals with who are competent to contract.', 3),
('550e8400-e29b-41d4-a716-446655440324', '550e8400-e29b-41d4-a716-446655440216', 'What is the age of majority for entering into a contract?', '16 years', '18 years', '21 years', '25 years', 'B. 18 years', 'The age of majority is 18 years for entering into contracts.', 4),
('550e8400-e29b-41d4-a716-446655440325', '550e8400-e29b-41d4-a716-446655440216', 'What makes a contract voidable?', 'Lack of consideration', 'Lack of capacity', 'Coercion, undue influence, fraud, misrepresentation', 'Unlawful object', 'C. Coercion, undue influence, fraud, misrepresentation', 'These factors make a contract voidable at the option of the aggrieved party.', 5);

-- Tort Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440326', '550e8400-e29b-41d4-a716-446655440221', 'What is a tort?', 'A criminal offense', 'A civil wrong', 'A breach of contract', 'A violation of constitutional right', 'B. A civil wrong', 'A tort is a civil wrong that causes harm to another person.', 1),
('550e8400-e29b-41d4-a716-446655440327', '550e8400-e29b-41d4-a716-446655440221', 'What are the essential elements of negligence?', 'Duty, breach, causation, damage', 'Act, intention, consequence', 'Fault, damage, remedy', 'Wrong, injury, compensation', 'A. Duty, breach, causation, damage', 'These are the four essential elements of negligence.', 2),
('550e8400-e29b-41d4-a716-446655440328', '550e8400-e29b-41d4-a716-446655440221', 'Which case established the neighbor principle in negligence?', 'Donoghue v. Stevenson', 'Rylands v. Fletcher', 'Hedley Byrne v. Heller', 'Wagon Mound Case', 'A. Donoghue v. Stevenson', 'Donoghue v. Stevenson established the neighbor principle.', 3),
('550e8400-e29b-41d4-a716-446655440329', '550e8400-e29b-41d4-a716-446655440221', 'What is the rule in Rylands v. Fletcher?', 'Strict liability for dangerous things', 'Liability for negligence', 'Liability for nuisance', 'Liability for trespass', 'A. Strict liability for dangerous things', 'Rylands v. Fletcher established strict liability for dangerous things.', 4),
('550e8400-e29b-41d4-a716-446655440330', '550e8400-e29b-41d4-a716-446655440221', 'What is defamation?', 'Physical injury', 'Property damage', 'Injury to reputation', 'Emotional distress', 'C. Injury to reputation', 'Defamation is injury to a person reputation.', 5);

-- Criminal Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440331', '550e8400-e29b-41d4-a716-446655440226', 'What are the two essential elements of a crime?', 'Act and intention', 'Mens rea and actus reus', 'Fault and damage', 'Wrong and injury', 'B. Mens rea and actus reus', 'Mens rea (guilty mind) and actus reus (guilty act) are essential elements.', 1),
('550e8400-e29b-41d4-a716-446655440332', '550e8400-e29b-41d4-a716-446655440226', 'Which section of IPC defines murder?', 'Section 299', 'Section 300', 'Section 301', 'Section 302', 'B. Section 300', 'Section 300 defines murder.', 2),
('550e8400-e29b-41d4-a716-446655440333', '550e8400-e29b-41d4-a716-446655440226', 'What is the difference between murder and culpable homicide?', 'No difference', 'Murder is intentional, culpable homicide is unintentional', 'Murder requires premeditation', 'Culpable homicide is a lesser offense', 'B. Murder is intentional, culpable homicide is unintentional', 'The main difference is the intention to cause death.', 3),
('550e8400-e29b-41d4-a716-446655440334', '550e8400-e29b-41d4-a716-446655440226', 'Which section deals with theft?', 'Section 378', 'Section 379', 'Section 380', 'Section 381', 'A. Section 378', 'Section 378 defines theft.', 4),
('550e8400-e29b-41d4-a716-446655440335', '550e8400-e29b-41d4-a716-446655440226', 'What is the punishment for murder?', 'Life imprisonment or death', 'Imprisonment for 7 years', 'Fine only', 'Community service', 'A. Life imprisonment or death', 'Murder is punishable with life imprisonment or death penalty.', 5);

-- Family Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440336', '550e8400-e29b-41d4-a716-446655440231', 'What are the essential ceremonies for a valid Hindu marriage?', 'Saptapadi', 'Kanyadaan', 'Vivah homa', 'All of the above', 'D. All of the above', 'All these ceremonies are essential for a valid Hindu marriage.', 1),
('550e8400-e29b-41d4-a716-446655440337', '550e8400-e29b-41d4-a716-446655440231', 'What is the minimum age for marriage under Hindu Marriage Act?', '18 years for bride, 21 years for groom', '21 years for both', '16 years for bride, 18 years for groom', '18 years for both', 'A. 18 years for bride, 21 years for groom', 'The minimum age is 18 years for bride and 21 years for groom.', 2),
('550e8400-e29b-41d4-a716-446655440338', '550e8400-e29b-41d4-a716-446655440231', 'What is nikah in Muslim law?', 'Marriage ceremony', 'Divorce', 'Dower', 'Maintenance', 'A. Marriage ceremony', 'Nikah is the marriage ceremony in Muslim law.', 3),
('550e8400-e29b-41d4-a716-446655440339', '550e8400-e29b-41d4-a716-446655440231', 'What is dower in Muslim law?', 'Marriage gift', 'Divorce settlement', 'Maintenance payment', 'Property settlement', 'A. Marriage gift', 'Dower is a marriage gift given by husband to wife.', 4),
('550e8400-e29b-41d4-a716-446655440340', '550e8400-e29b-41d4-a716-446655440231', 'What is the waiting period for Muslim women after divorce?', '3 months', '4 months', '6 months', '1 year', 'B. 4 months', 'The waiting period (iddat) is 4 months for Muslim women.', 5);

-- Property Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440341', '550e8400-e29b-41d4-a716-446655440236', 'What is the Transfer of Property Act, 1882?', 'A criminal law', 'A civil law', 'A constitutional law', 'An administrative law', 'B. A civil law', 'Transfer of Property Act is a civil law governing property transfers.', 1),
('550e8400-e29b-41d4-a716-446655440342', '550e8400-e29b-41d4-a716-446655440236', 'What is a sale deed?', 'A contract', 'A conveyance', 'A lease', 'A mortgage', 'B. A conveyance', 'A sale deed is a conveyance transferring ownership.', 2),
('550e8400-e29b-41d4-a716-446655440343', '550e8400-e29b-41d4-a716-446655440236', 'What is the difference between sale and mortgage?', 'No difference', 'Sale transfers ownership, mortgage creates security', 'Sale is temporary, mortgage is permanent', 'Sale is for land, mortgage is for buildings', 'B. Sale transfers ownership, mortgage creates security', 'Sale transfers ownership while mortgage creates security interest.', 3),
('550e8400-e29b-41d4-a716-446655440344', '550e8400-e29b-41d4-a716-446655440236', 'What is a lease?', 'Transfer of ownership', 'Transfer of possession', 'Transfer of security', 'Transfer of rights', 'B. Transfer of possession', 'A lease transfers possession for a specific period.', 4),
('550e8400-e29b-41d4-a716-446655440345', '550e8400-e29b-41d4-a716-446655440236', 'What is a gift deed?', 'A sale', 'A lease', 'A voluntary transfer', 'A mortgage', 'C. A voluntary transfer', 'A gift deed is a voluntary transfer without consideration.', 5);

-- Company Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440346', '550e8400-e29b-41d4-a716-446655440241', 'What is a company?', 'A partnership', 'A corporation', 'A trust', 'A society', 'B. A corporation', 'A company is a corporation created by law.', 1),
('550e8400-e29b-41d4-a716-446655440347', '550e8400-e29b-41d4-a716-446655440241', 'What is the minimum number of members for a private company?', '2', '7', '10', '20', 'A. 2', 'A private company requires minimum 2 members.', 2),
('550e8400-e29b-41d4-a716-446655440348', '550e8400-e29b-41d4-a716-446655440241', 'What is the minimum number of members for a public company?', '2', '7', '10', '20', 'B. 7', 'A public company requires minimum 7 members.', 3),
('550e8400-e29b-41d4-a716-446655440349', '550e8400-e29b-41d4-a716-446655440241', 'What is the memorandum of association?', 'Internal rules', 'Constitution of company', 'Annual report', 'Board resolution', 'B. Constitution of company', 'Memorandum is the constitution of the company.', 4),
('550e8400-e29b-41d4-a716-446655440350', '550e8400-e29b-41d4-a716-446655440241', 'What is the articles of association?', 'Internal rules', 'Constitution of company', 'Annual report', 'Board resolution', 'A. Internal rules', 'Articles are the internal rules of the company.', 5);

-- Labour Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440351', '550e8400-e29b-41d4-a716-446655440246', 'What is the Industrial Disputes Act, 1947?', 'A criminal law', 'A labour law', 'A civil law', 'A constitutional law', 'B. A labour law', 'Industrial Disputes Act is a labour law governing industrial relations.', 1),
('550e8400-e29b-41d4-a716-446655440352', '550e8400-e29b-41d4-a716-446655440246', 'What is a trade union?', 'A company', 'A workers organization', 'A government body', 'A court', 'B. A workers organization', 'A trade union is an organization of workers.', 2),
('550e8400-e29b-41d4-a716-446655440353', '550e8400-e29b-41d4-a716-446655440246', 'What is collective bargaining?', 'Individual negotiation', 'Group negotiation', 'Court proceeding', 'Government intervention', 'B. Group negotiation', 'Collective bargaining is negotiation between employers and workers groups.', 3),
('550e8400-e29b-41d4-a716-446655440354', '550e8400-e29b-41d4-a716-446655440246', 'What is retrenchment?', 'Termination for misconduct', 'Termination for redundancy', 'Voluntary resignation', 'Retirement', 'B. Termination for redundancy', 'Retrenchment is termination due to redundancy or surplus.', 4),
('550e8400-e29b-41d4-a716-446655440355', '550e8400-e29b-41d4-a716-446655440246', 'What is the minimum notice period for retrenchment?', '1 month', '2 months', '3 months', '6 months', 'A. 1 month', 'Minimum 1 month notice is required for retrenchment.', 5);

-- Tax Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440356', '550e8400-e29b-41d4-a716-446655440251', 'What is the Income Tax Act, 1961?', 'A state law', 'A central law', 'A local law', 'An international law', 'B. A central law', 'Income Tax Act is a central law governing income taxation.', 1),
('550e8400-e29b-41d4-a716-446655440357', '550e8400-e29b-41d4-a716-446655440251', 'What are the five heads of income?', 'Salary, Business, Capital Gains, House Property, Other Sources', 'Salary, Professional, Investment, Property, Miscellaneous', 'Earned, Unearned, Capital, Property, Other', 'Active, Passive, Portfolio, Real Estate, Other', 'A. Salary, Business, Capital Gains, House Property, Other Sources', 'These are the five heads of income under the Income Tax Act.', 2),
('550e8400-e29b-41d4-a716-446655440358', '550e8400-e29b-41d4-a716-446655440251', 'What is GST?', 'Goods and Services Tax', 'General Sales Tax', 'Government Service Tax', 'Gross Sales Tax', 'A. Goods and Services Tax', 'GST stands for Goods and Services Tax.', 3),
('550e8400-e29b-41d4-a716-446655440359', '550e8400-e29b-41d4-a716-446655440251', 'What is the GST rate for essential goods?', '0%', '5%', '12%', '18%', 'B. 5%', 'Essential goods are taxed at 5% under GST.', 4),
('550e8400-e29b-41d4-a716-446655440360', '550e8400-e29b-41d4-a716-446655440251', 'What is advance tax?', 'Tax paid in advance', 'Tax paid after assessment', 'Tax paid on demand', 'Tax paid voluntarily', 'A. Tax paid in advance', 'Advance tax is tax paid in advance during the financial year.', 5);

-- Environmental Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440361', '550e8400-e29b-41d4-a716-446655440256', 'What is the Environment Protection Act, 1986?', 'A state law', 'A central law', 'A local law', 'An international law', 'B. A central law', 'Environment Protection Act is a central law for environmental protection.', 1),
('550e8400-e29b-41d4-a716-446655440362', '550e8400-e29b-41d4-a716-446655440256', 'What is environmental impact assessment?', 'Assessment after damage', 'Assessment before project', 'Assessment during construction', 'Assessment after completion', 'B. Assessment before project', 'EIA is assessment of environmental impact before starting a project.', 2),
('550e8400-e29b-41d4-a716-446655440363', '550e8400-e29b-41d4-a716-446655440256', 'What is the Forest Conservation Act, 1980?', 'A state law', 'A central law', 'A local law', 'An international law', 'B. A central law', 'Forest Conservation Act is a central law for forest protection.', 3),
('550e8400-e29b-41d4-a716-446655440364', '550e8400-e29b-41d4-a716-446655440256', 'What is the Wildlife Protection Act, 1972?', 'A state law', 'A central law', 'A local law', 'An international law', 'B. A central law', 'Wildlife Protection Act is a central law for wildlife conservation.', 4),
('550e8400-e29b-41d4-a716-446655440365', '550e8400-e29b-41d4-a716-446655440256', 'What is sustainable development?', 'Development without growth', 'Development with environmental protection', 'Development without environment', 'Development with pollution', 'B. Development with environmental protection', 'Sustainable development balances development with environmental protection.', 5);

-- International Law Questions
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440366', '550e8400-e29b-41d4-a716-446655440261', 'What are the sources of international law?', 'Treaties, custom, general principles', 'Constitutions, statutes, regulations', 'Cases, precedents, judgments', 'Contracts, agreements, settlements', 'A. Treaties, custom, general principles', 'These are the primary sources of international law.', 1),
('550e8400-e29b-41d4-a716-446655440367', '550e8400-e29b-41d4-a716-446655440261', 'What is a treaty?', 'A domestic law', 'An international agreement', 'A court judgment', 'A government policy', 'B. An international agreement', 'A treaty is an international agreement between states.', 2),
('550e8400-e29b-41d4-a716-446655440368', '550e8400-e29b-41d4-a716-446655440261', 'What is customary international law?', 'Written law', 'Unwritten law based on practice', 'Court-made law', 'Legislative law', 'B. Unwritten law based on practice', 'Customary law is unwritten law based on state practice.', 3),
('550e8400-e29b-41d4-a716-446655440369', '550e8400-e29b-41d4-a716-446655440261', 'What is the International Court of Justice?', 'A domestic court', 'A regional court', 'The principal judicial organ of UN', 'A private court', 'C. The principal judicial organ of UN', 'ICJ is the principal judicial organ of the United Nations.', 4),
('550e8400-e29b-41d4-a716-446655440370', '550e8400-e29b-41d4-a716-446655440261', 'What is diplomatic immunity?', 'Immunity from civil suits', 'Immunity from criminal prosecution', 'Immunity from taxation', 'All of the above', 'D. All of the above', 'Diplomatic immunity covers various types of immunity.', 5);

-- ==============================================
-- COMPLETE! Your Gavalogy database is ready!
-- ==============================================

-- Summary of what was created:
-- ✅ 13 tables with proper relationships
-- ✅ Row Level Security enabled
-- ✅ RLS policies for user data protection
-- ✅ Performance indexes
-- ✅ 2 courses (Static Subjects & Contemporary Cases)
-- ✅ 13 subjects (all CLAT PG subjects)
-- ✅ 65 quizzes (5 per subject)
-- ✅ 70 sample questions (covering all major topics)

-- Your database is now ready for production use!
-- Users can sign up, take quizzes, track mistakes, and more!
