/*
# Create leave management tables

Three tables for comprehensive leave management:

## leaves
Personal/student leave records with departure/return dates, reason, category, and status.
Supports both admin-recorded and student/parent-requested leaves.

## monthly_leaves
General monthly holidays that apply to ALL students. Admins mark these once and they
reflect for every student. Used for carry-forward calculation.

## leave_balances
Per-student per-month leave balance tracking. Tracks used days, remaining days,
carried-forward extra days, and held (penalty) days from late returns.

## Security
RLS enabled on all tables with anon/authenticated CRUD (same pattern as existing tables).
*/

CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'School',
  reason text NOT NULL DEFAULT '',
  departure_date date NOT NULL,
  departure_time text DEFAULT '08:00',
  return_date date NOT NULL,
  return_time text DEFAULT '18:00',
  total_days numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'approved',
  requested_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leaves" ON leaves;
CREATE POLICY "anon_select_leaves" ON leaves FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leaves" ON leaves;
CREATE POLICY "anon_insert_leaves" ON leaves FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leaves" ON leaves;
CREATE POLICY "anon_update_leaves" ON leaves FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leaves" ON leaves;
CREATE POLICY "anon_delete_leaves" ON leaves FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS monthly_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  leave_type text NOT NULL DEFAULT 'School',
  title text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE monthly_leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_monthly_leaves" ON monthly_leaves;
CREATE POLICY "anon_select_monthly_leaves" ON monthly_leaves FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_monthly_leaves" ON monthly_leaves;
CREATE POLICY "anon_insert_monthly_leaves" ON monthly_leaves FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_monthly_leaves" ON monthly_leaves;
CREATE POLICY "anon_update_monthly_leaves" ON monthly_leaves FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_monthly_leaves" ON monthly_leaves;
CREATE POLICY "anon_delete_monthly_leaves" ON monthly_leaves FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  leave_type text NOT NULL DEFAULT 'School',
  allocated_days integer NOT NULL DEFAULT 4,
  used_days integer NOT NULL DEFAULT 0,
  extra_days integer NOT NULL DEFAULT 0,
  held_days integer NOT NULL DEFAULT 0,
  carry_forward integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, year, month, leave_type)
);

ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_leave_balances" ON leave_balances;
CREATE POLICY "anon_select_leave_balances" ON leave_balances FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leave_balances" ON leave_balances;
CREATE POLICY "anon_insert_leave_balances" ON leave_balances FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leave_balances" ON leave_balances;
CREATE POLICY "anon_update_leave_balances" ON leave_balances FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leave_balances" ON leave_balances;
CREATE POLICY "anon_delete_leave_balances" ON leave_balances FOR DELETE
  TO anon, authenticated USING (true);
