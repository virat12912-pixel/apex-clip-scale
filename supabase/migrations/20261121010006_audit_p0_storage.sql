-- Audit P0 fixes: M-23 (campaign-images bucket) + M-24 (final-submissions
-- bucket) storage policies.
--
-- M-23: any authenticated user could upload / overwrite / delete any
-- campaign image (policies only required auth.uid() IS NOT NULL). Now the
-- brand-or-admin role is required AND the first path segment must be the
-- caller's own id, mirroring the avatars bucket pattern. The public SELECT
-- policy is unchanged — campaign images are meant to be publicly visible.
--
-- M-24: final-submissions screenshots (analytics / demographics data) were
-- world-readable in a public bucket. The bucket is now private and the
-- "Anyone can view" SELECT policy is replaced with an owner-or-admin-only
-- policy. Reads go through signed URLs, which the code already fetches
-- (FinalSubmissionForm, AdminFinalReviews via createSignedUrl).
-- NOTE: uploads still have no MIME-type / size validation — that is the
-- frontend stream's job (storage policies cannot express a MIME allow-list
-- here); do not treat this migration as closing that half of M-24.

-- ---------------------------------------------------------------- M-23
DROP POLICY IF EXISTS "Brands can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Brands can update campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Brands can delete campaign images" ON storage.objects;

CREATE POLICY "Brands can upload campaign images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-images'
    AND (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'))
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brands can update campaign images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'campaign-images'
    AND (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'))
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brands can delete campaign images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-images'
    AND (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'))
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------- M-24
UPDATE storage.buckets SET public = false WHERE id = 'final-submissions';

DROP POLICY IF EXISTS "Anyone can view final submission files" ON storage.objects;

CREATE POLICY "Owners and admins can view final submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'final-submissions'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );
