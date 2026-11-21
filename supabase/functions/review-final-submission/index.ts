// Audit C-04 — Final-submission review, routed through the atomic
// accounting_review_final RPC (pending migration
// 20261108020000_atomic_accounting.sql — must be applied before this works).
//
// Replaces the old browser-side flow in AdminFinalReviews, which credited
// wallets with sequential client writes (uncapped, no status guard, no
// spent_budget sync, double-approval drift). The frontend calls this
// function instead; no client write to wallets / final_submissions is
// needed or permitted for review anymore.
//
// Auth pattern (see config.toml header): verify_jwt = false, the Bearer
// token is authenticated in code by the shared accounting handler. The RPC
// itself additionally requires has_role(auth.uid(), 'admin'), so the call
// is made with the caller's own JWT (userClient), not the service key.
//
// Body: { final_submission_id: uuid, decision: "approve" | "reject",
//         verified_views?: positive int (required for approve),
//         admin_notes?: string }
// Returns the RPC result ({ success, earnings }) on success.
import { accountingHandler } from "../_shared/accounting-handler.ts";

Deno.serve(accountingHandler("review-final"));
