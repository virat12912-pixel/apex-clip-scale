import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hashMetricsAssertion, jsonResponse, verifyMetricsAssertion } from "../_shared/security.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("process-submission");

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
    // M-27: banned callers cannot process submissions.
    if (auth.banned) return jsonResponse({ error: "This account is banned" }, 403, corsHeaders);
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
    log.info("processing submission", { submission_id, user_id: auth.user.id });

    // Get submission with campaign data
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("*, campaign:campaigns(*)")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      log.error("failed to fetch submission", { submission_id, detail: subError?.message });
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
    // H-04: the assertion is bound to this submission when it carries a
    // submissionId (verify rejects a bound assertion presented for a
    // different submission). Unbound assertions are still single-use:
    // see the duplicate-URL check below.
    const metrics = await verifyMetricsAssertion(metrics_assertion, {
      userId: auth.user.id,
      videoUrl: submission.clip_url.trim(),
      submissionId: submission_id,
    });
    if (!metrics) return jsonResponse({ error: "Metrics could not be verified. Please fetch the clip details again." }, 403, corsHeaders);
    const { views, likes, comments } = metrics;

    // H-04 single-use: one (creator, clip URL) may only ever produce ONE
    // processed row. A replayed assertion for the same video — e.g. two
    // pending rows for the same clip submitted within the assertion's
    // 5-minute window — is rejected here even though the per-row guard
    // (views=0/earnings=0) would pass on the second row. Rejected rows do
    // not block a later legitimate resubmission of the same URL.
    // The assertion hash is also persisted on the processed row
    // (submissions.processed_assertion_hash), so a replay of the same
    // assertion string is rejected by hash as well.
    const assertionHash = typeof metrics_assertion === "string"
      ? (await hashMetricsAssertion(metrics_assertion)).slice(0, 16)
      : null;
    const { data: alreadyProcessed } = await supabase
      .from("submissions")
      .select("id")
      .eq("creator_id", auth.user.id)
      .eq("clip_url", submission.clip_url.trim())
      .neq("id", submission_id)
      .or("status.in.(approved,paid),and(status.eq.pending,views.gt.0)")
      .limit(1)
      .maybeSingle();
    if (alreadyProcessed) {
      log.warn("duplicate clip replay rejected", { submission_id, user_id: auth.user.id, assertion_hash: assertionHash });
      return jsonResponse({ error: "This clip has already been processed" }, 409, corsHeaders);
    }
    // H-04: reject a replay of the same assertion string by its hash.
    if (assertionHash) {
      const { data: hashReplay } = await supabase
        .from("submissions")
        .select("id")
        .eq("creator_id", auth.user.id)
        .eq("processed_assertion_hash", assertionHash)
        .neq("id", submission_id)
        .limit(1)
        .maybeSingle();
      if (hashReplay) {
        log.warn("assertion hash replay rejected", { submission_id, user_id: auth.user.id, assertion_hash: assertionHash });
        return jsonResponse({ error: "This clip has already been processed" }, 409, corsHeaders);
      }
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
      log.info("campaign is not active", { campaign_id: campaign.id, status: campaign.status });
      return jsonResponse({ success: false, error: "Campaign is not accepting submissions" }, 409, corsHeaders);
    }

    // Pending submissions may show an estimate to their creator but must not
    // reserve or consume accepted campaign budget.
    const remainingBudget = Number(campaign.total_budget) - Number(campaign.spent_budget);
    if (remainingBudget <= 0) {
      return jsonResponse({ success: false, error: "Campaign budget is fully spent" }, 409, corsHeaders);
    }

    // C-08 / H-04: never divide by a zero (or negative) rate unit — that
    // would store Infinity/NaN earnings.
    if (!Number.isFinite(Number(campaign.rate_unit)) || Number(campaign.rate_unit) <= 0) {
      log.error("campaign rate_unit is misconfigured", { campaign_id: campaign.id, rate_unit: campaign.rate_unit });
      return jsonResponse({ success: false, error: "Campaign rate is misconfigured" }, 409, corsHeaders);
    }

    // Note: We always calculate earnings regardless of min_payout_views.
    // min_payout_views is only enforced at payout time (final submission review).
    // If the campaign ends and views are still below threshold, earnings get reversed.

    // Calculate earnings: (views / rate_unit) * rate_value, rounded to
    // cents (C-08) and capped at the remaining budget — the pending
    // estimate must never exceed what approval could pay out.
    const round2 = (n: number) => Math.round(n * 100) / 100;
    let earnings = round2((views / campaign.rate_unit) * campaign.rate_value);

    // Apply max_earnings_per_post cap if set
    if (campaign.max_earnings_per_post && earnings > campaign.max_earnings_per_post) {
      earnings = Number(campaign.max_earnings_per_post);
      log.info("capped earnings at max_earnings_per_post", { submission_id, earnings });
    }

    // Cap at remaining budget, then round again to keep 2 decimals.
    if (earnings > remainingBudget) {
      earnings = remainingBudget;
      log.info("capped earnings at remaining budget", { submission_id, earnings, remainingBudget });
    }
    earnings = round2(earnings);

    log.info("calculated earnings", { submission_id, earnings, views });

    // Update submission with views, likes, comments, and earnings
    const { data: updatedSubmission, error: updateSubError } = await supabase
      .from("submissions")
      .update({
        views: views,
        likes: likes,
        comments: comments,
        submitted_views: views,
        earnings: earnings,
        processed_assertion_hash: assertionHash,
        status: targetStatus,
      })
      .eq("id", submission_id)
      .eq("creator_id", auth.user.id)
      .eq("status", "pending")
      .eq("views", 0)
      .select("id")
      .maybeSingle();

    if (updateSubError || !updatedSubmission) {
      log.error("failed to update submission", { submission_id, detail: updateSubError?.message });
      if (updateSubError) return jsonResponse({ error: "Submission processing failed" }, 500, corsHeaders);
      return jsonResponse({ error: "Submission has already been processed" }, 409, corsHeaders);
    }

    // Send notification to creator about earnings
    try {
      const notifTitle = targetStatus === "pending" ? "Clip Submitted!" : "Clip Approved!";
      const notifMessage = targetStatus === "pending"
        ? `Your clip is pending review. Estimated earnings: $${earnings.toFixed(2)} from ${views.toLocaleString()} views on "${campaign.name}".`
        : `Your clip earned $${earnings.toFixed(2)} from ${views.toLocaleString()} views on "${campaign.name}".`;
      
      await supabase.functions.invoke("create-notification", {
        headers: { Authorization: req.headers.get("Authorization") || "" },
        body: {
          user_id: submission.creator_id,
          type: targetStatus === "pending" ? "submission_pending" : "earnings_updated",
          title: notifTitle,
          message: notifMessage,
          related_id: submission_id,
        },
      });
    } catch (notifError) {
      log.warn("failed to send notification", { submission_id, detail: notifError instanceof Error ? notifError.message : "unknown" });
    }

    log.info("successfully processed submission", { submission_id, earnings, views });

    return new Response(
      JSON.stringify({
        success: true,
        submission_id,
        views,
        likes,
        comments,
        earnings: earnings.toFixed(2),
        campaign_paused: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    // L-06: never return raw error details (Postgres/RPC internals) to the
    // caller — log them server-side and return a generic message.
    log.error("error processing submission", { detail: error instanceof Error ? error.message : "unknown" });
    return new Response(
      JSON.stringify({ error: "Submission processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
