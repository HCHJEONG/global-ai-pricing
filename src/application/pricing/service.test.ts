import { describe, expect, it } from "vitest";

import {
  calculateFixturePricingQuoteFromProduct,
  getFixturePricingQuote,
} from "./service";
import {
  normalizeSourceProductFixture,
  uniqloUsProduct456009Fixture,
} from "../../domain/pricing";

describe("pricing application service", () => {
  it("loads fixture inputs and returns a UI-ready pricing quote", () => {
    const quote = getFixturePricingQuote({
      fixtureId: uniqloUsProduct456009Fixture.fixtureId,
      destinationCountry: "KR",
      calculatedAt: "2026-08-14T12:00:00.000+09:00",
    });

    expect(quote.status).toBe("success");
    if (quote.status !== "success") {
      throw new Error("Expected successful quote");
    }

    expect(quote.product).toEqual(
      expect.objectContaining({
        productId: "456009",
        name: "Women's Cotton Oversized Short-Sleeve T-Shirt",
        sourceName: "UNIQLO US",
        sourceMarket: "US",
      }),
    );
    expect(quote.destinationCountry).toBe("KR");
    expect(quote.source).toEqual(
      expect.objectContaining({
        fixtureId: uniqloUsProduct456009Fixture.fixtureId,
        fixtureVersion: uniqloUsProduct456009Fixture.adapterVersion,
      }),
    );
    expect(quote.result.recommendedPrice).toEqual({
      amountMinor: BigInt(61200),
      currency: "KRW",
    });
    expect(quote.result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CUSTOMS_ESTIMATE_ONLY" }),
      ]),
    );
  });

  it("blocks missing required product price before calling the engine", () => {
    const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);
    const productWithoutPrice = { ...product } as Partial<typeof product>;
    delete productWithoutPrice.price;

    const quote = calculateFixturePricingQuoteFromProduct({
      product: productWithoutPrice,
      destinationCountry: "KR",
      calculatedAt: "2026-08-14T12:00:00.000+09:00",
    });

    expect(quote.status).toBe("blocked");
    if (quote.status !== "blocked") {
      throw new Error("Expected blocked quote");
    }
    expect(quote.blockingIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_PRODUCT_PRICE" }),
      ]),
    );
  });

  it("uses the seeded shipping fallback with an explicit warning", () => {
    const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);
    const productWithoutShipping = { ...product };
    delete productWithoutShipping.shippingCost;

    const quote = calculateFixturePricingQuoteFromProduct({
      product: productWithoutShipping,
      destinationCountry: "KR",
      calculatedAt: "2026-08-14T12:00:00.000+09:00",
    });

    expect(quote.status).toBe("success");
    if (quote.status !== "success") {
      throw new Error("Expected successful quote");
    }
    expect(quote.result.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "shipping",
          sourceAmount: { amountMinor: BigInt(800), currency: "USD" },
        }),
      ]),
    );
    expect(quote.result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "FIXTURE_SHIPPING_RULE_USED" }),
      ]),
    );
  });

  it("warns when origin or material are missing", () => {
    const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);
    const reducedProduct = { ...product };
    delete reducedProduct.originCountry;
    delete reducedProduct.material;

    const quote = calculateFixturePricingQuoteFromProduct({
      product: reducedProduct,
      destinationCountry: "KR",
      calculatedAt: "2026-08-14T12:00:00.000+09:00",
    });

    expect(quote.status).toBe("success");
    if (quote.status !== "success") {
      throw new Error("Expected successful quote");
    }
    expect(quote.result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_ORIGIN_COUNTRY" }),
        expect.objectContaining({ code: "MISSING_MATERIAL" }),
      ]),
    );
  });

  it("blocks invalid external request parameters", () => {
    const quote = getFixturePricingQuote({
      fixtureId: uniqloUsProduct456009Fixture.fixtureId,
      destinationCountry: "CN",
      calculatedAt: "not-a-date",
    });

    expect(quote.status).toBe("blocked");
    if (quote.status !== "blocked") {
      throw new Error("Expected blocked quote");
    }
    expect(quote.blockingIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_PRICING_REQUEST" }),
      ]),
    );
  });
});
