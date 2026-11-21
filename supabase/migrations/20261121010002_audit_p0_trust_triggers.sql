-- Audit P0 fixes: C-02 (fake social verification) + C-06 (profiles trust fields).
--
-- RLS constrains which ROWS a user can touch, not which COLUMNS. Both
-- findings are closed with BEFORE triggers that reject changes to trust
-- columns unless the writer is an admin or the service role:
--   * auth.uid() IS NULL  => service-role context (Edge Functions using the
--     service-role key, e.g. verify-*-bio setting verified server-side, and
--     admin-update-user writing is_banned / payment_verified).
--   * public.has_role(auth.uid(), 'admin') => an admin acting directly.
-- Ordinary authenticated users can change only the non-trust columns.
--
-- C-02: the verify-*-bio Edge Functions will set verified / verified_at
-- server-side (separate stream). Until that lands, the current frontend
-- flow that marks verified client-side (useSocialAccounts) will be rejected
-- by this trigger — that is the intended break; the verdict must come from
-- the server, not the browser.

-- ---------------------------------------------------------------- C-02
CREATE OR REPLACE FUNCTION public.guard_social_account_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- A row may never be born verified; verification is a server verdict.
    IF NEW.verified IS TRUE OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'Social verification must be set server-side after the bio-code check';
    END IF;
    RETURN NEW;
  END IF;

  -- Non-admin owners may change only username / profile_url (updated_at is
  -- maintained by update_social_accounts_updated_at, which fires after this
  -- trigger, so it is not checked here). Everything else — platform,
  -- verification_code, verified, verified_at, ids, created_at — is frozen.
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.platform IS DISTINCT FROM OLD.platform
    OR NEW.verification_code IS DISTINCT FROM OLD.verification_code
    OR NEW.verified IS DISTINCT FROM OLD.verified
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only an admin or the verification service may change social verification fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_social_account_verification ON public.social_accounts;
CREATE TRIGGER guard_social_account_verification
  BEFORE INSERT OR UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.guard_social_account_verification();

-- Split the owner UPDATE policy: keep row ownership, and state the column
-- restriction explicitly (enforced by the trigger above — RLS has no
-- column lists). WITH CHECK keeps the row owned after the update.
DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;
CREATE POLICY "Users can update own social accounts"
  ON public.social_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------- C-06
CREATE OR REPLACE FUNCTION public.guard_profile_trust_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned
    OR NEW.payment_verified IS DISTINCT FROM OLD.payment_verified
    OR NEW.clipper_tier IS DISTINCT FROM OLD.clipper_tier
    OR NEW.approval_rate IS DISTINCT FROM OLD.approval_rate
    OR NEW.total_views_generated IS DISTINCT FROM OLD.total_views_generated THEN
    RAISE EXCEPTION 'Trust fields on profiles can only be changed by an admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_trust_fields ON public.profiles;
CREATE TRIGGER guard_profile_trust_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_trust_fields();
