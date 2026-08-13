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
