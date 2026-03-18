-- Fix submissions INSERT policy to allow any authenticated user to submit
-- The role check was too restrictive and preventing legitimate submissions

-- Drop both possible policy names to ensure clean state
DROP POLICY IF EXISTS "Creators can submit clips" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can submit clips" ON public.submissions;

-- Create the new policy that allows any authenticated user to submit
-- (removed the role check requirement)
CREATE POLICY "Authenticated users can submit clips" ON public.submissions
  FOR INSERT 
  WITH CHECK (
    creator_id = auth.uid()
  );

