import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hasRole, jsonResponse } from "../_shared/security.ts";

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
    const auth = await authenticateRequest(req);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id, updates, action } = body;

    if (!await hasRole(supabase, auth.user.id, "admin") && !await hasRole(supabase, auth.user.id, "platform_admin")) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }

    if (!user_id || !updates) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or updates" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return jsonResponse({ error: "Invalid updates" }, 400, corsHeaders);
    }
    if (typeof user_id !== "string" || !/^[0-9a-f-]{36}$/i.test(user_id) ||
        (action !== undefined && !["delete_user", "update_user", "ban_user", "unban_user"].includes(action))) {
      return jsonResponse({ error: "Invalid request" }, 400, corsHeaders);
    }

    if (action === "delete_user") {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
      if (deleteError) return jsonResponse({ error: "Could not delete user" }, 400, corsHeaders);
      await supabase.from("admin_logs").insert({
        admin_id: auth.user.id,
        action: "delete_user",
        target_type: "user",
        target_id: user_id,
        details: {},
      });
      return jsonResponse({ success: true });
    }

    const allowedFields = ["is_banned", "payment_verified"];
    const safeUpdates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        if (typeof updates[field] !== "boolean") return jsonResponse({ error: "Invalid profile update" }, 400, corsHeaders);
        safeUpdates[field] = updates[field];
      }
    }
    if (Object.keys(safeUpdates).length === 0) return jsonResponse({ error: "No permitted profile changes" }, 400, corsHeaders);

    const { data, error } = await supabase
      .from("profiles")
      .update(safeUpdates)
      .eq("id", user_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Failed to update profile via service role:", error);
      return new Response(
        JSON.stringify({ error: "Update failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data) {
      console.warn("Update affected 0 rows (possible RLS or missing id)", {
        user_id,
        updates,
      });
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optionally log admin action if an Authorization header with admin id is provided
    try {
      const authHeader = req.headers.get("authorization");
      await supabase.from("admin_logs").insert({
        admin_id: auth.user.id,
        action: action || "admin_update_user",
        target_type: "user",
        target_id: user_id,
        details: safeUpdates,
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
