import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { authenticateRequest, hasRole, jsonResponse } from './security.ts';
import { createLogger } from './logger.ts';
import { z } from 'npm:zod@3';

const log = createLogger("accounting-handler");

const uuid = z.string().uuid();
const clipSchema = z.object({ submission_id: uuid, verified_views: z.number().int().positive().safe().optional(), rejection_reason: z.string().max(1000).optional(), reason: z.string().max(1000).optional() });
const requestSchema = z.object({ user_id: uuid.optional(), amount: z.number().finite().positive(), payout_method: z.enum(['paypal','usdc_solana']), payout_email: z.string().trim().min(1).max(255), campaign_id: uuid.nullish(), discord_username: z.string().max(64).optional() });
const processSchema = z.object({ payout_id: uuid, action: z.enum(['approve','paid','reject']), admin_notes: z.string().max(1000).optional() });
// Audit C-04: final review routes through the pending accounting_review_final
// RPC. Unlike accounting_clip (service_role only), that RPC checks
// auth.uid() for the admin role itself and is granted to `authenticated`,
// so it MUST be called with the caller's own JWT (auth.userClient), never
// the service-role client (which carries no auth.uid()).
const reviewFinalSchema = z.object({ final_submission_id: uuid, decision: z.enum(['approve','reject']), verified_views: z.number().int().positive().safe().optional(), admin_notes: z.string().max(1000).optional() });

export type AccountingOperation = 'approve' | 'reject' | 'delete' | 'request' | 'process' | 'review-final';

export function accountingHandler(operation: AccountingOperation) {
 return async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({error:'Method not allowed'},405,corsHeaders);
  try {
   const auth = await authenticateRequest(req);
   if (!auth) return jsonResponse({error:'Unauthorized'},401,corsHeaders);
   // M-27: banned callers are rejected from every money operation.
   if (auth.banned) return jsonResponse({error:'This account is banned'},403,corsHeaders);
   const body = await req.json();
   let rpc: string;
   let args: Record<string, unknown>;
   // accounting_review_final is the only RPC called as the user; the rest
   // run as service_role with an explicit p_actor.
   let useUserClient = false;
   if (operation === 'request') {
    const b = requestSchema.parse(body);
    if (b.user_id && b.user_id !== auth.user.id) return jsonResponse({error:'Invalid user context'},403,corsHeaders);
    rpc = 'accounting_request_payout';
    args = {p_user:auth.user.id,p_amount:b.amount,p_method:b.payout_method,p_destination:b.payout_email,p_campaign:b.campaign_id ?? null,p_discord:b.discord_username ?? null};
   } else if (operation === 'process') {
    const b = processSchema.parse(body);
    rpc = 'accounting_process_payout'; args = {p_actor:auth.user.id,p_payout:b.payout_id,p_action:b.action,p_notes:b.admin_notes ?? null};
   } else if (operation === 'review-final') {
    // The RPC itself requires has_role(auth.uid(), 'admin'); check up front
    // so a non-admin gets a clean 403 instead of an RPC error.
    if (!await hasRole(auth.serviceClient, auth.user.id, 'admin')) return jsonResponse({error:'Forbidden'},403,corsHeaders);
    const b = reviewFinalSchema.parse(body);
    if (b.decision === 'approve' && b.verified_views === undefined) return jsonResponse({error:'Verified views required'},400,corsHeaders);
    rpc = 'accounting_review_final';
    args = {p_final:b.final_submission_id,p_action:b.decision,p_views:b.verified_views ?? null,p_notes:b.admin_notes ?? null};
    useUserClient = true;
   } else {
    const b = clipSchema.parse(body);
    if (operation === 'approve' && b.verified_views === undefined) return jsonResponse({error:'Verified views required'},400,corsHeaders);
    rpc = 'accounting_clip'; args = {p_actor:auth.user.id,p_submission:b.submission_id,p_action:operation,p_views:b.verified_views ?? null,p_reason:b.rejection_reason ?? b.reason ?? null};
   }
   const client = useUserClient ? auth.userClient : auth.serviceClient;
   const {data,error} = await client.rpc(rpc,args);
   if (error) {
    // L-06: never return raw error.message (Postgres/RPC internals) to the
    // caller. Log the detail server-side, return a generic message.
    log.error("accounting RPC failed", { operation, rpc, code: error.code, detail: error.message, user_id: auth.user.id });
    if (error.code === '23505') return jsonResponse({error:'A payout already exists for this user and campaign.'},409,corsHeaders);
    if (error.message === 'Forbidden') return jsonResponse({error:'Forbidden'},403,corsHeaders);
    return jsonResponse({error:'Accounting operation failed'},409,corsHeaders);
   }
   log.info("accounting RPC succeeded", { operation, rpc, user_id: auth.user.id });
   return jsonResponse(data,200,corsHeaders);
  } catch (error) {
   // L-06: same rule in the catch path — generic message out, detail in logs.
   log.error("accounting handler error", { operation, detail: error instanceof Error ? error.message : "unknown" });
   return jsonResponse({error:error instanceof z.ZodError ? 'Invalid request fields' : 'Accounting operation failed'},400,corsHeaders);
  }
 };
}
