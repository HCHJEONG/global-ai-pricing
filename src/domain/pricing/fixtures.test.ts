import { describe, expect, it } from "vitest";

import {
  apparelTariffEstimateFixture,
  countryFixtures,
  currencyFixtures,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  normalizeSourceProductFixture,
  pricingFixtureMetadata,
  usdKrwExchangeRateFixture,
  uniqloUsProduct456009Fixture,
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

describe("UNIQLO product fixture", () => {
  it("normalizes the stored public product fixture into the source product shape", () => {
    const normalized = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);

    expect(uniqloUsProduct456009Fixture).toEqual(
      expect.objectContaining({
        sourceName: "UNIQLO US",
        sourceUrl: "https://www.uniqlo.com/us/en/products/E456009-000/00",
        sourceMarket: "US",
        observedAt: expect.stringMatching(/^2026-08-14T/),
        adapterVersion: expect.stringMatching(/^uniqlo-us-fixture-adapter-/),
      }),
    );
    expect(uniqloUsProduct456009Fixture.rawExtractedFields).toEqual(
      expect.objectContaining({
        productId: "456009",
        brand: "UNIQLO",
        material: "100% Cotton",
        originCountry: "BD",
      }),
    );

    expect(normalized).toEqual(
      expect.objectContaining({
        sourceName: "UNIQLO US",
        sourceMarket: "US",
        productName: "Women's Cotton Oversized Short-Sleeve T-Shirt",
        productId: "456009",
        brand: "UNIQLO",
        price: { amountMinor: BigInt(190), currency: "USD" },
        shippingCost: { amountMinor: BigInt(799), currency: "USD" },
        freeShippingThreshold: { amountMinor: BigInt(9900), currency: "USD" },
        observedAt: uniqloUsProduct456009Fixture.observedAt,
        adapterVersion: uniqloUsProduct456009Fixture.adapterVersion,
      }),
    );
    expect(normalized.rawData).toBe(uniqloUsProduct456009Fixture.rawExtractedFields);
  });
});
