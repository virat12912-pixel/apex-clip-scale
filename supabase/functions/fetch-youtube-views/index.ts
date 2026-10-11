import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, jsonResponse, signMetricsAssertion } from "../_shared/security.ts";

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
async function fetchViaScrapeCreators(videoUrl: string, videoId: string): Promise<{ views: number; likes: number; comments: number; author: string | null; ownerIds: string[]; description: string | null } | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY');
    if (!apiKey) return null;
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
      ownerIds: [data.channel?.id, data.channel?.handle, data.channel?.customUrl].filter((v): v is string => typeof v === "string"),
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
    const auth = await authenticateRequest(req);
    if (!auth) return jsonResponse({ success: false, error: "Unauthorized" }, 401, corsHeaders);
    const { video_url } = (await req.json()) as YouTubeRequest;

    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(video_url); } catch { return jsonResponse({ success: false, error: "Invalid YouTube URL" }, 400, corsHeaders); }
    if (parsedUrl.protocol !== "https:" || !["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"].includes(parsedUrl.hostname.toLowerCase())) {
      return jsonResponse({ success: false, error: "A valid YouTube video URL is required" }, 400, corsHeaders);
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
              ownerIds: [snippet.channelId, snippet.customUrl].filter((v): v is string => typeof v === "string"),
              description: snippet.title || null,
            };
          }
        }
      }
    }

    if (result && result.views > 0) {
      if (!await isAdminOrOwnVerifiedChannel(auth.serviceClient, auth.user.id, result.ownerIds)) {
        return jsonResponse({ success: false, error: "The video must belong to one of your verified YouTube accounts" }, 403, corsHeaders);
      }
      const metricsAssertion = await signMetricsAssertion({
        userId: auth.user.id,
        videoUrl: video_url.trim(),
        views: result.views,
        likes: result.likes,
        comments: result.comments,
      });
      const response = {
        success: true,
        video_id: videoId,
        play_count: result.views,
        like_count: result.likes,
        comment_count: result.comments,
        author: result.author,
        description: result.description,
        metrics_assertion: metricsAssertion,
      };

      console.log("YouTube metrics lookup completed", { videoId });
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

async function isAdminOrOwnVerifiedChannel(serviceClient: any, userId: string, ownerIds: string[]): Promise<boolean> {
  const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin === true) return true;
  if (!ownerIds.length) return false;
  const { data: accounts, error } = await serviceClient
    .from("social_accounts")
    .select("username")
    .eq("user_id", userId)
    .eq("platform", "youtube")
    .eq("verified", true);
  if (error) return false;
  const normalize = (value: string) => value.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?youtube\.com\//i, "").replace(/^\//, "").toLowerCase();
  const candidates = new Set(ownerIds.map(normalize));
  return (accounts ?? []).some((account: { username: string }) => candidates.has(normalize(account.username)));
}
