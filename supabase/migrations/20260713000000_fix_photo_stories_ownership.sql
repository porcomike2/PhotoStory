/*
# Fix photo_stories ownership + tighten storage SELECT

## Problem
1. photo_stories INSERT/UPDATE only checked story ownership.
   A user knowing another user's photo UUID could link it into their own story.
2. Storage SELECT allowed any authenticated user to read any object in the photos bucket.

## Changes
- photo_stories policies: also require that the linked photo belongs to auth.uid().
- Storage SELECT: restrict to objects whose first path segment equals auth.uid()::text.
  (Public bucket + getPublicUrl still work for <img src>; this policy governs authenticated API access.)
*/

-- photo_stories: SELECT (keep story ownership, add photo ownership for consistency)
DROP POLICY IF EXISTS "select_own_photo_stories" ON photo_stories;
CREATE POLICY "select_own_photo_stories" ON photo_stories FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = photo_stories.story_id
        AND stories.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_stories.photo_id
        AND photos.user_id = auth.uid()
    )
  );

-- photo_stories: INSERT
DROP POLICY IF EXISTS "insert_own_photo_stories" ON photo_stories;
CREATE POLICY "insert_own_photo_stories" ON photo_stories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = photo_stories.story_id
        AND stories.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_stories.photo_id
        AND photos.user_id = auth.uid()
    )
  );

-- photo_stories: UPDATE
DROP POLICY IF EXISTS "update_own_photo_stories" ON photo_stories;
CREATE POLICY "update_own_photo_stories" ON photo_stories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = photo_stories.story_id
        AND stories.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_stories.photo_id
        AND photos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = photo_stories.story_id
        AND stories.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_stories.photo_id
        AND photos.user_id = auth.uid()
    )
  );

-- photo_stories: DELETE
DROP POLICY IF EXISTS "delete_own_photo_stories" ON photo_stories;
CREATE POLICY "delete_own_photo_stories" ON photo_stories FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = photo_stories.story_id
        AND stories.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_stories.photo_id
        AND photos.user_id = auth.uid()
    )
  );

-- Storage SELECT: own folder only
DROP POLICY IF EXISTS "Public read access for photos bucket" ON storage.objects;
CREATE POLICY "Authenticated users can read own photos" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
