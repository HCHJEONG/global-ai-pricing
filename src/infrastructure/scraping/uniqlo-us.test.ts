import { describe, expect, it } from "vitest";

import {
  normalizeUniqloUsProductSnapshot,
  UNIQLO_US_ADAPTER_VERSION,
} from "./uniqlo-us";

describe("UNIQLO US Playwright adapter normalization", () => {
  it("normalizes public product metadata from a fixture snapshot", () => {
    const product = normalizeUniqloUsProductSnapshot(
      {
        title: "Women's Cotton Oversized Short-Sleeve T-Shirt | UNIQLO US",
        description:
          "Oversized cut for a comfortable, relaxed fit. Comfortable 100% cotton.",
        canonicalUrl: "https://www.uniqlo.com/us/en/products/E456009-000/00",
        imageUrl:
          "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/456009/item/goods_63_456009_3x4.jpg",
        jsonLd: [
          {
            "@type": "Product",
            name: "Women's Cotton Oversized Short-Sleeve T-Shirt",
            brand: "UNIQLO",
            description:
              "Oversized cut for a comfortable, relaxed fit. Comfortable 100% cotton.",
            image:
              "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/456009/item/goods_63_456009_3x4.jpg",
            offers: {
              "@type": "Offer",
              price: "19.90",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
            },
          },
        ],
        visibleText: "WOMEN BLACK WHITE BLUE YELLOW XS S M L XL In stock",
      },
      "2026-08-14T06:00:00.000Z",
    );

    expect(product).toEqual(
      expect.objectContaining({
        fixtureId: "uniqlo-us-456009-live",
        sourceName: "UNIQLO US",
        sourceMarket: "US",
        sourceUrl: "https://www.uniqlo.com/us/en/products/E456009-000/00",
        observedAt: "2026-08-14T06:00:00.000Z",
        adapterVersion: UNIQLO_US_ADAPTER_VERSION,
      }),
    );
    expect(product.rawExtractedFields).toEqual(
      expect.objectContaining({
        productId: "456009",
        productName: "Women's Cotton Oversized Short-Sleeve T-Shirt",
        brand: "UNIQLO",
        price: {
          amount: "19.90",
          currency: "USD",
          taxPolicy: "exclusive",
        },
        colors: expect.arrayContaining(["BLACK", "WHITE", "BLUE", "YELLOW"]),
      }),
    );
  });

  it("fails before returning invented pricing data when public price is missing", () => {
    expect(() =>
      normalizeUniqloUsProductSnapshot({
        title: "Women's Cotton Oversized Short-Sleeve T-Shirt | UNIQLO US",
        jsonLd: [{ "@type": "Product", name: "Women's Cotton Oversized Short-Sleeve T-Shirt" }],
        visibleText: "UNIQLO product page",
      }),
    ).toThrow(/price was not found/);
  });
});
