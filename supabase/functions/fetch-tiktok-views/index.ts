import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TikTokRequest {
  video_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_API_KEY = Deno.env.get('TIKTOK_API_KEY');
    
    if (!TIKTOK_API_KEY) {
      console.error('TIKTOK_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'TikTok API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { video_url } = await req.json() as TikTokRequest;
    
    if (!video_url) {
      return new Response(
        JSON.stringify({ error: 'video_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching TikTok data for:', video_url);

    // Use RapidAPI TikTok endpoint to fetch video info
    const apiUrl = `https://tiktok-video-no-watermark2.p.rapidapi.com/?url=${encodeURIComponent(video_url)}&hd=1`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': TIKTOK_API_KEY,
        'x-rapidapi-host': 'tiktok-video-no-watermark2.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TikTok API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch TikTok data', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('TikTok API response:', JSON.stringify(data, null, 2));

    // Extract relevant video stats
    const videoData = data.data || data;
    
    const result = {
      success: true,
      video_id: videoData.id || null,
      play_count: videoData.play_count || videoData.playCount || videoData.statistics?.playCount || 0,
      like_count: videoData.digg_count || videoData.diggCount || videoData.statistics?.diggCount || 0,
      comment_count: videoData.comment_count || videoData.commentCount || videoData.statistics?.commentCount || 0,
      share_count: videoData.share_count || videoData.shareCount || videoData.statistics?.shareCount || 0,
      author: videoData.author?.nickname || videoData.author?.unique_id || null,
      description: videoData.title || videoData.desc || null,
    };

    console.log('Processed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-tiktok-views:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
