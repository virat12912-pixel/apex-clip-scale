
-- Create enum for final submission status
CREATE TYPE public.final_submission_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'paid');

-- Create final_submissions table
CREATE TABLE public.final_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Top 3 performing videos
  video_link_1 TEXT NOT NULL,
  video_link_2 TEXT NOT NULL,
  video_link_3 TEXT NOT NULL,
  video_screenshot_1 TEXT,
  video_screenshot_2 TEXT,
  video_screenshot_3 TEXT,
  
  -- Account analytics
  followers_count BIGINT NOT NULL DEFAULT 0,
  account_analytics_screenshot TEXT,
  
  -- Demographics
  demographics_screenshot TEXT,
  
  -- Confirmation checklist
  ran_paid_ads BOOLEAN NOT NULL DEFAULT false,
  videos_deleted BOOLEAN NOT NULL DEFAULT false,
  content_is_original BOOLEAN NOT NULL DEFAULT true,
  
  -- Review data
  status public.final_submission_status NOT NULL DEFAULT 'submitted',
  tracked_views BIGINT NOT NULL DEFAULT 0,
  verified_views BIGINT,
  final_earnings NUMERIC DEFAULT 0,
  admin_notes TEXT,
  client_payment_received BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One final submission per campaign per user
  UNIQUE (campaign_id, user_id)
);

-- Create review history table
CREATE TABLE public.final_submission_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  final_submission_id UUID NOT NULL REFERENCES public.final_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approved', 'rejected', 'adjusted'
  previous_verified_views BIGINT,
  new_verified_views BIGINT,
  previous_earnings NUMERIC,
  new_earnings NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.final_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_submission_reviews ENABLE ROW LEVEL SECURITY;

-- RLS for final_submissions
CREATE POLICY "Users can view own final submissions"
  ON public.final_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own final submission"
  ON public.final_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all final submissions"
  ON public.final_submissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update final submissions"
  ON public.final_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for final_submission_reviews
CREATE POLICY "Admins can manage reviews"
  ON public.final_submission_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view reviews of own submissions"
  ON public.final_submission_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.final_submissions fs
    WHERE fs.id = final_submission_id AND fs.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_final_submissions_updated_at
  BEFORE UPDATE ON public.final_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for final submission screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('final-submissions', 'final-submissions', true);

-- Storage policies
CREATE POLICY "Users can upload own screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'final-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view final submission files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'final-submissions');

CREATE POLICY "Admins can manage all final submission files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'final-submissions' AND public.has_role(auth.uid(), 'admin'));
