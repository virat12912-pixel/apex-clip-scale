import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface YouTubeRequest {
  video_url: string;
}

// Extract video ID from various YouTube URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
    /^([a-zA-Z0-9_-]{11})$/,
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

    if (!YOUTUBE_API_KEY) {
      console.error("YOUTUBE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "YouTube API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_url } = (await req.json()) as YouTubeRequest;

    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractYouTubeVideoId(video_url);

    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not extract video ID from URL",
          error_code: "invalid_url",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Fetching YouTube data for video ID:", videoId);

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(apiUrl, { method: "GET" });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube API error:", response.status, errorText);

      const errorCode =
        response.status === 403 ? "quota_exceeded" : response.status === 429 ? "rate_limited" : "api_error";

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch YouTube data",
          error_code: errorCode,
          upstream_status: response.status,
          details: errorText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Video not found or is private",
          error_code: "VIDEO_NOT_FOUND",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const video = data.items[0];
    const stats = video.statistics || {};
    const snippet = video.snippet || {};

    const result = {
      success: true,
      video_id: videoId,
      play_count: parseInt(stats.viewCount || "0", 10),
      like_count: parseInt(stats.likeCount || "0", 10),
      comment_count: parseInt(stats.commentCount || "0", 10),
      author: snippet.channelTitle || null,
      description: snippet.title || null,
    };

    console.log("Processed result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in fetch-youtube-views:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
