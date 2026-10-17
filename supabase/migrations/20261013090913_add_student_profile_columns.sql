/*
# Add student profile columns

Adds new columns to the students table to support:
- Custom ID number (admin-assigned identifier)
- Student photo URL (stored in Supabase Storage)
- Father's WhatsApp number (required)
- Mother's WhatsApp number (optional)

## Changes to existing table: students
- custom_id (text, nullable) - admin-assigned custom ID number
- photo_url (text, nullable) - URL to student photo in Supabase Storage
- father_whatsapp (text, nullable) - father's WhatsApp number
- mother_whatsapp (text, nullable) - mother's WhatsApp number

## Security
No security changes — existing RLS policies on students already allow anon/authenticated CRUD.
*/

ALTER TABLE students ADD COLUMN IF NOT EXISTS custom_id text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_whatsapp text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_whatsapp text;
