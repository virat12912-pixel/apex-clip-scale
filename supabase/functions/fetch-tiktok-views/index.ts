import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const videoMatch = cleanUrl.match(/\/video\/(\d+)/);
    if (videoMatch && videoMatch[1]) return videoMatch[1];
    const urlWithoutQuery = cleanUrl.split("?")[0];
    const parts = urlWithoutQuery.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^\d{15,}$/.test(lastPart)) return lastPart;
    return null;
  } catch {
    return null;
  }
}

function isShortUrl(url: string): boolean {
  return url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com");
}

async function expandShortUrl(shortUrl: string): Promise<string> {
  let currentUrl = shortUrl;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
  try {
    for (let i = 0; i < 5; i++) {
      const response = await fetch(currentUrl, { method: "HEAD", headers, redirect: "manual" });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (location) {
          currentUrl = new URL(location, currentUrl).href;
          if (currentUrl.includes("/video/")) return currentUrl;
          continue;
        }
      }
      break;
    }
  } catch (error) {
    console.error("Expansion error:", error);
  }
  return currentUrl;
}

// Method 1: TikWM free API (no key needed)
async function fetchViaTikWM(videoUrl: string): Promise<{ views: number; likes: number; comments: number; author: string | null; description: string | null } | null> {
  try {
    console.log("Trying TikWM API...");
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&count=12&cursor=0&web=1&hd=1`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("TikWM API error:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (data?.code !== 0 || !data?.data) {
      console.error("TikWM returned error:", data?.msg || "unknown");
      return null;
    }

    const videoData = data.data;
    console.log("TikWM success - views:", videoData.play_count);

    return {
      views: videoData.play_count || 0,
      likes: videoData.digg_count || 0,
      comments: videoData.comment_count || 0,
      author: videoData.author?.unique_id || null,
      description: videoData.title || null,
    };
  } catch (error) {
    console.error("TikWM error:", error);
    return null;
  }
}

// Method 2: Fallback to RapidAPI if key is available (with retry/backoff)
async function fetchViaRapidApi(videoId: string, apiKey: string): Promise<{ views: number; likes: number; comments: number; author: string | null; description: string | null } | null> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Trying RapidAPI fallback (attempt ${attempt}/${maxRetries})...`);

      const apiUrl = `https://tiktok-api-fast-reliable-data-scraper.p.rapidapi.com/video/${videoId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "tiktok-api-fast-reliable-data-scraper.p.rapidapi.com",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const awemeDetail = data?.data?.aweme_detail;
        if (!awemeDetail) return null;

        const statistics = awemeDetail.statistics || {};
        const author = awemeDetail.author || {};
        return {
          views: statistics.play_count || 0,
          likes: statistics.digg_count || 0,
          comments: statistics.comment_count || 0,
          author: author.unique_id || author.nickname || null,
          description: awemeDetail.desc || null,
        };
      }

      const errorText = await response.text();
      console.error("TikTok RapidAPI error:", response.status, errorText);

      // Permanent errors
      if ([400, 401, 403, 404].includes(response.status)) {
        return null;
      }

      // Retry rate limits and transient errors
      if (attempt < maxRetries) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 0;
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 700);
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs > 0 ? retryAfterMs : backoffMs));
        continue;
      }

      return null;
    } catch (error) {
      console.error("TikTok RapidAPI fallback error:", error);

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 700);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }

      return null;
    }
  }

  return null;
}

// Method 3: TikTok oEmbed (free, gets author info for verification even if stats fail)
async function fetchOEmbed(videoUrl: string): Promise<{ author: string | null; description: string | null } | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      author: data.author_name || null,
      description: data.title || null,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_url } = (await req.json()) as TikTokRequest;

    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUrl = video_url;
    console.log(`Original URL: ${targetUrl}`);

    // Expand short URLs
    if (isShortUrl(targetUrl)) {
      targetUrl = await expandShortUrl(targetUrl);
      console.log(`Expanded URL: ${targetUrl}`);
    }

    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    // Method 1: Try TikWM free API
    let result = await fetchViaTikWM(targetUrl);

    // Method 2: If TikWM failed, try RapidAPI fallback
    if (!result || result.views <= 0) {
      const videoId = extractVideoId(targetUrl);
      const tiktokApiKey = Deno.env.get("TIKTOK_API_KEY");

      if (videoId && tiktokApiKey) {
        result = await fetchViaRapidApi(videoId, tiktokApiKey);
      }
    }

    // If we got stats, return them
    if (result && result.views > 0) {
      const response = {
        success: true,
        video_id: extractVideoId(targetUrl),
        play_count: result.views,
        like_count: result.likes,
        comment_count: result.comments,
        author: result.author,
        description: result.description,
      };

      console.log("Result:", JSON.stringify(response));
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we still don't have stats, try oEmbed for author info at least
    const oembedData = await fetchOEmbed(targetUrl);
    if (oembedData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not fetch video stats. The video may be private or temporarily unavailable.",
          error_code: "scrape_failed",
          author: oembedData.author,
          description: oembedData.description,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not fetch video data. Please check the URL and ensure the video is public.",
        error_code: "scrape_failed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in fetch-tiktok-views:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
