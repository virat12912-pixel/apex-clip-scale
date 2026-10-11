import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, jsonResponse, signMetricsAssertion } from "../_shared/security.ts";

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
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ["vm.tiktok.com", "vt.tiktok.com"].includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
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
          const nextUrl = new URL(location, currentUrl);
          if (nextUrl.protocol !== "https:" || !["vm.tiktok.com", "vt.tiktok.com", "tiktok.com", "www.tiktok.com"].includes(nextUrl.hostname.toLowerCase())) break;
          currentUrl = nextUrl.href;
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

// Scrape Creators API
async function fetchViaScrapeCreators(videoUrl: string): Promise<{ views: number; likes: number; comments: number; author: string | null; description: string | null } | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY');
    if (!apiKey) return null;
    console.log("Trying Scrape Creators API...");
    
    const apiUrl = `https://api.scrapecreators.com/v2/tiktok/video?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Scrape Creators API error:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data?.aweme_detail) {
      console.error("Scrape Creators returned no aweme_detail");
      return null;
    }

    const awemeDetail = data.aweme_detail;
    const statistics = awemeDetail.statistics || {};
    const author = awemeDetail.author || {};

    const result = {
      views: statistics.play_count || 0,
      likes: statistics.digg_count || 0,
      comments: statistics.comment_count || 0,
      author: author.unique_id || author.nickname || null,
      description: awemeDetail.desc || null,
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
    const { video_url } = (await req.json()) as TikTokRequest;

    if (!video_url) {
      return new Response(JSON.stringify({ error: "video_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUrl = video_url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = `https://${targetUrl}`;
    let parsedTarget: URL;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return jsonResponse({ success: false, error: "Invalid TikTok URL" }, 400, corsHeaders);
    }
    const approvedHosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
    if (parsedTarget.protocol !== "https:" || !approvedHosts.includes(parsedTarget.hostname.toLowerCase())) {
      return jsonResponse({ success: false, error: "A valid TikTok video URL is required" }, 400, corsHeaders);
    }
    console.log(`Original URL: ${targetUrl}`);

    // Expand short URLs
    if (isShortUrl(targetUrl)) {
      targetUrl = await expandShortUrl(targetUrl);
      console.log(`Expanded URL: ${targetUrl}`);
    }

    if (!extractVideoId(targetUrl)) {
      return jsonResponse({ success: false, error: "Could not extract video ID from URL", error_code: "invalid_url" }, 400, corsHeaders);
    }

    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    // Try Scrape Creators API
    const result = await fetchViaScrapeCreators(targetUrl);

    // If we got stats, return them
    if (result && result.views > 0) {
      if (!await isAdminOrOwnVerifiedAccount(auth.serviceClient, auth.user.id, result.author)) {
        return jsonResponse({ success: false, error: "The video must belong to one of your verified TikTok accounts" }, 403, corsHeaders);
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
        video_id: extractVideoId(targetUrl),
        play_count: result.views,
        like_count: result.likes,
        comment_count: result.comments,
        author: result.author,
        description: result.description,
        metrics_assertion: metricsAssertion,
      };

      console.log("TikTok metrics lookup completed", { videoId: response.video_id });
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If scraping failed, return error
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

async function isAdminOrOwnVerifiedAccount(serviceClient: any, userId: string, author: string | null): Promise<boolean> {
  const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return true;
  if (!author) return false;
  const { data: accounts, error } = await serviceClient
    .from("social_accounts")
    .select("username")
    .eq("user_id", userId)
    .eq("platform", "tiktok")
    .eq("verified", true);
  if (error) return false;
  const normalize = (value: string) => value.trim().replace(/^@/, "").toLowerCase();
  return (accounts ?? []).some((account: { username: string }) => normalize(account.username) === normalize(author));
}
