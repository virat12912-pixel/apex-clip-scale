import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViewFetchResult {
  submission_id: string;
  success: boolean;
  views?: number;
  error?: string;
}

// Extract video ID from TikTok URL
function extractTikTokVideoId(url: string): string | null {
  try {
    let cleanUrl = (url || "").trim();
    if (!cleanUrl) return null;
    
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    
    const parts = cleanUrl.split("/");
    const lastPart = parts[parts.length - 1];
    const videoId = lastPart.split("?")[0];
    
    return videoId || null;
  } catch {
    return null;
  }
}

// Extract reel ID from Instagram URL
function extractInstagramReelId(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels)\/([\w-]+)/i,
    /instagr\.am\/(?:p|reel)\/([\w-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function fetchTikTokViews(videoUrl: string, apiKey: string): Promise<number | null> {
  try {
    const videoId = extractTikTokVideoId(videoUrl);
    if (!videoId) {
      console.error('Could not extract TikTok video ID from:', videoUrl);
      return null;
    }

    const apiUrl = `https://tiktok-api-fast-reliable-data-scraper.p.rapidapi.com/video/${videoId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'tiktok-api-fast-reliable-data-scraper.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('TikTok API error:', response.status);
      return null;
    }

    const data = await response.json();
    const awemeDetail = data?.data?.aweme_detail;
    
    if (!awemeDetail) {
      console.error('No aweme_detail in TikTok response');
      return null;
    }

    return awemeDetail.statistics?.play_count || null;
  } catch (error) {
    console.error('TikTok fetch error:', error);
    return null;
  }
}

async function fetchInstagramViews(videoUrl: string, apiKey: string): Promise<number | null> {
  try {
    const reelId = extractInstagramReelId(videoUrl);
    
    if (!reelId) {
      console.error('Could not extract Instagram reel ID from:', videoUrl);
      return null;
    }

    const apiUrl = `https://instagram-scraper21.p.rapidapi.com/api/v1/post-info?code=${reelId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram-scraper21.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      console.error('Instagram API error:', response.status);
      return null;
    }

    const data = await response.json();
    const postData = data?.data?.post;
    
    if (!postData) {
      console.error('No post data in Instagram response');
      return null;
    }

    return postData.video_play_count || null;
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tiktokApiKey = Deno.env.get('TIKTOK_API_KEY');
    const instagramApiKey = Deno.env.get('INSTAGRAM_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily view update job...');

    // Get all pending/approved submissions for TikTok or Instagram
    const { data: submissions, error: fetchError } = await supabase
      .from('submissions')
      .select('id, clip_url, platform, views, submitted_views')
      .in('status', ['pending', 'approved'])
      .in('platform', ['tiktok', 'instagram']);

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${submissions?.length || 0} submissions to update`);

    const results: ViewFetchResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const sub of submissions || []) {
      let newViews: number | null = null;

      if (sub.platform === 'tiktok' && tiktokApiKey) {
        newViews = await fetchTikTokViews(sub.clip_url, tiktokApiKey);
      } else if (sub.platform === 'instagram' && instagramApiKey) {
        newViews = await fetchInstagramViews(sub.clip_url, instagramApiKey);
      }

      if (newViews !== null && newViews > 0) {
        // Update the views in the database
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ views: newViews })
          .eq('id', sub.id);

        if (updateError) {
          console.error(`Failed to update submission ${sub.id}:`, updateError);
          results.push({ submission_id: sub.id, success: false, error: updateError.message });
          errorCount++;
        } else {
          console.log(`Updated submission ${sub.id}: ${sub.views} -> ${newViews} views`);
          results.push({ submission_id: sub.id, success: true, views: newViews });
          successCount++;
        }
      } else {
        results.push({ submission_id: sub.id, success: false, error: 'Could not fetch views' });
        errorCount++;
      }

      // Rate limiting - wait between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Daily update complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total: submissions?.length || 0,
        updated: successCount,
        errors: errorCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in update-all-views:', error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
