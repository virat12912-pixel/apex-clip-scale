
-- Campaign assignments table: links campaigns to client users
CREATE TABLE public.campaign_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage assignments"
  ON public.campaign_assignments
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments"
  ON public.campaign_assignments
  FOR SELECT
  USING (auth.uid() = user_id);
