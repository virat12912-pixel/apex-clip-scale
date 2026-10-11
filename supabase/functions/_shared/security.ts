import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function authenticateRequest(req: Request) {
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
  return { user, authorization, serviceClient, userClient };
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

export async function signMetricsAssertion(claims: {
  userId: string;
  videoUrl: string;
  views: number;
  likes: number;
  comments: number;
}) {
  const keyMaterial = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!keyMaterial) throw new Error("Metrics signing is unavailable");
  const payload = new TextEncoder().encode(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + 300 }));
  const encoded = bytesToBase64Url(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyMetricsAssertion(
  assertion: unknown,
  expected: { userId: string; videoUrl: string },
) {
  if (typeof assertion !== "string" || assertion.length > 4096) return null;
  const [encoded, signature, extra] = assertion.split(".");
  if (!encoded || !signature || extra !== undefined) return null;
  const keyMaterial = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!keyMaterial) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keyMaterial),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureBytes = base64UrlToBytes(signature);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(encoded));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded)));
    if (claims.userId !== expected.userId || claims.videoUrl !== expected.videoUrl ||
        !Number.isInteger(claims.exp) || claims.exp < Math.floor(Date.now() / 1000) ||
        !Number.isSafeInteger(claims.views) || claims.views <= 0 ||
        !Number.isSafeInteger(claims.likes) || claims.likes < 0 ||
        !Number.isSafeInteger(claims.comments) || claims.comments < 0) return null;
    return { views: claims.views as number, likes: claims.likes as number, comments: claims.comments as number };
  } catch {
    return null;
  }
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