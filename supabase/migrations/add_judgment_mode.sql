-- Migration: Add Notes + Judgment Mode
-- Run this in your Supabase SQL editor

-- 1. Add pdf_url column to structure_items (our "cases" table)
ALTER TABLE structure_items ADD COLUMN IF NOT EXISTS pdf_url text;

-- 2. Create note_pdf_links table
CREATE TABLE IF NOT EXISTS note_pdf_links (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid references structure_items(id) on delete cascade,
  link_id    text not null,
  pdf_page   integer not null,
  x          float not null,
  y          float not null,
  width      float not null,
  height     float not null,
  label      text,
  created_at timestamptz default now()
);

-- 3. RLS policies for note_pdf_links
ALTER TABLE note_pdf_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read links"
  ON note_pdf_links FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert links"
  ON note_pdf_links FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete links"
  ON note_pdf_links FOR DELETE
  USING (auth.role() = 'service_role');

-- 4. Create Supabase Storage bucket for judgment PDFs
-- Run in dashboard: Storage > New bucket > Name: judgments, Public: YES
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('judgments', 'judgments', true)
ON CONFLICT (id) DO NOTHING;
