-- Fix referrals RLS: Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;

-- Create admin-only INSERT policy for referrals
CREATE POLICY "Only admins can create referrals" ON public.referrals
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin UPDATE policy for referrals
CREATE POLICY "Admins can update referrals" ON public.referrals
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin DELETE policy for referrals
CREATE POLICY "Admins can delete referrals" ON public.referrals
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));