import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import requests
from urllib.parse import urlparse


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TikTokRequest {
  video_url: string;
}

// Extract video ID from TikTok URL
function extractVideoId(url: string): string | null {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return null;
    
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    
    // Get last part of path and remove query params
    const parts = cleanUrl.split("/");
    const lastPart = parts[parts.length - 1];
    const videoId = lastPart.split("?")[0];
    
    return videoId || null;
  } catch {
    return null;
  }
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
    
    parsed = urlparse(video_url)
    response = requests.get(video_url, allow_redirects=True, timeout=10)
    video_url = response.url  # Final resolved URL

    const videoId = extractVideoId(video_url);
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract video ID from URL',
          error_code: 'invalid_url'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching TikTok data for video ID:', videoId);

    // Use new RapidAPI TikTok endpoint
    const apiUrl = `https://tiktok-api-fast-reliable-data-scraper.p.rapidapi.com/video/${videoId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': TIKTOK_API_KEY,
        'x-rapidapi-host': 'tiktok-api-fast-reliable-data-scraper.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TikTok API error:', response.status, errorText);

      const errorCode = response.status === 403
        ? 'not_subscribed'
        : response.status === 429
          ? 'rate_limited'
          : 'api_error';

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch TikTok data',
          error_code: errorCode,
          upstream_status: response.status,
          details: errorText,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('TikTok API response received');

    // Extract from new API structure: data.aweme_detail.statistics.play_count
    const awemeDetail = data?.data?.aweme_detail;
    
    if (!awemeDetail) {
      console.error('No aweme_detail in response');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API response structure',
          error_code: 'parse_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statistics = awemeDetail.statistics || {};
    const author = awemeDetail.author || {};
    
    const result = {
      success: true,
      video_id: videoId,
      play_count: statistics.play_count || 0,
      like_count: statistics.digg_count || 0,
      comment_count: statistics.comment_count || 0,
      share_count: statistics.share_count || 0,
      author: author.unique_id || author.nickname || null,
      description: awemeDetail.desc || null,
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
