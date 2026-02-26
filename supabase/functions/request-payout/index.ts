import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayoutBody {
  user_id: string;
  amount: number;
  payout_method: string;
  payout_email: string;
  campaign_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, amount, payout_method, payout_email, campaign_id }: RequestPayoutBody = await req.json();

    if (!user_id || !amount || !payout_method || !payout_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing payout request for user ${user_id}: $${amount} campaign: ${campaign_id || "global"}`);

    // Check for existing pending or approved payout for same campaign (prevent duplicates)
    let existingQuery = supabase
      .from("payouts")
      .select("id, amount, status")
      .eq("user_id", user_id)
      .in("status", ["pending", "approved"]);

    if (campaign_id) {
      existingQuery = existingQuery.eq("campaign_id", campaign_id);
    }

    const { data: existingPayouts, error: checkError } = await existingQuery;

    if (checkError) {
      console.error("Error checking existing payouts:", checkError);
      throw checkError;
    }

    if (existingPayouts && existingPayouts.length > 0) {
      const status = existingPayouts[0].status;
      return new Response(
        JSON.stringify({ error: `You already have a ${status} payout request for this campaign` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (walletError || !wallet) {
      console.error("Wallet not found:", walletError);
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has enough balance
    if (wallet.pending_balance < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Minimum payout check
    if (amount < 10) {
      return new Response(
        JSON.stringify({ error: "Minimum payout is $10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lock the earnings by moving from pending to locked
    const newPendingBalance = wallet.pending_balance - amount;
    const newLockedEarnings = (wallet.locked_earnings || 0) + amount;

    const { error: lockError } = await supabase
      .from("wallets")
      .update({
        pending_balance: newPendingBalance,
        locked_earnings: newLockedEarnings,
      })
      .eq("user_id", user_id);

    if (lockError) {
      console.error("Error locking earnings:", lockError);
      throw lockError;
    }

    console.log(`Locked $${amount} for user ${user_id}`);

    // Create the payout request with campaign_id
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        user_id,
        amount,
        payout_method,
        payout_email,
        status: "pending",
        campaign_id: campaign_id || null,
      })
      .select()
      .single();

    if (payoutError) {
      // Rollback the lock if payout creation fails
      await supabase
        .from("wallets")
        .update({
          pending_balance: wallet.pending_balance,
          locked_earnings: wallet.locked_earnings || 0,
        })
        .eq("user_id", user_id);

      console.error("Error creating payout:", payoutError);
      throw payoutError;
    }

    console.log(`Payout request created: ${payout.id}`);

    // Get campaign name for notification
    let campaignName = "";
    if (campaign_id) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaign_id)
        .single();
      campaignName = campaign?.name || "";
    }

    // Create notification
    await supabase.functions.invoke("create-notification", {
      body: {
        user_id,
        type: "payout_requested",
        title: "Payout Requested",
        message: `Your payout request for $${amount.toFixed(2)}${campaignName ? ` from "${campaignName}"` : ""} has been submitted and is pending review.`,
        related_id: payout.id,
      },
    });

    return new Response(
      JSON.stringify({ success: true, payout }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing payout request:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
