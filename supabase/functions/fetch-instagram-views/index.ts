import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InstagramRequest {
  video_url: string;
}

interface ScrapedResult {
  views: number;
  likes: number;
  comments: number;
  author: string | null;
  description: string | null;
}

// Extract reel ID/shortcode from Instagram URL
function extractReelId(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels)\/([\w-]+)/i,
    /instagr\.am\/(?:p|reel)\/([\w-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Mode": "navigate",
};

// ─── Method 1: Instagram Embed page (most reliable free method) ────────
async function fetchViaEmbed(shortcode: string): Promise<ScrapedResult | null> {
  try {
    console.log("Trying Instagram Embed page...");

    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
    const response = await fetch(embedUrl, {
      method: "GET",
      headers: {
        ...BROWSER_HEADERS,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error("Embed page error:", response.status);
      await response.text();
      return null;
    }

    const html = await response.text();

    // Extract from embedded media JSON
    // Look for window.__additionalDataLoaded or embedded media data
    let views = 0, likes = 0, comments = 0;
    let author: string | null = null;
    let description: string | null = null;

    // Try to find video_view_count in the embed HTML
    const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/);
    if (viewMatch) views = parseInt(viewMatch[1]);

    const playMatch = html.match(/"video_play_count"\s*:\s*(\d+)/);
    if (!views && playMatch) views = parseInt(playMatch[1]);

    // Also try play_count pattern (mobile-style)
    const playCount2 = html.match(/"play_count"\s*:\s*(\d+)/);
    if (!views && playCount2) views = parseInt(playCount2[1]);

    const likeMatch = html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (likeMatch) likes = parseInt(likeMatch[1]);

    const likeMatch2 = html.match(/"like_count"\s*:\s*(\d+)/);
    if (!likes && likeMatch2) likes = parseInt(likeMatch2[1]);

    const commentMatch = html.match(/"edge_media_preview_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (commentMatch) comments = parseInt(commentMatch[1]);

    const commentMatch2 = html.match(/"comment_count"\s*:\s*(\d+)/);
    if (!comments && commentMatch2) comments = parseInt(commentMatch2[1]);

    const authorMatch = html.match(/"username"\s*:\s*"([^"]+)"/);
    if (authorMatch) author = authorMatch[1];

    // Try to extract from the embed's caption area
    const captionMatch = html.match(/<div class="Caption"[^>]*>.*?<div class="CaptionUsername"[^>]*>.*?<\/div>(.*?)<\/div>/s);
    if (captionMatch) {
      description = captionMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Also try JSON caption
    if (!description) {
      const captionJsonMatch = html.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (captionJsonMatch) {
        try {
          description = JSON.parse(`"${captionJsonMatch[1]}"`);
        } catch { /* ignore */ }
      }
    }

    if (views > 0 || author) {
      console.log("Embed success - views:", views, "author:", author);
      return { views, likes, comments, author, description };
    }

    // Fallback: try to extract view count from the visible text (e.g., "1,234 views")
    const textViewMatch = html.match(/([\d,]+)\s*views/i);
    if (textViewMatch) {
      views = parseInt(textViewMatch[1].replace(/,/g, ''));
      if (views > 0) {
        console.log("Embed text scrape success - views:", views);
        return { views, likes, comments, author, description };
      }
    }

    console.log("Embed page: no data extracted");
    return null;
  } catch (error) {
    console.error("Embed error:", error);
    return null;
  }
}

// ─── Method 2: Instagram GraphQL API (updated doc_ids) ─────────────────
async function fetchViaGraphQL(shortcode: string): Promise<ScrapedResult | null> {
  // Try multiple known doc_ids (Instagram rotates them)
  const docIds = [
    "8845758582119845",  // PolarisPostActionLoadPostQueryQuery (newer)
    "10015901848480474", // PolarisPostActionLoadPostQueryQuery (older)
    "17891344298141564", // Alternative
  ];

  for (const docId of docIds) {
    try {
      console.log(`Trying Instagram GraphQL with doc_id ${docId}...`);

      const variables = JSON.stringify({
        shortcode,
        child_comment_count: 0,
        fetch_comment_count: 0,
        parent_comment_count: 0,
        has_threaded_comments: false,
      });

      const response = await fetch("https://www.instagram.com/graphql/query", {
        method: "POST",
        headers: {
          ...BROWSER_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          "X-ASBD-ID": "129477",
          "X-IG-WWW-Claim": "0",
        },
        body: `av=0&__d=www&__user=0&__a=1&__req=1&__hs=0&dpr=1&__ccg=UNKNOWN&__rev=0&__s=0&__hsi=0&__comet_req=0&lsd=0&jazoest=0&__spin_r=0&__spin_b=trunk&__spin_t=0&__jssesw=0&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostActionLoadPostQueryQuery&variables=${encodeURIComponent(variables)}&server_timestamps=true&doc_id=${docId}`,
      });

      if (!response.ok) {
        console.error(`GraphQL doc_id ${docId} error:`, response.status);
        await response.text();
        continue;
      }

      const data = await response.json();
      const media = data?.data?.xdt_shortcode_media;

      if (!media) {
        console.error(`No media data for doc_id ${docId}`);
        continue;
      }

      const captionEdges = media.edge_media_to_caption?.edges || [];
      const caption = captionEdges[0]?.node?.text || null;

      const result: ScrapedResult = {
        views: media.video_view_count || media.video_play_count || 0,
        likes: media.edge_media_preview_like?.count || 0,
        comments: media.edge_media_preview_comment?.count || media.edge_media_to_parent_comment?.count || 0,
        author: media.owner?.username || null,
        description: caption,
      };

      console.log("GraphQL success - views:", result.views, "author:", result.author);
      return result;
    } catch (error) {
      console.error(`GraphQL doc_id ${docId} error:`, error);
      continue;
    }
  }
  return null;
}

// ─── Method 3: Instagram mobile/web API (/api/v1/media) ────────────────
async function fetchViaMobileApi(shortcode: string): Promise<ScrapedResult | null> {
  try {
    console.log("Trying Instagram web info API...");

    // Convert shortcode to media ID is complex, so use the web info endpoint instead
    const response = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      method: "GET",
      headers: {
        "User-Agent": "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)",
        "Accept": "*/*",
        "X-IG-App-ID": "936619743392459",
      },
    });

    if (!response.ok) {
      console.error("Mobile API error:", response.status);
      await response.text();
      return null;
    }

    const data = await response.json();
    const item = data?.graphql?.shortcode_media || data?.items?.[0];

    if (!item) {
      console.log("No data from mobile API");
      return null;
    }

    const result: ScrapedResult = {
      views: item.video_view_count || item.video_play_count || item.play_count || 0,
      likes: item.edge_media_preview_like?.count || item.like_count || 0,
      comments: item.edge_media_preview_comment?.count || item.comment_count || 0,
      author: item.owner?.username || item.user?.username || null,
      description: item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || null,
    };

    console.log("Mobile API success - views:", result.views, "author:", result.author);
    return result;
  } catch (error) {
    console.error("Mobile API error:", error);
    return null;
  }
}

// ─── Method 4: HTML page scraping ──────────────────────────────────────
async function fetchViaHTMLScrape(shortcode: string): Promise<ScrapedResult | null> {
  try {
    console.log("Trying Instagram HTML scrape...");

    const url = `https://www.instagram.com/p/${shortcode}/`;
    const response = await fetch(url, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });

    if (!response.ok) {
      console.error("HTML scrape error:", response.status);
      await response.text();
      return null;
    }

    const html = await response.text();

    // Try multiple JSON patterns from the page source
    let views = 0, likes = 0, comments = 0;
    let author: string | null = null;

    // Pattern: xdt_shortcode_media in preloader cache
    const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/);
    if (viewMatch) views = parseInt(viewMatch[1]);

    const playMatch = html.match(/"video_play_count"\s*:\s*(\d+)/);
    if (!views && playMatch) views = parseInt(playMatch[1]);

    const likeMatch = html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (likeMatch) likes = parseInt(likeMatch[1]);

    const commentMatch = html.match(/"edge_media_preview_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (commentMatch) comments = parseInt(commentMatch[1]);

    const authorMatch = html.match(/"username"\s*:\s*"([^"]+)"/);
    if (authorMatch) author = authorMatch[1];

    if (views > 0 || author) {
      console.log("HTML scrape success - views:", views, "author:", author);
      return { views, likes, comments, author, description: null };
    }

    console.log("Could not extract media data from HTML");
    return null;
  } catch (error) {
    console.error("HTML scrape error:", error);
    return null;
  }
}

