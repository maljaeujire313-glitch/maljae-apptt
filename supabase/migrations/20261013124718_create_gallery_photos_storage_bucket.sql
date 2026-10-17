/*
# Create gallery-photos storage bucket

Creates a public storage bucket for gallery image uploads.
Allows anon + authenticated to read, upload, and delete gallery photos.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-photos', 'gallery-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_gallery_photos" ON storage.objects;
CREATE POLICY "anon_select_gallery_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "anon_insert_gallery_photos" ON storage.objects;
CREATE POLICY "anon_insert_gallery_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "anon_update_gallery_photos" ON storage.objects;
CREATE POLICY "anon_update_gallery_photos" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'gallery-photos') WITH CHECK (bucket_id = 'gallery-photos');

DROP POLICY IF EXISTS "anon_delete_gallery_photos" ON storage.objects;
CREATE POLICY "anon_delete_gallery_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'gallery-photos');
