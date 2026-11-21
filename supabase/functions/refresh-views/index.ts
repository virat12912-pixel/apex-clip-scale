// Audit H-11 — Admin single-submission view refresh, through the atomic
// accounting_clip("refresh") RPC.
//
// Replaces the old admin flow (AdminUserSubmissions handleRefreshViews),
// which wrote views/likes/comments directly and never recomputed earnings
// — and which refused YouTube outright even though a YouTube fetch function
// exists. Refreshing through the RPC recomputes pending-clip earnings,
// caps approved-clip deltas against remaining budget, and never leaves a
// pending row half-processed (views set but earnings untouched).
//
// Flow: authenticate (admin only) -> re-fetch fresh metrics from the
// sibling fetch-*-views function for the submission's platform (TikTok,
// Instagram, AND YouTube) -> call accounting_clip "refresh" with the
// fresh numbers. The sibling fetch functions are called over HTTP with
// the admin's own Authorization header; admins pass their ownership
// check, so no paid call is wasted on a foreign video.
//
// The daily cron (update-all-views) already calls accounting_clip
// "refresh" directly for every submission; this function is the manual,
// one-submission equivalent for admins.
//
// Body: { submission_id: uuid }
// Returns the RPC result ({ success, earnings, verified_views }) on success.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hasRole, jsonResponse } from "../_shared/security.ts";
import { createLogger } from "../_shared/logger.ts";
import { z } from "npm:zod@3";

const log = createLogger("refresh-views");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const bodySchema = z.object({ submission_id: z.string().uuid() });

const FETCH_FUNCTIONS: Record<string, string> = {
  tiktok: "fetch-tiktok-views",
  instagram: "fetch-instagram-views",
  youtube: "fetch-youtube-views",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    if (auth.banned) return jsonResponse({ error: "This account is banned" }, 403, corsHeaders);
    if (
      !await hasRole(auth.serviceClient, auth.user.id, "admin") &&
      !await hasRole(auth.serviceClient, auth.user.id, "platform_admin")
    ) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return jsonResponse({ error: "Invalid request fields" }, 400, corsHeaders);
    const { submission_id } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("id, clip_url, platform, views, earnings, status")
      .eq("id", submission_id)
      .maybeSingle();
    if (subError || !submission) {
      log.error("refresh: submission lookup failed", { submission_id, detail: subError?.message });
      return jsonResponse({ error: "Submission not found" }, 404, corsHeaders);
    }

    const fetchFn = FETCH_FUNCTIONS[submission.platform];
    if (!fetchFn) {
      return jsonResponse({ error: `Refresh is not supported for platform "${submission.platform}"` }, 400, corsHeaders);
    }

    // Re-fetch fresh metrics via the sibling function (same call the
    // creator flow uses, including its ownership check — admins pass it).
    const fetchResponse = await fetch(`${supabaseUrl}/functions/v1/${fetchFn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey ?? "",
        Authorization: auth.authorization,
      },
      body: JSON.stringify({ video_url: submission.clip_url }),
    });
    if (!fetchResponse.ok) {
      log.error("refresh: metrics fetch request failed", { submission_id, platform: submission.platform, status: fetchResponse.status });
      return jsonResponse({ error: "Could not fetch current views" }, 502, corsHeaders);
    }
    const metrics = await fetchResponse.json();
    if (!metrics?.success || !(Number(metrics.play_count) > 0)) {
      log.warn("refresh: metrics fetch returned no views", { submission_id, platform: submission.platform });
      return jsonResponse({ error: "Could not fetch current views" }, 502, corsHeaders);
    }

    // The accounting RPC recomputes earnings and caps against the budget.
    const { data, error } = await supabase.rpc("accounting_clip", {
      p_actor: auth.user.id,
      p_submission: submission_id,
      p_action: "refresh",
      p_views: Number(metrics.play_count),
      p_likes: Number(metrics.like_count ?? 0),
      p_comments: Number(metrics.comment_count ?? 0),
    });
    if (error) {
      log.error("refresh: accounting_clip failed", { submission_id, detail: error.message });
      return jsonResponse({ error: "View refresh failed" }, 409, corsHeaders);
    }

    log.info("submission refreshed", {
      submission_id,
      platform: submission.platform,
      views: Number(metrics.play_count),
      user_id: auth.user.id,
    });
    return jsonResponse(data, 200, corsHeaders);
  } catch (error) {
    log.error("refresh-views failed", { detail: error instanceof Error ? error.message : "unknown" });
    return jsonResponse({ error: "View refresh failed" }, 500, corsHeaders);
  }
});
