import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TikTokRequest {
  video_url: string;
}

// Helper: Resolve short URLs (e.g., vm.tiktok.com) to full URLs
async function expandShortUrl(url: string): Promise<string> {
  try {
    // We use a simple fetch. The browser/Deno runtime follows redirects automatically.
    // We try a HEAD request first to save bandwidth, but fall back to GET if needed.
    const response = await fetch(url, {
      method: "GET", // TikTok sometimes blocks HEAD requests, GET is safer
      redirect: "follow",
    });
    return response.url;
  } catch (err) {
    console.error("Error expanding URL:", err);
    return url; // Return original if fetch fails
  }
}

// Extract video ID from TikTok URL
function extractVideoId(url: string): string | null {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return null;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    // Remove query parameters first
    const urlWithoutQuery = cleanUrl.split("?")[0];

    // Get the last segment
    const parts = urlWithoutQuery.split("/");
    const lastPart = parts[parts.length - 1];

    // Basic validation to ensure it looks like an ID (numeric)
    if (lastPart && /^\d+$/.test(lastPart)) {
      return lastPart;
    }

    return lastPart || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // --- LOGIC FIX: Expand URL using TypeScript (Replacing Python requests) ---
    // If it looks like a short link (vm.tiktok, vt.tiktok), expand it
    if (targetUrl.includes("vm.tiktok.com") || targetUrl.includes("vt.tiktok.com")) {
      targetUrl = await expandShortUrl(targetUrl);
      console.log(`Expanded URL: ${targetUrl}`);
    }

    const videoId = extractVideoId(targetUrl);

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

    console.log("Fetching TikTok data for video ID:", videoId);

    // Use RapidAPI TikTok endpoint
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
          details: errorText,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await apiResponse.json();
    console.log("TikTok API response received");

    // Extract from new API structure: data.aweme_detail.statistics.play_count
    const awemeDetail = data?.data?.aweme_detail;

    if (!awemeDetail) {
      console.error("No aweme_detail in response");
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

    console.log("Processed result:", result);

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
