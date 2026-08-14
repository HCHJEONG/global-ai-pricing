import { describe, expect, it, vi } from "vitest";

import { AuditLogService } from "../audit";
import type { AuditLogRepository } from "../audit";
import { runAiToolHarness } from "./harness";
import { createAiPricingTools } from "./pricing-tools";

describe("AI pricing tools", () => {
  it("normalizes fixture product data for downstream pricing", async () => {
    const events: unknown[] = [];
    const [normalizeProductDataTool] = createAiPricingTools({
      onToolEvent: (event) => {
        events.push(event);
      },
    });

    const result = await normalizeProductDataTool.execute({
      fixtureId: "uniqlo-us-456009-2026-08-14",
    });

    expect(result).toMatchObject({
      status: "success",
      source: "fixture",
      product: {
        productId: "456009",
        productName: "Women's Cotton Oversized Short-Sleeve T-Shirt",
        sourceName: "UNIQLO US",
        sourceMarket: "US",
      },
    });
    expect(events).toEqual([
      expect.objectContaining({
        toolName: "normalize_product_data",
        status: "started",
      }),
      expect.objectContaining({
        toolName: "normalize_product_data",
        status: "succeeded",
      }),
    ]);
  });

  it("calculates a price from mocked model output and fixture pricing data", async () => {
    const tools = createAiPricingTools();

    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [
            {
              name: "calculate_price",
              input: {
                fixtureId: "uniqlo-us-456009-2026-08-14",
                destinationCountry: "KR",
                calculatedAt: "2026-08-14T12:00:00.000+09:00",
              },
            },
          ],
        }),
      },
      tools,
    });

    expect(results[0]).toMatchObject({
      status: "executed",
      result: {
        status: "success",
        destinationCountry: "KR",
        result: {
          recommendedPrice: {
            amountMinor: BigInt(61200),
            currency: "KRW",
          },
        },
      },
    });
  });

  it("creates and audits a price approval request", async () => {
    const repository: AuditLogRepository = {
      create: vi.fn(async (input) => ({
        id: "audit-001",
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        occurredAt: input.occurredAt ?? "2026-08-14T12:00:00.000+09:00",
        actorId: input.actorId,
        before: input.before,
        after: input.after,
        metadata: input.metadata,
      })),
      findByTarget: vi.fn(),
      findRecent: vi.fn(),
    };
    const tools = createAiPricingTools({
      auditLogService: new AuditLogService(repository),
    });

    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [
            {
              name: "request_price_approval",
              input: {
                calculationId: "calc-001",
                proposedPrice: { amount: "61200", currency: "KRW" },
                actorId: "agent-001",
              },
            },
          ],
        }),
      },
      tools,
    });

    expect(results[0]).toMatchObject({
      status: "executed",
      result: {
        status: "approval_required",
        approval: {
          calculationId: "calc-001",
          status: "approval_required",
        },
        decision: {
          outcome: "approval_required",
        },
      },
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "approval.requested",
        targetType: "approval",
        actorId: "agent-001",
      }),
    );
  });

  it("logs harness-level tool failures", async () => {
    const events: unknown[] = [];

    const results = await runAiToolHarness({
      response: {
        text: JSON.stringify({
          toolCalls: [{ name: "missing_tool", input: {} }],
        }),
      },
      tools: createAiPricingTools(),
      onToolEvent: (event) => {
        events.push(event);
      },
    });

    expect(results[0]).toMatchObject({
      status: "rejected",
      reason: { code: "UNKNOWN_TOOL" },
    });
    expect(events).toEqual([
      expect.objectContaining({
        status: "rejected",
        reason: expect.objectContaining({ code: "UNKNOWN_TOOL" }),
      }),
    ]);
  });
});
