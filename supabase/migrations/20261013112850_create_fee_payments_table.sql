/*
# Create fee_payments table for monthly fee tracking

Each row tracks a single month's fee payment for a student.
- student_id: links to students table
- year: e.g. 2026
- month: 1-12 (January=1, December=12)
- amount: fee amount in INR (default 1500)
- paid: boolean
- paid_at: timestamp when marked paid
- receipt_id: unique receipt number for PDF generation

RLS: anon/authenticated can CRUD (same pattern as other tables).
*/

CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  amount integer NOT NULL DEFAULT 1500,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  receipt_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, year, month)
);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fee_payments" ON fee_payments;
CREATE POLICY "anon_select_fee_payments" ON fee_payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fee_payments" ON fee_payments;
CREATE POLICY "anon_insert_fee_payments" ON fee_payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fee_payments" ON fee_payments;
CREATE POLICY "anon_update_fee_payments" ON fee_payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fee_payments" ON fee_payments;
CREATE POLICY "anon_delete_fee_payments" ON fee_payments FOR DELETE
  TO anon, authenticated USING (true);
