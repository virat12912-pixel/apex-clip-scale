DROP POLICY IF EXISTS "Brands can delete campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Brands can update campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Brands can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Campaign images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view final submission files" ON storage.objects;

CREATE POLICY "Brands can upload campaign images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'campaign-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Brands can update campaign images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'campaign-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
WITH CHECK (bucket_id = 'campaign-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

CREATE POLICY "Brands can delete campaign images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'campaign-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));