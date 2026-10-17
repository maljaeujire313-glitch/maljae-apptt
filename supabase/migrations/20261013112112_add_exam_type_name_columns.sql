/*
# Add exam type and exam name columns to marks table

Adds two columns to support exam categorization:
- exam_type (text): 'School' or 'Dars' — categorizes the exam
- exam_name (text): e.g. 'FA 1', 'FA 2', 'SA 1' — names the specific exam

## Changes to existing table: marks
- exam_type text (nullable, defaults to 'School')
- exam_name text (nullable)

## Security
No security changes — existing RLS policies already allow anon/authenticated CRUD.
*/

ALTER TABLE marks ADD COLUMN IF NOT EXISTS exam_type text DEFAULT 'School';
ALTER TABLE marks ADD COLUMN IF NOT EXISTS exam_name text;
