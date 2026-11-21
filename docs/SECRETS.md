# Secrets inventory — Apex Clip Scale

Audit finding M-30. This is the single source of truth for every
environment variable / secret the app uses: its name, where it is set,
which code needs it, and what happens when it is missing.

**Rule: no secret value ever goes in this repo.** Frontend variables live
in a local `.env` (see `.env.example`, names only). Server secrets live
in the Supabase dashboard (Project Settings → Edge Functions → Secrets).
The GitHub Actions cron secret lives in GitHub repository Secrets.

## Frontend (Vite build-time env)

| Variable | Where set | Read by | Missing behaviour |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` locally; build env in Lovable/CI | `src/integrations/supabase/client.ts`, `src/hooks/useWallet.ts`, `src/pages/AdminPayouts.tsx`, `src/pages/AdminUserDetail.tsx` | App cannot talk to Supabase at all — fail loud (client init throws / requests fail). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` locally; build env in Lovable/CI | `src/integrations/supabase/client.ts` | Same as above — fail loud. Publishable by design (safe to ship in the bundle), but **rotate it if it was ever committed** — see H-34 and `docs/DEPLOY_CHECKLIST.md`. |
| `VITE_SUPABASE_PROJECT_ID` | `.env` only (reference) | **Never read anywhere in code** (audit-verified). Kept in `.env.example` for tooling that expects it. | No effect. Safe to leave empty. |

## Server (Supabase Edge Functions — Supabase dashboard secrets)

Supabase injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` automatically for every function; the rest
must be set manually in the dashboard.

| Variable | Where set | Needed by | Missing behaviour |
|---|---|---|---|
| `SUPABASE_URL` | Supabase (auto) | All functions via `_shared/security.ts` | Fail loud: `authenticateRequest` returns null → 401 on every authenticated function. |
| `SUPABASE_ANON_KEY` | Supabase (auto) | All functions via `_shared/security.ts` (fallback: `SUPABASE_PUBLISHABLE_KEY`) | Fail loud (same as above). |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase (auto) | Fallback for `SUPABASE_ANON_KEY` in `_shared/security.ts` and `update-all-views` | Only matters if `SUPABASE_ANON_KEY` is unset. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (auto) | All functions via `_shared/security.ts` (service client); `process-submission`, `create-notification`, `fetch-social-profile`, `admin-*` | Fail loud: auth fails / service client cannot be built. **Also currently (mis)used as the HMAC key for metrics assertions** in `_shared/security.ts` — see H-04. A dedicated key is being introduced (below). |
| `APIFY_API_TOKEN` | Supabase dashboard secret | `fetch-instagram-views`, `fetch-social-profile`, `verify-instagram-bio` | **Degrade silent:** `fetch-instagram-views` logs "APIFY_API_TOKEN not configured, skipping Apify" and falls through its other scraper methods — views may come back wrong or stale, which feeds earnings. Treat a missing key as a bug, not an option. |
| `SCRAPE_CREATORS_API_KEY` | Supabase dashboard secret | `fetch-tiktok-views`, `fetch-youtube-views`, `fetch-instagram-views`, `fetch-social-profile`, `verify-*-bio` (all three) | **Degrade silent:** each fetch function falls through to its next method (RapidAPI / TikWM / YouTube API). Missing key = fewer working methods = more failed/stale views. |
| `TIKTOK_API_KEY` | Supabase dashboard secret | `update-all-views` (TikTok refresh path) | **Degrade silent:** TikTok views are not refreshed for that run; the cron still reports success per submission (see C-09). |
| `INSTAGRAM_API_KEY` | Supabase dashboard secret | `update-all-views`, `fetch-instagram-views` | **Degrade silent:** same as TikTok — Instagram refresh skipped, run still "succeeds". |
| `YOUTUBE_API_KEY` | Supabase dashboard secret | `update-all-views`, `fetch-youtube-views` | **Degrade silent:** YouTube refresh skipped. |
| `UPDATE_VIEWS_CRON_SECRET` | Supabase dashboard secret **and** GitHub repository Secret (same value, two places) | `update-all-views` (authenticates the cron call); `fetch-instagram-views` (internal call from `update-all-views`); `.github/workflows/update-views-cron.yml` sends it as `x-update-views-token` | Fail loud: the cron call is rejected (401) and the workflow exits 1. **Rotation means updating both places at once.** Compared with `===`, not timing-safe (L-06). |
| `METRICS_SIGNING_KEY` | **Not yet set — must be created** (Supabase dashboard secret) | Will be used by `_shared/security.ts` (`signMetricsAssertion` / `verifyMetricsAssertion`) once the H-04 fix lands; currently the service-role key is reused as the HMAC key | Until set, metrics assertions keep using `SUPABASE_SERVICE_ROLE_KEY` as the signing key. **Live step:** generate a random 32+ byte key, set it in the dashboard, and deploy the H-04 fix that reads it. See `docs/DEPLOY_CHECKLIST.md`. |

## GitHub Actions

| Secret | Where set | Used by |
|---|---|---|
| `UPDATE_VIEWS_CRON_SECRET` | GitHub repository Settings → Secrets and variables → Actions | `.github/workflows/update-views-cron.yml` (same value as the Supabase dashboard secret above). No other GitHub secrets exist; CI (`ci.yml`) needs none. |

## Fail-loud vs degrade-silent — the rule going forward

- **Auth / Supabase keys:** fail loud (401 / hard error). Correct.
- **Scraper / provider API keys:** currently degrade silent (fall through to
  the next method, log a line, keep going). That is the wrong default for
  anything that feeds earnings: a silently skipped provider means silently
  wrong views. Any new provider key should fail the affected refresh
  explicitly (count it as an error in the cron response) instead of
  falling through quietly.
