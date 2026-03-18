import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculateEarningsRequest {
  submission_id: string;
  verified_views: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { submission_id, verified_views }: CalculateEarningsRequest = await req.json();

    if (!submission_id || verified_views === undefined) {
      return new Response(
        JSON.stringify({ error: "submission_id and verified_views are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Calculating earnings for submission ${submission_id} with ${verified_views} views`);

    // Get the submission and related campaign
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

    // Calculate earnings: (views / rate_unit) * rate_value
    let earnings = (verified_views / campaign.rate_unit) * campaign.rate_value;
    
    // Apply max_earnings_per_post cap if set
    if (campaign.max_earnings_per_post && earnings > campaign.max_earnings_per_post) {
      earnings = campaign.max_earnings_per_post;
      console.log(`Capped earnings at ${campaign.max_earnings_per_post}`);
    }

    console.log(`Calculated earnings: $${earnings.toFixed(2)}`);

    // Update submission with views and earnings
    const { error: updateSubError } = await supabase
      .from("submissions")
      .update({
        views: verified_views,
        earnings: earnings,
        status: "approved",
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
      .single();

    if (walletFetchError) {
      console.error("Failed to fetch wallet:", walletFetchError);
      // Create wallet if it doesn't exist
      const { error: createWalletError } = await supabase
        .from("wallets")
        .insert({ user_id: submission.creator_id, pending_balance: earnings });
      
      if (createWalletError) {
        console.error("Failed to create wallet:", createWalletError);
        throw createWalletError;
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
        throw walletUpdateError;
      }
    }

    // Update campaign spent_budget
    const newSpentBudget = Number(campaign.spent_budget) + earnings;
    const { error: campaignUpdateError } = await supabase
      .from("campaigns")
      .update({ spent_budget: newSpentBudget })
      .eq("id", campaign.id);

    if (campaignUpdateError) {
      console.error("Failed to update campaign budget:", campaignUpdateError);
      // Non-fatal, continue
    }

    // Send approval notification to creator
    try {
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: submission.creator_id,
          type: "submission_approved",
          title: "Clip Approved! 🎉",
          message: `Your clip for "${campaign.name}" has been approved. Earnings: $${earnings.toFixed(2)}`,
          related_id: submission_id,
        },
      });
    } catch (notifError) {
      console.error("Failed to send approval notification:", notifError);
    }

    console.log(`Successfully processed submission ${submission_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        verified_views,
        earnings: earnings.toFixed(2),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error calculating earnings:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
