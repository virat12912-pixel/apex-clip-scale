import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, getOwnedSocialAccount, jsonResponse } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fetch YouTube channel description using Scrape Creators API
async function fetchYouTubeDescription(username: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get('SCRAPE_CREATORS_API_KEY');
    if (!apiKey) return null;
    const cleanUsername = username.replace(/^@/, '').trim();
    
    // Handle different YouTube URL formats
    let channelId = cleanUsername;
    
    // If it's a full URL, extract the channel ID or handle
    if (cleanUsername.includes('youtube.com') || cleanUsername.includes('youtu.be')) {
      const urlMatch = cleanUsername.match(/(?:youtube\.com\/(?:c\/|channel\/|user\/|@))([^\/\s]+)/);
      if (urlMatch) {
        channelId = urlMatch[1];
      }
    }
    
    const apiUrl = `https://api.scrapecreators.com/v1/youtube/channel?channel=${encodeURIComponent(channelId)}`;
    
    console.log('Fetching YouTube channel via Scrape Creators API:', channelId);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error('Scrape Creators API error:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    const description = data?.description || null;
    
    if (description !== null && description !== undefined) {
      console.log('Found description via Scrape Creators API');
      return description;
    }

    return null;
  } catch (error) {
    console.error('Scrape Creators API error:', error);
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
    const { account_id } = await req.json();
    const account = await getOwnedSocialAccount(auth.serviceClient, auth.user.id, account_id, "youtube");
    if (!account) return jsonResponse({ success: false, error: "YouTube account was not found or is already verified" }, 400, corsHeaders);
    const cleanUsername = account.username.replace(/^@/, "").trim();

    console.log("Verifying YouTube channel for:", cleanUsername);

    const description = await fetchYouTubeDescription(cleanUsername);

    if (description === null) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not fetch YouTube channel. Please make sure the channel name or handle is correct and try again.",
          error_code: "fetch_failed"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if verification code is in description
    const isVerified = description.includes(account.verification_code);

    return new Response(
      JSON.stringify({
        success: true,
        verified: isVerified,
        bio: undefined,
        message: isVerified
          ? "Verification successful! Code found in channel description."
          : "Verification code not found in channel description. Please add it to your YouTube channel's About section and try again.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in verify-youtube-bio:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
