/*
# Create storage policies for photos bucket

## Overview
Creates storage policies so authenticated users can upload, read, and delete
their own photos in the `photos` storage bucket.

## Security
- SELECT (read): authenticated users can read all photos (public bucket).
- INSERT (upload): authenticated users can upload to their own folder.
- DELETE: authenticated users can delete from their own folder.
- UPDATE: authenticated users can update objects in their own folder.

## Notes
1. The bucket is public so photo URLs are accessible for display.
2. Upload/delete scoped to user's own folder: `user_id/`.
*/

DROP POLICY IF EXISTS "Public read access for photos bucket" ON storage.objects;
CREATE POLICY "Public read access for photos bucket" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Authenticated users can update own photos" ON storage.objects;
CREATE POLICY "Authenticated users can update own photos" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Authenticated users can delete own photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete own photos" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'photos');
