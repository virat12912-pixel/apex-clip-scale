-- Audit P0 fix: L-01 — NOT VALID CHECK constraints on money columns.
--
-- All constraints are added NOT VALID: legacy rows may violate them, and
-- validating (VALIDATE CONSTRAINT) is a live-DB step for Ramon after
-- inspecting offending rows. NOT VALID still enforces the constraint on
-- every NEW / UPDATED row from the moment this migration applies.
-- NOTE: rate_unit > 0 also closes the divide-by-zero that produced
-- Infinity/NaN earnings on the live process-submission path.

ALTER TABLE public.payouts
  ADD CONSTRAINT payouts_amount_nonnegative CHECK (amount >= 0) NOT VALID;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_views_nonnegative CHECK (views >= 0) NOT VALID,
  ADD CONSTRAINT submissions_earnings_nonnegative CHECK (earnings >= 0) NOT VALID,
  ADD CONSTRAINT submissions_likes_nonnegative CHECK (likes >= 0) NOT VALID,
  ADD CONSTRAINT submissions_comments_nonnegative CHECK (comments >= 0) NOT VALID;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_rate_value_nonnegative CHECK (rate_value >= 0) NOT VALID,
  ADD CONSTRAINT campaigns_rate_unit_positive CHECK (rate_unit > 0) NOT VALID,
  ADD CONSTRAINT campaigns_total_budget_nonnegative CHECK (total_budget >= 0) NOT VALID,
  ADD CONSTRAINT campaigns_spent_budget_nonnegative CHECK (spent_budget >= 0) NOT VALID,
  ADD CONSTRAINT campaigns_min_views_nonnegative CHECK (min_views >= 0) NOT VALID;

ALTER TABLE public.wallets
  ADD CONSTRAINT wallets_pending_balance_nonnegative CHECK (pending_balance >= 0) NOT VALID,
  ADD CONSTRAINT wallets_paid_balance_nonnegative CHECK (paid_balance >= 0) NOT VALID,
  ADD CONSTRAINT wallets_locked_earnings_nonnegative CHECK (locked_earnings >= 0) NOT VALID;

ALTER TABLE public.client_balances
  ADD CONSTRAINT client_balances_available_nonnegative CHECK (available_balance >= 0) NOT VALID,
  ADD CONSTRAINT client_balances_total_funded_nonnegative CHECK (total_funded >= 0) NOT VALID,
  ADD CONSTRAINT client_balances_total_spent_nonnegative CHECK (total_spent >= 0) NOT VALID,
  ADD CONSTRAINT client_balances_pending_spend_nonnegative CHECK (pending_spend >= 0) NOT VALID;
