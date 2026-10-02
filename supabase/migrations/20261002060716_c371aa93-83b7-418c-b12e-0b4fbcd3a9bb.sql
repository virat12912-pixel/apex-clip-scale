ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS discord_username text;
ALTER TABLE public.final_submissions ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1;

CREATE POLICY "Users can resubmit rejected final submission" ON public.final_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'rejected'::final_submission_status)
  WITH CHECK (user_id = auth.uid() AND status = 'submitted'::final_submission_status AND final_earnings = 0 AND verified_views IS NULL);

CREATE OR REPLACE FUNCTION public.guard_final_submission_resubmit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF OLD.status <> 'rejected' THEN
    RAISE EXCEPTION 'Only rejected submissions can be resubmitted';
  END IF;
  IF NEW.attempt_count <> OLD.attempt_count + 1 OR NEW.attempt_count > 3 THEN
    RAISE EXCEPTION 'No resubmission attempts left';
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.campaign_id := OLD.campaign_id;
  NEW.tracked_views := OLD.tracked_views;
  NEW.admin_notes := NULL;
  NEW.client_payment_received := OLD.client_payment_received;
  NEW.reviewed_at := NULL; NEW.approved_at := NULL; NEW.paid_at := NULL;
  NEW.submitted_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER guard_final_submission_resubmit BEFORE UPDATE ON public.final_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_final_submission_resubmit();