import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViewFetchResult {
  submission_id: string;
  success: boolean;
  views?: number;
  likes?: number;
  comments?: number;
  error?: string;
}

interface Campaign {
  id: string;
  status: string;
  min_payout_views: number | null;
  rate_unit: number;
  rate_value: number;
  max_earnings_per_post: number | null;
  total_budget: number;
  spent_budget: number;
}

interface SubmissionWithCampaign {
  id: string;
  clip_url: string;
  platform: string;
  views: number;
  submitted_views: number;
  earnings: number;
  status: string;
  creator_id: string;
  campaign: Campaign | null;
}

// Check if URL is a short link
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    return response.url;
  } catch (err) {
    console.error("Error expanding URL:", err);
    return url;
  }
}

// Extract video ID from TikTok URL
function extractTikTokVideoId(url: string): string | null {
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

    // Fallback: check if URL ends with numeric ID (at least 15 digits for TikTok)
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

// Extract reel ID from Instagram URL
function extractInstagramReelId(url: string): string | null {
  const patterns = [/instagram\.com\/(?:p|reel|reels)\/([\w-]+)/i, /instagr\.am\/(?:p|reel)\/([\w-]+)/i];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

interface TikTokResult {
  views: number;
  likes: number;
  comments: number;
}

// TikWM free API for TikTok video stats (no key needed)
async function fetchViaTikWM(videoUrl: string): Promise<TikTokResult | null> {
  try {
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&count=12&cursor=0&web=1&hd=1`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.code !== 0 || !data?.data) return null;
    const videoData = data.data;
    return {
      views: videoData.play_count || 0,
      likes: videoData.digg_count || 0,
      comments: videoData.comment_count || 0,
    };
  } catch {
    return null;
  }
}

async function fetchTikTokViews(videoUrl: string, apiKey: string): Promise<TikTokResult | null> {
  try {
    let targetUrl = videoUrl;

    if (isShortUrl(targetUrl)) {
      targetUrl = await expandShortUrl(targetUrl);
      console.log(`Expanded TikTok URL: ${videoUrl} -> ${targetUrl}`);
    }

    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    // Method 1: Try TikWM free API
    const tikwmResult = await fetchViaTikWM(targetUrl);
    if (tikwmResult && tikwmResult.views > 0) {
      return tikwmResult;
    }

    // Method 2: Fallback to RapidAPI
    if (apiKey) {
      const videoId = extractTikTokVideoId(targetUrl);
      if (!videoId) return null;

      const apiUrl = `https://tiktok-api-fast-reliable-data-scraper.p.rapidapi.com/video/${videoId}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "tiktok-api-fast-reliable-data-scraper.p.rapidapi.com",
        },
      });

      if (!response.ok) {
        await response.text();
        return null;
      }

      const data = await response.json();
      const awemeDetail = data?.data?.aweme_detail;
      if (!awemeDetail) return null;
      const statistics = awemeDetail.statistics || {};
      return {
        views: statistics.play_count || 0,
        likes: statistics.digg_count || 0,
        comments: statistics.comment_count || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("TikTok fetch error:", error);
    return null;
  }
}

async function fetchInstagramViews(clipUrl: string, apiKey: string): Promise<{ views: number; likes: number; comments: number } | null> {
  try {
    const reelId = extractInstagramReelId(clipUrl);
    if (!reelId) {
      console.error("Could not extract Instagram reel ID from:", clipUrl);
      return null;
    }

    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post-info?code=${reelId}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "instagram-scraper21.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      console.error("Instagram API error:", response.status);
      return null;
    }

    const data = await response.json();
    const postData = data?.data?.post;
    if (!postData) return null;

    return {
      views: postData.video_view_count || 0,
      likes: postData.edge_media_preview_like?.count || 0,
      comments: postData.edge_media_preview_comment?.count || 0,
    };
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return null;
  }
}

