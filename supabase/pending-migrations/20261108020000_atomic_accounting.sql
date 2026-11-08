-- STAGED ONLY: reviewed code change; do not apply to production without a separate release.
-- Preflight indexes intentionally fail on legacy duplicates rather than modifying production records.
CREATE UNIQUE INDEX payouts_one_campaign ON public.payouts(user_id, campaign_id)
  WHERE campaign_id IS NOT NULL AND status IN ('pending','approved','paid','rejected');
CREATE UNIQUE INDEX payouts_one_open_global ON public.payouts(user_id)
  WHERE campaign_id IS NULL AND status IN ('pending','approved');
ALTER TABLE public.payouts ADD COLUMN reserved_amount numeric;
CREATE TABLE public.campaign_disqualifications (
  user_id uuid NOT NULL, campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  payout_id uuid NOT NULL REFERENCES public.payouts(id), created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, campaign_id)
);
GRANT SELECT ON public.campaign_disqualifications TO authenticated;
GRANT ALL ON public.campaign_disqualifications TO service_role;
ALTER TABLE public.campaign_disqualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY disqualifications_read ON public.campaign_disqualifications FOR SELECT TO authenticated
 USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE FUNCTION public.accounting_reviewer(p_actor uuid, p_campaign uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.has_role(p_actor,'admin') OR
 ((public.has_role(p_actor,'client_admin') OR public.has_role(p_actor,'client_manager')) AND
 EXISTS(SELECT 1 FROM public.campaign_assignments WHERE user_id=p_actor AND campaign_id=p_campaign))
$$;
REVOKE ALL ON FUNCTION public.accounting_reviewer(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_reviewer(uuid,uuid) TO service_role;

-- All accounting mutations use campaign -> wallet -> submission/final/payout lock order.
CREATE FUNCTION public.accounting_clip(p_actor uuid, p_submission uuid, p_action text,
 p_views bigint DEFAULT NULL, p_reason text DEFAULT NULL, p_likes bigint DEFAULT NULL, p_comments bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.submissions; c public.campaigns; w public.wallets; f public.final_submissions;
 delta numeric := 0; earned numeric; spent numeric; previous numeric; resulting numeric;
BEGIN
 SELECT * INTO s FROM public.submissions WHERE id=p_submission;
 IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=s.campaign_id FOR UPDATE;
 SELECT * INTO w FROM public.wallets WHERE user_id=s.creator_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Creator wallet not found'; END IF;
 SELECT * INTO s FROM public.submissions WHERE id=p_submission FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
 IF p_action NOT IN ('approve','reject','delete','refresh','threshold') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF p_action='delete' THEN
  IF p_actor<>s.creator_id AND NOT public.has_role(p_actor,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 ELSIF NOT public.accounting_reviewer(p_actor,c.id) AND NOT (p_actor IS NULL AND p_action IN ('refresh','threshold')) THEN
  RAISE EXCEPTION 'Forbidden';
 END IF;
 SELECT * INTO f FROM public.final_submissions WHERE user_id=s.creator_id AND campaign_id=c.id FOR UPDATE;
 SELECT coalesce(sum(earnings),0) INTO spent FROM public.submissions WHERE campaign_id=c.id AND status IN ('approved','paid');
 previous := s.earnings;
 PERFORM set_config('app.accounting_rpc','on',true);
 IF p_action='approve' THEN
  IF s.status<>'pending' THEN RAISE EXCEPTION 'Only pending clips can be approved'; END IF;
  IF c.status NOT IN ('active','private') OR (c.end_date IS NOT NULL AND c.end_date<=now()) THEN
   RAISE EXCEPTION 'Campaign is closed or paused; pending clips cannot be approved'; END IF;
  IF EXISTS(SELECT 1 FROM public.campaign_disqualifications WHERE user_id=s.creator_id AND campaign_id=c.id)
   OR f.status IN ('approved','paid') THEN RAISE EXCEPTION 'Campaign earnings are finalized or creator is disqualified'; END IF;
  IF p_views IS NULL OR p_views<=0 OR c.rate_unit<=0 THEN RAISE EXCEPTION 'Verified views must be positive'; END IF;
  IF spent>=c.total_budget THEN RAISE EXCEPTION 'Campaign budget is exhausted'; END IF;
  earned := round((p_views::numeric/c.rate_unit)*c.rate_value,2);
  IF c.max_earnings_per_post IS NOT NULL THEN earned:=least(earned,c.max_earnings_per_post); END IF;
  earned:=least(earned,c.total_budget-spent);
  delta:=earned;
  UPDATE public.submissions SET status='approved',views=p_views,earnings=earned WHERE id=s.id;
 ELSIF p_action IN ('reject','delete','threshold') THEN
  IF s.status='paid' THEN RAISE EXCEPTION 'Paid clips cannot be reversed'; END IF;
  IF p_action='reject' AND s.status NOT IN ('pending','approved') THEN RAISE EXCEPTION 'Clip already reviewed'; END IF;
  IF p_action='threshold' AND (s.status<>'approved' OR s.views>=coalesce(c.min_payout_views,1000)
   OR NOT (c.status='completed' OR c.end_date<=now())) THEN RETURN jsonb_build_object('success',true,'reversed_earnings',0); END IF;
  IF s.status='approved' THEN
   IF EXISTS(SELECT 1 FROM public.payouts WHERE user_id=s.creator_id AND status IN ('pending','approved','paid')
    AND (campaign_id=c.id OR campaign_id IS NULL)) THEN RAISE EXCEPTION 'Cannot reverse clips with a processing or paid payout'; END IF;
   delta:=-s.earnings;
   -- Verification replaces the campaign's tracked sum. Invalidate it exactly once before reversal.
   IF f.status='approved' THEN
    SELECT coalesce(sum(earnings),0) INTO previous FROM public.submissions WHERE campaign_id=c.id AND creator_id=s.creator_id AND status IN ('approved','paid');
    delta:=previous-coalesce(f.final_earnings,0)-s.earnings;
    UPDATE public.final_submissions SET status='under_review', final_earnings=0, approved_at=NULL WHERE id=f.id;
   END IF;
  END IF;
  IF p_action='delete' THEN DELETE FROM public.submissions WHERE id=s.id;
  ELSE UPDATE public.submissions SET status=CASE WHEN p_action='reject' THEN 'rejected'::public.submission_status ELSE status END,
   earnings=0,rejection_reason=p_reason WHERE id=s.id; END IF;
 ELSIF p_action='refresh' THEN
  IF p_views IS NULL OR p_views<0 OR coalesce(p_likes,0)<0 OR coalesce(p_comments,0)<0 THEN RAISE EXCEPTION 'Invalid metrics'; END IF;
  earned:=s.earnings;
  IF s.status='pending' THEN
   IF EXISTS(SELECT 1 FROM public.campaign_disqualifications WHERE user_id=s.creator_id AND campaign_id=c.id) THEN RAISE EXCEPTION 'Creator disqualified'; END IF;
   earned:=round((p_views::numeric/c.rate_unit)*c.rate_value,2);
   IF c.max_earnings_per_post IS NOT NULL THEN earned:=least(earned,c.max_earnings_per_post); END IF;
  ELSIF s.status='approved' AND c.status='active' AND (c.end_date IS NULL OR c.end_date>now()) AND
   coalesce(f.status::text,'') NOT IN ('approved','paid') AND NOT EXISTS(SELECT 1 FROM public.payouts WHERE user_id=s.creator_id AND status IN ('pending','approved','paid') AND (campaign_id=c.id OR campaign_id IS NULL)) THEN
   earned:=round((greatest(p_views,s.views)::numeric/c.rate_unit)*c.rate_value,2);
   IF c.max_earnings_per_post IS NOT NULL THEN earned:=least(earned,c.max_earnings_per_post); END IF;
   delta:=least(greatest(0,earned-s.earnings),greatest(0,c.total_budget-spent)); earned:=s.earnings+delta;
  END IF;
  UPDATE public.submissions SET views=p_views,likes=coalesce(p_likes,likes),comments=coalesce(p_comments,comments),earnings=earned WHERE id=s.id;
 END IF;
 IF w.pending_balance+delta<0 THEN RAISE EXCEPTION 'Insufficient available wallet funds to reverse; reconcile this campaign first'; END IF;
 UPDATE public.wallets SET pending_balance=pending_balance+delta WHERE id=w.id;
 SELECT coalesce(sum(earnings),0) INTO resulting FROM public.submissions WHERE campaign_id=c.id AND status IN ('approved','paid');
 UPDATE public.campaigns SET spent_budget=resulting,
 status=CASE WHEN resulting>=total_budget THEN 'completed'::public.campaign_status ELSE status END WHERE id=c.id;
 RETURN jsonb_build_object('success',true,'submission_id',s.id,'earnings',coalesce(earned,0),'verified_views',p_views,
 'reversed_earnings',CASE WHEN s.status='approved' AND p_action IN ('reject','delete','threshold') THEN s.earnings ELSE 0 END);
END $$;
REVOKE ALL ON FUNCTION public.accounting_clip(uuid,uuid,text,bigint,text,bigint,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_clip(uuid,uuid,text,bigint,text,bigint,bigint) TO service_role;

CREATE FUNCTION public.accounting_request_payout(p_user uuid,p_amount numeric,p_method text,p_destination text,
 p_campaign uuid DEFAULT NULL,p_discord text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE w public.wallets; f public.final_submissions; p public.payouts; amount numeric; eligible numeric;
BEGIN
 IF p_campaign IS NOT NULL THEN PERFORM 1 FROM public.campaigns WHERE id=p_campaign FOR UPDATE; END IF;
 SELECT * INTO w FROM public.wallets WHERE user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.payouts WHERE user_id=p_user AND
 ((campaign_id IS NOT DISTINCT FROM p_campaign AND (status IN ('pending','approved') OR (p_campaign IS NOT NULL AND status IN ('paid','rejected'))))
 OR (status IN ('pending','approved') AND (p_campaign IS NULL OR campaign_id IS NULL)))) THEN
 RAISE EXCEPTION 'A payout already exists for this campaign or overlaps an active global request'; END IF;
 IF p_method NOT IN ('paypal','usdc_solana') OR p_destination IS NULL OR length(p_destination)>255 OR
 (p_method='paypal' AND p_destination !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR
 (p_method='usdc_solana' AND p_destination !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') THEN RAISE EXCEPTION 'Invalid payout destination'; END IF;
 IF p_campaign IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM public.campaign_disqualifications WHERE user_id=p_user AND campaign_id=p_campaign) THEN RAISE EXCEPTION 'You are disqualified from this campaign'; END IF;
  SELECT * INTO f FROM public.final_submissions WHERE user_id=p_user AND campaign_id=p_campaign FOR UPDATE;
  IF NOT FOUND OR f.status<>'approved' THEN RAISE EXCEPTION 'Final analytics approval required before payout'; END IF;
  amount:=f.final_earnings;
  -- Historic global payments cannot be assigned to a campaign safely.
  IF EXISTS(SELECT 1 FROM public.payouts WHERE user_id=p_user AND campaign_id IS NULL AND status='paid') THEN
   RAISE EXCEPTION 'Previous global payout needs campaign reconciliation before requesting a campaign payout'; END IF;
 ELSE
  amount:=round(p_amount,2);
  SELECT coalesce(sum(final_earnings),0) INTO eligible FROM public.final_submissions fs WHERE user_id=p_user AND status='approved'
   AND NOT EXISTS(SELECT 1 FROM public.payouts WHERE user_id=p_user AND campaign_id=fs.campaign_id AND status IN ('pending','approved','paid','rejected'));
  SELECT eligible-coalesce(sum(amount),0) INTO eligible FROM public.payouts WHERE user_id=p_user AND campaign_id IS NULL AND status='paid';
  IF amount>eligible THEN RAISE EXCEPTION 'Insufficient approved analytics earnings for global payout'; END IF;
 END IF;
 IF amount IS NULL OR amount::text IN ('NaN','Infinity','-Infinity') OR amount<10 THEN RAISE EXCEPTION 'Minimum payout is $10'; END IF;
 IF w.pending_balance<amount THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
 PERFORM set_config('app.accounting_rpc','on',true);
 UPDATE public.wallets SET pending_balance=pending_balance-amount,locked_earnings=locked_earnings+amount WHERE id=w.id;
 INSERT INTO public.payouts(user_id,amount,payout_method,payout_email,campaign_id,discord_username,status,reserved_amount)
 VALUES(p_user,amount,p_method,p_destination,p_campaign,nullif(left(trim(p_discord),64),''),'pending',amount) RETURNING * INTO p;
 RETURN jsonb_build_object('success',true,'payout',to_jsonb(p));
END $$;
REVOKE ALL ON FUNCTION public.accounting_request_payout(uuid,numeric,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_request_payout(uuid,numeric,text,text,uuid,text) TO service_role;

CREATE FUNCTION public.accounting_process_payout(p_actor uuid,p_payout uuid,p_action text,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.payouts; w public.wallets; f public.final_submissions; reserved numeric; accepted numeric; entitlement numeric;
BEGIN
 IF NOT public.has_role(p_actor,'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO p FROM public.payouts WHERE id=p_payout;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payout not found'; END IF;
 IF p.campaign_id IS NOT NULL THEN PERFORM 1 FROM public.campaigns WHERE id=p.campaign_id FOR UPDATE; END IF;
 SELECT * INTO w FROM public.wallets WHERE user_id=p.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
 SELECT * INTO p FROM public.payouts WHERE id=p_payout FOR UPDATE;
 IF p_action NOT IN ('approve','paid','reject') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF (p_action='paid' AND p.status='paid') OR (p_action='reject' AND p.status='rejected') THEN
  RETURN jsonb_build_object('success',true,'status',p.status,'already_processed',true); END IF;
 IF (p_action='approve' AND p.status<>'pending') OR (p_action='paid' AND p.status<>'approved') OR
 (p_action='reject' AND p.status NOT IN ('pending','approved')) THEN RAISE EXCEPTION 'Payout has already been processed or is not in the required status'; END IF;
 SELECT coalesce(sum(coalesce(reserved_amount,amount)),0) INTO reserved FROM public.payouts WHERE user_id=p.user_id AND status IN ('pending','approved');
 IF coalesce(p.reserved_amount,p.amount)<>p.amount OR w.locked_earnings<p.amount OR w.locked_earnings<reserved THEN
  RAISE EXCEPTION 'Insufficient locked funds: full payout and other payout reservations must be covered. Nothing was marked paid; reconcile the wallet first'; END IF;
 PERFORM set_config('app.accounting_rpc','on',true);
 IF p_action='approve' THEN UPDATE public.payouts SET status='approved',admin_notes=p_notes WHERE id=p.id;
 ELSIF p_action='paid' THEN
  UPDATE public.wallets SET locked_earnings=locked_earnings-p.amount,paid_balance=paid_balance+p.amount WHERE id=w.id;
  UPDATE public.payouts SET status='paid',reserved_amount=0,processed_at=now(),admin_notes=p_notes WHERE id=p.id;
  IF p.campaign_id IS NOT NULL THEN UPDATE public.final_submissions SET status='paid',paid_at=now()
   WHERE user_id=p.user_id AND campaign_id=p.campaign_id AND status='approved'; END IF;
 ELSE
  IF p.campaign_id IS NULL THEN
   -- Preserve the existing global rejection behavior; it disqualifies no campaign.
   UPDATE public.wallets SET locked_earnings=locked_earnings-p.amount,pending_balance=pending_balance+p.amount WHERE id=w.id;
  ELSE
   SELECT * INTO f FROM public.final_submissions WHERE user_id=p.user_id AND campaign_id=p.campaign_id FOR UPDATE;
   SELECT coalesce(sum(earnings),0) INTO accepted FROM public.submissions WHERE creator_id=p.user_id AND campaign_id=p.campaign_id AND status IN ('approved','paid');
   entitlement:=CASE WHEN f.status IN ('approved','paid') THEN coalesce(f.final_earnings,0) ELSE accepted END;
   IF entitlement<p.amount OR w.pending_balance<entitlement-p.amount THEN RAISE EXCEPTION 'Campaign wallet accounting needs reconciliation before disqualification'; END IF;
   INSERT INTO public.campaign_disqualifications(user_id,campaign_id,payout_id) VALUES(p.user_id,p.campaign_id,p.id);
   UPDATE public.wallets SET locked_earnings=locked_earnings-p.amount,pending_balance=pending_balance-(entitlement-p.amount) WHERE id=w.id;
   UPDATE public.submissions SET status='rejected',earnings=0,rejection_reason=coalesce(p_notes,'Campaign payout rejected: disqualified') WHERE creator_id=p.user_id AND campaign_id=p.campaign_id;
   UPDATE public.final_submissions SET status='rejected',final_earnings=0,verified_views=0,admin_notes=coalesce(p_notes,'Campaign payout rejected: disqualified'),reviewed_at=now(),approved_at=NULL WHERE user_id=p.user_id AND campaign_id=p.campaign_id;
   UPDATE public.campaigns SET spent_budget=(SELECT coalesce(sum(earnings),0) FROM public.submissions WHERE campaign_id=p.campaign_id AND status IN ('approved','paid')) WHERE id=p.campaign_id;
  END IF;
  UPDATE public.payouts SET status='rejected',reserved_amount=0,processed_at=NULL,admin_notes=p_notes WHERE id=p.id;
 END IF;
 INSERT INTO public.notifications(user_id,type,title,message,related_id) VALUES(p.user_id,'payout_'||p_action,
 CASE p_action WHEN 'paid' THEN 'Payout Sent' WHEN 'approve' THEN 'Payout Approved' ELSE 'Payout Rejected' END,
 CASE p_action WHEN 'paid' THEN 'Your full payout of $'||p.amount||' has been marked sent.'
 WHEN 'approve' THEN 'Your payout of $'||p.amount||' is approved for processing.'
 ELSE CASE WHEN p.campaign_id IS NULL THEN 'Your global payout was rejected; reserved funds were released.' ELSE 'You are disqualified from this campaign. Its earnings are $0; no campaign funds were returned to available balance.' END||coalesce(' Reason: '||p_notes,'') END,p.id);
 RETURN jsonb_build_object('success',true,'status',CASE p_action WHEN 'approve' THEN 'approved' WHEN 'paid' THEN 'paid' ELSE 'rejected' END);
END $$;
REVOKE ALL ON FUNCTION public.accounting_process_payout(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_process_payout(uuid,uuid,text,text) TO service_role;

CREATE FUNCTION public.accounting_review_final(p_final uuid,p_action text,p_views bigint DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f public.final_submissions; c public.campaigns; w public.wallets; baseline numeric; earned numeric:=0; delta numeric:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT * INTO f FROM public.final_submissions WHERE id=p_final;
 IF NOT FOUND THEN RAISE EXCEPTION 'Final submission not found'; END IF;
 SELECT * INTO c FROM public.campaigns WHERE id=f.campaign_id FOR UPDATE;
 SELECT * INTO w FROM public.wallets WHERE user_id=f.user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
 SELECT * INTO f FROM public.final_submissions WHERE id=p_final FOR UPDATE;
 IF f.status NOT IN ('submitted','under_review') THEN RAISE EXCEPTION 'Analytics already reviewed'; END IF;
 IF EXISTS(SELECT 1 FROM public.campaign_disqualifications WHERE user_id=f.user_id AND campaign_id=f.campaign_id) THEN RAISE EXCEPTION 'Creator disqualified from this campaign'; END IF;
 IF EXISTS(SELECT 1 FROM public.payouts WHERE user_id=f.user_id AND status IN ('pending','approved','paid') AND (campaign_id=f.campaign_id OR campaign_id IS NULL)) THEN RAISE EXCEPTION 'Cannot reconcile analytics while payout is processing or paid'; END IF;
 SELECT coalesce(sum(earnings),0) INTO baseline FROM public.submissions WHERE creator_id=f.user_id AND campaign_id=f.campaign_id AND status IN ('approved','paid');
 IF p_action='approve' THEN
  IF p_views IS NULL OR p_views<=0 THEN RAISE EXCEPTION 'Verified views must be positive'; END IF;
  -- Verified earnings cannot undo the approval-time budget/per-post caps.
  earned:=least(baseline,round((p_views::numeric/c.rate_unit)*c.rate_value,2)); delta:=earned-baseline;
 ELSIF p_action<>'reject' THEN RAISE EXCEPTION 'Invalid action'; END IF;
 IF w.pending_balance+delta<0 THEN RAISE EXCEPTION 'Insufficient available funds for analytics reconciliation'; END IF;
 PERFORM set_config('app.accounting_rpc','on',true);
 UPDATE public.wallets SET pending_balance=pending_balance+delta WHERE id=w.id;
 INSERT INTO public.final_submission_reviews(final_submission_id,reviewer_id,action,previous_verified_views,new_verified_views,previous_earnings,new_earnings,notes)
 VALUES(f.id,auth.uid(),CASE p_action WHEN 'approve' THEN 'approved' ELSE 'rejected' END,f.verified_views,p_views,f.final_earnings,earned,p_notes);
 UPDATE public.final_submissions SET status=CASE p_action WHEN 'approve' THEN 'approved'::public.final_submission_status ELSE 'rejected'::public.final_submission_status END,
 verified_views=CASE WHEN p_action='approve' THEN p_views ELSE verified_views END,final_earnings=earned,admin_notes=p_notes,reviewed_at=now(),approved_at=CASE WHEN p_action='approve' THEN now() ELSE NULL END WHERE id=f.id;
 RETURN jsonb_build_object('success',true,'earnings',earned);
END $$;
REVOKE ALL ON FUNCTION public.accounting_review_final(uuid,text,bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.accounting_review_final(uuid,text,bigint,text) TO authenticated;

-- Close direct accounting bypasses, including old sequential service-role handlers.
CREATE FUNCTION public.guard_accounting_write() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_setting('app.accounting_rpc',true)='on' THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF TG_TABLE_NAME='wallets' THEN
  IF (NEW.pending_balance,NEW.locked_earnings,NEW.paid_balance) IS DISTINCT FROM (OLD.pending_balance,OLD.locked_earnings,OLD.paid_balance) THEN RAISE EXCEPTION 'Wallet accounting must use transactional RPC'; END IF;
 ELSIF TG_TABLE_NAME='payouts' THEN RAISE EXCEPTION 'Payout accounting must use transactional RPC';
 ELSIF TG_TABLE_NAME='submissions' THEN
  IF TG_OP='DELETE' OR NEW.status IS DISTINCT FROM OLD.status OR
   (OLD.status IN ('approved','paid') AND NEW.earnings IS DISTINCT FROM OLD.earnings) THEN RAISE EXCEPTION 'Clip accounting must use transactional RPC'; END IF;
 ELSIF TG_TABLE_NAME='campaigns' THEN
  IF NEW.spent_budget IS DISTINCT FROM OLD.spent_budget THEN RAISE EXCEPTION 'Campaign spending must use transactional RPC'; END IF;
  IF OLD.status='completed' AND NEW.status<>'completed' AND NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Only an admin may manually reopen a campaign'; END IF;
 ELSIF TG_TABLE_NAME='final_submissions' THEN
  IF EXISTS(SELECT 1 FROM public.campaign_disqualifications WHERE user_id=NEW.user_id AND campaign_id=NEW.campaign_id) THEN RAISE EXCEPTION 'Creator disqualified from this campaign'; END IF;
  IF NEW.status IN ('approved','paid') OR OLD.status IN ('approved','paid') OR NEW.final_earnings IS DISTINCT FROM OLD.final_earnings AND NEW.final_earnings<>0 THEN RAISE EXCEPTION 'Final analytics accounting must use transactional RPC'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER accounting_wallet_guard BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_write();
CREATE TRIGGER accounting_payout_guard BEFORE INSERT OR UPDATE OR DELETE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_write();
CREATE TRIGGER accounting_clip_guard BEFORE UPDATE OR DELETE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_write();
CREATE TRIGGER accounting_campaign_guard BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_write();
CREATE TRIGGER accounting_final_guard BEFORE UPDATE ON public.final_submissions FOR EACH ROW EXECUTE FUNCTION public.guard_accounting_write();
