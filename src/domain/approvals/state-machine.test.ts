import { describe, expect, it } from "vitest";

import {
  applyApprovalTransition,
  validateApprovalTransition,
} from "./state-machine";
import type { ApprovalAction, ApprovalState } from "./types";

describe("approval state machine", () => {
  it.each([
    ["approval_required", "approve", "approved"],
    ["approval_required", "reject", "rejected"],
    ["approved", "mark_executed", "executed"],
    ["approved", "mark_failed", "failed"],
    ["failed", "retry", "approved"],
  ] satisfies Array<[ApprovalState, ApprovalAction, ApprovalState]>)(
    "allows %s -> %s -> %s",
    (from, action, to) => {
      expect(validateApprovalTransition(from, action)).toEqual({
        ok: true,
        transition: { from, action, to },
      });
      expect(applyApprovalTransition(from, action)).toBe(to);
    },
  );

  it.each([
    ["approval_required", "mark_executed"],
    ["approved", "approve"],
    ["rejected", "approve"],
    ["rejected", "mark_executed"],
    ["executed", "mark_failed"],
    ["failed", "mark_executed"],
  ] satisfies Array<[ApprovalState, ApprovalAction]>)(
    "rejects %s with %s",
    (from, action) => {
      const result = validateApprovalTransition(from, action);

      expect(result).toEqual({
        ok: false,
        from,
        action,
        reason: `Cannot ${action} when approval is ${from}.`,
      });
      if (result.ok) {
        throw new Error("Expected rejected transition");
      }
      expect(() => applyApprovalTransition(from, action)).toThrow(result.reason);
    },
  );
});
