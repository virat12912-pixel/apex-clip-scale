-- Audit P0 fix: C-01 — upgrade_user_role lockdown.
--
-- Any authenticated user could call the SECURITY DEFINER upgrade_user_role
-- directly and make themselves admin (no admin check, default PUBLIC execute
-- grant). The only legitimate caller is the admin-change-role Edge Function,
-- which verifies the caller is admin/platform_admin via the service role
-- before invoking this RPC.
--
-- Fix: (1) an in-function admin check, (2) REVOKE EXECUTE from PUBLIC/anon/
-- authenticated and GRANT only to service_role.
--
-- NOTE on the in-function check: a bare
--   IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION ...
-- would break the legitimate service-role caller, because in service-role
-- context auth.uid() IS NULL (the service-role JWT carries no user id) and
-- has_role(NULL, 'admin') is false. The service-role caller is trusted
-- server-side code (admin-change-role already verified the human caller is
-- an admin before invoking), so a NULL auth.uid() is allowed through and
-- only a non-NULL, non-admin caller is rejected. Direct browser calls by
-- admins (e.g. useBrandApplications.ts calling this RPC) will now fail at
-- the grant level and must be routed through admin-change-role instead.
--
-- NOTE on L-05 (has_role / get_user_role grants): deliberately NOT revoked.
-- Both helpers are called from ~30 RLS policies (campaigns, submissions,
-- payouts, profiles, storage, ...) and from the guard triggers added in
-- 20261121010002. PostgreSQL checks EXECUTE privilege on functions invoked
-- from a policy expression in the querying role's context, so revoking
-- EXECUTE from authenticated would break every policy that calls them.
-- The helpers are read-only EXISTS / single-row lookups, SECURITY DEFINER
-- with search_path=public; direct calls can only answer "does user X have
-- role Y" (role enumeration, L-05 LOW) and cannot change anything.

CREATE OR REPLACE FUNCTION public.upgrade_user_role(_user_id uuid, _new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only an admin (direct authenticated caller) or the service role (via
  -- admin-change-role, which already verified the caller is an admin) may
  -- change roles. auth.uid() is NULL in service-role context.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: only admins can change roles';
  END IF;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF _new_role IS NULL THEN
    RAISE EXCEPTION 'new role is required';
  END IF;

  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _user_id;

  -- A user whose role row is missing (e.g. after a DB reset) must still end
  -- up with the new role instead of a silent no-op success.
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _new_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upgrade_user_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_user_role(uuid, app_role) TO service_role;
