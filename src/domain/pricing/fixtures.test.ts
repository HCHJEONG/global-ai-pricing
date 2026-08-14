import { describe, expect, it } from "vitest";

import {
  apparelTariffEstimateFixture,
  countryFixtures,
  currencyFixtures,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  pricingFixtureMetadata,
  usdKrwExchangeRateFixture,
  usToKoreaShippingRuleFixture,
} from "./fixtures";

describe("seeded pricing rule fixtures", () => {
  it("loads country, currency, exchange, tax, tariff, shipping, and policy fixtures", () => {
    expect(pricingFixtureMetadata.version).toMatch(/\.demo-\d+$/);
    expect(pricingFixtureMetadata.sourceObservedAt).toBeTruthy();

    expect(countryFixtures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "US", defaultCurrency: "USD" }),
        expect.objectContaining({ code: "KR", defaultCurrency: "KRW" }),
      ]),
    );

    expect(currencyFixtures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "USD", minorUnits: 2 }),
        expect.objectContaining({ code: "KRW", minorUnits: 0 }),
      ]),
    );

    expect(usdKrwExchangeRateFixture).toEqual(
      expect.objectContaining({
        fromCurrency: "USD",
        toCurrency: "KRW",
        basis: "manual_seed",
      }),
    );
    expect(Number(usdKrwExchangeRateFixture.rate)).toBeGreaterThan(0);
    expect(usdKrwExchangeRateFixture.version).toBeTruthy();

    expect(koreaVatRuleFixture).toEqual(
      expect.objectContaining({
        country: "KR",
        kind: "vat",
        taxableBase: "cost_shipping_tariff",
      }),
    );
    expect(koreaVatRuleFixture.rate.basisPoints).toBeGreaterThan(0);
    expect(koreaVatRuleFixture.version).toBeTruthy();

    expect(apparelTariffEstimateFixture).toEqual(
      expect.objectContaining({
        sourceCountry: "US",
        destinationCountry: "KR",
        productCategory: "apparel",
        determination: "estimate",
      }),
    );
    expect(apparelTariffEstimateFixture.disclaimer).toMatch(/estimate/i);
    expect(apparelTariffEstimateFixture.disclaimer).toMatch(/not an official/i);
    expect(apparelTariffEstimateFixture.version).toBeTruthy();

    expect(usToKoreaShippingRuleFixture.flatCost).toEqual({
      amountMinor: BigInt(800),
      currency: "USD",
    });
    expect(usToKoreaShippingRuleFixture.version).toBeTruthy();

    expect(koreaPricingPolicyFixture).toEqual(
      expect.objectContaining({
        id: "kr-demo-policy",
        version: expect.stringMatching(/^policy-kr-/),
      }),
    );
    expect(koreaPricingPolicyFixture.targetMarginRate.basisPoints).toBeGreaterThan(0);
    expect(koreaPricingPolicyFixture.paymentFeeRate.basisPoints).toBeGreaterThan(0);
    expect(koreaPricingPolicyFixture.rounding).toEqual({
      currency: "KRW",
      incrementMinor: BigInt(100),
      mode: "nearest",
    });
  });
});
