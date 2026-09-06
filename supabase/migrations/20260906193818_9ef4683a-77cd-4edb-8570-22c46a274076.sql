UPDATE public.campaigns c
SET spent_budget = COALESCE((
  SELECT SUM(s.earnings)
  FROM public.submissions s
  WHERE s.campaign_id = c.id
    AND s.status IN ('pending','approved','paid')
), 0);