import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("security");

export interface AuthContext {
  user: { id: string };
  authorization: string;
  serviceClient: ReturnType<typeof createClient>;
  userClient: ReturnType<typeof createClient>;
  /** True when the caller's profiles.is_banned is set (audit M-27). */
  banned: boolean;
}

export async function authenticateRequest(req: Request): Promise<AuthContext | null> {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return null;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // M-27: bans are enforced at the edge. A banned caller authenticates fine
  // but must be rejected (403) by every money/protected function. Read-only
  // profile fetch (fetch-social-profile) deliberately does NOT check `banned`
  // so a banned user can still see their own public profile data.
  let banned = false;
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    // Fail open only for the lookup itself: a missing/unreadable profile row
    // must not lock out legitimate users. Money functions still require their
    // own role checks, and admins can ban via profiles directly.
    log.warn("is_banned lookup failed; treating caller as not banned", { user_id: user.id });
  } else {
    banned = profile?.is_banned === true;
  }

  return { user, authorization, serviceClient, userClient, banned };
}

/**
 * Constant-time string comparison (audit L-06). Use for secrets/tokens
 * instead of `===`: a length mismatch rejects immediately, and equal-length
 * inputs always take the same number of steps regardless of where they
 * differ. Implemented manually because WebCrypto has no timingSafeEqual.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function hasRole(serviceClient: ReturnType<typeof createClient>, userId: string, role: string) {
  const { data, error } = await serviceClient.rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  return !error && data === true;
}

export async function getOwnedSocialAccount(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  accountId: unknown,
  platform: string,
) {
  if (typeof accountId !== "string" || !/^[0-9a-f-]{36}$/i.test(accountId)) return null;
  const { data, error } = await serviceClient
    .from("social_accounts")
    .select("id, username, verification_code, platform, user_id, verified")
    .eq("id", accountId)
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();
  if (error || !data || data.verified || !data.verification_code) return null;
  return data;
}

export function jsonResponse(body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ─── Metrics assertions (audit H-04) ──────────────────────────────────────
//
// Assertions are HMAC-signed with a DEDICATED secret, METRICS_SIGNING_KEY.
// It must be set in the Supabase dashboard before deploy; if it is unset
// this module FAILS LOUDLY (throw on sign, null + error log on verify)
// and never falls back to SUPABASE_SERVICE_ROLE_KEY, which must never
// double as a signing key.
//
// An assertion may carry `submissionId`. When it does, verify enforces it:
// the assertion only verifies for that one submission, so it cannot be
// replayed across duplicate rows. Assertions minted without a submissionId
// (the current fetch-before-insert frontend flow) still verify, and are
// instead made single-use by process-submission's one-processed-row-per-URL
// check. Once the frontend inserts first and passes submission_id to the
// fetch functions, every assertion will be submission-bound.

export interface MetricsAssertionClaims {
  userId: string;
  videoUrl: string;
  views: number;
  likes: number;
  comments: number;
  /** Optional: the submission this assertion was minted for. */
  submissionId?: string;
}

function getMetricsSigningKey(): string {
  const key = Deno.env.get("METRICS_SIGNING_KEY");
  if (!key) {
    // Fail loudly: never sign or verify with a fallback key.
    throw new Error("METRICS_SIGNING_KEY is not configured");
  }
  return key;
}

async function importMetricsKey(keyMaterial: string, usage: "sign" | "verify") {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

export async function signMetricsAssertion(claims: MetricsAssertionClaims) {
  const keyMaterial = getMetricsSigningKey();
  const payload = new TextEncoder().encode(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + 300 }));
  const encoded = bytesToBase64Url(payload);
  const key = await importMetricsKey(keyMaterial, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyMetricsAssertion(
  assertion: unknown,
  expected: { userId: string; videoUrl: string; submissionId?: string },
) {
  if (typeof assertion !== "string" || assertion.length > 4096) return null;
  const [encoded, signature, extra] = assertion.split(".");
  if (!encoded || !signature || extra !== undefined) return null;
  let keyMaterial: string;
  try {
    keyMaterial = getMetricsSigningKey();
  } catch (error) {
    log.error("metrics assertion verification unavailable", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
  try {
    const key = await importMetricsKey(keyMaterial, "verify");
    const signatureBytes = base64UrlToBytes(signature);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(encoded));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded)));
    if (claims.userId !== expected.userId || claims.videoUrl !== expected.videoUrl ||
        !Number.isInteger(claims.exp) || claims.exp < Math.floor(Date.now() / 1000) ||
        !Number.isSafeInteger(claims.views) || claims.views <= 0 ||
        !Number.isSafeInteger(claims.likes) || claims.likes < 0 ||
        !Number.isSafeInteger(claims.comments) || claims.comments < 0) return null;
    // Submission binding (H-04): a bound assertion verifies only for its
    // own submission. Unbound (legacy) assertions still verify here; their
    // single-use guarantee comes from process-submission's
    // one-processed-row-per-URL check.
    if (typeof claims.submissionId === "string" && claims.submissionId !== expected.submissionId) return null;
    return {
      views: claims.views as number,
      likes: claims.likes as number,
      comments: claims.comments as number,
      submissionId: (typeof claims.submissionId === "string" ? claims.submissionId : undefined) as string | undefined,
    };
  } catch {
    return null;
  }
}

/** SHA-256 hex of an assertion, for single-use / audit records. */
export async function hashMetricsAssertion(assertion: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(assertion));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
