# Deploy checklist — before this fixed code is safe in production

Ordered live steps for Ramon. Do them in order; do not skip ahead —
step (c) changes what the money functions can do, and step (f) is the
gate that proves it worked. Nothing here is done by merging code alone.

## (a) Snapshot / back up the production database

- In the Supabase dashboard: Project Settings → Database → Backups,
  confirm a recent backup exists (or trigger one). Note the backup
  time.
- Why: step (c) adds unique indexes and guard triggers and cannot be
  rolled back automatically. If anything goes wrong, restore starts
  from this snapshot.

## (b) De-duplicate legacy payouts (if any)

The pending migration's preflight indexes **intentionally fail** on
duplicates instead of silently fixing them. Run these two checks in the
Supabase SQL editor first — both must return zero rows:

```sql
-- More than one live payout per (user, campaign)
select user_id, campaign_id, count(*)
from public.payouts
where campaign_id is not null
  and status in ('pending', 'approved', 'paid', 'rejected')
group by user_id, campaign_id
having count(*) > 1;

-- More than one open global payout per user
select user_id, count(*)
from public.payouts
where campaign_id is null
  and status in ('pending', 'approved')
group by user_id
having count(*) > 1;
```

If either returns rows, resolve the duplicates manually first (decide
with the affected creators/admins which payout row is real; void the
rest — do not delete rows blindly). Re-run the checks until both are
empty, then proceed.

## (c) Apply the pending accounting migration

File: `supabase/pending-migrations/20261108020000_atomic_accounting.sql`

It defines `accounting_clip`, `accounting_request_payout`,
`accounting_process_payout`, `accounting_review_final`, the
`guard_accounting_write` triggers, and the payout uniqueness indexes.
Either:

- **Dashboard:** paste the file contents into the SQL editor and run
  it, or
- **CLI:** move it into `supabase/migrations/` and run
  `supabase db push` (linked to project `htkcortbngtlkjkmgbca`).

If it errors on the preflight indexes, go back to (b) — do not edit
the migration to drop the indexes.

## (d) Set `METRICS_SIGNING_KEY` in Supabase dashboard secrets

- Generate a random 32+ byte key (e.g. `openssl rand -hex 32`).
- Set it as `METRICS_SIGNING_KEY` in Project Settings → Edge
  Functions → Secrets.
- This is the dedicated HMAC key for metrics assertions (audit H-04).
  Until the H-04 code fix that reads it is deployed, assertions keep
  using the service-role key — setting the secret now is still
  required so the fix works the moment it lands. Do not reuse the
  service-role key value here.

## (e) Rotate the publishable key (audit H-34)

- The old `.env` was committed to git history. The publishable key in
  it is public by design, but the leak precedent means it should be
  rotated anyway.
- In the Supabase dashboard: Project Settings → API → rotate/regenerate
  the publishable (anon) key.
- Update the new key everywhere it is consumed: local `.env`
  (`VITE_SUPABASE_PUBLISHABLE_KEY`), the Lovable/build environment,
  and any other place it was pasted.
- **Purge `.env` from git history** (e.g. `git filter-repo --path .env --invert-paths`)
  and force-push the cleaned history — coordinate this, because it
  rewrites shared history. This agent deliberately did not do it.
- Verify the app still signs in after rotation.

## (f) Verify the `accounting_*` RPCs exist (deploy gate)

Run in the Supabase SQL editor. All five rows must be present:

```sql
select proname
from pg_proc
where proname in (
  'accounting_clip',
  'accounting_request_payout',
  'accounting_process_payout',
  'accounting_review_final',
  'accounting_reviewer'
)
order by proname;
```

If any row is missing, step (c) did not apply cleanly — stop here,
do not deploy functions or approve anything.

## (g) Deploy the Edge Functions

```sh
supabase link --project-ref htkcortbngtlkjkmgbca
supabase functions deploy
```

Then confirm the deploy picked up the new import map
(`supabase/deno.json`) and that every function still in
`supabase/config.toml` has an explicit `verify_jwt` entry. Spot-check
one function in the dashboard logs after deploy.

## (h) Verify with a test approval / payout

- **Only if a staging project exists:** run the full flow there
  first — submit a clip, approve it, request a payout, process it —
  and confirm wallet, `spent_budget`, and payout status all move
  together.
- **No staging project exists today** (there is only the one prod
  project). Until one is created, do the verification with a throwaway
  test campaign and test accounts in production, for a trivial amount,
  and reverse/clean it up immediately afterwards. Do not test with
  real creators, real campaigns, or real money.
- After verification, watch the next daily cron run
  (`.github/workflows/update-views-cron.yml`, 06:00 UTC) and confirm
  it completes without retries failing in the Actions tab.

## If anything fails mid-checklist

Stop at the failed step. Do not work around it by deploying code that
assumes the step happened. The pre-migration state (functions calling
RPCs that don't exist) fails loudly at the RPC call — that is safer
than a half-applied migration with functions live.