async function fetchYouTubeViews(videoUrl: string, apiKey: string): Promise<{ views: number; likes: number; comments: number } | null> {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    let videoId: string | null = null;
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }

    if (!videoId) {
      console.error("Could not extract YouTube video ID from:", videoUrl);
      return null;
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
    const response = await fetch(apiUrl, { method: "GET" });

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.error("No video found in YouTube response");
      return null;
    }

    const stats = data.items[0].statistics || {};
    return {
      views: parseInt(stats.viewCount || "0", 10),
      likes: parseInt(stats.likeCount || "0", 10),
      comments: parseInt(stats.commentCount || "0", 10),
    };
  } catch (error) {
    console.error("YouTube fetch error:", error);
    return null;
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const tiktokApiKey = Deno.env.get("TIKTOK_API_KEY");
    const instagramApiKey = Deno.env.get("INSTAGRAM_API_KEY");
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily view update job...");

    // Get all pending/approved submissions for TikTok or Instagram with campaign data
    const { data: rawSubmissions, error: fetchError } = await supabase
      .from("submissions")
      .select(
        "id, clip_url, platform, views, submitted_views, earnings, status, creator_id, campaign:campaigns(id, status, min_payout_views, rate_unit, rate_value, max_earnings_per_post, total_budget, spent_budget)",
      )
      .in("status", ["pending", "approved"])
      .in("platform", ["tiktok", "instagram", "youtube"]);

    if (fetchError) {
      console.error("Error fetching submissions:", fetchError);
      throw fetchError;
    }

    // Cast to proper type
    const submissions = rawSubmissions as unknown as SubmissionWithCampaign[];

    console.log(`Found ${submissions?.length || 0} submissions to update`);

    const results: ViewFetchResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const sub of submissions || []) {
      let result: { views: number; likes: number; comments: number } | null = null;

      if (sub.platform === "tiktok" && tiktokApiKey) {
        result = await fetchTikTokViews(sub.clip_url, tiktokApiKey);
      } else if (sub.platform === "instagram" && instagramApiKey) {
        result = await fetchInstagramViews(sub.clip_url, instagramApiKey);
      } else if (sub.platform === "youtube" && youtubeApiKey) {
        result = await fetchYouTubeViews(sub.clip_url, youtubeApiKey);
      }

      if (result && result.views > 0) {
        const campaign = sub.campaign;
        const previousViews = sub.views || 0;
        const previousEarnings = sub.earnings || 0;

        let newEarnings = previousEarnings;
        let shouldRecalculate = false;

        // Always recalculate earnings when views increase (no min_payout_views gate)
        // min_payout_views is only enforced at campaign end or payout time
        if (campaign && campaign.status === "active" && (result.views > previousViews || (previousEarnings === 0 && result.views > 0))) {
          shouldRecalculate = true;

          // Calculate new earnings based on new views
          newEarnings = (result.views / campaign.rate_unit) * campaign.rate_value;

          // Apply max_earnings_per_post cap
          if (campaign.max_earnings_per_post && newEarnings > campaign.max_earnings_per_post) {
            newEarnings = Number(campaign.max_earnings_per_post);
          }

          // Check remaining budget
          const remainingBudget = Number(campaign.total_budget) - Number(campaign.spent_budget);
          const earningsDiff = newEarnings - previousEarnings;

          if (earningsDiff > remainingBudget) {
            newEarnings = previousEarnings + remainingBudget;
          }
        }

        // Update submission
        const { error: updateError } = await supabase
          .from("submissions")
          .update({
            views: result.views,
            likes: result.likes,
            comments: result.comments,
            earnings: newEarnings,
            // Preserve current status - don't auto-approve
          })
          .eq("id", sub.id);

        if (updateError) {
          console.error(`Failed to update submission ${sub.id}:`, updateError);
          results.push({ submission_id: sub.id, success: false, error: updateError.message });
          errorCount++;
        } else {
          // Update wallet and campaign budget if earnings changed
          if (shouldRecalculate && newEarnings > previousEarnings && campaign) {
            const earningsDiff = newEarnings - previousEarnings;

            // Update creator's wallet
            const { data: wallet } = await supabase
              .from("wallets")
              .select("pending_balance")
              .eq("user_id", sub.creator_id)
              .maybeSingle();

            if (wallet) {
              await supabase
                .from("wallets")
                .update({ pending_balance: Number(wallet.pending_balance) + earningsDiff })
                .eq("user_id", sub.creator_id);
            }

            // Update campaign spent budget
            const newSpentBudget = Number(campaign.spent_budget) + earningsDiff;
            const newRemainingBudget = Number(campaign.total_budget) - newSpentBudget;

            const campaignUpdate: Record<string, unknown> = { spent_budget: newSpentBudget };
            if (newRemainingBudget <= 0) {
              campaignUpdate.status = "completed";
              console.log(`Campaign ${campaign.id} budget exhausted, marking as completed`);
            }

            await supabase.from("campaigns").update(campaignUpdate).eq("id", campaign.id);
          }

          console.log(
            `Updated submission ${sub.id}: ${previousViews} -> ${result.views} views, earnings: $${newEarnings.toFixed(2)}`,
          );
          results.push({
            submission_id: sub.id,
            success: true,
            views: result.views,
            likes: result.likes,
            comments: result.comments,
          });
          successCount++;
        }
      } else {
        results.push({ submission_id: sub.id, success: false, error: "Could not fetch views" });
        errorCount++;
      }

      // Rate limiting - wait between API calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`View update complete: ${successCount} success, ${errorCount} errors`);

    // === Campaign-end cleanup ===
    // For ended/completed campaigns, reverse earnings on submissions below min_payout_views
    const { data: endedCampaigns } = await supabase
      .from("campaigns")
      .select("id, min_payout_views, rate_unit, rate_value, max_earnings_per_post, total_budget, spent_budget, end_date, status")
      .or("status.eq.completed,end_date.lte." + new Date().toISOString());

    let reversedCount = 0;

    for (const campaign of endedCampaigns || []) {
      const minPayoutViews = campaign.min_payout_views || 1000;

      // Find submissions below threshold with earnings > 0
      const { data: belowThresholdSubs } = await supabase
        .from("submissions")
        .select("id, views, earnings, creator_id")
        .eq("campaign_id", campaign.id)
        .in("status", ["pending", "approved"])
        .gt("earnings", 0);

      for (const sub of belowThresholdSubs || []) {
        if (Number(sub.views) < minPayoutViews && Number(sub.earnings) > 0) {
          const earningsToReverse = Number(sub.earnings);

          // Zero out earnings on submission
          await supabase
            .from("submissions")
            .update({ earnings: 0 })
            .eq("id", sub.id);

          // Reverse from creator's wallet
          const { data: wallet } = await supabase
            .from("wallets")
            .select("pending_balance")
            .eq("user_id", sub.creator_id)
            .maybeSingle();

          if (wallet) {
            const newBalance = Math.max(0, Number(wallet.pending_balance) - earningsToReverse);
            await supabase
              .from("wallets")
              .update({ pending_balance: newBalance })
              .eq("user_id", sub.creator_id);
          }

          // Return to campaign budget
          const newSpent = Math.max(0, Number(campaign.spent_budget) - earningsToReverse);
          await supabase
            .from("campaigns")
            .update({ spent_budget: newSpent })
            .eq("id", campaign.id);

          // Update local reference for subsequent iterations
          campaign.spent_budget = newSpent;

          console.log(`Reversed $${earningsToReverse.toFixed(2)} for submission ${sub.id} (${sub.views} views < ${minPayoutViews} threshold, campaign ended)`);
          reversedCount++;
        }
      }

      // Mark as completed if still active and end_date passed
      if (campaign.status === "active" && campaign.end_date && new Date(campaign.end_date) <= new Date()) {
        await supabase
          .from("campaigns")
          .update({ status: "completed" })
          .eq("id", campaign.id);
        console.log(`Campaign ${campaign.id} end_date passed, marking as completed`);
      }
    }

    if (reversedCount > 0) {
      console.log(`Reversed earnings on ${reversedCount} submissions below threshold on ended campaigns`);
    }

    console.log(`Daily update complete: ${successCount} success, ${errorCount} errors, ${reversedCount} reversals`);

    return new Response(
      JSON.stringify({
        success: true,
        total: submissions?.length || 0,
        updated: successCount,
        errors: errorCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in update-all-views:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
