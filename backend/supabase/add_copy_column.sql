-- Migration: Add copy column to schedule_items table
-- This allows storing social media copy content for each schedule item

-- Add the copy column to store social media content
ALTER TABLE public.schedule_items 
ADD COLUMN IF NOT EXISTS copy TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.schedule_items.copy IS 'Social media copy content for the scheduled post';

-- Optional: Create an index if you plan to search by copy content
-- CREATE INDEX IF NOT EXISTS schedule_items_copy_idx ON public.schedule_items USING gin(to_tsvector('spanish', copy));