// ─── Method 5: RapidAPI (paid fallback) ────────────────────────────────
async function fetchViaRapidApi(
  shortcode: string,
  apiKey: string,
): Promise<ScrapedResult | null> {
  try {
    console.log("Trying RapidAPI fallback...");

    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post-info?code=${shortcode}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "instagram-scraper21.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const postData = data?.data?.post;

    if (!postData) {
      console.error("No post data in RapidAPI response");
      return null;
    }

    const captionEdges = postData.edge_media_to_caption?.edges || [];
    const caption = captionEdges[0]?.node?.text || null;
    const likeCount = postData.edge_media_preview_like?.count || 0;

    const result: ScrapedResult = {
      views: postData.video_view_count || 0,
      likes: likeCount,
      comments: postData.edge_media_preview_comment?.count || 0,
      author: postData.owner?.username || null,
      description: caption,
    };

    console.log("RapidAPI success - views:", result.views, "author:", result.author);
    return result;
  } catch (error) {
    console.error("RapidAPI error:", error);
    return null;
  }
}

// ─── oEmbed for author info fallback ───────────────────────────────────
async function fetchOEmbed(
  url: string,
): Promise<{ author: string | null; description: string | null } | null> {
  try {
    console.log("Trying Instagram oEmbed...");
    const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl, {
      headers: { "User-Agent": BROWSER_HEADERS["User-Agent"] },
    });
    if (!response.ok) {
      await response.text();
      return null;
    }
    const data = await response.json();
    return {
      author: data.author_name || null,
      description: data.title || null,
    };
  } catch {
    return null;
  }
}

