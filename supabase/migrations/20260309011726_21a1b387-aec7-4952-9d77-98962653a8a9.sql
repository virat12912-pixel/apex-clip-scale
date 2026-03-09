
CREATE POLICY "Users can update own final submission to resubmit"
ON public.final_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status IN ('submitted', 'rejected'))
WITH CHECK (
  user_id = auth.uid() 
  AND status = 'submitted'::final_submission_status
  AND final_earnings = 0
  AND verified_views IS NULL
);
