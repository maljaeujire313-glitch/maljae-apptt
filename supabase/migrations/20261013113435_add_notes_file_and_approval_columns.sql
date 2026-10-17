/*
# Add file support and approval to notes table

Adds columns for file uploads and admin approval:
- file_url: public URL of uploaded file in storage
- file_name: original filename
- file_type: MIME type
- approved: boolean, default false — notes only visible to students/parents when true

Also creates the notes-files storage bucket with public read policies.
*/

ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Create storage bucket for note files
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes-files', 'notes-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for notes-files bucket
DROP POLICY IF EXISTS "anon_select_notes_files" ON storage.objects;
CREATE POLICY "anon_select_notes_files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'notes-files');

DROP POLICY IF EXISTS "anon_insert_notes_files" ON storage.objects;
CREATE POLICY "anon_insert_notes_files" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'notes-files');

DROP POLICY IF EXISTS "anon_update_notes_files" ON storage.objects;
CREATE POLICY "anon_update_notes_files" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'notes-files') WITH CHECK (bucket_id = 'notes-files');

DROP POLICY IF EXISTS "anon_delete_notes_files" ON storage.objects;
CREATE POLICY "anon_delete_notes_files" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'notes-files');
