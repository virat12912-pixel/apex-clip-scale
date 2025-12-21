import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  username: string;
  verification_code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_API_KEY = Deno.env.get('TIKTOK_API_KEY');
    
    if (!TIKTOK_API_KEY) {
      console.error('TIKTOK_API_KEY is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'TikTok API not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, verification_code } = await req.json() as VerifyRequest;
    
    if (!username || !verification_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'username and verification_code are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');
    
    console.log('Fetching TikTok bio for:', cleanUsername);

    const apiUrl = `https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${encodeURIComponent(cleanUsername)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': TIKTOK_API_KEY,
        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('TikTok API error:', response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit reached. Please try again later.',
            error_code: 'rate_limited'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch TikTok profile',
          error_code: 'api_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('TikTok API response received');

    // TikTok bio is in "signature" field
    const bio = data?.data?.user?.signature || data?.data?.signature || '';
    
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
    console.error('Error in verify-tiktok-bio:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
