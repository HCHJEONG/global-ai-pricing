import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { runAiToolHarness } from "./harness";
import type { LlmToolExecutor } from "./tools";

const calculatePriceTool: LlmToolExecutor = {
  definition: {
    name: "calculate_price",
    description: "Calculate a deterministic landed price.",
    inputSchema: {
      type: "object",
      properties: {
        fixtureId: { type: "string" },
      },
      required: ["fixtureId"],
    },
  },
  inputSchema: z.object({
    fixtureId: z.string().min(1),
  }),
  execute: vi.fn(async (input) => ({
    quoteId: "quote-001",
    input,
  })),
};

const requestPriceApprovalTool: LlmToolExecutor = {
  definition: {
    name: "request_price_approval",
    description: "Create a price approval request.",
    inputSchema: {
      type: "object",
      properties: {
        calculationId: { type: "string" },
      },
      required: ["calculationId"],
    },
  },
  inputSchema: z.object({
    calculationId: z.string().min(1),
  }),
  requiresApproval: true,
  execute: vi.fn(async () => {
    throw new Error("Sensitive mutation should not execute immediately.");
  }),
};

describe("runAiToolHarness", () => {
  it("executes a valid allowlisted tool call with parsed input", async () => {
    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [
            {
              id: "call-001",
              name: "calculate_price",
              input: { fixtureId: "uniqlo-us-456009" },
            },
          ],
        }),
      },
      tools: [calculatePriceTool],
    });

    expect(results).toEqual([
      {
        status: "executed",
        call: {
          id: "call-001",
          name: "calculate_price",
          input: { fixtureId: "uniqlo-us-456009" },
        },
        result: {
          quoteId: "quote-001",
          input: { fixtureId: "uniqlo-us-456009" },
        },
      },
    ]);
    expect(calculatePriceTool.execute).toHaveBeenCalledWith({
      fixtureId: "uniqlo-us-456009",
    });
  });

  it("rejects unknown tools before execution", async () => {
    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [{ name: "delete_all_prices", input: {} }],
        }),
      },
      tools: [calculatePriceTool],
    });

    expect(results).toEqual([
      {
        status: "rejected",
        call: { name: "delete_all_prices", input: {} },
        reason: {
          code: "UNKNOWN_TOOL",
          message: "Tool delete_all_prices is not in the allowlist.",
        },
      },
    ]);
  });

  it("rejects invalid tool input using the tool Zod schema", async () => {
    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [{ name: "calculate_price", input: { fixtureId: "" } }],
        }),
      },
      tools: [calculatePriceTool],
    });

    expect(results[0]).toMatchObject({
      status: "rejected",
      call: { name: "calculate_price", input: { fixtureId: "" } },
      reason: { code: "INVALID_TOOL_INPUT" },
    });
    expect(calculatePriceTool.execute).toHaveBeenCalledTimes(1);
  });

  it("converts approval-required tool calls into approval requests", async () => {
    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [
            {
              name: "request_price_approval",
              input: { calculationId: "calc-001" },
            },
          ],
        }),
      },
      tools: [requestPriceApprovalTool],
    });

    expect(results).toEqual([
      {
        status: "approval_required",
        call: {
          name: "request_price_approval",
          input: { calculationId: "calc-001" },
        },
        approvalRequest: {
          toolName: "request_price_approval",
          input: { calculationId: "calc-001" },
          reason: "Sensitive mutation requires approval before execution.",
        },
      },
    ]);
    expect(requestPriceApprovalTool.execute).not.toHaveBeenCalled();
  });

  it("rejects model output that is not parseable as tool calls", async () => {
    const results = await runAiToolHarness({
      response: { text: "I would calculate the price manually." },
      tools: [calculatePriceTool],
    });

    expect(results[0]).toMatchObject({
      status: "rejected",
      reason: { code: "INVALID_MODEL_OUTPUT" },
    });
  });
});
