import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessPayoutBody {
  payout_id: string;
  action: "approve" | "paid" | "reject";
  admin_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { payout_id, action, admin_notes }: ProcessPayoutBody =
      await req.json();

    if (!payout_id || !action) {
      return new Response(
        JSON.stringify({ error: "payout_id and action are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing payout ${payout_id} with action: ${action}`);

    // Get the payout
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", payout_id)
      .single();

    if (payoutError || !payout) {
      console.error("Payout not found:", payoutError);
      return new Response(JSON.stringify({ error: "Payout not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", payout.user_id)
      .single();

    if (walletError || !wallet) {
      console.error("Wallet not found:", walletError);
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newStatus: string;
    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === "approve" || action === "paid") {
      const isPaid = action === "paid";
      newStatus = isPaid ? "paid" : "approved";
      notificationType = isPaid ? "payout_paid" : "payout_approved";
      notificationTitle = isPaid ? "Payout Sent" : "Payout Approved";
      notificationMessage = isPaid
        ? `Your payout of $${payout.amount.toFixed(2)} has been sent to your ${
            payout.payout_method === "usdc_solana"
              ? "Solana wallet"
              : "PayPal account"
          }.`
        : `Your payout request for $${payout.amount.toFixed(
            2
          )} has been approved and will be processed soon.`;

      // Move from locked to paid
      const newLockedEarnings = (wallet.locked_earnings || 0) - payout.amount;
      const newPaidBalance = wallet.paid_balance + payout.amount;

      await supabase
        .from("wallets")
        .update({
          locked_earnings: Math.max(0, newLockedEarnings),
          paid_balance: newPaidBalance,
        })
        .eq("user_id", payout.user_id);

      // Update payout status
      await supabase
        .from("payouts")
        .update({
          status: newStatus,
          processed_at: isPaid ? new Date().toISOString() : null,
          admin_notes,
        })
        .eq("id", payout_id);

      console.log(
        `Payout ${payout_id} marked as ${newStatus}, moved $${payout.amount} from locked to paid`
      );
    } else if (action === "reject") {
      newStatus = "rejected";
      notificationType = "payout_rejected";
      notificationTitle = "Payout Rejected";
      notificationMessage = `Your payout request for $${payout.amount.toFixed(
        2
      )} has been rejected.${admin_notes ? ` Reason: ${admin_notes}` : ""}`;

      // Return locked funds to pending balance
      const newLockedEarnings = (wallet.locked_earnings || 0) - payout.amount;
      const newPendingBalance = wallet.pending_balance + payout.amount;

      await supabase
        .from("wallets")
        .update({
          locked_earnings: Math.max(0, newLockedEarnings),
          pending_balance: newPendingBalance,
        })
        .eq("user_id", payout.user_id);

      // Update payout status
      await supabase
        .from("payouts")
        .update({ status: "rejected", admin_notes })
        .eq("id", payout_id);

      console.log(
        `Payout ${payout_id} rejected, returned $${payout.amount} to pending balance`
      );
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notification
    await supabase.functions.invoke("create-notification", {
      body: {
        user_id: payout.user_id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        related_id: payout_id,
      },
    });

    return new Response(JSON.stringify({ success: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing payout:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
