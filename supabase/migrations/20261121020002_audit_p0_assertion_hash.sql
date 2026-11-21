-- H-04 follow-up: persist the metrics-assertion hash on the processed
-- submission row, so a replayed assertion can be rejected by hash as well
-- as by the duplicate-URL check in process-submission.
-- Audit: apex-clip-scale-audit.md H-04.
-- Safe additive change: nullable column, no backfill, no constraint.
-- The hash is of the assertion string (which embeds a 5-minute expiry),
-- so it only matches replays of the SAME assertion, not re-fetches.

alter table public.submissions
  add column if not exists processed_assertion_hash text;

create index if not exists submissions_processed_assertion_hash_idx
  on public.submissions (processed_assertion_hash)
  where processed_assertion_hash is not null;
