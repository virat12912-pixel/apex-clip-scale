import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { authenticateRequest, jsonResponse } from './security.ts';
import { z } from 'npm:zod@3';

const uuid = z.string().uuid();
const clipSchema = z.object({ submission_id: uuid, verified_views: z.number().int().positive().safe().optional(), rejection_reason: z.string().max(1000).optional(), reason: z.string().max(1000).optional() });
const requestSchema = z.object({ user_id: uuid.optional(), amount: z.number().finite().positive(), payout_method: z.enum(['paypal','usdc_solana']), payout_email: z.string().trim().min(1).max(255), campaign_id: uuid.nullish(), discord_username: z.string().max(64).optional() });
const processSchema = z.object({ payout_id: uuid, action: z.enum(['approve','paid','reject']), admin_notes: z.string().max(1000).optional() });

export function accountingHandler(operation: 'approve' | 'reject' | 'delete' | 'request' | 'process') {
 return async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({error:'Method not allowed'},405,corsHeaders);
  try {
   const auth = await authenticateRequest(req);
   if (!auth) return jsonResponse({error:'Unauthorized'},401,corsHeaders);
   const body = await req.json();
   let rpc: string;
   let args: Record<string, unknown>;
   if (operation === 'request') {
    const b = requestSchema.parse(body);
    if (b.user_id && b.user_id !== auth.user.id) return jsonResponse({error:'Invalid user context'},403,corsHeaders);
    rpc = 'accounting_request_payout';
    args = {p_user:auth.user.id,p_amount:b.amount,p_method:b.payout_method,p_destination:b.payout_email,p_campaign:b.campaign_id ?? null,p_discord:b.discord_username ?? null};
   } else if (operation === 'process') {
    const b = processSchema.parse(body);
    rpc = 'accounting_process_payout'; args = {p_actor:auth.user.id,p_payout:b.payout_id,p_action:b.action,p_notes:b.admin_notes ?? null};
   } else {
    const b = clipSchema.parse(body);
    if (operation === 'approve' && b.verified_views === undefined) return jsonResponse({error:'Verified views required'},400,corsHeaders);
    rpc = 'accounting_clip'; args = {p_actor:auth.user.id,p_submission:b.submission_id,p_action:operation,p_views:b.verified_views ?? null,p_reason:b.rejection_reason ?? b.reason ?? null};
   }
   const {data,error} = await auth.serviceClient.rpc(rpc,args);
   if (error) return jsonResponse({error:error.code === '23505' ? 'A payout already exists for this user and campaign.' : error.message}, error.message === 'Forbidden' ? 403 : 409,corsHeaders);
   return jsonResponse(data,200,corsHeaders);
  } catch (error) {
   return jsonResponse({error:error instanceof z.ZodError ? 'Invalid request fields' : error instanceof Error ? error.message : 'Accounting operation failed'},400,corsHeaders);
  }
 };
}
