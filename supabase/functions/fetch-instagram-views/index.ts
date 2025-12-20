import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramRequest {
  video_url: string;
}

// Extract shortcode from Instagram URL
function extractShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels)\/([\w-]+)/i,
    /instagr\.am\/(?:p|reel)\/([\w-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const INSTAGRAM_API_KEY = Deno.env.get('INSTAGRAM_API_KEY');
    
    if (!INSTAGRAM_API_KEY) {
      console.error('INSTAGRAM_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Instagram API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { video_url } = await req.json() as InstagramRequest;
    
    if (!video_url) {
      return new Response(
        JSON.stringify({ error: 'video_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shortcode = extractShortcode(video_url);
    
    if (!shortcode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract shortcode from URL',
          error_code: 'invalid_url'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Instagram data for shortcode:', shortcode);

    // Use RapidAPI Instagram Scraper endpoint - parameter must be shortcode_or_url
    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post_info?shortcode_or_url=${shortcode}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': INSTAGRAM_API_KEY,
        'x-rapidapi-host': 'instagram-scraper21.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram API error:', response.status, errorText);

      const errorCode = response.status === 403
        ? 'not_subscribed'
        : response.status === 429
          ? 'rate_limited'
          : 'api_error';

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch Instagram data',
          error_code: errorCode,
          upstream_status: response.status,
          details: errorText,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Instagram API response:', JSON.stringify(data, null, 2));

    // Extract relevant video stats from the response
    const mediaData = data.data || data;
    
    const result = {
      success: true,
      shortcode: shortcode,
      play_count: mediaData.play_count || mediaData.video_play_count || mediaData.view_count || 0,
      like_count: mediaData.like_count || mediaData.likes?.count || 0,
      comment_count: mediaData.comment_count || mediaData.comments?.count || 0,
      author: mediaData.owner?.username || mediaData.user?.username || null,
      description: mediaData.caption?.text || mediaData.caption || null,
    };

    console.log('Processed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-instagram-views:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
