import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  username: string;
  verification_code: string;
}

// Fetch Instagram bio using Apify (primary)
async function fetchBioViaApify(username: string): Promise<string | null> {
  const token = Deno.env.get('APIFY_API_TOKEN');
  if (!token) {
    console.log('APIFY_API_TOKEN not configured, skipping Apify');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    console.log('Fetching Instagram profile via Apify:', username);
    const response = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?timeout=90',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernames: [username] }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Apify error [${response.status}]: ${body.slice(0, 400)}`);
      return null;
    }

    const items = await response.json();
    const item = Array.isArray(items) ? items[0] : null;
    if (!item) {
      console.error('Apify returned no profile items for', username);
      return null;
    }
    if (item.error) {
      console.error('Apify profile error:', item.error, item.errorDescription || '');
      return null;
    }

    const bio = item.biography ?? null;
    if (bio !== null) console.log('Found bio via Apify');
    return bio;
  } catch (error) {
    console.error('Apify request failed:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Fetch Instagram bio using Scrape Creators API (fallback)

async function fetchInstagramBio(username: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY') || 'yp6K8BEqORYJn6YZkZJLLIwgFkV2';
    const cleanUsername = username.replace(/^@/, '');
    const apiUrl = `https://api.scrapecreators.com/v1/instagram/profile?username=${encodeURIComponent(cleanUsername)}`;
    
    console.log('Fetching Instagram profile via Scrape Creators API:', cleanUsername);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('Scrape Creators API error:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      if (response.status === 429) {
        return null;
      }
      
      return null;
    }

    const data = await response.json();
    const bio = data?.data?.user?.biography || data?.data?.biography || null;
    
    if (bio !== null && bio !== undefined) {
      console.log('Found bio via Scrape Creators API');
      return bio;
    }

    return null;
  } catch (error) {
    console.error('Scrape Creators API error:', error);
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

    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');
    
    console.log('Verifying Instagram bio for:', cleanUsername);

    let bio = await fetchBioViaApify(cleanUsername);
    if (bio === null) {
      bio = await fetchInstagramBio(cleanUsername);
    }

    if (bio === null) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not fetch Instagram profile. Please make sure the username is correct and try again.',
          error_code: 'fetch_failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User bio:', bio);
    console.log('Looking for code:', verification_code);

    // Check if verification code is in bio
    const isVerified = bio.includes(verification_code);

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        bio: bio,
        message: isVerified 
          ? 'Verification successful! Code found in bio.' 
          : 'Verification code not found in bio. Please add it and try again.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-instagram-bio:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
