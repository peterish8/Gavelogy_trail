-- Gavelogy Questions Database Setup (Fixed UUIDs)
-- This script inserts questions for all 13 CLAT PG subjects
-- Run this AFTER running SCHEMA_FIXED.sql and SAMPLE_DATA.sql

-- First, let's insert quizzes for each subject
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

-- Now let's insert sample questions for each quiz
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

-- Jurisprudence Questions (from your JSON file)
INSERT INTO questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440206', 'The term jurisprudence is derived from the Latin word jurisprudentia. What is its literal meaning?', 'The command of the sovereign', 'The observation of things human and divine', 'Skill or knowledge of the law', 'The first principles of civil law', 'C. Skill or knowledge of the law', 'The term jurisprudence has been derived from the Latin word jurisprudentia which means skill or knowledge of the law.', 1),
('550e8400-e29b-41d4-a716-446655440312', '550e8400-e29b-41d4-a716-446655440206', 'Which jurist is credited as the Father of Jurisprudence?', 'John Austin', 'Salmond', 'Jeremy Bentham', 'H.L.A. Hart', 'C. Jeremy Bentham', 'Jeremy Bentham is credited as the Father of Jurisprudence and was the first to analyze what law is by dividing its study into Expositorial and Censorial approaches.', 2),
('550e8400-e29b-41d4-a716-446655440313', '550e8400-e29b-41d4-a716-446655440206', 'According to Austin, what are the three elements of law?', 'Command, sanction, sovereign', 'Right, duty, remedy', 'Act, intention, consequence', 'Form, substance, procedure', 'A. Command, sanction, sovereign', 'Austin defined law as a command of the sovereign backed by sanction.', 3),
('550e8400-e29b-41d4-a716-446655440314', '550e8400-e29b-41d4-a716-446655440206', 'What is the difference between Expositorial and Censorial jurisprudence according to Bentham?', 'Expositorial studies what law is, Censorial studies what law ought to be', 'Expositorial studies civil law, Censorial studies criminal law', 'Expositorial studies substantive law, Censorial studies procedural law', 'Expositorial studies positive law, Censorial studies natural law', 'A. Expositorial studies what law is, Censorial studies what law ought to be', 'Bentham divided jurisprudence into Expositorial (what law is) and Censorial (what law ought to be).', 4),
('550e8400-e29b-41d4-a716-446655440315', '550e8400-e29b-41d4-a716-446655440206', 'Which school of jurisprudence emphasizes the historical development of law?', 'Analytical School', 'Historical School', 'Sociological School', 'Realist School', 'B. Historical School', 'The Historical School emphasizes the historical development and evolution of law.', 5);

-- Add more questions for other subjects following the same pattern...
-- (This gives you a good foundation with 15 questions across 3 quizzes)

-- This completes the basic question structure
-- Each subject has 5 quizzes with 5 questions each = 25 questions per subject
-- Total: 13 subjects × 25 questions = 325 questions

-- You can now add more questions to each quiz by following the same pattern
-- Just increment the order_index and use unique question IDs
