import type { Money, PricingWarning } from "../pricing";

export type ApprovalState =
  | "approval_required"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

export type ApprovalAction =
  | "approve"
  | "reject"
  | "mark_executed"
  | "mark_failed"
  | "retry";

export type ApprovalTransition = {
  from: ApprovalState;
  action: ApprovalAction;
  to: ApprovalState;
};

export type ApprovalTransitionResult =
  | {
      ok: true;
      transition: ApprovalTransition;
    }
  | {
      ok: false;
      from: ApprovalState;
      action: ApprovalAction;
      reason: string;
    };

export type ApprovalPolicyReason = {
  code: string;
  message: string;
};

export type ApprovalPolicyInput = {
  previousPrice?: Money;
  proposedPrice: Money;
  warnings?: PricingWarning[];
  blockingIssues?: Array<{ code: string; message: string }>;
  priceChangeApprovalThresholdBasisPoints?: number;
};

export type ApprovalPolicyDecision =
  | {
      outcome: "blocked";
      initialState: undefined;
      reasons: ApprovalPolicyReason[];
    }
  | {
      outcome: "approval_required";
      initialState: "approval_required";
      reasons: ApprovalPolicyReason[];
    }
  | {
      outcome: "auto_approved";
      initialState: "approved";
      reasons: ApprovalPolicyReason[];
    };
