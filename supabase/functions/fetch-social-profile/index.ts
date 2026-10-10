import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";

const ProfileRequest = z.object({
  platform: z.enum(["tiktok", "instagram"]),
  username: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9._@-]+$/),
});

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function getPath(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) current = asObject(current)[key];
  return current;
}

function collectStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    const record = asObject(item);
    const candidate = record.url ?? record.link ?? record.href;
    return typeof candidate === "string" ? [candidate] : [];
  });
}

function parseProfileData(raw: unknown, platform: "tiktok" | "instagram") {
  const root = asObject(raw);
  const user = asObject(root.user);
  const data = asObject(root.data);
  const nestedUser = asObject(data.user);
  const records = [root, user, data, nestedUser];
  const numberPaths = platform === "tiktok"
    ? [["user", "stats", "followerCount"], ["user", "follower_count"], ["stats", "followerCount"], ["followerCount"]]
    : [["followersCount"], ["followers_count"], ["followerCount"], ["follower_count"], ["stats", "followerCount"]];

  let followersCount: number | null = null;
  for (const record of records) {
    for (const path of numberPaths) {
      const value = getPath(record, path);
      const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
      if (Number.isFinite(parsed) && parsed >= 0) {
        followersCount = parsed;
        break;
      }
    }
    if (followersCount !== null) break;
  }

  const bioLinks: string[] = [];
  const linkPaths = platform === "tiktok"
    ? [["user", "bioLink", "link"], ["bioLink", "link"], ["user", "bio_link", "link"], ["bio_link", "link"]]
    : [["externalUrl"], ["external_url"], ["externalLink"], ["website"], ["bioLinks"], ["bio_links"]];
  for (const record of records) {
    for (const path of linkPaths) {
      const value = getPath(record, path);
      if (typeof value === "string") bioLinks.push(value.trim());
      else bioLinks.push(...collectStrings(value));
    }
  }

  const validLinks = [...new Set(bioLinks)].filter((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });

  return { followers_count: followersCount, bio_links: validLinks };
}

async function fetchInstagramProfile(username: string): Promise<unknown | null> {
  const token = Deno.env.get("APIFY_API_TOKEN");
  if (token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(
        "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?timeout=55",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] }),
          signal: controller.signal,
        },
      );
      if (response.ok) {
        const items: unknown = await response.json();
        if (Array.isArray(items) && items[0]) return items[0];
      } else {
        console.error("Instagram profile lookup via Apify failed with status", response.status);
      }
    } catch (error) {
      console.error("Instagram profile lookup via Apify failed:", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  const apiKey = Deno.env.get("SCRAPE_CREATORS_API_KEY");
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://api.scrapecreators.com/v1/instagram/profile?username=${encodeURIComponent(username)}`,
      { headers: { "x-api-key": apiKey, Accept: "application/json" } },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Instagram profile lookup fallback failed:", error);
    return null;
  }
}

async function fetchTikTokProfile(username: string): Promise<unknown | null> {
  const apiKey = Deno.env.get("SCRAPE_CREATORS_API_KEY");
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://api.scrapecreators.com/v1/tiktok/profile?uniqueId=${encodeURIComponent(username)}`,
      { headers: { "x-api-key": apiKey, Accept: "application/json" } },
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("TikTok profile lookup failed:", error);
    return null;
  }
}

function respond(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ success: false, error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return respond({ success: false, error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return respond({ success: false, error: "Profile lookup is unavailable" }, 503);

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authorization.slice(7));
    const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
    if (claimsError || !userId) return respond({ success: false, error: "Unauthorized" }, 401);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return respond({ success: false, error: "Invalid request body" }, 400);
    }
    const parsed = ProfileRequest.safeParse(body);
    if (!parsed.success) return respond({ success: false, error: "Invalid platform or username" }, 400);

    const { platform } = parsed.data;
    const username = parsed.data.username.replace(/^@/, "").toLowerCase();
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: accounts, error: accountError } = await adminClient
      .from("social_accounts")
      .select("username, verified")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("verified", true);

    if (accountError) {
      console.error("Could not load verified social account");
      return respond({ success: false, error: "Could not confirm your verified account" }, 500);
    }
    const accountExists = (accounts ?? []).some((account) => account.username.replace(/^@/, "").toLowerCase() === username);
    if (!accountExists) return respond({ success: false, error: "Verify this account before submitting clips" }, 403);

    const rawProfile = platform === "instagram"
      ? await fetchInstagramProfile(username)
      : await fetchTikTokProfile(username);
    if (!rawProfile) return respond({ success: false, error: "Could not read this profile right now. Please try again." });

    const profile = parseProfileData(rawProfile, platform);
    if (platform === "tiktok" && profile.followers_count === null) {
      return respond({ success: false, error: "Could not read the TikTok follower count. Please try again." });
    }
    return respond({ success: true, ...profile });
  } catch (error) {
    console.error("Profile lookup failed:", error);
    return respond({ success: false, error: "Could not read this profile right now. Please try again." }, 500);
  }
});