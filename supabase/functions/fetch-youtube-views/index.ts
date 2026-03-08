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

// Fetch YouTube video stats using Scrape Creators API
async function fetchViaScrapeCreators(videoUrl: string, videoId: string): Promise<{ views: number; likes: number; comments: number; author: string | null; description: string | null } | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY') || 'yp6K8BEqORYJn6YZkZJLLIwgFkV2';
    console.log("Trying Scrape Creators API...");
    
    // Try with full URL first, then with video ID
    let apiUrl = `https://api.scrapecreators.com/v1/youtube/video?url=${encodeURIComponent(videoUrl)}`;
    let response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    // If URL doesn't work, try with video ID
    if (!response.ok) {
      apiUrl = `https://api.scrapecreators.com/v1/youtube/video?id=${encodeURIComponent(videoId)}`;
      response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Accept": "application/json",
        },
      });
    }

    if (!response.ok) {
      console.error("Scrape Creators API error:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.success === false) {
      console.error("Scrape Creators returned error");
      return null;
    }

    const result = {
      views: data.viewCountInt || 0,
      likes: data.likeCountInt || 0,
      comments: data.commentCountInt || 0,
      author: data.channel?.title || null,
      description: data.title || null,
    };

    console.log("Scrape Creators success - views:", result.views, "likes:", result.likes, "comments:", result.comments);
    return result;
  } catch (error) {
    console.error("Scrape Creators error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Method 1: Try Scrape Creators API (primary)
    let result = await fetchViaScrapeCreators(video_url, videoId);

    // Method 2: If Scrape Creators failed, try YouTube API as fallback
    if (!result || result.views <= 0) {
      const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

      if (YOUTUBE_API_KEY) {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(apiUrl, { method: "GET" });

        if (response.ok) {
          const data = await response.json();

          if (data.items && data.items.length > 0) {
            const video = data.items[0];
            const stats = video.statistics || {};
            const snippet = video.snippet || {};

            result = {
              views: parseInt(stats.viewCount || "0", 10),
              likes: parseInt(stats.likeCount || "0", 10),
              comments: parseInt(stats.commentCount || "0", 10),
              author: snippet.channelTitle || null,
              description: snippet.title || null,
            };
          }
        }
      }
    }

    if (result && result.views > 0) {
      const response = {
        success: true,
        video_id: videoId,
        play_count: result.views,
        like_count: result.likes,
        comment_count: result.comments,
        author: result.author,
        description: result.description,
      };

      console.log("Processed result:", response);
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Video not found or is private",
        error_code: "VIDEO_NOT_FOUND",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in fetch-youtube-views:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
