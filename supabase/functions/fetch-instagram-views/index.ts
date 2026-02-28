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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Mode": "navigate",
};

// ─── Method 1: Instagram GraphQL API (free, no key) ────────────────────
async function fetchViaGraphQL(shortcode: string): Promise<ScrapedResult | null> {
  try {
    console.log("Trying Instagram GraphQL API...");

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
      },
      body: `av=0&__d=www&__user=0&__a=1&__req=1&__hs=0&dpr=1&__ccg=UNKNOWN&__rev=0&__s=0&__hsi=0&__comet_req=0&lsd=0&jazoest=0&__spin_r=0&__spin_b=trunk&__spin_t=0&__jssesw=0&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostActionLoadPostQueryQuery&variables=${encodeURIComponent(variables)}&server_timestamps=true&doc_id=10015901848480474`,
    });

    if (!response.ok) {
      console.error("GraphQL API error:", response.status);
      await response.text();
      return null;
    }

    const data = await response.json();
    const media = data?.data?.xdt_shortcode_media;

    if (!media) {
      console.error("No media data in GraphQL response");
      return null;
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
    console.error("GraphQL error:", error);
    return null;
  }
}

// ─── Method 2: HTML page scraping (extract JSON from page source) ──────
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

    // Try to extract data from embedded JSON in the page
    // Pattern 1: window.__additionalDataLoaded or window._sharedData
    let mediaData: any = null;

    // Try SharedData pattern
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});\s*<\/script>/s);
    if (sharedDataMatch) {
      try {
        const sharedData = JSON.parse(sharedDataMatch[1]);
        mediaData =
          sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
      } catch {
        // parse failed, continue
      }
    }

    // Try additionalDataLoaded pattern
    if (!mediaData) {
      const additionalMatch = html.match(
        /window\.__additionalDataLoaded\s*\(\s*['"][^'"]*['"]\s*,\s*(\{.+?\})\s*\)\s*;/s,
      );
      if (additionalMatch) {
        try {
          const additionalData = JSON.parse(additionalMatch[1]);
          mediaData =
            additionalData?.graphql?.shortcode_media ||
            additionalData?.items?.[0];
        } catch {
          // parse failed
        }
      }
    }

    // Try require("PolarisQueryPreloaderCache") pattern (newer pages)
    if (!mediaData) {
      const preloaderMatch = html.match(/"xdt_shortcode_media"\s*:\s*(\{.+?"owner"\s*:\s*\{[^}]+\})/s);
      if (preloaderMatch) {
        try {
          // This is partial JSON, try to extract key fields
          const snippet = preloaderMatch[0];
          const viewMatch = snippet.match(/"video_view_count"\s*:\s*(\d+)/);
          const likeMatch = snippet.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
          const commentMatch = snippet.match(/"edge_media_preview_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
          const authorMatch = snippet.match(/"username"\s*:\s*"([^"]+)"/);

          if (viewMatch || authorMatch) {
            const result: ScrapedResult = {
              views: viewMatch ? parseInt(viewMatch[1]) : 0,
              likes: likeMatch ? parseInt(likeMatch[1]) : 0,
              comments: commentMatch ? parseInt(commentMatch[1]) : 0,
              author: authorMatch ? authorMatch[1] : null,
              description: null,
            };
            console.log("HTML regex scrape success - views:", result.views);
            return result;
          }
        } catch {
          // parse failed
        }
      }
    }

    if (!mediaData) {
      console.log("Could not extract media data from HTML");
      return null;
    }

    const captionEdges = mediaData.edge_media_to_caption?.edges || [];
    const caption = captionEdges[0]?.node?.text || mediaData.caption?.text || null;

    const result: ScrapedResult = {
      views: mediaData.video_view_count || mediaData.video_play_count || 0,
      likes: mediaData.edge_media_preview_like?.count || mediaData.like_count || 0,
      comments: mediaData.edge_media_preview_comment?.count || mediaData.comment_count || 0,
      author: mediaData.owner?.username || mediaData.user?.username || null,
      description: caption,
    };

    console.log("HTML scrape success - views:", result.views, "author:", result.author);
    return result;
  } catch (error) {
    console.error("HTML scrape error:", error);
    return null;
  }
}

// ─── Method 3: RapidAPI (paid, existing) ───────────────────────────────
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

// ─── Method 4: oEmbed for author info fallback ─────────────────────────
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

    // Method 1: Try free GraphQL API
    let result = await fetchViaGraphQL(reelId);

    // Method 2: If GraphQL failed, try HTML page scraping
    if (!result || result.views <= 0) {
      result = await fetchViaHTMLScrape(reelId);
    }

    // Method 3: If free methods failed, try RapidAPI
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
