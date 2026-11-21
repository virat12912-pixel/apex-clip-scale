-- Audit P0 fixes: H-06 (self-credited client balances) + H-08 (atomic
-- admin balance adjustments).
--
-- H-06: drop the user INSERT policy on client_balances — a balance row
-- could previously be inserted with arbitrary available_balance /
-- total_funded, which the Launch gate then trusted as funding. Rows are
-- now created server-side with zeros only:
--   * a SECURITY DEFINER trigger on profiles INSERT (covers handle_new_user
--     and every other profile-creation path), and
--   * ensure_user_setup (self-heal path for users whose profile already
--     exists, where no profiles INSERT fires).
-- Existing profiles without a row are backfilled with zeros below.
-- NOTE: the frontend useClientBalance hook auto-creates a row on read; that
-- call will now fail with an RLS error until the frontend stream updates
-- the hook to rely on the server-created row.
--
-- H-08: admin_adjust_balance is the single server-side transaction for
-- admin credit/debit: it checks the caller is an admin, locks the
-- client_balances row FOR UPDATE, rejects (does NOT clamp) a debit larger
-- than the available balance, writes the balance change and the
-- balance_transactions ledger row in the same transaction, and is
-- idempotent on idempotency_key — a second call with the same key returns
-- the original result without moving money again. Callers must supply a
-- fresh unique key per adjustment (e.g. a uuid generated per click);
-- keys are NOT scoped per user, so never reuse a key across adjustments.
-- The legacy AdminBalances read-modify-write (balanceMutation /
-- approveTopUp) must be replaced by calls to this RPC (frontend stream).

-- ---------------------------------------------------------------- H-06
DROP POLICY IF EXISTS "Users can insert own balance" ON public.client_balances;

CREATE OR REPLACE FUNCTION public.ensure_client_balance_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_client_balance_row ON public.profiles;
CREATE TRIGGER ensure_client_balance_row
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_client_balance_row();

-- Backfill zero rows for profiles created before this trigger existed.
INSERT INTO public.client_balances (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ensure_user_setup self-heal: create the zero balance row as well, for
-- users whose profile already exists (no profiles INSERT fires for them).
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

  INSERT INTO public.client_balances (user_id)
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

-- ---------------------------------------------------------------- H-08
ALTER TABLE public.balance_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS balance_transactions_idempotency_key_uidx
  ON public.balance_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_kind text,
  p_note text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.client_balances;
  prior_tx public.balance_transactions;
  new_available numeric;
  new_funded numeric;
  new_spent numeric;
  tx_id uuid;
BEGIN
  -- The admin UI calls this directly as the signed-in admin, so the admin
  -- check must live inside the function (it is SECURITY DEFINER and
  -- bypasses RLS). Service-role callers cannot use this RPC as written —
  -- auth.uid() is NULL for them — by design: admin actions go through a
  -- signed-in admin session.
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: only admins can adjust client balances';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF p_kind NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'kind must be credit or debit';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be a positive number';
  END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'idempotency_key is required';
  END IF;
  IF length(p_idempotency_key) > 128 THEN
    RAISE EXCEPTION 'idempotency_key is too long';
  END IF;

  -- Lock the balance row FIRST: concurrent adjustments for the same user
  -- serialise here, so the idempotency check below cannot race a duplicate.
  SELECT * INTO b FROM public.client_balances WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client balance not found for user';
  END IF;

  -- Idempotency: a repeat call with the same key returns the original
  -- result and moves no money again.
  SELECT * INTO prior_tx
  FROM public.balance_transactions
  WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'user_id', prior_tx.user_id,
      'kind', prior_tx.type,
      'amount', prior_tx.amount,
      'transaction_id', prior_tx.id,
      'available_balance', b.available_balance,
      'total_funded', b.total_funded,
      'total_spent', b.total_spent
    );
  END IF;

  IF p_kind = 'credit' THEN
    new_available := b.available_balance + p_amount;
    new_funded := b.total_funded + p_amount;
    new_spent := b.total_spent;
  ELSE
    -- Reject an over-debit. Do NOT clamp: the old client-side clamp set
    -- available to 0 while still adding the FULL amount to total_spent,
    -- breaking the available + spent = funded invariant (H-08).
    IF p_amount > b.available_balance THEN
      RAISE EXCEPTION 'Insufficient available balance for debit';
    END IF;
    new_available := b.available_balance - p_amount;
    new_funded := b.total_funded;
    new_spent := b.total_spent + p_amount;
  END IF;

  UPDATE public.client_balances
  SET available_balance = new_available,
      total_funded = new_funded,
      total_spent = new_spent
  WHERE user_id = p_user_id;

  INSERT INTO public.balance_transactions
    (user_id, type, amount, description, notes, idempotency_key)
  VALUES (
    p_user_id,
    p_kind,
    p_amount,
    CASE WHEN p_kind = 'credit' THEN 'Admin credit' ELSE 'Admin debit' END,
    p_note,
    p_idempotency_key
  )
  RETURNING id INTO tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'user_id', p_user_id,
    'kind', p_kind,
    'amount', p_amount,
    'transaction_id', tx_id,
    'available_balance', new_available,
    'total_funded', new_funded,
    'total_spent', new_spent
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_balance(uuid, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, numeric, text, text, text) TO authenticated;
