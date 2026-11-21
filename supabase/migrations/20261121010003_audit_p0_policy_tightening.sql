-- Audit P0 fixes: direct-write policy tightening.
--
-- H-01 payouts: drop the direct INSERT policy entirely. The only legitimate
-- path is request-payout -> accounting_request_payout (locks wallet funds,
-- enforces the $10 minimum, final-submission approval and duplicate rules).
-- Direct inserts could fabricate rows with arbitrary amount / status='paid'.
-- (A DB CHECK on amount is added as NOT VALID in 20261121010005.)
--
-- H-02 final_submissions: INSERT may only create a 'submitted' row with
-- zero earnings, no verified views and no client payment. Self-approval at
-- insert is closed both by the policy and by the trigger below
-- (defence in depth; the pending guard_accounting_write trigger only
-- guards UPDATE, not INSERT).
--
-- H-03 submissions: INSERT may only create a creator-owned, zeroed,
-- pending row. The frontend already inserts exactly this shape
-- (useSubmissions builds status='pending', views/earnings/likes/comments/
-- submitted_views = 0). The partial UNIQUE index also serves H-04: one
-- live (non-rejected) row per (campaign, creator, clip_url), so a metrics
-- assertion cannot be replayed across duplicate rows.
-- NOTE: CREATE UNIQUE INDEX fails at apply time if legacy duplicates exist
-- (same preflight behaviour as the pending accounting migration); dedupe
-- legacy rows before applying.
--
-- H-05 campaigns: INSERT must set created_by to the caller (a brand could
-- previously impersonate another user as created_by and gain owner rights
-- over that campaign's submissions). Money fields are server-managed: the
-- trigger below rejects changes to spent_budget / rate_value / rate_unit /
-- total_budget by anyone except an admin or the service role (accounting
-- RPCs run in service-role context, auth.uid() IS NULL, and set the
-- app.accounting_rpc flag).
--
-- H-07 submissions DELETE: drop the direct DELETE policy. Deletes must go
-- through delete-submission / accounting_clip, which reverses wallet and
-- budget and refuses paid clips. After this drop, no RLS policy permits
-- DELETE on submissions at all; only the service role can delete (via RPC).

-- ---------------------------------------------------------------- H-01
DROP POLICY IF EXISTS "Users can request payouts" ON public.payouts;

-- ---------------------------------------------------------------- H-02
DROP POLICY IF EXISTS "Users can insert own final submission" ON public.final_submissions;
CREATE POLICY "Users can insert own final submission"
  ON public.final_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'submitted'::public.final_submission_status
    AND final_earnings = 0
    AND verified_views IS NULL
    AND client_payment_received = false
  );

CREATE OR REPLACE FUNCTION public.guard_final_submission_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('approved', 'paid')
    OR coalesce(NEW.final_earnings, 0) <> 0
    OR NEW.verified_views IS NOT NULL
    OR NEW.client_payment_received IS TRUE THEN
    RAISE EXCEPTION 'Final submissions must start submitted with zero earnings; approval is an admin review action';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_final_submission_insert ON public.final_submissions;
CREATE TRIGGER guard_final_submission_insert
  BEFORE INSERT ON public.final_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_final_submission_insert();

-- ---------------------------------------------------------------- H-03
DROP POLICY IF EXISTS "Authenticated users can submit clips" ON public.submissions;
CREATE POLICY "Authenticated users can submit clips"
  ON public.submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND status = 'pending'::public.submission_status
    AND views = 0
    AND earnings = 0
    AND likes = 0
    AND comments = 0
    AND submitted_views = 0
  );

CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_active_clip_per_creator
  ON public.submissions (campaign_id, creator_id, clip_url)
  WHERE status <> 'rejected';

-- ---------------------------------------------------------------- H-05
DROP POLICY IF EXISTS "Brands can create campaigns" ON public.campaigns;
CREATE POLICY "Brands can create campaigns"
  ON public.campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.has_role(auth.uid(), 'brand') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE OR REPLACE FUNCTION public.guard_campaign_money_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.accounting_rpc', true) = 'on'
    OR auth.uid() IS NULL
    OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.spent_budget IS DISTINCT FROM OLD.spent_budget
    OR NEW.rate_value IS DISTINCT FROM OLD.rate_value
    OR NEW.rate_unit IS DISTINCT FROM OLD.rate_unit
    OR NEW.total_budget IS DISTINCT FROM OLD.total_budget THEN
    RAISE EXCEPTION 'Campaign money fields are server-managed and can only be changed by an admin or the accounting RPCs';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_campaign_money_fields ON public.campaigns;
CREATE TRIGGER guard_campaign_money_fields
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.guard_campaign_money_fields();

-- ---------------------------------------------------------------- H-07
DROP POLICY IF EXISTS "Creators can delete own submissions" ON public.submissions;