// ─── Main handler ──────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_url } = (await req.json()) as InstagramRequest;

    if (!video_url) {
      return new Response(
        JSON.stringify({ error: "video_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reelId = extractReelId(video_url);
    if (!reelId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not extract reel ID from URL",
          error_code: "invalid_url",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Fetching Instagram data for shortcode: ${reelId}`);

    // Method 1: Try embed page (most reliable free method)
    let result = await fetchViaEmbed(reelId);

    // Method 2: Try GraphQL with multiple doc_ids
    if (!result || result.views <= 0) {
      result = await fetchViaGraphQL(reelId);
    }

    // Method 3: Try mobile/web API
    if (!result || result.views <= 0) {
      result = await fetchViaMobileApi(reelId);
    }

    // Method 4: Try HTML page scraping
    if (!result || result.views <= 0) {
      const htmlResult = await fetchViaHTMLScrape(reelId);
      if (htmlResult && (htmlResult.views > 0 || (result && !result.author && htmlResult.author))) {
        result = htmlResult;
      }
    }

    // Method 5: RapidAPI as final fallback
    if (!result || result.views <= 0) {
      const apiKey = Deno.env.get("INSTAGRAM_API_KEY");
      if (apiKey) {
        result = await fetchViaRapidApi(reelId, apiKey);
      }
    }

    // If we got stats, return them
    if (result && result.views > 0) {
      const response = {
        success: true,
        shortcode: reelId,
        play_count: result.views,
        like_count: result.likes,
        comment_count: result.comments,
        author: result.author,
        description: result.description,
      };

      console.log("Processed result:", JSON.stringify(response));
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If stats failed but we can get author info via oEmbed
    const oembedData = await fetchOEmbed(video_url);
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
    console.error("Error in fetch-instagram-views:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
