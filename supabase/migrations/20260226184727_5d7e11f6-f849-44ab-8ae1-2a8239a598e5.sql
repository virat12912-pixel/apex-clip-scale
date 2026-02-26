
-- Drop the existing restrictive SELECT policies and recreate with broader access
DROP POLICY IF EXISTS "Anyone authenticated can view active campaigns" ON public.campaigns;

CREATE POLICY "Anyone authenticated can view active campaigns"
ON public.campaigns
FOR SELECT
USING (
  (status = 'active'::campaign_status)
  OR (status = 'completed'::campaign_status)
  OR (created_by = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
