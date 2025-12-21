import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramRequest {
  video_url: string;
}

// Extract reel ID/shortcode from Instagram URL
function extractReelId(url: string): string | null {
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

    const reelId = extractReelId(video_url);
    
    if (!reelId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract reel ID from URL',
          error_code: 'invalid_url'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Instagram data for shortcode:', reelId);

    // Use new API endpoint: /api/v1/post-info?code={reel_id}
    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post-info?code=${reelId}`;
    
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
    console.log('Instagram API response received');

    // Extract from new API structure: data.post.video_play_count
    const postData = data?.data?.post;
    
    if (!postData) {
      console.error('No post data in response');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API response structure',
          error_code: 'parse_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract caption from edges structure
    const captionEdges = postData.edge_media_to_caption?.edges || [];
    const caption = captionEdges[0]?.node?.text || null;
    
    // Extract like count
    const likeCount = postData.edge_media_preview_like?.count || 0;
    
    const result = {
      success: true,
      shortcode: reelId,
      play_count: postData.video_play_count || 0,
      like_count: likeCount,
      comment_count: postData.edge_media_to_comment?.count || 0,
      author: postData.owner?.username || null,
      description: caption,
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
