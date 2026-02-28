CREATE OR REPLACE FUNCTION public.ensure_user_setup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  jwt_email text;
  jwt_full_name text;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  jwt_email := COALESCE(auth.jwt() ->> 'email', '');
  jwt_full_name := COALESCE(
    auth.jwt() ->> 'full_name',
    auth.jwt() ->> 'name',
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    jwt_email
  );

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    current_user_id,
    COALESCE(NULLIF(jwt_email, ''), current_user_id::text || '@placeholder.local'),
    NULLIF(jwt_full_name, '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), profiles.email),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

  INSERT INTO public.wallets (user_id)
  VALUES (current_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = current_user_id
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'creator');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_setup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_setup() TO authenticated;