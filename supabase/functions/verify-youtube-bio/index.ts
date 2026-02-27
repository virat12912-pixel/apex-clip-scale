import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  username: string;
  verification_code: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

    if (!YOUTUBE_API_KEY) {
      console.error("YOUTUBE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "YouTube API not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { username, verification_code } = (await req.json()) as VerifyRequest;

    if (!username || !verification_code) {
      return new Response(
        JSON.stringify({ success: false, error: "username and verification_code are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Clean username - remove @ and leading/trailing whitespace
    const cleanUsername = username.replace(/^@/, "").trim();

    console.log("Searching YouTube channel for:", cleanUsername);

    // First, search for the channel by username/handle
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanUsername)}&maxResults=5&key=${YOUTUBE_API_KEY}`;
    const searchResponse = await fetch(searchUrl, { method: "GET" });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("YouTube search API error:", searchResponse.status, errorText);

      if (searchResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit reached. Please try again later.", error_code: "rate_limited" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Failed to search YouTube channels", error_code: "api_error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const searchData = await searchResponse.json();
    const channels = searchData.items || [];

    if (channels.length === 0) {
      return new Response(
        JSON.stringify({ success: true, verified: false, message: "YouTube channel not found. Make sure you entered the correct channel name or handle." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get channel details (description) for all found channels
    const channelIds = channels.map((ch: any) => ch.snippet?.channelId || ch.id?.channelId).filter(Boolean).join(",");

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
    const channelResponse = await fetch(channelUrl, { method: "GET" });

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error("YouTube channels API error:", channelResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch channel details", error_code: "api_error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const channelData = await channelResponse.json();
    const channelItems = channelData.items || [];

    // Check each channel's description for the verification code
    for (const channel of channelItems) {
      const description = channel.snippet?.description || "";
      const brandingDescription = channel.brandingSettings?.channel?.description || "";
      const combinedText = `${description} ${brandingDescription}`;

      console.log(`Channel "${channel.snippet?.title}" description:`, description.substring(0, 200));

      if (combinedText.includes(verification_code)) {
        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            channel_title: channel.snippet?.title,
            message: "Verification successful! Code found in channel description.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: false,
        message: "Verification code not found in channel description. Please add it to your YouTube channel's About section and try again.",
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
