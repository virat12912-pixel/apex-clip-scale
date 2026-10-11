import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hasRole, jsonResponse } from "../_shared/security.ts";

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
    const auth = await authenticateRequest(req);
    const authorization = req.headers.get("Authorization");
    const trustedServiceCall = authorization === `Bearer ${supabaseServiceKey}`;
    if (!auth && !trustedServiceCall) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);

    const body = await req.json() as CreateNotificationRequest;
    const { user_id, type, title, message, related_id } = body;

    if (typeof user_id !== "string" || typeof type !== "string" || typeof title !== "string" || typeof message !== "string" ||
        title.length < 1 || title.length > 160 || message.length < 1 || message.length > 2000 ||
        (related_id != null && (typeof related_id !== "string" || !/^[0-9a-f-]{36}$/i.test(related_id)))) {
      return jsonResponse({ error: "Invalid notification" }, 400, corsHeaders);
    }

    if (!trustedServiceCall) {
      if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
      const isAdmin = await hasRole(supabase, auth.user.id, "admin") || await hasRole(supabase, auth.user.id, "platform_admin");
      if (user_id === auth.user.id && type === "payout_requested" && related_id) {
        const { data: payout } = await supabase.from("payouts").select("id, status").eq("id", related_id).eq("user_id", auth.user.id).maybeSingle();
        if (!payout || payout.status !== "pending") return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
      } else if (["submission_approved", "submission_rejected"].includes(type) && related_id) {
        const { data: submission } = await supabase.from("submissions").select("creator_id, campaign_id, status").eq("id", related_id).maybeSingle();
        if (!submission || submission.creator_id !== user_id ||
            (type === "submission_approved" && submission.status !== "approved") ||
            (type === "submission_rejected" && submission.status !== "rejected")) return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
        const isClientReviewer = await hasRole(supabase, auth.user.id, "client_admin") || await hasRole(supabase, auth.user.id, "client_manager");
        const { data: assignment } = await supabase.from("campaign_assignments").select("id").eq("campaign_id", submission.campaign_id).eq("user_id", auth.user.id).maybeSingle();
        if (!isAdmin && !(isClientReviewer && assignment)) return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
      } else if (["final_submission_approved", "final_submission_rejected"].includes(type) && related_id && isAdmin) {
        const { data: finalSubmission } = await supabase.from("final_submissions").select("user_id, status").eq("id", related_id).maybeSingle();
        if (!finalSubmission || finalSubmission.user_id !== user_id ||
            (type === "final_submission_approved" && finalSubmission.status !== "approved") ||
            (type === "final_submission_rejected" && finalSubmission.status !== "rejected")) return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
      } else {
        return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
      }
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
      return jsonResponse({ error: "Unable to create notification" }, 500, corsHeaders);
    }

    console.log(`Notification created: ${data.id}`);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating notification:", error);
    return jsonResponse({ error: "Unable to create notification" }, 500, corsHeaders);
  }
});
