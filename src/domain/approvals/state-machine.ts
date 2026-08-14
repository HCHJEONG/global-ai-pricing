import type {
  ApprovalAction,
  ApprovalState,
  ApprovalTransitionResult,
} from "./types";

const allowedTransitions: Record<
  ApprovalState,
  Partial<Record<ApprovalAction, ApprovalState>>
> = {
  approval_required: {
    approve: "approved",
    reject: "rejected",
  },
  approved: {
    mark_executed: "executed",
    mark_failed: "failed",
  },
  failed: {
    retry: "approved",
  },
  rejected: {},
  executed: {},
};

export function validateApprovalTransition(
  from: ApprovalState,
  action: ApprovalAction,
): ApprovalTransitionResult {
  const to = allowedTransitions[from][action];

  if (!to) {
    return {
      ok: false,
      from,
      action,
      reason: `Cannot ${action} when approval is ${from}.`,
    };
  }

  return {
    ok: true,
    transition: {
      from,
      action,
      to,
    },
  };
}

export function applyApprovalTransition(
  from: ApprovalState,
  action: ApprovalAction,
): ApprovalState {
  const result = validateApprovalTransition(from, action);

  if (!result.ok) {
    throw new Error(result.reason);
  }

  return result.transition.to;
}
