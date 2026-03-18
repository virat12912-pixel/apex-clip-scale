-- Add new columns to campaigns table for enhanced campaign management
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS min_payout_views integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS required_hashtags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS required_links text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;

-- Create social_accounts table for creator verification
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform platform_type NOT NULL,
  username text NOT NULL,
  profile_url text,
  verification_code text UNIQUE DEFAULT concat('APEX', upper(substr((gen_random_uuid())::text, 1, 8))),
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, platform, username)
);

-- Enable RLS on social_accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can view own social accounts"
ON public.social_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own social accounts"
ON public.social_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts"
ON public.social_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts"
ON public.social_accounts
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all social accounts"
ON public.social_accounts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all social accounts"
ON public.social_accounts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_social_accounts_updated_at
BEFORE UPDATE ON public.social_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add campaign_id to submissions for better tracking (if not exists)
-- This helps group payouts by campaign
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS auto_rejected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason text;