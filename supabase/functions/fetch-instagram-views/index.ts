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

const INSTAGRAM_PATHS = ["reel", "p"] as const;

interface RapidApiFetchResult {
  result: ScrapedResult | null;
  errorCode?: "rate_limited" | "quota_exceeded" | "api_error";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(retryAfter: string | null): number {
  if (!retryAfter) return 0;

  const seconds = Number.parseInt(retryAfter, 10);
  if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;

  const dateDelay = new Date(retryAfter).getTime() - Date.now();
  return Number.isNaN(dateDelay) ? 0 : Math.max(0, dateDelay);
}

function parseScrapedPayload(payload: string): ScrapedResult {
  let views = 0;
  let likes = 0;
  let comments = 0;
  let author: string | null = null;
  let description: string | null = null;

  const viewMatch = payload.match(/"video_view_count"\s*:\s*(\d+)/);
  if (viewMatch?.[1]) views = Number.parseInt(viewMatch[1], 10);

  const playMatch = payload.match(/"video_play_count"\s*:\s*(\d+)/);
  if (!views && playMatch?.[1]) views = Number.parseInt(playMatch[1], 10);

  const playCountMatch = payload.match(/"play_count"\s*:\s*(\d+)/);
  if (!views && playCountMatch?.[1]) views = Number.parseInt(playCountMatch[1], 10);

  const textViewMatch = payload.match(/([\d,]+)\s*views/i);
  if (!views && textViewMatch?.[1]) {
    views = Number.parseInt(textViewMatch[1].replace(/,/g, ""), 10);
  }

  const likeMatch = payload.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
  if (likeMatch?.[1]) likes = Number.parseInt(likeMatch[1], 10);

  const likeCountMatch = payload.match(/"like_count"\s*:\s*(\d+)/);
  if (!likes && likeCountMatch?.[1]) likes = Number.parseInt(likeCountMatch[1], 10);

  const commentMatch = payload.match(/"edge_media_preview_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
  if (commentMatch?.[1]) comments = Number.parseInt(commentMatch[1], 10);

  const commentCountMatch = payload.match(/"comment_count"\s*:\s*(\d+)/);
  if (!comments && commentCountMatch?.[1]) comments = Number.parseInt(commentCountMatch[1], 10);

  const authorMatch = payload.match(/"username"\s*:\s*"([^\"]+)"/);
  if (authorMatch?.[1]) author = authorMatch[1];

  const captionJsonMatch = payload.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (captionJsonMatch?.[1]) {
    try {
      description = JSON.parse(`"${captionJsonMatch[1]}"`);
    } catch {
      description = null;
    }
  }

  return { views, likes, comments, author, description };
}

// ─── Method 1: Scrape Creators API (primary) ─────────────────────────────
async function fetchViaScrapeCreators(videoUrl: string, shortcode: string): Promise<ScrapedResult | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY') || 'BYkwgH6v3kXbKlvvXcaXa9XNa5J2';
    console.log("Trying Scrape Creators API...");
    
    // Try with full URL first, then with shortcode
    const apiUrl = `https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(videoUrl)}`;
    let response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    // If URL doesn't work, try with shortcode
    if (!response.ok) {
      const shortcodeUrl = `https://www.instagram.com/reel/${shortcode}/`;
      const apiUrlShortcode = `https://api.scrapecreators.com/v1/instagram/post?url=${encodeURIComponent(shortcodeUrl)}`;
      response = await fetch(apiUrlShortcode, {
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
    
    if (!data?.data?.xdt_shortcode_media) {
      console.error("Scrape Creators returned no media data");
      return null;
    }

    const media = data.data.xdt_shortcode_media;
    const captionEdges = media.edge_media_to_caption?.edges || [];
    const caption = captionEdges[0]?.node?.text || null;

    const result: ScrapedResult = {
      views: media.video_view_count || media.video_play_count || 0,
      likes: media.edge_media_preview_like?.count || 0,
      comments: media.edge_media_to_parent_comment?.count || media.edge_media_preview_comment?.count || 0,
      author: media.owner?.username || null,
      description: caption,
    };

    console.log("Scrape Creators success - views:", result.views, "likes:", result.likes, "comments:", result.comments);
    return result;
  } catch (error) {
    console.error("Scrape Creators error:", error);
    return null;
  }
}

// ─── Method 2: Instagram Embed page ─────────────────────────────────────
async function fetchViaEmbed(shortcode: string): Promise<ScrapedResult | null> {
  for (const path of INSTAGRAM_PATHS) {
    try {
      console.log(`Trying Instagram embed page via /${path}/...`);

      const embedUrl = `https://www.instagram.com/${path}/${shortcode}/embed/captioned/`;
      const response = await fetch(embedUrl, {
        method: "GET",
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`Embed page error (${path}):`, response.status);
        await response.text();
        continue;
      }

      const html = await response.text();
      const parsed = parseScrapedPayload(html);

      if (parsed.views > 0 || parsed.author) {
        console.log(`Embed success (${path}) - views:`, parsed.views, "author:", parsed.author);
        return parsed;
      }
    } catch (error) {
      console.error(`Embed error (${path}):`, error);
    }
  }

  console.log("Embed page: no data extracted");
  return null;
}

// ─── Method 2: Instagram GraphQL API ────────────────────────────────────
async function fetchViaGraphQL(shortcode: string): Promise<ScrapedResult | null> {
  const docIds = [
    "8845758582119845",
    "10015901848480474",
    "17891344298141564",
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
    }
  }

  return null;
}

// ─── Method 3: Instagram web API ────────────────────────────────────────
async function fetchViaMobileApi(shortcode: string): Promise<ScrapedResult | null> {
  for (const path of INSTAGRAM_PATHS) {
    try {
      console.log(`Trying Instagram web info API via /${path}/...`);

      const response = await fetch(`https://www.instagram.com/${path}/${shortcode}/?__a=1&__d=dis`, {
        method: "GET",
        headers: {
          "User-Agent": "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)",
          "Accept": "*/*",
          "X-IG-App-ID": "936619743392459",
        },
      });

      if (!response.ok) {
        console.error(`Mobile API error (${path}):`, response.status);
        await response.text();
        continue;
      }

      const data = await response.json();
      const item = data?.graphql?.shortcode_media || data?.items?.[0];

      if (!item) {
        console.log(`No data from mobile API (${path})`);
        continue;
      }

      const result: ScrapedResult = {
        views: item.video_view_count || item.video_play_count || item.play_count || 0,
        likes: item.edge_media_preview_like?.count || item.like_count || 0,
        comments: item.edge_media_preview_comment?.count || item.comment_count || 0,
        author: item.owner?.username || item.user?.username || null,
        description: item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || null,
      };

      if (result.views > 0 || result.author) {
        console.log(`Mobile API success (${path}) - views:`, result.views, "author:", result.author);
        return result;
      }
    } catch (error) {
      console.error(`Mobile API error (${path}):`, error);
    }
  }

  return null;
}

// ─── Method 4: HTML page scraping ───────────────────────────────────────
async function fetchViaHTMLScrape(shortcode: string): Promise<ScrapedResult | null> {
  for (const path of INSTAGRAM_PATHS) {
    try {
      console.log(`Trying Instagram HTML scrape via /${path}/...`);

      const response = await fetch(`https://www.instagram.com/${path}/${shortcode}/`, {
        method: "GET",
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`HTML scrape error (${path}):`, response.status);
        await response.text();
        continue;
      }

      const html = await response.text();
      const parsed = parseScrapedPayload(html);

      if (parsed.views > 0 || parsed.author) {
        console.log(`HTML scrape success (${path}) - views:`, parsed.views, "author:", parsed.author);
        return parsed;
      }
    } catch (error) {
      console.error(`HTML scrape error (${path}):`, error);
    }
  }

  return null;
}

// ─── Method 5: Jina AI proxy page scrape (free fallback) ────────────────
async function fetchViaJinaProxy(shortcode: string): Promise<ScrapedResult | null> {
  for (const path of INSTAGRAM_PATHS) {
    try {
      console.log(`Trying Jina proxy scrape via /${path}/...`);

      const response = await fetch(`https://r.jina.ai/http://www.instagram.com/${path}/${shortcode}/`, {
        method: "GET",
        headers: {
          "User-Agent": BROWSER_HEADERS["User-Agent"],
          Accept: "text/plain, text/markdown, */*",
        },
      });

      if (!response.ok) {
        console.error(`Jina proxy error (${path}):`, response.status);
        await response.text();
        continue;
      }

      const text = await response.text();
      const parsed = parseScrapedPayload(text);

      if (parsed.views > 0 || parsed.author) {
        console.log(`Jina proxy success (${path}) - views:`, parsed.views, "author:", parsed.author);
        return parsed;
      }
    } catch (error) {
      console.error(`Jina proxy error (${path}):`, error);
    }
  }

  return null;
}

// ─── Method 6: instagram120 API (primary paid provider) ──
async function fetchViaInstagram120(shortcode: string, apiKey: string): Promise<RapidApiFetchResult> {
  try {
    console.log("Trying instagram120 /api/instagram/links...");

    const reelUrl = `https://www.instagram.com/reel/${shortcode}/`;
    const response = await fetch("https://instagram120.p.rapidapi.com/api/instagram/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "instagram120.p.rapidapi.com",
      },
      body: JSON.stringify({ url: reelUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("instagram120 raw response keys:", Object.keys(data));

      // Navigate nested response structures
      const item = data?.data || data?.result || data?.media || data?.graphql?.shortcode_media || data?.items?.[0] || data;

      if (!item || (typeof item === 'object' && Object.keys(item).length === 0)) {
        console.error("Empty response from instagram120");
        return { result: null, errorCode: "api_error" };
      }

      const result: ScrapedResult = {
        views: item.video_view_count || item.video_play_count || item.play_count || item.view_count || 0,
        likes: item.like_count || item.edge_media_preview_like?.count || 0,
        comments: item.comment_count || item.edge_media_preview_comment?.count || 0,
        author: item.user?.username || item.owner?.username || null,
        description: item.caption?.text || item.edge_media_to_caption?.edges?.[0]?.node?.text || null,
      };

      if (result.views > 0 || result.author) {
        console.log("instagram120 success - views:", result.views, "author:", result.author);
        return { result };
      }

      // Try parsing the raw response with our general parser
      const rawText = JSON.stringify(data);
      const parsed = parseScrapedPayload(rawText);
      if (parsed.views > 0 || parsed.author) {
        console.log("instagram120 parsed success - views:", parsed.views, "author:", parsed.author);
        return { result: parsed };
      }

      return { result: null, errorCode: "api_error" };
    }

    const errorText = await response.text();
    console.error("instagram120 error:", response.status, errorText);

    if (/monthly quota|exceeded.*quota|upgrade your plan/i.test(errorText)) {
      return { result: null, errorCode: "quota_exceeded" };
    }
    if (response.status === 403 && /not subscribed/i.test(errorText)) {
      return { result: null, errorCode: "api_error" };
    }
    return { result: null, errorCode: response.status === 429 ? "rate_limited" : "api_error" };
  } catch (error) {
    console.error("instagram120 error:", error);
    return { result: null, errorCode: "api_error" };
  }
}

// ─── Method 7: RapidAPI instagram-scraper21 (paid fallback with retry/backoff) ─
async function fetchViaRapidApi(shortcode: string, apiKey: string): Promise<RapidApiFetchResult> {
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Trying RapidAPI instagram-scraper21 (attempt ${attempt}/${maxRetries})...`);

      const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post-info?code=${shortcode}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "instagram-scraper21.p.rapidapi.com",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const postData = data?.data?.post;

        if (!postData) {
          console.error("No post data in RapidAPI response");
          return { result: null, errorCode: "api_error" };
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

        console.log("RapidAPI scraper21 success - views:", result.views, "author:", result.author);
        return { result };
      }

      const errorText = await response.text();
      console.error("RapidAPI scraper21 error:", response.status, errorText);

      const quotaExceeded = /monthly quota|exceeded.*quota|credits|upgrade your plan/i.test(errorText);
      if (response.status === 429 && quotaExceeded) {
        return { result: null, errorCode: "quota_exceeded" };
      }

      if ([400, 401, 403, 404].includes(response.status)) {
        return { result: null, errorCode: "api_error" };
      }

      if (attempt < maxRetries) {
        const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 700);
        await sleep(retryAfterMs > 0 ? retryAfterMs : backoffMs);
        continue;
      }

      return { result: null, errorCode: response.status === 429 ? "rate_limited" : "api_error" };
    } catch (error) {
      console.error("RapidAPI scraper21 error:", error);
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 700);
        await sleep(backoffMs);
        continue;
      }
      return { result: null, errorCode: "api_error" };
    }
  }

  return { result: null, errorCode: "rate_limited" };
}

// ─── oEmbed for author info fallback ─────────────────────────────────────
async function fetchOEmbed(url: string): Promise<{ author: string | null; description: string | null } | null> {
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

// ─── Main handler ────────────────────────────────────────────────────────
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

    // Method 1: Try Scrape Creators API (primary)
    let result = await fetchViaScrapeCreators(video_url, reelId);

    // Method 2: If Scrape Creators failed, try embed page
    if (!result || result.views <= 0) {
      result = await fetchViaEmbed(reelId);
    }

    if (!result || result.views <= 0) {
      const graphResult = await fetchViaGraphQL(reelId);
      if (graphResult && (graphResult.views > 0 || graphResult.author)) {
        result = graphResult;
      }
    }

    if (!result || result.views <= 0) {
      const mobileResult = await fetchViaMobileApi(reelId);
      if (mobileResult && (mobileResult.views > 0 || mobileResult.author)) {
        result = mobileResult;
      }
    }

    if (!result || result.views <= 0) {
      const htmlResult = await fetchViaHTMLScrape(reelId);
      if (htmlResult && (htmlResult.views > 0 || htmlResult.author)) {
        result = htmlResult;
      }
    }

    if (!result || result.views <= 0) {
      const jinaResult = await fetchViaJinaProxy(reelId);
      if (jinaResult && (jinaResult.views > 0 || jinaResult.author)) {
        result = jinaResult;
      }
    }

    let rapidApiErrorCode: RapidApiFetchResult["errorCode"];
    const apiKey = Deno.env.get("INSTAGRAM_API_KEY");

    // Method 6: Try instagram120 API (primary paid provider)
    if ((!result || result.views <= 0) && apiKey) {
      const ig120Result = await fetchViaInstagram120(reelId, apiKey);
      rapidApiErrorCode = ig120Result.errorCode;

      if (ig120Result.result && (ig120Result.result.views > 0 || ig120Result.result.author)) {
        result = ig120Result.result;
      }
    }

    // Method 7: Try original RapidAPI scraper21 as final fallback
    if ((!result || result.views <= 0) && apiKey) {
      const rapidApiResult = await fetchViaRapidApi(reelId, apiKey);
      rapidApiErrorCode = rapidApiResult.errorCode;

      if (rapidApiResult.result && (rapidApiResult.result.views > 0 || rapidApiResult.result.author)) {
        result = rapidApiResult.result;
      }
    }

    if (result && result.views > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          shortcode: reelId,
          play_count: result.views,
          like_count: result.likes,
          comment_count: result.comments,
          author: result.author,
          description: result.description,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (result?.author || result?.description) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Stats are temporarily unavailable for this Instagram post, but author metadata was found.",
          error_code: rapidApiErrorCode ?? "stats_unavailable",
          author: result.author,
          description: result.description,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oembedData = await fetchOEmbed(video_url);
    if (oembedData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not fetch video stats. The video may be private or temporarily unavailable.",
          error_code: rapidApiErrorCode ?? "scrape_failed",
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
        error_code: rapidApiErrorCode ?? "scrape_failed",
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
