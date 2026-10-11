CREATE POLICY "Owners can list own avatar files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Owners can list own campaign images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'campaign-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Owners and admins can list final submission files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'final-submissions'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    OR public.has_role((SELECT auth.uid()), 'admin')
  )
);