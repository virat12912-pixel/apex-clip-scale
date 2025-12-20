-- Add solana_wallet_address column to profiles for USDC payments
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS solana_wallet_address TEXT;

-- Add is_banned column to profiles for user banning
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Change views column from integer to bigint in submissions table
ALTER TABLE public.submissions ALTER COLUMN views TYPE bigint;

-- Also change submitted_views to bigint
ALTER TABLE public.submissions ALTER COLUMN submitted_views TYPE bigint;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create campaign-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for campaign-images bucket
CREATE POLICY "Campaign images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY "Brands can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Brands can update campaign images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'campaign-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Brands can delete campaign images"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-images' AND auth.uid() IS NOT NULL);