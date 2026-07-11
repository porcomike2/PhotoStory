/*
# Create photos table for PhotoStory app

## Overview
Creates the core `photos` table for the PhotoStory personal journal app.
Each photo belongs to a user and stores image reference, metadata, and story.

## New Tables

### photos
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, not null, defaults to auth.uid() — owner of the photo)
- `storage_url` (text, not null — public URL of the image in Supabase Storage)
- `title` (text, not null — user-given title for the photo)
- `photo_date` (timestamptz, not null — date the photo was taken, from EXIF or manual)
- `location` (text — reverse-geocoded or manually entered location name)
- `story` (text — free-text story/memory associated with the photo)
- `gps_lat` (float8 — raw GPS latitude from EXIF)
- `gps_lng` (float8 — raw GPS longitude from EXIF)
- `created_at` (timestamptz, auto-generated)

## Security
- RLS enabled on `photos`.
- 4 owner-scoped policies (SELECT, INSERT, UPDATE, DELETE) restricted to `authenticated` users.
- Each user can only access rows where `user_id = auth.uid()`.
- `user_id` defaults to `auth.uid()` so inserts omitting it still satisfy the WITH CHECK constraint.

## Notes
1. This is a multi-user app — each user sees only their own photos.
2. The frontend must implement sign-in/sign-up to use the app.
3. Storage bucket `photos` should be created separately for image uploads.
*/

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  title text NOT NULL,
  photo_date timestamptz NOT NULL,
  location text,
  story text,
  gps_lat float8,
  gps_lng float8,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photos" ON photos;
CREATE POLICY "select_own_photos" ON photos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_photos" ON photos;
CREATE POLICY "insert_own_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_photos" ON photos;
CREATE POLICY "update_own_photos" ON photos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_photos" ON photos;
CREATE POLICY "delete_own_photos" ON photos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_photo_date ON photos(photo_date DESC);
