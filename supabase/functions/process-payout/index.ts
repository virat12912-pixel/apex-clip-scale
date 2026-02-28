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

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { payout_id, action, admin_notes }: ProcessPayoutBody = await req.json();

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

    const payoutAmount = Number(payout.amount || 0);
    const lockedBefore = Number(wallet.locked_earnings || 0);
    const pendingBefore = Number(wallet.pending_balance || 0);
    const paidBefore = Number(wallet.paid_balance || 0);

    let newStatus: string;
    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === "approve") {
      if (payout.status !== "pending") {
        return new Response(
          JSON.stringify({
            error: `Only pending payouts can be approved (current: ${payout.status})`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      newStatus = "approved";
      notificationType = "payout_approved";
      notificationTitle = "Payout Approved";
      notificationMessage = `Your payout request for $${payoutAmount.toFixed(
        2
      )} has been approved and will be processed soon.`;

      const { error: updatePayoutError } = await supabase
        .from("payouts")
        .update({
          status: "approved",
          processed_at: null,
          admin_notes,
        })
        .eq("id", payout_id);

      if (updatePayoutError) throw updatePayoutError;
    } else if (action === "paid") {
      if (payout.status === "paid") {
        return new Response(
          JSON.stringify({ success: true, status: "paid", already_processed: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (payout.status !== "approved") {
        return new Response(
          JSON.stringify({
            error: `Only approved payouts can be marked paid (current: ${payout.status})`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const amountToMove = Math.min(lockedBefore, payoutAmount);
      const walletUpdate = {
        locked_earnings: Math.max(0, lockedBefore - amountToMove),
        paid_balance: paidBefore + amountToMove,
      };

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update(walletUpdate)
        .eq("user_id", payout.user_id);

      if (walletUpdateError) throw walletUpdateError;

      const { error: updatePayoutError } = await supabase
        .from("payouts")
        .update({
          status: "paid",
          processed_at: new Date().toISOString(),
          admin_notes,
        })
        .eq("id", payout_id);

      if (updatePayoutError) {
        await supabase
          .from("wallets")
          .update({
            locked_earnings: lockedBefore,
            paid_balance: paidBefore,
          })
          .eq("user_id", payout.user_id);
        throw updatePayoutError;
      }

      if (amountToMove < payoutAmount) {
        console.warn(
          `Payout ${payout_id}: locked balance (${lockedBefore}) was below payout amount (${payoutAmount}). Moved ${amountToMove}.`
        );
      }

      newStatus = "paid";
      notificationType = "payout_paid";
      notificationTitle = "Payout Sent";
      notificationMessage = `Your payout of $${payoutAmount.toFixed(2)} has been sent to your ${
        payout.payout_method === "usdc_solana" ? "Solana wallet" : "PayPal account"
      }.`;
    } else if (action === "reject") {
      if (payout.status === "rejected") {
        return new Response(
          JSON.stringify({ success: true, status: "rejected", already_processed: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (payout.status === "paid") {
        return new Response(
          JSON.stringify({ error: "Paid payouts cannot be rejected" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const amountToReturn = Math.min(lockedBefore, payoutAmount);
      const walletUpdate = {
        locked_earnings: Math.max(0, lockedBefore - amountToReturn),
        pending_balance: pendingBefore + amountToReturn,
      };

      const { error: walletUpdateError } = await supabase
        .from("wallets")
        .update(walletUpdate)
        .eq("user_id", payout.user_id);

      if (walletUpdateError) throw walletUpdateError;

      const { error: updatePayoutError } = await supabase
        .from("payouts")
        .update({ status: "rejected", processed_at: null, admin_notes })
        .eq("id", payout_id);

      if (updatePayoutError) {
        await supabase
          .from("wallets")
          .update({
            locked_earnings: lockedBefore,
            pending_balance: pendingBefore,
          })
          .eq("user_id", payout.user_id);
        throw updatePayoutError;
      }

      if (amountToReturn < payoutAmount) {
        console.warn(
          `Payout ${payout_id}: locked balance (${lockedBefore}) was below payout amount (${payoutAmount}). Returned ${amountToReturn}.`
        );
      }

      newStatus = "rejected";
      notificationType = "payout_rejected";
      notificationTitle = "Payout Rejected";
      notificationMessage = `Your payout request for $${payoutAmount.toFixed(2)} has been rejected.${
        admin_notes ? ` Reason: ${admin_notes}` : ""
      }`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing payout:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
