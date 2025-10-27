-- Remove duplicate policy on pyqs_2020
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Allow public read access to pyqs" ON pyqs_2020;

-- Verify remaining policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pyqs_2020';

