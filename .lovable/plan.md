

# Plan: Update RapidAPI Keys for Bio Verification

## Overview
Update the TikTok and Instagram API keys with the new RapidAPI key you provided so the bio verification mechanism works.

## Steps

### 1. Update TIKTOK_API_KEY Secret
Replace the current TikTok API key with the new key:
```
aa0adfaf90msh966f61f493a0d28p11f6afjsnff2a014bd89b
```

### 2. Update INSTAGRAM_API_KEY Secret
If the same key is subscribed to both APIs, update the Instagram API key with the same value:
```
aa0adfaf90msh966f61f493a0d28p11f6afjsnff2a014bd89b
```

### 3. Test Verification Flow
After updating the secrets:
1. Go to Social Accounts page
2. Add a TikTok or Instagram account
3. Copy the verification code shown (e.g., `APEX12345678`)
4. Add that code to your social media bio
5. Click "Verify" button
6. The system will fetch your bio and confirm the code is present

## Prerequisites
Ensure your RapidAPI account has active subscriptions to:
- `tiktok-scraper7.p.rapidapi.com` (for TikTok verification)
- `instagram-scraper21.p.rapidapi.com` (for Instagram verification)

Both can use the same API key if subscribed under the same RapidAPI account.

