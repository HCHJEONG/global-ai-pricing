import { describe, expect, it } from "vitest";

import { calculateLandedPrice, PRICING_ENGINE_VERSION } from "./engine";
import {
  apparelTariffEstimateFixture,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  normalizeSourceProductFixture,
  usdKrwExchangeRateFixture,
  uniqloUsProduct456009Fixture,
} from "./fixtures";

describe("pricing calculation pipeline", () => {
  it("calculates the first Korea destination landed-price scenario from fixture inputs", () => {
    const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);

    const result = calculateLandedPrice(
      {
        productCost: product.price,
        sourceCountry: product.sourceMarket,
        destinationCountry: "KR",
        shippingCost: product.shippingCost!,
        tariffRate: apparelTariffEstimateFixture.rate,
        vatRate: koreaVatRuleFixture.rate,
        exchangeRate: usdKrwExchangeRateFixture,
        paymentFeeRate: koreaPricingPolicyFixture.paymentFeeRate,
        targetMarginRate: koreaPricingPolicyFixture.targetMarginRate,
        rounding: koreaPricingPolicyFixture.rounding,
        pricingPolicyVersion: koreaPricingPolicyFixture.version,
      },
      { calculatedAt: "2026-08-14T12:00:00.000+09:00" },
    );

    expect(result.recommendedPrice).toEqual({
      amountMinor: BigInt(21700),
      currency: "KRW",
    });
    expect(result.engineVersion).toBe(PRICING_ENGINE_VERSION);
    expect(result.policyVersion).toBe(koreaPricingPolicyFixture.version);
    expect(result.calculatedAt).toBe("2026-08-14T12:00:00.000+09:00");
    expect(result.breakdown).toEqual([
      expect.objectContaining({
        kind: "product_cost",
        amount: { amountMinor: BigInt(2622), currency: "KRW" },
        sourceAmount: { amountMinor: BigInt(190), currency: "USD" },
      }),
      expect.objectContaining({
        kind: "shipping",
        amount: { amountMinor: BigInt(11026), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "tariff",
        amount: { amountMinor: BigInt(1774), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "vat",
        amount: { amountMinor: BigInt(1542), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "payment_fee",
        amount: { amountMinor: BigInt(509), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "margin",
        amount: { amountMinor: BigInt(4241), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "discount",
        amount: { amountMinor: BigInt(0), currency: "KRW" },
      }),
      expect.objectContaining({
        kind: "rounding",
        amount: { amountMinor: BigInt(-14), currency: "KRW" },
      }),
    ]);
    expect(result.assumptions.map((assumption) => assumption.code)).toEqual([
      "EXCHANGE_RATE_BASIS",
      "CALCULATION_ORDER",
      "ROUNDING_POLICY",
    ]);
    expect(result.warnings).toEqual([
      expect.objectContaining({ code: "CUSTOMS_ESTIMATE_ONLY" }),
    ]);
  });

  it("supports round-up policy and warns when exchange-rate data is stale", () => {
    const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);

    const result = calculateLandedPrice(
      {
        productCost: product.price,
        sourceCountry: product.sourceMarket,
        destinationCountry: "KR",
        shippingCost: product.shippingCost!,
        tariffRate: apparelTariffEstimateFixture.rate,
        vatRate: koreaVatRuleFixture.rate,
        exchangeRate: usdKrwExchangeRateFixture,
        paymentFeeRate: koreaPricingPolicyFixture.paymentFeeRate,
        targetMarginRate: koreaPricingPolicyFixture.targetMarginRate,
        rounding: {
          currency: "KRW",
          incrementMinor: BigInt(1000),
          mode: "up",
        },
        pricingPolicyVersion: koreaPricingPolicyFixture.version,
      },
      {
        calculatedAt: "2026-08-20T12:00:00.000+09:00",
        staleExchangeRateAfterDays: 1,
      },
    );

    expect(result.recommendedPrice).toEqual({
      amountMinor: BigInt(22000),
      currency: "KRW",
    });
    expect(result.breakdown.at(-1)).toEqual(
      expect.objectContaining({
        kind: "rounding",
        amount: { amountMinor: BigInt(286), currency: "KRW" },
      }),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "STALE_EXCHANGE_RATE" }),
      ]),
    );
  });
});
