/*
# Create leave_non_goers table for tracking students who stay back during monthly leaves

1. New Tables
- `leave_non_goers`
  - `id` (uuid, primary key)
  - `monthly_leave_id` (uuid, FK to monthly_leaves, ON DELETE CASCADE)
  - `student_id` (uuid, FK to students, ON DELETE CASCADE)
  - `notes` (text, optional, for any remarks about why student stayed)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (monthly_leave_id, student_id) to prevent duplicates

2. Security
- Enable RLS on `leave_non_goers`.
- Anon + authenticated CRUD (single-tenant app with no Supabase auth sign-in).
*/

CREATE TABLE IF NOT EXISTS leave_non_goers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_leave_id uuid NOT NULL REFERENCES monthly_leaves(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(monthly_leave_id, student_id)
);

ALTER TABLE leave_non_goers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_non_goers" ON leave_non_goers;
CREATE POLICY "anon_select_non_goers" ON leave_non_goers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_non_goers" ON leave_non_goers;
CREATE POLICY "anon_insert_non_goers" ON leave_non_goers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_non_goers" ON leave_non_goers;
CREATE POLICY "anon_update_non_goers" ON leave_non_goers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_non_goers" ON leave_non_goers;
CREATE POLICY "anon_delete_non_goers" ON leave_non_goers FOR DELETE
  TO anon, authenticated USING (true);
