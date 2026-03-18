-- Remove creator resubmission/relaunch update path for final submissions
-- This disables user UPDATE on final_submissions; only INSERT (initial submission) remains.

DROP POLICY IF EXISTS "Users can update own final submission to resubmit" ON public.final_submissions;