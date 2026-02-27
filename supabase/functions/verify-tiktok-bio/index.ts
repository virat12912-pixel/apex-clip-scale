import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  username: string;
  verification_code: string;
}

// Method 1: Scrape TikTok profile page directly
async function scrapeTikTokBio(username: string): Promise<string | null> {
  try {
    const url = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
    console.log('Scraping TikTok profile:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('TikTok page fetch failed:', response.status);
      return null;
    }

    const html = await response.text();

    // Try to extract bio from __UNIVERSAL_DATA_FOR_REHYDRATION__
    const rehydrationMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (rehydrationMatch) {
      try {
        const data = JSON.parse(rehydrationMatch[1]);
        const userInfo = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
        const bio = userInfo?.user?.signature;
        if (bio !== undefined) {
          console.log('Found bio via REHYDRATION data');
          return bio;
        }
      } catch (e) {
        console.log('Failed to parse REHYDRATION data');
      }
    }

    // Try SIGI_STATE
    const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
    if (sigiMatch) {
      try {
        const data = JSON.parse(sigiMatch[1]);
        const userModule = data?.UserModule?.users;
        if (userModule) {
          const userKey = Object.keys(userModule)[0];
          const bio = userModule[userKey]?.signature;
          if (bio !== undefined) {
            console.log('Found bio via SIGI_STATE');
            return bio;
          }
        }
      } catch (e) {
        console.log('Failed to parse SIGI_STATE');
      }
    }

    // Try meta description as fallback
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (metaMatch) {
      console.log('Found meta description as fallback');
      return metaMatch[1];
    }

    // Try JSON-LD
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const match of jsonLdMatches) {
      try {
        const ld = JSON.parse(match[1]);
        if (ld?.description) {
          console.log('Found bio via JSON-LD');
          return ld.description;
        }
      } catch (e) {
        // skip
      }
    }

    return null;
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
}

// Method 2: Use TikWM free API
async function fetchBioViaTikWM(username: string): Promise<string | null> {
  try {
    const url = `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`;
    console.log('Fetching bio via TikWM:', username);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TikWM API error:', response.status);
      return null;
    }

    const data = await response.json();
    const bio = data?.data?.signature;
    if (bio !== undefined) {
      console.log('Found bio via TikWM');
      return bio;
    }

    return null;
  } catch (error) {
    console.error('TikWM error:', error);
    return null;
  }
}

// Method 3: Fallback to RapidAPI if key exists
async function fetchBioViaRapidApi(username: string, apiKey: string): Promise<string | null> {
  try {
    const apiUrl = `https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${encodeURIComponent(username)}`;
    console.log('Fetching bio via RapidAPI');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('RapidAPI error:', response.status);
      return null;
    }

    const data = await response.json();
    return data?.data?.user?.signature || data?.data?.signature || null;
  } catch (error) {
    console.error('RapidAPI error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, verification_code } = await req.json() as VerifyRequest;

    if (!username || !verification_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'username and verification_code are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.replace(/^@/, '');
    console.log('Verifying TikTok bio for:', cleanUsername);

    // Try methods in order: TikWM (free API) → Scrape → RapidAPI (fallback)
    let bio: string | null = null;

    bio = await fetchBioViaTikWM(cleanUsername);

    if (bio === null) {
      console.log('TikWM failed, trying direct scrape...');
      bio = await scrapeTikTokBio(cleanUsername);
    }

    if (bio === null) {
      const tiktokApiKey = Deno.env.get('TIKTOK_API_KEY');
      if (tiktokApiKey) {
        console.log('Scrape failed, trying RapidAPI fallback...');
        bio = await fetchBioViaRapidApi(cleanUsername, tiktokApiKey);
      }
    }

    if (bio === null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not fetch TikTok profile. Please make sure the username is correct and try again.',
          error_code: 'fetch_failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User bio:', bio);
    console.log('Looking for code:', verification_code);

    const isVerified = bio.includes(verification_code);

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        bio,
        message: isVerified
          ? 'Verification successful! Code found in bio.'
          : 'Verification code not found in bio. Please add it and try again.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-tiktok-bio:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
