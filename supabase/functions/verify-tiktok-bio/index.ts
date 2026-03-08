import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyRequest {
  username: string;
  verification_code: string;
}

// Fetch TikTok bio using Scrape Creators API
async function fetchTikTokBio(username: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY') || 'yp6K8BEqORYJn6YZkZJLLIwgFkV2';
    const cleanUsername = username.replace(/^@/, '');
    const apiUrl = `https://api.scrapecreators.com/v1/tiktok/profile?uniqueId=${encodeURIComponent(cleanUsername)}`;
    
    console.log('Fetching TikTok profile via Scrape Creators API:', cleanUsername);

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
      return null;
    }

    const data = await response.json();
    const bio = data?.user?.signature || null;
    
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

    const cleanUsername = username.replace(/^@/, '');
    console.log('Verifying TikTok bio for:', cleanUsername);

    const bio = await fetchTikTokBio(cleanUsername);

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
