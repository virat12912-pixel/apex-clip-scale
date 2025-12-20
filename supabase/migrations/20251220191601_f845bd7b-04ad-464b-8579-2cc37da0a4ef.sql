-- Create brand_applications table
CREATE TABLE public.brand_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  campaign_goals TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Users can create their own applications
CREATE POLICY "Users can create own application" ON public.brand_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view own application" ON public.brand_applications
FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON public.brand_applications
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications" ON public.brand_applications
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Add submitted_views and screenshot_url to submissions
ALTER TABLE public.submissions
ADD COLUMN submitted_views INTEGER DEFAULT 0,
ADD COLUMN screenshot_url TEXT;

-- Create trigger for updated_at on brand_applications
CREATE TRIGGER update_brand_applications_updated_at
BEFORE UPDATE ON public.brand_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to upgrade user role (for admins)
CREATE OR REPLACE FUNCTION public.upgrade_user_role(_user_id uuid, _new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _user_id;
END;
$$;