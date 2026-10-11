import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, jsonResponse, verifyMetricsAssertion } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessSubmissionRequest {
  submission_id: string;
  metrics_assertion?: string;
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

    const body = await req.json() as ProcessSubmissionRequest;
    const { submission_id, metrics_assertion } = body;

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetStatus = "pending";
    console.log(`Processing new pending submission ${submission_id}`);

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

    if (submission.creator_id !== auth.user.id) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }
    if (submission.status !== "pending" || Number(submission.views) !== 0 || Number(submission.earnings) !== 0 || Number(submission.submitted_views ?? 0) !== 0) {
      return jsonResponse({ error: "Only newly created pending submissions can be processed" }, 409, corsHeaders);
    }
    const metrics = await verifyMetricsAssertion(metrics_assertion, {
      userId: auth.user.id,
      videoUrl: submission.clip_url.trim(),
    });
    if (!metrics) return jsonResponse({ error: "Metrics could not be verified. Please fetch the clip details again." }, 403, corsHeaders);
    const { views, likes, comments } = metrics;

    const campaign = submission.campaign;
    if (!campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if campaign is active (allow processing for active campaigns)
    if (campaign.status !== "active") {
      console.log(`Campaign ${campaign.id} is not active (status: ${campaign.status})`);
      return jsonResponse({ success: false, error: "Campaign is not accepting submissions" }, 409, corsHeaders);
    }

    // Check remaining budget
    const remainingBudget = Number(campaign.total_budget) - Number(campaign.spent_budget);
    if (remainingBudget <= 0) {
      console.log(`Campaign ${campaign.id} has no remaining budget`);
      
      // Auto-pause the campaign
      await supabase
        .from("campaigns")
        .update({ status: "paused" })
        .eq("id", campaign.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Campaign budget exhausted, campaign paused",
          earnings: 0,
          campaign_paused: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: We always calculate earnings regardless of min_payout_views.
    // min_payout_views is only enforced at payout time (final submission review).
    // If the campaign ends and views are still below threshold, earnings get reversed.

    // Calculate earnings: (views / rate_unit) * rate_value
    let earnings = (views / campaign.rate_unit) * campaign.rate_value;
    
    // Apply max_earnings_per_post cap if set
    if (campaign.max_earnings_per_post && earnings > campaign.max_earnings_per_post) {
      earnings = Number(campaign.max_earnings_per_post);
      console.log(`Capped earnings at max_earnings_per_post: ${earnings}`);
    }

    // Cap earnings to remaining budget
    if (earnings > remainingBudget) {
      earnings = remainingBudget;
      console.log(`Capped earnings to remaining budget: ${earnings}`);
    }

    console.log(`Calculated earnings: $${earnings.toFixed(2)}`);

    // Update submission with views, likes, comments, and earnings
    const { data: updatedSubmission, error: updateSubError } = await supabase
      .from("submissions")
      .update({
        views: views,
        likes: likes,
        comments: comments,
        submitted_views: views,
        earnings: earnings,
        status: targetStatus,
      })
      .eq("id", submission_id)
      .eq("creator_id", auth.user.id)
      .eq("status", "pending")
      .eq("views", 0)
      .select("id")
      .maybeSingle();

    if (updateSubError || !updatedSubmission) {
      console.error("Failed to update submission:", updateSubError);
      if (updateSubError) throw updateSubError;
      return jsonResponse({ error: "Submission has already been processed" }, 409, corsHeaders);
    }

    // Update creator's wallet pending_balance
    const { data: wallet, error: walletFetchError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", submission.creator_id)
      .maybeSingle();

    if (walletFetchError) {
      console.error("Failed to fetch wallet:", walletFetchError);
    } else if (!wallet) {
      // Create wallet if it doesn't exist
      const { error: createWalletError } = await supabase
        .from("wallets")
        .insert({ user_id: submission.creator_id, pending_balance: earnings });
      
      if (createWalletError) {
        console.error("Failed to create wallet:", createWalletError);
      }
    } else {
      // Update existing wallet
      const newPendingBalance = Number(wallet.pending_balance) + earnings;
      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update({ pending_balance: newPendingBalance })
        .eq("user_id", submission.creator_id);

      if (walletUpdateError) {
        console.error("Failed to update wallet:", walletUpdateError);
      }
    }

    // Update campaign spent_budget
    const newSpentBudget = Number(campaign.spent_budget) + earnings;
    const newRemainingBudget = Number(campaign.total_budget) - newSpentBudget;
    
    const campaignUpdate: Record<string, unknown> = { spent_budget: newSpentBudget };
    
    // Auto-complete campaign if budget is exhausted
    if (newRemainingBudget <= 0) {
      campaignUpdate.status = "completed";
      console.log(`Campaign ${campaign.id} budget exhausted, marking as completed`);
    }
    
    const { error: campaignUpdateError } = await supabase
      .from("campaigns")
      .update(campaignUpdate)
      .eq("id", campaign.id);

    if (campaignUpdateError) {
      console.error("Failed to update campaign budget:", campaignUpdateError);
    }

    // Send notification to creator about earnings
    try {
      const notifTitle = targetStatus === "pending" ? "Clip Submitted!" : "Clip Approved!";
      const notifMessage = targetStatus === "pending"
        ? `Your clip is pending review. Estimated earnings: $${earnings.toFixed(2)} from ${views.toLocaleString()} views on "${campaign.name}".`
        : `Your clip earned $${earnings.toFixed(2)} from ${views.toLocaleString()} views on "${campaign.name}".`;
      
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: submission.creator_id,
          type: targetStatus === "pending" ? "submission_pending" : "earnings_updated",
          title: notifTitle,
          message: notifMessage,
          related_id: submission_id,
        },
      });
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    console.log(`Successfully processed submission ${submission_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        views,
        likes,
        comments,
        earnings: earnings.toFixed(2),
        campaign_paused: newRemainingBudget <= 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing submission:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
