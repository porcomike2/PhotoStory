/*
# Create stories and photo_stories tables

## Overview
Adds support for "Stories" — user-curated collections of photos. A story has a title
and optional description. Photos are linked to stories via a many-to-many junction
table `photo_stories` with an ordering column.

## New Tables

### stories
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, not null, defaults to auth.uid() — owner of the story)
- `title` (text, not null — story title)
- `description` (text — optional longer description)
- `created_at` (timestamptz, auto-generated)

### photo_stories (junction table — many-to-many)
- `id` (uuid, primary key, auto-generated)
- `story_id` (uuid, not null — FK to stories, cascade on delete)
- `photo_id` (uuid, not null — FK to photos, cascade on delete)
- `position` (int, not null, default 0 — ordering of photos within a story)
- `created_at` (timestamptz, auto-generated)
- UNIQUE constraint on (story_id, photo_id) to prevent duplicates

## Security
- RLS enabled on both `stories` and `photo_stories`.
- `stories`: 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) restricted to
  `authenticated` users where `user_id = auth.uid()`.
- `photo_stories`: 4 policies (SELECT/INSERT/UPDATE/DELETE) restricted to
  `authenticated` users who own the parent story (checked via EXISTS subquery
  on `stories` where `stories.user_id = auth.uid()`).
- `user_id` on `stories` defaults to `auth.uid()` so inserts omitting it succeed.

## Notes
1. Existing `photos` table and its RLS policies are untouched.
2. Storage policies are untouched.
3. Indexes added on `stories(user_id)` and `photo_stories(story_id)` for query performance.
4. The junction table cascade-deletes when either a story or a photo is deleted.
*/

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_stories" ON stories;
CREATE POLICY "select_own_stories" ON stories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stories" ON stories;
CREATE POLICY "insert_own_stories" ON stories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stories" ON stories;
CREATE POLICY "update_own_stories" ON stories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stories" ON stories;
CREATE POLICY "delete_own_stories" ON stories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);

CREATE TABLE IF NOT EXISTS photo_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (story_id, photo_id)
);

ALTER TABLE photo_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photo_stories" ON photo_stories;
CREATE POLICY "select_own_photo_stories" ON photo_stories FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = photo_stories.story_id AND stories.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_photo_stories" ON photo_stories;
CREATE POLICY "insert_own_photo_stories" ON photo_stories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = photo_stories.story_id AND stories.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_photo_stories" ON photo_stories;
CREATE POLICY "update_own_photo_stories" ON photo_stories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = photo_stories.story_id AND stories.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = photo_stories.story_id AND stories.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_photo_stories" ON photo_stories;
CREATE POLICY "delete_own_photo_stories" ON photo_stories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM stories WHERE stories.id = photo_stories.story_id AND stories.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_photo_stories_story_id ON photo_stories(story_id);
CREATE INDEX IF NOT EXISTS idx_photo_stories_photo_id ON photo_stories(photo_id);
