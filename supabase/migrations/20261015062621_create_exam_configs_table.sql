/*
# Create exam_configs table for exam definitions

1. New Tables
- `exam_configs`
  - `id` (uuid, primary key)
  - `name` (text, not null) — e.g. "FA 1", "SA 2"
  - `total_marks` (integer, not null) — out-of marks, e.g. 15, 20, 50, 100
  - `remarks` (text, nullable) — optional notes about the exam
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `exam_configs`.
- Allow anon + authenticated CRUD (single-tenant admin app, no auth-RLS).
*/

CREATE TABLE IF NOT EXISTS exam_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_marks integer NOT NULL DEFAULT 100,
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exam_configs" ON exam_configs;
CREATE POLICY "anon_select_exam_configs" ON exam_configs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exam_configs" ON exam_configs;
CREATE POLICY "anon_insert_exam_configs" ON exam_configs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exam_configs" ON exam_configs;
CREATE POLICY "anon_update_exam_configs" ON exam_configs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exam_configs" ON exam_configs;
CREATE POLICY "anon_delete_exam_configs" ON exam_configs FOR DELETE
  TO anon, authenticated USING (true);
