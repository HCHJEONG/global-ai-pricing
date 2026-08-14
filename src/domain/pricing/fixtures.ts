import { moneyFromMajorUnit } from "./money";
import type {
  CountryFixture,
  CurrencyFixture,
  ExchangeRate,
  PricingPolicyFixture,
  ShippingRuleFixture,
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
