export {
  applyApprovalTransition,
  validateApprovalTransition,
} from "./state-machine";
export { evaluateApprovalPolicy } from "./policy";

export type {
  ApprovalAction,
  ApprovalPolicyDecision,
  ApprovalPolicyInput,
  ApprovalPolicyReason,
  ApprovalState,
  ApprovalTransition,
  ApprovalTransitionResult,
} from "./types";
