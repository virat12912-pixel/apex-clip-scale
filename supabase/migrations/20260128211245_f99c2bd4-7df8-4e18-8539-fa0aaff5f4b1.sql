-- Enable realtime for submissions table to broadcast view count changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;