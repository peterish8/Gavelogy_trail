-- Sample Data for Gavelogy Database
-- Run this AFTER running SCHEMA_FIXED.sql

-- Insert sample courses
INSERT INTO courses (id, name, description, price) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Static Subjects Course', '13 Law Subjects • 650 Questions • 20 Mock Tests', 1999.00),
('550e8400-e29b-41d4-a716-446655440002', 'Contemporary Cases Course', '150 Legal Cases • 2023-2025 • Month Quizzes', 1499.00);

-- Insert sample subjects (with proper UUIDs)
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
