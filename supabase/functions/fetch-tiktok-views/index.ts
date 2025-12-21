import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TikTokRequest {
  video_url: string;
}

// Extract video ID from TikTok URL - handles full URLs only
function extractVideoId(url: string): string | null {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return null;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    // Match pattern: /@username/video/NUMERIC_ID or /video/NUMERIC_ID
    const videoMatch = cleanUrl.match(/\/video\/(\d+)/);
    if (videoMatch && videoMatch[1]) {
      return videoMatch[1];
    }

    // Fallback: check if URL ends with numeric ID
    const urlWithoutQuery = cleanUrl.split("?")[0];
    const parts = urlWithoutQuery.split("/");
    const lastPart = parts[parts.length - 1];

    if (lastPart && /^\d{15,}$/.test(lastPart)) {
      return lastPart;
    }

    return null;
  } catch {
    return null;
  }
}

// Check if URL is a short link that needs expansion
function isShortUrl(url: string): boolean {
  return url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com");
}

// Expand short URL by following redirects
async function expandShortUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    console.log(`Expanded URL: ${url} -> ${response.url}`);
    return response.url;
  } catch (err) {
    console.error("Error expanding URL:", err);
    return url;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_API_KEY = Deno.env.get("TIKTOK_API_KEY");

    if (!TIKTOK_API_KEY) {
      console.error("TIKTOK_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "TikTok API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestData = (await req.json()) as TikTokRequest;
    let targetUrl = requestData.video_url;

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Original URL: ${targetUrl}`);

    // Expand short URLs first
    if (isShortUrl(targetUrl)) {
      targetUrl = await expandShortUrl(targetUrl);
      console.log(`After expansion: ${targetUrl}`);
    }

    const videoId = extractVideoId(targetUrl);

    if (!videoId) {
      console.error(`Could not extract video ID from: ${targetUrl}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not extract video ID from URL. Please use the full TikTok video URL.",
          error_code: "invalid_url",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Fetching TikTok data for video ID:", videoId);

    const apiUrl = `https://tiktok-api-fast-reliable-data-scraper.p.rapidapi.com/video/${videoId}`;

    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": TIKTOK_API_KEY,
        "x-rapidapi-host": "tiktok-api-fast-reliable-data-scraper.p.rapidapi.com",
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("TikTok API error:", apiResponse.status, errorText);

      const errorCode =
        apiResponse.status === 403 ? "not_subscribed" : apiResponse.status === 429 ? "rate_limited" : "api_error";

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch TikTok data",
          error_code: errorCode,
          upstream_status: apiResponse.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await apiResponse.json();
    console.log("TikTok API response received");

    const awemeDetail = data?.data?.aweme_detail;

    if (!awemeDetail) {
      console.error("No aweme_detail in response:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid API response structure",
          error_code: "parse_error",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    console.log("Processed result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in fetch-tiktok-views:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
