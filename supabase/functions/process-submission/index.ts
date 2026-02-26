import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessSubmissionRequest {
  submission_id: string;
  views: number;
  likes: number;
  comments: number;
  set_status?: string; // optional: defaults to "approved", can be "pending" to keep status unchanged
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submission_id, views, likes, comments, set_status }: ProcessSubmissionRequest = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: "submission_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetStatus = set_status || "approved";
    console.log(`Processing submission ${submission_id} with views: ${views}, likes: ${likes}, comments: ${comments}, status: ${targetStatus}`);

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
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Campaign is not active, no earnings calculated",
          earnings: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Check if views meet minimum threshold
    const minPayoutViews = campaign.min_payout_views || 1000;
    if (views < minPayoutViews) {
      console.log(`Views ${views} below minimum payout threshold ${minPayoutViews}`);
      
      // Update submission with views but no earnings yet
      await supabase
        .from("submissions")
        .update({ 
          views: views,
          likes: likes,
          comments: comments,
          submitted_views: views,
          status: targetStatus,
        })
        .eq("id", submission_id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Views (${views}) below minimum payout threshold (${minPayoutViews})`,
          earnings: 0,
          views_updated: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const { error: updateSubError } = await supabase
      .from("submissions")
      .update({
        views: views,
        likes: likes,
        comments: comments,
        submitted_views: views,
        earnings: earnings,
        status: targetStatus,
      })
      .eq("id", submission_id);

    if (updateSubError) {
      console.error("Failed to update submission:", updateSubError);
      throw updateSubError;
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
