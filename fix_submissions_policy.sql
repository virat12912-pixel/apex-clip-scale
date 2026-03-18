-- Quick fix for submissions INSERT policy
-- Run this in your Supabase SQL Editor to fix the RLS error immediately

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Creators can submit clips" ON public.submissions;

-- Drop the new policy if it exists (to recreate it cleanly)
DROP POLICY IF EXISTS "Authenticated users can submit clips" ON public.submissions;

-- Create the new policy that allows any authenticated user to submit
-- (removed the role check requirement - only checks that creator_id matches auth.uid())
CREATE POLICY "Authenticated users can submit clips" ON public.submissions
  FOR INSERT 
  WITH CHECK (
    creator_id = auth.uid()
  );

