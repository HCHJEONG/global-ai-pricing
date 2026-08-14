import { describe, expect, it } from "vitest";

import {
  normalizeSourceProductFixture,
  uniqloUsProduct456009Fixture,
} from "../../domain/pricing";
import { buildAiInputContext } from "./context";
import type { LlmToolDefinition } from "./provider";

const allowedTools: LlmToolDefinition[] = [
  {
    name: "calculate_price",
    description: "Calculate a deterministic landed price from explicit inputs.",
    inputSchema: {
      type: "object",
      properties: {
        fixtureId: { type: "string" },
        destinationCountry: { type: "string" },
      },
      required: ["fixtureId", "destinationCountry"],
    },
  },
  {
    name: "normalize_product_data",
    description: "Normalize observed source product data.",
    inputSchema: {
      type: "object",
      properties: {
        sourceUrl: { type: "string" },
      },
      required: ["sourceUrl"],
    },
  },
];

describe("buildAiInputContext", () => {
  it("builds deterministic model input from request, product, rules, policy, and tools", () => {
    const context = buildAiInputContext({
      userRequest: {
        id: "request-001",
        locale: "ko",
        text: "이 상품의 한국 판매가를 계산해줘.",
        requestedAt: "2026-08-14T12:00:00.000+09:00",
        actorId: "demo-user",
      },
      product: normalizeSourceProductFixture(uniqloUsProduct456009Fixture),
      allowedTools: [...allowedTools].reverse(),
    });

    expect(context).toMatchObject({
      schemaVersion: "ai-input-context-2026-08-14.unit-15",
      userRequest: {
        id: "request-001",
        locale: "ko",
        text: "이 상품의 한국 판매가를 계산해줘.",
      },
      product: {
        sourceName: "UNIQLO US",
        sourceMarket: "US",
        productId: "456009",
        name: "Women's Cotton Oversized Short-Sleeve T-Shirt",
        price: { amountMinor: "1990", currency: "USD" },
        shippingCost: { amountMinor: "799", currency: "USD" },
      },
      pricingRules: {
        exchangeRate: {
          fromCurrency: "USD",
          toCurrency: "KRW",
          rate: "1380.00",
          basis: "manual_seed",
        },
        tariff: {
          determination: "estimate",
          rate: { basisPoints: 1300 },
        },
        vat: {
          country: "KR",
          rate: { basisPoints: 1000 },
        },
        pricingPolicy: {
          version: "policy-kr-2026-08-14.demo-1",
          targetMarginRate: { basisPoints: 2500 },
          rounding: {
            currency: "KRW",
            incrementMinor: "100",
            mode: "nearest",
          },
        },
      },
      policyConstraints: {
        approval: {
          firstExecutablePriceRequiresApproval: true,
          sensitiveMutationsRequireApproval: true,
          defaultPriceChangeThresholdBasisPoints: 1000,
        },
      },
      allowedTools: [
        expect.objectContaining({ name: "calculate_price" }),
        expect.objectContaining({ name: "normalize_product_data" }),
      ],
    });
    expect(context.forbiddenBehavior).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Do not invent product prices"),
        expect.stringContaining("Do not bypass approval policy"),
      ]),
    );
    expect(JSON.stringify(context)).toContain('"amountMinor":"1990"');
  });
});
