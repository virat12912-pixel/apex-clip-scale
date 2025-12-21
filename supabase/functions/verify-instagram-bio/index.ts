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
    const INSTAGRAM_API_KEY = Deno.env.get('INSTAGRAM_API_KEY');
    
    if (!INSTAGRAM_API_KEY) {
      console.error('INSTAGRAM_API_KEY is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Instagram API not configured' }),
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
    
    console.log('Fetching Instagram bio for:', cleanUsername);

    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/info?id_or_username=${encodeURIComponent(cleanUsername)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': INSTAGRAM_API_KEY,
        'x-rapidapi-host': 'instagram-scraper21.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('Instagram API error:', response.status);
      
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
          error: 'Failed to fetch Instagram profile',
          error_code: 'api_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Instagram API response received');

    const bio = data?.data?.user?.biography || data?.data?.biography || data?.biography || '';
    
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
