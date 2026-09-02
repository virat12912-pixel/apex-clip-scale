# Fix Instagram bio verification and view tracking with Apify

The Scrape Creators key is rejected (backend logs show `401 Invalid API key` on both the Instagram and YouTube bio checks), so Instagram verification and view fetching both fail. Switch Instagram to Apify as the primary data source.

## What changes

1. **Store the Apify token** you provided as a backend secret (`APIFY_API_TOKEN`). It stops being pasted anywhere in code.
2. **Bio verification (Instagram):** call the Apify Instagram profile scraper, read the profile biography, and match the verification code against it. If Apify fails or the profile is unreachable, fall back to the existing Scrape Creators call so nothing gets worse.
3. **View tracking (Instagram reels/posts):** call the Apify Instagram post scraper with the reel URL and read views/plays, likes, comments, author. Existing fallbacks stay in place below it.
4. **Clear error messages:** distinguish "profile is private / not found", "Apify run failed", and "credit/quota exhausted" so admins can tell whether to enter metrics manually.

## Technical details

- New helper in each function calls Apify's synchronous run endpoint:
  `POST https://api.apify.com/v2/acts/<actor>/run-sync-get-dataset-items?token=$APIFY_API_TOKEN`
  - profile: `apify~instagram-profile-scraper`, input `{ usernames: [handle] }` → `biography`
  - post/reel: `apify~instagram-scraper`, input `{ directUrls: [url], resultsType: "posts", resultsLimit: 1 }` → `videoPlayCount` / `videoViewCount`, `likesCount`, `commentsCount`, `ownerUsername`
- Timeouts capped (~60s) with one retry; non-2xx responses logged with status and body snippet.
- Files touched: `supabase/functions/verify-instagram-bio/index.ts`, `supabase/functions/fetch-instagram-views/index.ts`. Both redeployed.
- No database or frontend changes.

## Note

YouTube bio verification is failing for the same Scrape Creators key reason. Say the word and I'll fix that in the same pass (Apify has a YouTube actor too); otherwise it stays as-is.
