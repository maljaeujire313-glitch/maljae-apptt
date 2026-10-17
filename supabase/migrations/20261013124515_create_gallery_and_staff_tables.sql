/*
# Create gallery_images and staff tables

## gallery_images
Stores admin-uploaded gallery photos for the landing page.
Admins can upload, delete, and reorder photos. The landing page
gallery reads from this table instead of hardcoded image URLs.

## staff
Stores staff member accounts with individual username/password logins.
Each staff member logs in with their credentials to access the admin portal.
The admin can add, edit, or remove staff. Staff have a role field to
distinguish admin from regular staff (both can access the portal).

## Security
RLS enabled on both tables with anon/authenticated CRUD (same pattern
as existing tables in this project — no auth screen, shared data).
*/

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery_images" ON gallery_images;
CREATE POLICY "anon_select_gallery_images" ON gallery_images FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_gallery_images" ON gallery_images;
CREATE POLICY "anon_insert_gallery_images" ON gallery_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_gallery_images" ON gallery_images;
CREATE POLICY "anon_update_gallery_images" ON gallery_images FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_gallery_images" ON gallery_images;
CREATE POLICY "anon_delete_gallery_images" ON gallery_images FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE
  TO anon, authenticated USING (true);
