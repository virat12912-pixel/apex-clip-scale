import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hasRole, jsonResponse } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RejectSubmissionRequest {
  submission_id: string;
  rejection_reason?: string;
}

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

    const { submission_id, rejection_reason }: RejectSubmissionRequest = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rejecting submission ${submission_id}`);

    // Get submission with campaign data
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("*, campaign:campaigns(*)")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      console.error("Failed to fetch submission:", subError);
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = await hasRole(supabase, auth.user.id, "admin");
    const isClientReviewer = await hasRole(supabase, auth.user.id, "client_admin") ||
      await hasRole(supabase, auth.user.id, "client_manager");
    if (!isAdmin && !(isClientReviewer && await isAssignedReviewer(supabase, auth.user.id, submission.campaign_id))) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }
    if (submission.status === "rejected" || submission.status === "paid") {
      return jsonResponse({ error: "This submission cannot be rejected in its current status" }, 409, corsHeaders);
    }
    if (submission.status !== "pending" && submission.status !== "approved") {
      return jsonResponse({ error: "This submission cannot be rejected in its current status" }, 409, corsHeaders);
    }
    const reason = typeof rejection_reason === "string" ? rejection_reason.trim().slice(0, 1000) : "";

    const previousStatus = submission.status;
    const previousEarnings = Number(submission.earnings || 0);
    const campaign = submission.campaign;

    console.log(`Previous status: ${previousStatus}, Previous earnings: $${previousEarnings}`);

    // If submission was already approved and had earnings, we need to reverse them
    if ((previousStatus === "approved" || previousStatus === "pending") && previousEarnings > 0) {
      console.log(`Reversing earnings of $${previousEarnings}`);

      // Reduce creator's wallet pending_balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", submission.creator_id)
        .maybeSingle();

      if (!walletFetchError && wallet) {
        const newPendingBalance = Math.max(0, Number(wallet.pending_balance) - previousEarnings);
        const { error: walletUpdateError } = await supabase
          .from("wallets")
          .update({ pending_balance: newPendingBalance })
          .eq("user_id", submission.creator_id);

        if (walletUpdateError) {
          console.error("Failed to update wallet:", walletUpdateError);
        } else {
          console.log(`Updated wallet pending_balance: $${newPendingBalance}`);
        }
      }

      // Reduce campaign spent_budget
      if (campaign) {
        const newSpentBudget = Math.max(0, Number(campaign.spent_budget) - previousEarnings);
        const campaignUpdate: Record<string, unknown> = { spent_budget: newSpentBudget };
        
        // If campaign was completed/paused due to budget, reactivate it
        if (campaign.status === "completed" || campaign.status === "paused") {
          const remainingBudget = Number(campaign.total_budget) - newSpentBudget;
          if (remainingBudget > 0) {
            campaignUpdate.status = "active";
            console.log(`Reactivating campaign ${campaign.id}`);
          }
        }
        
        const { error: campaignUpdateError } = await supabase
          .from("campaigns")
          .update(campaignUpdate)
          .eq("id", campaign.id);

        if (campaignUpdateError) {
          console.error("Failed to update campaign budget:", campaignUpdateError);
        } else {
          console.log(`Updated campaign spent_budget: $${newSpentBudget}`);
        }
      }
    }

    // Update submission to rejected with 0 earnings
    const { data: updatedSubmission, error: updateSubError } = await supabase
      .from("submissions")
      .update({
        status: "rejected",
        earnings: 0,
        rejection_reason: reason || null,
      })
      .eq("id", submission_id)
      .eq("status", previousStatus)
      .select("id")
      .maybeSingle();

    if (updateSubError || !updatedSubmission) {
      console.error("Failed to update submission:", updateSubError);
      if (updateSubError) throw updateSubError;
      return jsonResponse({ error: "Submission has already been reviewed" }, 409, corsHeaders);
    }

    // Send notification to creator about rejection
    try {
      const campaignName = campaign?.name || "a campaign";
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: submission.creator_id,
          type: "submission_rejected",
          title: "Submission Rejected",
          message: reason
            ? `Your clip submission for "${campaignName}" was rejected. Reason: ${reason}`
            : `Your clip submission for "${campaignName}" was rejected.`,
          related_id: submission_id,
        },
      });
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    console.log(`Successfully rejected submission ${submission_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        reversed_earnings: previousEarnings > 0 ? previousEarnings.toFixed(2) : "0.00",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error rejecting submission:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function isAssignedReviewer(supabase: any, userId: string, campaignId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaign_assignments")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  return !error && Boolean(data);
}
