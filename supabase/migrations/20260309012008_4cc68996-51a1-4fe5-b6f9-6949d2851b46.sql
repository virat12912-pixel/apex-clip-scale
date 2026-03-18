
DROP POLICY IF EXISTS "Users can update own final submission to resubmit" ON public.final_submissions;

CREATE POLICY "Users can update own final submission to resubmit"
ON public.final_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND status = 'submitted'::final_submission_status
  AND final_earnings = 0
  AND verified_views IS NULL
  AND reviewed_at IS NULL
  AND approved_at IS NULL
  AND paid_at IS NULL
  AND client_payment_received = false
  AND admin_notes IS NULL
);
