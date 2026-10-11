import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMissingCaptionRequirements, isBioLinkRequirementSatisfied } from "./campaignRequirements";

describe("campaign caption requirements", () => {
  it("finds required text across the full caption", () => {
    const caption = `${"intro ".repeat(300)}#GameNight @Brand New release`;
    assert.deepEqual(getMissingCaptionRequirements(caption, ["#gamenight", "@brand", "new release"]), []);
  });

  it("reports missing text without matching a partial word", () => {
    assert.deepEqual(getMissingCaptionRequirements("A branding update", ["brand", "#missing"]), ["brand", "#missing"]);
  });
});

describe("campaign bio-link requirements", () => {
  const required = ["https://brand.example/offer"];

  it("allows TikTok profiles below 1,000 followers without a bio link", () => {
    assert.equal(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 999, bioLinks: [] }), true);
  });

  it("requires the link for TikTok profiles at 1,000 followers and above", () => {
    assert.equal(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 1000, bioLinks: [] }), false);
    assert.equal(isBioLinkRequirementSatisfied("tiktok", required, { followersCount: 1000, bioLinks: ["https://www.brand.example/offer/"] }), true);
  });

  it("requires the link for Instagram regardless of follower count", () => {
    assert.equal(isBioLinkRequirementSatisfied("instagram", required, { followersCount: 20, bioLinks: [] }), false);
    assert.equal(isBioLinkRequirementSatisfied("instagram", required, { followersCount: 20, bioLinks: [required[0]] }), true);
  });
});