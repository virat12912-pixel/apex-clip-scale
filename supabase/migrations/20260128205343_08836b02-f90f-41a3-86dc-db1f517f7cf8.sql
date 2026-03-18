-- Phase 2-4: Part 2 - Add clipper tiers and analytics tables

-- Create clipper_tier enum for quality tiers
DO $$ BEGIN
  CREATE TYPE public.clipper_tier AS ENUM ('standard', 'verified', 'elite');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add clipper_tier column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clipper_tier text DEFAULT 'standard' CHECK (clipper_tier IN ('standard', 'verified', 'elite'));

-- Add approval_rate column for tracking clipper performance
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_rate numeric DEFAULT 0;

-- Add total_views_generated column for clipper metrics
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_views_generated bigint DEFAULT 0;

-- Add campaign_health column to campaigns for health indicators
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'needs_attention', 'underperforming'));

-- Add budget_alert_threshold for governance
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS budget_alert_threshold numeric DEFAULT 80;

-- Add auto_pause_enabled for anomaly detection
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS auto_pause_enabled boolean DEFAULT true;

-- Create campaign_analytics table for time-series data
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  views bigint DEFAULT 0,
  submissions_count integer DEFAULT 0,
  earnings numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Enable RLS on campaign_analytics
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_analytics
CREATE POLICY "Campaign owners can view analytics"
ON public.campaign_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_analytics.campaign_id
    AND (campaigns.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Admins can manage analytics
CREATE POLICY "Admins can manage analytics"
ON public.campaign_analytics FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create clipper_stats table for clipper performance tracking
CREATE TABLE IF NOT EXISTS public.clipper_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  views bigint DEFAULT 0,
  earnings numeric DEFAULT 0,
  submissions_count integer DEFAULT 0,
  approvals_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on clipper_stats
ALTER TABLE public.clipper_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for clipper_stats
CREATE POLICY "Users can view own clipper stats"
ON public.clipper_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all clipper stats"
ON public.clipper_stats FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage clipper stats"
ON public.clipper_stats FOR ALL
USING (public.has_role(auth.uid(), 'admin'));