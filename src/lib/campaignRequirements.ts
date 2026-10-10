export type SocialPlatform = "tiktok" | "instagram" | "youtube";

export interface ProfileLinkData {
  followersCount: number | null;
  bioLinks: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getMissingCaptionRequirements(
  caption: string | null | undefined,
  requirements: string[] | null | undefined,
): string[] {
  const text = caption?.toLocaleLowerCase() ?? "";
  return (requirements ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}_])${escapeRegExp(item.toLocaleLowerCase())}(?![\\p{L}\\p{N}_])`,
        "u",
      );
      return !pattern.test(text);
    });
}

function normalizeUrl(value: string): string | null {
  try {
    const input = value.trim();
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

export function isBioLinkRequirementSatisfied(
  platform: SocialPlatform,
  requiredLinks: string[] | null | undefined,
  profile: ProfileLinkData,
): boolean {
  const required = (requiredLinks ?? []).map((item) => item.trim()).filter(Boolean);
  if (required.length === 0 || platform === "youtube") return true;

  // TikTok lets profiles below 1,000 followers submit without a website link.
  if (platform === "tiktok" && profile.followersCount !== null && profile.followersCount < 1000) {
    return true;
  }

  const profileLinks = profile.bioLinks.map(normalizeUrl).filter((link): link is string => link !== null);
  return required.every((item) => {
    const normalizedRequirement = normalizeUrl(item);
    return normalizedRequirement !== null && profileLinks.includes(normalizedRequirement);
  });
}