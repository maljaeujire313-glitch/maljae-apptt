/*
# Storage policies for student-photos bucket

Creates public read and write policies for the student-photos storage bucket
so the anon-key frontend can upload and read student photos.
*/

CREATE POLICY "anon_read_student_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'student-photos');

CREATE POLICY "anon_insert_student_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "anon_update_student_photos" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'student-photos') WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "anon_delete_student_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'student-photos');
