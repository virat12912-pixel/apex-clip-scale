-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('creator', 'brand', 'admin');

-- Create campaign status enum
CREATE TYPE public.campaign_status AS ENUM ('active', 'paused', 'completed', 'private');

-- Create submission status enum
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- Create payout status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Create platform enum
CREATE TYPE public.platform_type AS ENUM ('tiktok', 'instagram', 'youtube');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  referral_code TEXT UNIQUE DEFAULT CONCAT('APEX', UPPER(SUBSTR(gen_random_uuid()::text, 1, 8))),
  referred_by UUID REFERENCES public.profiles(id),
  payout_method TEXT DEFAULT 'paypal',
  payout_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'creator',
  UNIQUE (user_id, role)
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  platforms platform_type[] NOT NULL DEFAULT '{}',
  niche TEXT,
  rate_value DECIMAL(10,2) NOT NULL DEFAULT 75,
  rate_unit INTEGER NOT NULL DEFAULT 100000,
  min_views INTEGER NOT NULL DEFAULT 1000,
  max_earnings_per_post DECIMAL(10,2),
  total_budget DECIMAL(10,2) NOT NULL DEFAULT 1000,
  spent_budget DECIMAL(10,2) NOT NULL DEFAULT 0,
  status campaign_status NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  clip_url TEXT NOT NULL,
  platform platform_type NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  status submission_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT NOT NULL,
  payout_email TEXT NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Assign default role (creator)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'creator'));
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- CAMPAIGNS POLICIES
CREATE POLICY "Anyone authenticated can view active campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (status = 'active' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brands can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brands can update own campaigns" ON public.campaigns
  FOR UPDATE USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campaigns" ON public.campaigns
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- SUBMISSIONS POLICIES
CREATE POLICY "Creators can view own submissions" ON public.submissions
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Campaign owners can view submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = submissions.campaign_id 
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions" ON public.submissions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can submit clips" ON public.submissions
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    public.has_role(auth.uid(), 'creator')
  );

CREATE POLICY "Admins can update submissions" ON public.submissions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- WALLETS POLICIES
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can update wallets" ON public.wallets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- PAYOUTS POLICIES
CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can request payouts" ON public.payouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage payouts" ON public.payouts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- REFERRALS POLICIES
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "System can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX idx_submissions_campaign ON public.submissions(campaign_id);
CREATE INDEX idx_submissions_creator ON public.submissions(creator_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_wallets_user ON public.wallets(user_id);
CREATE INDEX idx_payouts_user ON public.payouts(user_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);