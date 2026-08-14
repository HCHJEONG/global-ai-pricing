export type CurrencyCode = "USD" | "KRW" | "JPY" | "CNY";

export type CountryCode = "US" | "KR" | "JP" | "CN";

export type Money = {
  amountMinor: bigint;
  currency: CurrencyCode;
};

export type Rate = {
  basisPoints: number;
};

export type ExchangeRate = {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: string;
  basis: "mid_market" | "provider_quote" | "manual_seed";
  observedAt: string;
  source: string;
  version?: string;
};

export type CountryFixture = {
  code: CountryCode;
  name: string;
  defaultCurrency: CurrencyCode;
  marketRole: "source" | "destination" | "source_and_destination";
};

export type CurrencyFixture = {
  code: CurrencyCode;
  minorUnits: number;
  symbol: string;
};

export type TaxRuleFixture = {
  id: string;
  country: CountryCode;
  kind: "vat";
  rate: Rate;
  taxableBase: "cost_shipping_tariff";
  effectiveFrom: string;
  source: string;
  sourceObservedAt: string;
  version: string;
};

export type TariffRuleFixture = {
  id: string;
  sourceCountry: CountryCode;
  destinationCountry: CountryCode;
  productCategory: "apparel";
  rate: Rate;
  classificationBasis: "category_estimate";
  determination: "estimate";
  source: string;
  sourceObservedAt: string;
  version: string;
  disclaimer: string;
};

export type ShippingRuleFixture = {
  id: string;
  sourceCountry: CountryCode;
  destinationCountry: CountryCode;
  method: "standard_cross_border";
  flatCost: Money;
  effectiveFrom: string;
  source: string;
  sourceObservedAt: string;
  version: string;
};

export type PricingPolicyFixture = {
  id: string;
  version: string;
  targetMarginRate: Rate;
  paymentFeeRate: Rate;
  rounding: {
    currency: CurrencyCode;
    incrementMinor: bigint;
    mode: "nearest" | "up";
  };
  effectiveFrom: string;
  source: string;
  sourceObservedAt: string;
};

export type SourceProductFixture = {
  fixtureId: string;
  sourceName: string;
  sourceUrl: string;
  sourceMarket: CountryCode;
  observedAt: string;
  adapterVersion: string;
  rawExtractedFields: {
    productId: string;
    productName: string;
    brand?: string;
    price: {
      amount: string;
      currency: CurrencyCode;
      taxPolicy?: "exclusive" | "inclusive" | "unknown";
    };
    shippingCost?: {
      amount: string;
      currency: CurrencyCode;
      label?: string;
    };
    freeShippingThreshold?: {
      amount: string;
      currency: CurrencyCode;
      label?: string;
    };
    originCountry?: string;
    material?: string;
    availability?: string;
    description?: string;
    colors?: string[];
    sizes?: string[];
    imageUrl?: string;
  };
};

export type NormalizedSourceProduct = {
  sourceUrl: string;
  sourceName: string;
  sourceMarket: CountryCode;
  productName: string;
  productId?: string;
  brand?: string;
  price: Money;
  shippingCost?: Money;
  freeShippingThreshold?: Money;
  originCountry?: string;
  material?: string;
  availability?: string;
  description?: string;
  observedAt: string;
  adapterVersion: string;
  rawData: SourceProductFixture["rawExtractedFields"];
};

export type PricingInput = {
  productCost: Money;
  sourceCountry: CountryCode;
  destinationCountry: CountryCode;
  shippingCost: Money;
  tariffRate: Rate;
  vatRate: Rate;
  exchangeRate: ExchangeRate;
  paymentFeeRate: Rate;
  targetMarginRate: Rate;
  discountRate?: Rate;
  pricingPolicyVersion: string;
};

export type PriceComponentKind =
  | "product_cost"
  | "shipping"
  | "tariff"
  | "vat"
  | "payment_fee"
  | "margin"
  | "discount"
  | "rounding";

export type PriceComponent = {
  kind: PriceComponentKind;
  label: string;
  amount: Money;
  rate?: Rate;
  sourceAmount?: Money;
  note?: string;
};

export type PricingAssumption = {
  code: string;
  message: string;
};

export type PricingWarningSeverity = "info" | "warning" | "blocking";

export type PricingWarning = {
  code: string;
  severity: PricingWarningSeverity;
  message: string;
};

export type PricingResult = {
  recommendedPrice: Money;
  breakdown: PriceComponent[];
  assumptions: PricingAssumption[];
  warnings: PricingWarning[];
  engineVersion: string;
  policyVersion: string;
  calculatedAt: string;
};
