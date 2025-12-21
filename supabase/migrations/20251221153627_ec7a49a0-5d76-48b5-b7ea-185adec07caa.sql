-- Add likes and comments columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS likes bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments bigint DEFAULT 0;