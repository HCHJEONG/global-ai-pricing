import type { ApprovalPolicyDecision, ApprovalPolicyInput } from "./types";

const defaultPriceChangeApprovalThresholdBasisPoints = 1000;

function absolute(value: bigint): bigint {
  return value < BigInt(0) ? -value : value;
}

function isPriceChangeAboveThreshold(input: {
  previousPriceAmountMinor: bigint;
  proposedPriceAmountMinor: bigint;
  thresholdBasisPoints: number;
}): boolean {
  if (input.previousPriceAmountMinor <= BigInt(0)) {
    return true;
  }

  const change = absolute(
    input.proposedPriceAmountMinor - input.previousPriceAmountMinor,
  );

  return (
    change * BigInt(10_000) >
    input.previousPriceAmountMinor * BigInt(input.thresholdBasisPoints)
  );
}

export function evaluateApprovalPolicy(
  input: ApprovalPolicyInput,
): ApprovalPolicyDecision {
  const blockingReasons = [
    ...(input.blockingIssues ?? []).map((issue) => ({
      code: issue.code,
      message: issue.message,
    })),
    ...(input.warnings ?? [])
      .filter((warning) => warning.severity === "blocking")
      .map((warning) => ({
        code: warning.code,
        message: warning.message,
      })),
  ];

  if (blockingReasons.length > 0) {
    return {
      outcome: "blocked",
      initialState: undefined,
      reasons: blockingReasons,
    };
  }

  if (!input.previousPrice) {
    return {
      outcome: "approval_required",
      initialState: "approval_required",
      reasons: [
        {
          code: "NO_PREVIOUS_PRICE",
          message:
            "No previous price exists, so the first executable price requires approval.",
        },
      ],
    };
  }

  if (input.previousPrice.currency !== input.proposedPrice.currency) {
    return {
      outcome: "approval_required",
      initialState: "approval_required",
      reasons: [
        {
          code: "PRICE_CURRENCY_CHANGED",
          message:
            "The proposed price currency differs from the previous price currency.",
        },
      ],
    };
  }

  const thresholdBasisPoints =
    input.priceChangeApprovalThresholdBasisPoints ??
    defaultPriceChangeApprovalThresholdBasisPoints;

  if (
    isPriceChangeAboveThreshold({
      previousPriceAmountMinor: input.previousPrice.amountMinor,
      proposedPriceAmountMinor: input.proposedPrice.amountMinor,
      thresholdBasisPoints,
    })
  ) {
    return {
      outcome: "approval_required",
      initialState: "approval_required",
      reasons: [
        {
          code: "PRICE_CHANGE_ABOVE_THRESHOLD",
          message: `The proposed price change is above ${thresholdBasisPoints} basis points.`,
        },
      ],
    };
  }

  return {
    outcome: "auto_approved",
    initialState: "approved",
    reasons: [
      {
        code: "PRICE_CHANGE_WITHIN_THRESHOLD",
        message: `The proposed price change is within ${thresholdBasisPoints} basis points.`,
      },
    ],
  };
}
