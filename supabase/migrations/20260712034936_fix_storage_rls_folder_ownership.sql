/*
# Fix storage RLS policies for photos bucket — enforce per-user folder ownership

## Problem
The existing INSERT, UPDATE, and DELETE policies on `storage.objects` only checked
`bucket_id = 'photos'` without verifying that the file path belongs to the authenticated
user. Any authenticated user could upload, modify, or delete files in another user's folder.

## Changes
- DROP and RECREATE the INSERT, UPDATE, and DELETE policies on `storage.objects`
  for the `photos` bucket, adding the condition:
    `(storage.foldername(name))[1] = auth.uid()::text`
  This ensures the first path segment of the file name matches the authenticated user's ID.
- The SELECT policy ("Public read access for photos bucket") is left unchanged —
  authenticated users can still read all photos in the bucket.

## Security
- INSERT: `WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)`
- UPDATE: `USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)`
           `WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)`
- DELETE: `USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text)`

## Notes
1. The frontend (PhotoForm.tsx) uploads files to `${user.id}/...` which matches the
   `(storage.foldername(name))[1]` check exactly.
2. The SELECT policy is not touched — it remains public read for authenticated users.
3. `storage.foldername(name)` returns a text array of path segments; `[1]` is the first segment
   (PostgreSQL arrays are 1-indexed).
*/

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update own photos" ON storage.objects;
CREATE POLICY "Authenticated users can update own photos" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can delete own photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete own photos" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
