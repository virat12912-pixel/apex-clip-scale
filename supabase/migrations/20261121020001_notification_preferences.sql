-- H-19: notification preferences were toggles backed by local state only,
-- so they reset on every reload. Persist them as columns on profiles.
--
-- Access: the existing "Users can update own profile" policy already
-- restricts updates to the row owner, and the guard_profile_trust_fields
-- trigger only blocks the five trust columns (is_banned, payment_verified,
-- clipper_tier, approval_rate, total_views_generated) — these three
-- preference columns are owner-writable, so no new policy is needed.
-- Defaults are true, matching the previous (always-on) UI behaviour.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS submission_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payout_notifications boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.email_notifications IS 'H-19: receive email notifications';
COMMENT ON COLUMN public.profiles.submission_notifications IS 'H-19: notified when submissions are approved/rejected';
COMMENT ON COLUMN public.profiles.payout_notifications IS 'H-19: notified when payouts are processed';
