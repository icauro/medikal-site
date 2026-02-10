-- Add is_deleted column to comments table for soft deletion
-- This allows preserving comment history while hiding deleted comments

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Update existing records to have is_deleted = false
UPDATE public.comments
SET is_deleted = FALSE
WHERE is_deleted IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted
ON public.comments(is_deleted)
WHERE is_deleted = FALSE;