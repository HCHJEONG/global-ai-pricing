import { moneyFromMajorUnit } from "./money";
import type {
  CountryFixture,
  CurrencyFixture,
  ExchangeRate,
  NormalizedSourceProduct,
  PricingPolicyFixture,
  ShippingRuleFixture,
  SourceProductFixture,
  TariffRuleFixture,
  TaxRuleFixture,
} from "./types";

export const pricingFixtureMetadata = {
  id: "us-to-kr-apparel-demo-rules",
  version: "2026-08-14.demo-1",
  sourceObservedAt: "2026-08-14T00:00:00.000+09:00",
  notes: [
    "Seeded values are stable demo inputs for deterministic tests.",
    "Customs and tariff outputs must be displayed as estimates, not official determinations.",
  ],
} as const;

export const countryFixtures: CountryFixture[] = [
  {
    code: "US",
    name: "United States",
    defaultCurrency: "USD",
    marketRole: "source",
  },
  {
    code: "KR",
    name: "Korea",
    defaultCurrency: "KRW",
    marketRole: "destination",
  },
];

export const currencyFixtures: CurrencyFixture[] = [
  {
    code: "USD",
    minorUnits: 2,
    symbol: "$",
  },
  {
    code: "KRW",
    minorUnits: 0,
    symbol: "₩",
  },
];

export const usdKrwExchangeRateFixture: ExchangeRate = {
  fromCurrency: "USD",
  toCurrency: "KRW",
  rate: "1380.00",
  basis: "manual_seed",
  observedAt: pricingFixtureMetadata.sourceObservedAt,
  source: "Manual portfolio-demo seed, not a live FX quote",
  version: "fx-usd-krw-2026-08-14.demo-1",
};

export const koreaVatRuleFixture: TaxRuleFixture = {
  id: "kr-vat-standard-demo",
  country: "KR",
  kind: "vat",
  rate: { basisPoints: 1000 },
  taxableBase: "cost_shipping_tariff",
  effectiveFrom: "2026-08-14",
  source: "Manual portfolio-demo seed based on Korea standard VAT assumption",
  sourceObservedAt: pricingFixtureMetadata.sourceObservedAt,
  version: "tax-kr-vat-2026-08-14.demo-1",
};

export const apparelTariffEstimateFixture: TariffRuleFixture = {
  id: "us-kr-apparel-tariff-estimate-demo",
  sourceCountry: "US",
  destinationCountry: "KR",
  productCategory: "apparel",
  rate: { basisPoints: 1300 },
  classificationBasis: "category_estimate",
  determination: "estimate",
  source: "Manual portfolio-demo seed for apparel tariff estimation",
  sourceObservedAt: pricingFixtureMetadata.sourceObservedAt,
  version: "tariff-us-kr-apparel-2026-08-14.demo-1",
  disclaimer:
    "Tariff treatment is an estimate for demo pricing and is not an official customs determination.",
};

export const usToKoreaShippingRuleFixture: ShippingRuleFixture = {
  id: "us-kr-standard-cross-border-demo",
  sourceCountry: "US",
  destinationCountry: "KR",
  method: "standard_cross_border",
  flatCost: moneyFromMajorUnit("8.00", "USD"),
  effectiveFrom: "2026-08-14",
  source: "Manual portfolio-demo seed for standard cross-border shipping",
  sourceObservedAt: pricingFixtureMetadata.sourceObservedAt,
  version: "shipping-us-kr-2026-08-14.demo-1",
};

export const koreaPricingPolicyFixture: PricingPolicyFixture = {
  id: "kr-demo-policy",
  version: "policy-kr-2026-08-14.demo-1",
  targetMarginRate: { basisPoints: 2500 },
  paymentFeeRate: { basisPoints: 300 },
  rounding: {
    currency: "KRW",
    incrementMinor: BigInt(100),
    mode: "nearest",
  },
  effectiveFrom: "2026-08-14",
  source: "Manual portfolio-demo seed for deterministic recommended pricing",
  sourceObservedAt: pricingFixtureMetadata.sourceObservedAt,
};

export const uniqloUsProduct456009Fixture: SourceProductFixture = {
  fixtureId: "uniqlo-us-456009-2026-08-14",
  sourceName: "UNIQLO US",
  sourceUrl: "https://www.uniqlo.com/us/en/products/E456009-000/00",
  sourceMarket: "US",
  observedAt: "2026-08-14T11:12:00.000+09:00",
  adapterVersion: "uniqlo-us-fixture-adapter-2026-08-14.demo-1",
  rawExtractedFields: {
    productId: "456009",
    productName: "Women's Cotton Oversized Short-Sleeve T-Shirt",
    brand: "UNIQLO",
    price: {
      amount: "19.90",
      currency: "USD",
      taxPolicy: "exclusive",
    },
    shippingCost: {
      amount: "7.99",
      currency: "USD",
      label: "Standard shipping",
    },
    freeShippingThreshold: {
      amount: "99.00",
      currency: "USD",
      label: "Free shipping for purchases over $99 or in-store pickup",
    },
    originCountry: "BD",
    material: "100% Cotton",
    availability: "Available online; store availability varies by selected store",
    description:
      "Oversized cut for a comfortable, relaxed fit. Comfortable 100% cotton with a ribbed neckline.",
    colors: ["BLUE", "WHITE", "BLACK", "YELLOW"],
    sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
    imageUrl:
      "https://image.uniqlo.com/UQ/ST3/WesternCommon/imagesgoods/456009/item/goods_63_456009_3x4.jpg",
  },
};

export function normalizeSourceProductFixture(
  fixture: SourceProductFixture,
): NormalizedSourceProduct {
  const { rawExtractedFields } = fixture;

  return {
    sourceUrl: fixture.sourceUrl,
    sourceName: fixture.sourceName,
    sourceMarket: fixture.sourceMarket,
    productName: rawExtractedFields.productName,
    productId: rawExtractedFields.productId,
    brand: rawExtractedFields.brand,
    price: moneyFromMajorUnit(
      rawExtractedFields.price.amount,
      rawExtractedFields.price.currency,
    ),
    shippingCost: rawExtractedFields.shippingCost
      ? moneyFromMajorUnit(
          rawExtractedFields.shippingCost.amount,
          rawExtractedFields.shippingCost.currency,
        )
      : undefined,
    freeShippingThreshold: rawExtractedFields.freeShippingThreshold
      ? moneyFromMajorUnit(
          rawExtractedFields.freeShippingThreshold.amount,
          rawExtractedFields.freeShippingThreshold.currency,
        )
      : undefined,
    originCountry: rawExtractedFields.originCountry,
    material: rawExtractedFields.material,
    availability: rawExtractedFields.availability,
    description: rawExtractedFields.description,
    observedAt: fixture.observedAt,
    adapterVersion: fixture.adapterVersion,
    rawData: rawExtractedFields,
  };
}
