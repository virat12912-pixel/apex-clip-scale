import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateNotificationRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, type, title, message, related_id }: CreateNotificationRequest = await req.json();

    if (!user_id || !type || !title || !message) {
      console.error("Missing required fields:", { user_id, type, title, message });
      return new Response(
        JSON.stringify({ error: "user_id, type, title, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating notification for user ${user_id}: ${type} - ${title}`);

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message,
        related_id: related_id || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create notification:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Notification created: ${data.id}`);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating notification:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
