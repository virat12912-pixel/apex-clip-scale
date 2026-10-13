import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateAcceptedBudgetChange } from "../supabase/functions/_shared/accepted-budget";

describe("accepted campaign budget", () => {
  it("does not spend budget for a pending clip even when its estimate exceeds the remainder", () => {
    assert.deepEqual(calculateAcceptedBudgetChange({
      status: "pending",
      totalBudget: 100,
      spentBudget: 90,
      requestedDelta: 25,
    }), {
      appliedDelta: 0,
      spentBudget: 90,
      campaignCompleted: false,
    });
  });

  it("caps accepted spend at the remaining budget and completes the campaign", () => {
    assert.deepEqual(calculateAcceptedBudgetChange({
      status: "approved",
      totalBudget: 100,
      spentBudget: 90,
      requestedDelta: 25,
    }), {
      appliedDelta: 10,
      spentBudget: 100,
      campaignCompleted: true,
    });
  });

  it("does not complete a campaign when an accepted clip stays within the budget", () => {
    assert.deepEqual(calculateAcceptedBudgetChange({
      status: "approved",
      totalBudget: 100,
      spentBudget: 70,
      requestedDelta: 20,
    }), {
      appliedDelta: 20,
      spentBudget: 90,
      campaignCompleted: false,
    });
  });
});