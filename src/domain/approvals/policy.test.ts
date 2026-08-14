import { describe, expect, it } from "vitest";

import { money } from "../pricing";
import { evaluateApprovalPolicy } from "./policy";

describe("approval policy", () => {
  it("requires approval when the proposed price changes by more than 10 percent", () => {
    expect(
      evaluateApprovalPolicy({
        previousPrice: money(BigInt(10_000), "KRW"),
        proposedPrice: money(BigInt(11_001), "KRW"),
      }),
    ).toEqual({
      outcome: "approval_required",
      initialState: "approval_required",
      reasons: [
        expect.objectContaining({ code: "PRICE_CHANGE_ABOVE_THRESHOLD" }),
      ],
    });
  });

  it("auto-approves when the proposed price change is within the threshold", () => {
    expect(
      evaluateApprovalPolicy({
        previousPrice: money(BigInt(10_000), "KRW"),
        proposedPrice: money(BigInt(11_000), "KRW"),
      }),
    ).toEqual({
      outcome: "auto_approved",
      initialState: "approved",
      reasons: [
        expect.objectContaining({ code: "PRICE_CHANGE_WITHIN_THRESHOLD" }),
      ],
    });
  });

  it("requires approval when there is no previous price", () => {
    expect(
      evaluateApprovalPolicy({
        proposedPrice: money(BigInt(10_000), "KRW"),
      }),
    ).toEqual({
      outcome: "approval_required",
      initialState: "approval_required",
      reasons: [expect.objectContaining({ code: "NO_PREVIOUS_PRICE" })],
    });
  });

  it("blocks execution when missing data reaches the blocking level", () => {
    expect(
      evaluateApprovalPolicy({
        previousPrice: money(BigInt(10_000), "KRW"),
        proposedPrice: money(BigInt(10_500), "KRW"),
        blockingIssues: [
          {
            code: "MISSING_PRODUCT_PRICE",
            message: "Product price is required before execution.",
          },
        ],
        warnings: [
          {
            code: "MISSING_SOURCE_TIMESTAMP",
            severity: "blocking",
            message: "Source timestamp is required before execution.",
          },
        ],
      }),
    ).toEqual({
      outcome: "blocked",
      initialState: undefined,
      reasons: [
        expect.objectContaining({ code: "MISSING_PRODUCT_PRICE" }),
        expect.objectContaining({ code: "MISSING_SOURCE_TIMESTAMP" }),
      ],
    });
  });
});
