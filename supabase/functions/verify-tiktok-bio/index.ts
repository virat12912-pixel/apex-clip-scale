import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, getOwnedSocialAccount, jsonResponse } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fetch TikTok bio using Scrape Creators API
async function fetchTikTokBio(username: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY');
    if (!apiKey) return null;
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
    const auth = await authenticateRequest(req);
    if (!auth) return jsonResponse({ success: false, error: "Unauthorized" }, 401, corsHeaders);
    const { account_id } = await req.json();
    const account = await getOwnedSocialAccount(auth.serviceClient, auth.user.id, account_id, "tiktok");
    if (!account) return jsonResponse({ success: false, error: "TikTok account was not found or is already verified" }, 400, corsHeaders);
    const cleanUsername = account.username.replace(/^@/, "").trim();
    if (!/^[A-Za-z0-9._]{1,24}$/.test(cleanUsername)) return jsonResponse({ success: false, error: "Invalid TikTok account" }, 400, corsHeaders);
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

    const isVerified = bio.includes(account.verification_code);

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        bio: undefined,
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
