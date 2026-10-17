/*
# Create Academy Management Tables

This migration creates the core tables for the Science & Dars Academy app:
- students: student profiles with auto-generated credentials for student and parent logins
- calls: call log entries tracking communication with students
- notes: study notes/materials organized by class and subject
- marks: exam marks per student per subject

## Tables

### students
- id (uuid, primary key)
- name (text, student full name)
- category (text: 'School' or 'Dars')
- class (text: e.g. 'Class 8', 'Class 9', 'Class 10')
- username (text, unique - student login username, auto-generated)
- password (text - student login password, auto-generated)
- parent_user (text, unique - parent login username, auto-generated)
- parent_pass (text - parent login password, auto-generated)
- fees_paid (boolean, default false)
- created_at (timestamp)

### calls
- id (uuid, primary key)
- student_id (uuid, foreign key to students)
- called_at (timestamp, when the call was logged)
- created_at (timestamp)

### notes
- id (uuid, primary key)
- class (text, e.g. 'Class 8')
- subject (text, e.g. 'Maths')
- title (text, note title/description)
- link (text, optional link to external resource)
- created_at (timestamp)

### marks
- id (uuid, primary key)
- student_id (uuid, foreign key to students)
- subject (text)
- score (integer)
- created_at (timestamp)

## Security
This is a single-tenant app with no sign-in screen — the admin/staff accesses the dashboard directly.
RLS is enabled on all tables with TO anon, authenticated policies so the anon-key frontend can read/write all data.
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'School',
  class text NOT NULL DEFAULT 'Class 8',
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  parent_user text UNIQUE NOT NULL,
  parent_pass text NOT NULL,
  fees_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  called_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_calls" ON calls;
CREATE POLICY "anon_select_calls" ON calls FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_calls" ON calls;
CREATE POLICY "anon_insert_calls" ON calls FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_calls" ON calls;
CREATE POLICY "anon_update_calls" ON calls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_calls" ON calls;
CREATE POLICY "anon_delete_calls" ON calls FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_marks" ON marks;
CREATE POLICY "anon_select_marks" ON marks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_marks" ON marks;
CREATE POLICY "anon_insert_marks" ON marks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_marks" ON marks;
CREATE POLICY "anon_update_marks" ON marks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_marks" ON marks;
CREATE POLICY "anon_delete_marks" ON marks FOR DELETE
  TO anon, authenticated USING (true);
