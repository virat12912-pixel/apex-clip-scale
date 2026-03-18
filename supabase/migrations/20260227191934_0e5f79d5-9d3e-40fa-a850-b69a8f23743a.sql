
CREATE POLICY "Creators can delete own submissions"
ON public.submissions
FOR DELETE
USING (creator_id = auth.uid());
