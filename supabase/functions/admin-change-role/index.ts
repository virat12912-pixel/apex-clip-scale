import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = claims.claims.sub as string;

    // Check caller is admin using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: isAdmin }, { data: isPlatformAdmin }] = await Promise.all([
      serviceClient.rpc("has_role", { _user_id: adminId, _role: "admin" }),
      serviceClient.rpc("has_role", { _user_id: adminId, _role: "platform_admin" }),
    ]);

    if (!isAdmin && !isPlatformAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, new_role } = await req.json();

    if (!user_id || !new_role) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or new_role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validRoles = [
      "creator", "brand", "admin", "client_admin",
      "client_manager", "client_viewer", "clipper", "platform_admin",
    ];

    if (!validRoles.includes(new_role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current role for logging
    const { data: currentRole } = await serviceClient.rpc("get_user_role", {
      _user_id: user_id,
    });

    // Change role
    const { error: rpcError } = await serviceClient.rpc("upgrade_user_role", {
      _user_id: user_id,
      _new_role: new_role,
    });

    if (rpcError) {
      console.error("Failed to change role:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the action
    await serviceClient.from("admin_logs").insert({
      admin_id: adminId,
      action: "change_role",
      target_type: "user",
      target_id: user_id,
      details: { old_role: currentRole, new_role },
    });

    return new Response(
      JSON.stringify({ success: true, old_role: currentRole, new_role }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-change-role:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
