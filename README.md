# Apex Clip Scale

Clipping platform: brands launch campaigns, creators submit clips,
admins review and pay out. React 18 + Vite 5 + Tailwind + shadcn/Radix
frontend, Supabase (Postgres + Auth + Storage) backend, 17 Deno Edge
Functions.

> **Status: not launch-safe.** See the audit report
> (`~/workspace/your_files/apex-clip-scale-audit.md`, 2026-11-21) and
> `docs/DEPLOY_CHECKLIST.md` — the atomic-accounting migration is still
> unapplied, so the money paths are broken until the checklist is done.
> Do not put real money through the current deploy.

## Environments

There is currently **one environment: production**. One Supabase project
(`htkcortbngtlkjkmgbca`), one deployed frontend, no staging project.
If you need to test a money flow before it touches production, create a
separate Supabase project first and point a local `.env` at it — never
test against production data.

## Local setup

```sh
# Node 24 (see .nvmrc; package.json "engines" enforces >= 24)
nvm use        # or: nvm install 24
npm ci
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev    # http://localhost:8080
```

Useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm test` | Vitest unit tests (`tests/`) |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |

CI (`.github/workflows/ci.yml`) runs all five checks — `npm ci`,
`npm test`, `npx tsc -b`, `npm run lint`, `npm run build` — on every
push and pull request.

## Deploying the frontend

The frontend is deployed through Lovable (this repo originated there):

1. Push to `main` (or merge the PR).
2. In Lovable, open the project → **Share → Publish**.
3. Verify the deployed app loads and you can sign in.

There is no separate build-and-upload step: the Lovable publish builds
from the repo. If the Lovable path is ever replaced by a static host,
the build is `npm run build` and the output is `dist/` (gitignored).

## Deploying Edge Functions

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli)
logged in and linked to the project:

```sh
supabase link --project-ref htkcortbngtlkjkmgbca
supabase functions deploy <function-name>   # e.g. update-all-views
supabase functions deploy                  # deploy all functions
```

Secrets are set in the Supabase dashboard
(Project Settings → Edge Functions → Secrets), **never** in the repo.
See `docs/SECRETS.md` for the full inventory, including which secret
each function needs and what breaks when one is missing.

After deploying functions that depend on new database objects, verify
the deploy gate in `docs/DEPLOY_CHECKLIST.md` (the `accounting_*` RPCs
must exist before the money functions can work).

## Daily cron — view refresh

`.github/workflows/update-views-cron.yml` runs daily at **06:00 UTC**
(plus manual `workflow_dispatch`). It POSTs to the `update-all-views`
Edge Function with the `UPDATE_VIEWS_CRON_SECRET` GitHub secret as
the `x-update-views-token` header. The function refreshes views for all
submissions, recomputes earnings, and reverses below-threshold clips.

- The workflow retries the call up to 3 times with backoff on
  non-200 responses. The function is idempotent per run (re-running it
  recomputes from current views; it does not double-apply earnings).
- A failed run shows as a failed Actions run — check the Actions tab
  if views look stale. There is no separate alerting yet (see audit
  H-35).

## Rollback

- **Frontend:** redeploy the previous commit — revert the commit on
  `main` (or `git revert <sha>` + push) and re-publish in Lovable.
- **Edge Functions:** redeploy from the previous commit —
  `git checkout <sha> -- supabase/functions/<name>` then
  `supabase functions deploy <name>`. There is no function versioning
  in the dashboard; git is the source of truth.
- **Database:** there is no automatic rollback for migrations. Before
  applying any migration, snapshot the production database
  (see `docs/DEPLOY_CHECKLIST.md` step a).

## Project layout

- `src/` — React frontend (pages, components, hooks)
- `supabase/migrations/` — applied migrations
- `supabase/pending-migrations/` — staged, **not yet applied**
  (notably `20261108020000_atomic_accounting.sql`)
- `supabase/functions/` — Deno Edge Functions (`_shared/` holds the
  shared auth/accounting helpers)
- `supabase/deno.json` — import map pinning function dependency versions
- `tests/` — Vitest unit tests
- `docs/` — `SECRETS.md` (env/secret inventory),
  `DEPLOY_CHECKLIST.md` (ordered pre-production live steps)
