import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const caller = userData?.user;
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submission_id } = await req.json();
    if (!submission_id || typeof submission_id !== "string") {
      return new Response(JSON.stringify({ error: "submission_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("*, campaign:campaigns(*)")
      .eq("id", submission_id)
      .maybeSingle();

    if (subError || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: owner or admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (submission.creator_id !== caller.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (submission.status === "paid") {
      return new Response(JSON.stringify({ error: "Paid clips cannot be deleted" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousEarnings = Number(submission.earnings || 0);
    const campaign = submission.campaign;

    if ((submission.status === "approved" || submission.status === "paid") && previousEarnings > 0) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", submission.creator_id)
        .maybeSingle();

      if (wallet) {
        const newPending = Math.max(0, Number(wallet.pending_balance) - previousEarnings);
        await supabase
          .from("wallets")
          .update({ pending_balance: newPending })
          .eq("user_id", submission.creator_id);
      }

      if (campaign) {
        const newSpentBudget = Math.max(0, Number(campaign.spent_budget) - previousEarnings);
        const campaignUpdate: Record<string, unknown> = { spent_budget: newSpentBudget };
        if (campaign.status === "completed" || campaign.status === "paused") {
          if (Number(campaign.total_budget) - newSpentBudget > 0) {
            campaignUpdate.status = "active";
          }
        }
        await supabase.from("campaigns").update(campaignUpdate).eq("id", campaign.id);
      }
    }

    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submission_id);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true, reversed_earnings: previousEarnings.toFixed(2) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting submission:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
