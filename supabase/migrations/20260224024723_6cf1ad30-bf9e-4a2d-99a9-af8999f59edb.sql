-- Allow client_admin and client_manager to update submissions for their assigned campaigns
CREATE POLICY "Client admins can update submissions for assigned campaigns"
ON public.submissions
FOR UPDATE
USING (
  (
    has_role(auth.uid(), 'client_admin'::app_role)
    OR has_role(auth.uid(), 'client_manager'::app_role)
  )
  AND EXISTS (
    SELECT 1 FROM campaign_assignments
    WHERE campaign_assignments.campaign_id = submissions.campaign_id
    AND campaign_assignments.user_id = auth.uid()
  )
);