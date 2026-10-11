import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayoutBody {
  user_id?: string;
  amount: number;
  payout_method: string;
  payout_email: string;
  campaign_id?: string;
  discord_username?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, amount, payout_method, payout_email, campaign_id, discord_username }: RequestPayoutBody =
      await req.json();

    if (user_id && user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Invalid user context" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!amount || amount <= 0 || !payout_method || !payout_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    let payoutAmount = Number(amount);

    if (campaign_id) {
      const { data: finalSubmission, error: finalSubmissionError } = await supabase
        .from("final_submissions")
        .select("status, final_earnings")
        .eq("user_id", userId)
        .eq("campaign_id", campaign_id)
        .single();

      if (finalSubmissionError || !finalSubmission) {
        return new Response(
          JSON.stringify({ error: "Final submission approval required before payout" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (finalSubmission.status !== "approved" && finalSubmission.status !== "paid") {
        return new Response(
          JSON.stringify({ error: "Payout is only available after final submission approval" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      payoutAmount = Number(finalSubmission.final_earnings || 0);
    }

    if (payoutAmount < 10) {
      return new Response(JSON.stringify({ error: "Minimum payout is $10" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `Processing payout request for user ${userId}: $${payoutAmount} campaign: ${campaign_id || "global"}`
    );

    let existingQuery = supabase
      .from("payouts")
      .select("id, amount, status")
      .eq("user_id", userId)
      .in("status", ["pending", "approved", "paid"]);

    if (campaign_id) {
      existingQuery = existingQuery.eq("campaign_id", campaign_id);
    } else {
      existingQuery = existingQuery.is("campaign_id", null);
    }

    const { data: existingPayouts, error: checkError } = await existingQuery;

    if (checkError) {
      console.error("Error checking existing payouts:", checkError);
      throw checkError;
    }

    if (existingPayouts && existingPayouts.length > 0) {
      const status = existingPayouts[0].status;
      const message =
        status === "paid"
          ? "You have already been paid for this campaign"
          : `You already have a ${status} payout request for this campaign`;

      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      console.error("Wallet not found:", walletError);
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Number(wallet.pending_balance) < payoutAmount) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newPendingBalance = Number(wallet.pending_balance) - payoutAmount;
    const newLockedEarnings = Number(wallet.locked_earnings || 0) + payoutAmount;

    const { error: lockError } = await supabase
      .from("wallets")
      .update({
        pending_balance: newPendingBalance,
        locked_earnings: newLockedEarnings,
      })
      .eq("user_id", userId);

    if (lockError) {
      console.error("Error locking earnings:", lockError);
      throw lockError;
    }

    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        user_id: userId,
        amount: payoutAmount,
        payout_method,
        payout_email,
        status: "pending",
        campaign_id: campaign_id || null,
        discord_username: typeof discord_username === "string" && discord_username.trim() ? discord_username.trim().slice(0, 64) : null,
      })
      .select()
      .single();

    if (payoutError) {
      await supabase
        .from("wallets")
        .update({
          pending_balance: wallet.pending_balance,
          locked_earnings: wallet.locked_earnings || 0,
        })
        .eq("user_id", userId);

      console.error("Error creating payout:", payoutError);
      throw payoutError;
    }

    let campaignName = "";
    if (campaign_id) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("name")
        .eq("id", campaign_id)
        .single();
      campaignName = campaign?.name || "";
    }

    await supabase.functions.invoke("create-notification", {
      headers: { Authorization: req.headers.get("Authorization") || "" },
      body: {
        user_id: userId,
        type: "payout_requested",
        title: "Payout Requested",
        message: `Your payout request for $${payoutAmount.toFixed(2)}${
          campaignName ? ` from "${campaignName}"` : ""
        } has been submitted and is pending review.`,
        related_id: payout.id,
      },
    });

    return new Response(JSON.stringify({ success: true, payout }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing payout request:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
