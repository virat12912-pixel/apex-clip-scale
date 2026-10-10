import { describe, expect, it } from "bun:test";
import { getMissingCaptionRequirements, isBioLinkRequirementSatisfied } from "./campaignRequirements";

describe("campaign caption requirements", () => {
  it("finds required text across the full caption", () => {
    const caption = `${"intro ".repeat(300)}#GameNight @Brand New release`;
    expect(getMissingCaptionRequirements(caption, ["#gamenight", "@brand", "new release"])).toEqual([]);
  });

  it("reports missing text without matching a partial word", () => {
    expect(getMissingCaptionRequirements("A branding update", ["brand", "#missing"])).toEqual(["brand", "#missing"]);
  });
});

describe("campaign bio-link requirements", () => {
  const required = ["https://brand.example/offer"];

  it("allows TikTok profiles below 1,000 followers without a bio link", () => {
    expect(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 999, bioLinks: [] })).toBe(true);
  });

  it("requires the link for TikTok profiles at 1,000 followers and above", () => {
    expect(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 1000, bioLinks: [] })).toBe(false);
    expect(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 1000, bioLinks: ["https://www.brand.example/offer/"] })).toBe(true);
  });

  it("requires the link for Instagram regardless of follower count", () => {
    expect(isBioLinkRequirementSatisfied("instagram", required, { followersCount: 20, bioLinks: [] })).toBe(false);
    expect(isBioLinkRequirementSatisfied("instagram", required, { followersCount: 20, bioLinks: [required[0]] })).toBe(true);
  });
});