
-- Allow client users to view campaigns assigned to them
CREATE POLICY "Client users can view assigned campaigns"
  ON public.campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_assignments
      WHERE campaign_assignments.campaign_id = campaigns.id
        AND campaign_assignments.user_id = auth.uid()
    )
  );

-- Allow client users to view submissions for their assigned campaigns
CREATE POLICY "Client users can view submissions for assigned campaigns"
  ON public.submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_assignments
      WHERE campaign_assignments.campaign_id = submissions.campaign_id
        AND campaign_assignments.user_id = auth.uid()
    )
  );
