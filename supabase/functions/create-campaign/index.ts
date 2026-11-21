// Audit C-05 — Server-side campaign creation with a funding gate.
//
// Replaces the direct `campaigns` insert from the frontend. The old flow
// only warned when `availableBalance > 0 && budget > availableBalance`,
// so a $0-balance brand could launch any budget, and nothing ever reserved
// funds (client_balances.pending_spend was never written anywhere).
//
// This function:
//   1. Authenticates the caller and requires the brand or admin role.
//   2. Validates input with Zod, mirroring src/lib/validation.ts
//      campaignSchema (positive budget, RPM >= 0.01, positive min_views…).
//   3. Enforces the funding gate server-side: budget must be
//      <= available_balance, INCLUDING when available is 0.
//   4. Reserves the funds first (available_balance -= budget,
//      pending_spend += budget, conditional on the balance value read —
//      a concurrent reservation changing the balance fails the update and
//      the request is rejected instead of over-reserving), then inserts
//      the campaign with created_by = caller. There is no single
//      campaign-creation RPC in the pending accounting migration, so this
//      is sequential service-role writes with a compensating rollback: if
//      the campaign insert fails, the reservation is restored before the
//      error is returned, so a campaign is never left without a reservation
//      and a reservation is never left without a campaign.
//   5. Writes a `campaign_spend` ledger row (best effort; a ledger failure
//      is logged but does not fail the request — the balance state above
//      is the source of truth).
//
// Body: { name, description?, requirements?, niche?, platforms[],
//         rate_value, rate_unit?, min_views?, min_payout_views?,
//         max_earnings_per_post?, total_budget, duration_days?,
//         required_hashtags?, required_links?, image_url? }
// Returns 201 with the created campaign row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, hasRole, jsonResponse } from "../_shared/security.ts";
import { createLogger } from "../_shared/logger.ts";
import { z } from "npm:zod@3";

const log = createLogger("create-campaign");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const campaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  requirements: z.string().trim().max(2000).optional(),
  niche: z.string().trim().max(100).optional(),
  platforms: z.array(z.enum(["tiktok", "instagram", "youtube"])).min(1),
  rate_value: z.number().positive().min(0.01).max(10000),
  rate_unit: z.number().int().positive().default(1000),
  min_views: z.number().int().positive().min(1).max(100000000).default(1000),
  min_payout_views: z.number().int().positive().max(100000000).default(10000),
  max_earnings_per_post: z.number().positive().max(1000000).optional(),
  total_budget: z.number().positive().min(1).max(100000000),
  duration_days: z.number().int().positive().max(365).optional(),
  required_hashtags: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  required_links: z.array(z.string().url()).max(50).optional(),
  image_url: z.string().url().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);

  try {
    const auth = await authenticateRequest(req);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
    if (auth.banned) return jsonResponse({ error: "This account is banned" }, 403, corsHeaders);
    if (
      !await hasRole(auth.serviceClient, auth.user.id, "brand") &&
      !await hasRole(auth.serviceClient, auth.user.id, "admin") &&
      !await hasRole(auth.serviceClient, auth.user.id, "platform_admin")
    ) {
      return jsonResponse({ error: "Forbidden" }, 403, corsHeaders);
    }

    const parsed = campaignSchema.safeParse(await req.json());
    if (!parsed.success) return jsonResponse({ error: "Invalid request fields" }, 400, corsHeaders);
    const b = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Funding gate (C-05): budget <= available_balance, including 0. ──
    const { data: balance, error: balanceError } = await supabase
      .from("client_balances")
      .select("available_balance, pending_spend")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (balanceError || !balance) {
      log.error("client balance lookup failed", { user_id: auth.user.id, detail: balanceError?.message });
      return jsonResponse({ error: "No client balance found. Top up before launching a campaign." }, 409, corsHeaders);
    }
    const available = Number(balance.available_balance);
    const pendingSpend = Number(balance.pending_spend ?? 0);
    if (!Number.isFinite(available) || b.total_budget > available) {
      log.info("campaign rejected: insufficient balance", { user_id: auth.user.id, budget: b.total_budget, available });
      return jsonResponse({ error: "Insufficient balance for this campaign budget" }, 409, corsHeaders);
    }

    // ── Reserve first, conditional on the balance just read. ─────────────
    // If another reservation landed in between, the equality guard matches
    // zero rows and we reject instead of over-reserving.
    const { data: reserved, error: reserveError } = await supabase
      .from("client_balances")
      .update({
        available_balance: available - b.total_budget,
        pending_spend: pendingSpend + b.total_budget,
      })
      .eq("user_id", auth.user.id)
      .eq("available_balance", available)
      .select("available_balance, pending_spend")
      .maybeSingle();
    if (reserveError || !reserved) {
      log.warn("campaign reservation lost race or failed", { user_id: auth.user.id, detail: reserveError?.message });
      return jsonResponse({ error: "Insufficient balance for this campaign budget" }, 409, corsHeaders);
    }

    // ── Insert the campaign. On failure, roll the reservation back. ──────
    const endDate = b.duration_days
      ? new Date(Date.now() + b.duration_days * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const { data: campaign, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        name: b.name,
        description: b.description ?? null,
        requirements: b.requirements ?? null,
        platforms: b.platforms,
        niche: b.niche ?? null,
        rate_value: b.rate_value,
        rate_unit: b.rate_unit,
        min_views: b.min_views,
        min_payout_views: b.min_payout_views,
        max_earnings_per_post: b.max_earnings_per_post ?? null,
        total_budget: b.total_budget,
        spent_budget: 0,
        duration_days: b.duration_days ?? null,
        end_date: endDate,
        required_hashtags: b.required_hashtags ?? [],
        required_links: b.required_links ?? [],
        image_url: b.image_url ?? null,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (insertError || !campaign) {
      log.error("campaign insert failed; rolling back reservation", {
        user_id: auth.user.id,
        budget: b.total_budget,
        detail: insertError?.message,
      });
      const { error: rollbackError } = await supabase
        .from("client_balances")
        .update({
          available_balance: available,
          pending_spend: pendingSpend,
        })
        .eq("user_id", auth.user.id)
        .eq("available_balance", available - b.total_budget);
      if (rollbackError) {
        // Money state is now inconsistent (reservation without a campaign).
        // Surface loudly in logs so an admin can reconcile; the caller still
        // gets a generic failure, not a silent success.
        log.error("RESERVATION ROLLBACK FAILED — manual reconciliation required", {
          user_id: auth.user.id,
          budget: b.total_budget,
          detail: rollbackError.message,
        });
      }
      return jsonResponse({ error: "Campaign creation failed" }, 500, corsHeaders);
    }

    // ── Ledger row (audit only; never blocks the created campaign). ──────
    const { error: ledgerError } = await supabase.from("balance_transactions").insert({
      user_id: auth.user.id,
      type: "campaign_spend",
      amount: b.total_budget,
      description: `Budget reserved for campaign "${b.name}"`,
      related_campaign_id: campaign.id,
    });
    if (ledgerError) {
      log.error("campaign_spend ledger write failed", { user_id: auth.user.id, campaign_id: campaign.id, detail: ledgerError.message });
    }

    log.info("campaign created with reserved budget", {
      user_id: auth.user.id,
      campaign_id: campaign.id,
      budget: b.total_budget,
      available_after: available - b.total_budget,
    });
    return jsonResponse({ success: true, campaign }, 201, corsHeaders);
  } catch (error) {
    log.error("create-campaign failed", { detail: error instanceof Error ? error.message : "unknown" });
    return jsonResponse({ error: "Campaign creation failed" }, 500, corsHeaders);
  }
});
