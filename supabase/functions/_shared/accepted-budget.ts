export type AcceptedSubmissionStatus = "approved" | "paid" | "pending" | "rejected";

export interface AcceptedBudgetChange {
  appliedDelta: number;
  spentBudget: number;
  campaignCompleted: boolean;
}

/** Applies budget changes only for accepted submissions and caps spend at the campaign budget. */
export function calculateAcceptedBudgetChange(input: {
  status: AcceptedSubmissionStatus;
  totalBudget: number;
  spentBudget: number;
  requestedDelta: number;
}): AcceptedBudgetChange {
  const spentBudget = Math.max(0, Number.isFinite(input.spentBudget) ? input.spentBudget : 0);
  const totalBudget = Math.max(0, Number.isFinite(input.totalBudget) ? input.totalBudget : 0);

  if (input.status !== "approved" && input.status !== "paid") {
    return {
      appliedDelta: 0,
      spentBudget,
      campaignCompleted: spentBudget >= totalBudget,
    };
  }

  const requestedDelta = Number.isFinite(input.requestedDelta) ? input.requestedDelta : 0;
  const appliedDelta = requestedDelta >= 0
    ? Math.min(requestedDelta, Math.max(0, totalBudget - spentBudget))
    : Math.max(requestedDelta, -spentBudget);
  const nextSpentBudget = spentBudget + appliedDelta;

  return {
    appliedDelta,
    spentBudget: nextSpentBudget,
    campaignCompleted: nextSpentBudget >= totalBudget,
  };
}