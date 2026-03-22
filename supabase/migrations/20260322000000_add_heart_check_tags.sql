-- Add heart_check_tags column to reflections table for storing
-- the Heart Check selections from Step 2 of the guided journey.
-- The reflections table already exists (see schema.sql); this adds
-- the new column and tightens RLS policies.

ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS heart_check_tags TEXT[];

-- Add indexes for common lookups if they don't already exist.
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON public.reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_verse_id ON public.reflections(verse_id);
