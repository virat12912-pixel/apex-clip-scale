import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, updates, action } = body;

    if (!user_id || !updates) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or updates" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Admin update user", { user_id, updates, action });

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update profile via service role:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Update failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optionally log admin action if an Authorization header with admin id is provided
    try {
      const authHeader = req.headers.get("authorization");
      let admin_id = null;
      if (authHeader) {
        // If using service-to-service, admin id may not be available; skip if missing
        admin_id = null;
      }

      await supabase.from("admin_logs").insert({
        admin_id: admin_id,
        action: action || "admin_update_user",
        target_type: "user",
        target_id: user_id,
        details: updates,
      });
    } catch (logErr) {
      console.warn("Failed to write admin log from function:", logErr);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-update-user function:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
