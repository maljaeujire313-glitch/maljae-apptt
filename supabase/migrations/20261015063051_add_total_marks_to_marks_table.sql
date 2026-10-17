/*
# Add total_marks column to marks table

1. Modified Tables
- `marks`
  - Added `total_marks` (integer, nullable) — the out-of marks for the exam (e.g. 15, 20, 50, 100).
    Nullable so existing rows are not affected; new inserts from the updated form will include it.
2. Security
- No security changes; existing RLS policies on `marks` remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marks' AND column_name = 'total_marks'
  ) THEN
    ALTER TABLE marks ADD COLUMN total_marks integer;
  END IF;
END $$;
