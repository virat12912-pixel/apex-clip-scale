

## Plan: Update Scrape Creators API Key

### What's changing
Update the hardcoded fallback API key for Scrape Creators from `BYkwgH6v3kXbKlvvXcaXa9XNa5J2` to `yp6K8BEqORYJn6YZkZJLLIwgFkV2` in 3 edge functions:

1. `supabase/functions/fetch-tiktok-views/index.ts` (line 64)
2. `supabase/functions/fetch-instagram-views/index.ts` (line 113)
3. `supabase/functions/fetch-youtube-views/index.ts` (line 31)

The bio verification functions (`verify-tiktok-bio`, `verify-instagram-bio`, `verify-youtube-bio`) already use this key — no changes needed there.

### Additionally
Store `SCRAPE_CREATORS_API_KEY` as a proper backend secret with value `yp6K8BEqORYJn6YZkZJLLIwgFkV2` so the key can be rotated without code changes in the future.

### Deployment
Redeploy all 3 updated edge functions and verify they respond correctly.

