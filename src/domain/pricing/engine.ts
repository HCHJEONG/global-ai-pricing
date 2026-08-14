import Decimal from "decimal.js";

import {
  addMoney,
  assertSameCurrency,
  currencyMinorUnits,
  money,
  multiplyMoneyByRate,
} from "./money";
import type {
  ExchangeRate,
  Money,
  PriceComponent,
  PricingAssumption,
  PricingInput,
  PricingResult,
  PricingWarning,
} from "./types";

export const PRICING_ENGINE_VERSION = "pricing-engine-2026-08-14.unit-6";

const CalculationDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export type CalculatePricingOptions = {
  calculatedAt?: string;
  staleExchangeRateAfterDays?: number;
};

function convertMoney(value: Money, exchangeRate: ExchangeRate): Money {
  if (value.currency !== exchangeRate.fromCurrency) {
    throw new Error(
      `Exchange rate source currency mismatch: expected ${value.currency}, received ${exchangeRate.fromCurrency}`,
    );
  }

  const sourceScale = new CalculationDecimal(10).pow(
    currencyMinorUnits[value.currency],
  );
  const targetScale = new CalculationDecimal(10).pow(
    currencyMinorUnits[exchangeRate.toCurrency],
  );
  const amountMinor = new CalculationDecimal(value.amountMinor.toString())
    .div(sourceScale)
    .mul(exchangeRate.rate)
    .mul(targetScale)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

  return money(BigInt(amountMinor.toFixed(0)), exchangeRate.toCurrency);
}

function roundMoney(
  value: Money,
  rounding: PricingInput["rounding"],
): { rounded: Money; adjustment: Money } {
  if (value.currency !== rounding.currency) {
    throw new Error(
      `Rounding currency mismatch: expected ${value.currency}, received ${rounding.currency}`,
    );
  }

  if (rounding.incrementMinor <= BigInt(0)) {
    throw new Error("Rounding increment must be greater than zero");
  }

  const quotient = new CalculationDecimal(value.amountMinor.toString()).div(
    rounding.incrementMinor.toString(),
  );
  const roundedQuotient =
    rounding.mode === "up"
      ? quotient.ceil()
      : quotient.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const roundedMinor = BigInt(
    roundedQuotient.mul(rounding.incrementMinor.toString()).toFixed(0),
  );

  return {
    rounded: money(roundedMinor, value.currency),
    adjustment: money(roundedMinor - value.amountMinor, value.currency),
  };
}

function wholeDaysBetween(leftIso: string, rightIso: string): number {
  const left = new Date(leftIso).getTime();
  const right = new Date(rightIso).getTime();

  if (Number.isNaN(left) || Number.isNaN(right)) {
    return 0;
  }

  return Math.floor(Math.abs(right - left) / 86_400_000);
}

export function calculateLandedPrice(
  input: PricingInput,
  options: CalculatePricingOptions = {},
): PricingResult {
  assertSameCurrency(input.productCost, input.shippingCost);

  if (input.exchangeRate.toCurrency !== input.rounding.currency) {
    throw new Error(
      `Destination currency mismatch: expected ${input.rounding.currency}, received ${input.exchangeRate.toCurrency}`,
    );
  }

  const calculatedAt = options.calculatedAt ?? new Date().toISOString();
  const staleExchangeRateAfterDays = options.staleExchangeRateAfterDays ?? 1;

  const sourceLandedCost = addMoney(input.productCost, input.shippingCost);
  const productCost = convertMoney(input.productCost, input.exchangeRate);
  const shipping = convertMoney(input.shippingCost, input.exchangeRate);
  const landedCost = convertMoney(sourceLandedCost, input.exchangeRate);
  const tariff = multiplyMoneyByRate(landedCost, input.tariffRate);
  const vatBase = addMoney(landedCost, tariff);
  const vat = multiplyMoneyByRate(vatBase, input.vatRate);
  const preMarginSubtotal = addMoney(landedCost, tariff, vat);
  const paymentFee = multiplyMoneyByRate(preMarginSubtotal, input.paymentFeeRate);
  const margin = multiplyMoneyByRate(preMarginSubtotal, input.targetMarginRate);
  const discount = input.discountRate
    ? multiplyMoneyByRate(preMarginSubtotal, input.discountRate)
    : money(BigInt(0), preMarginSubtotal.currency);
  const beforeRounding = money(
    preMarginSubtotal.amountMinor +
      paymentFee.amountMinor +
      margin.amountMinor -
      discount.amountMinor,
    preMarginSubtotal.currency,
  );
  const { rounded: recommendedPrice, adjustment } = roundMoney(
    beforeRounding,
    input.rounding,
  );

  const breakdown: PriceComponent[] = [
    {
      kind: "product_cost",
      label: "Product cost",
      amount: productCost,
      sourceAmount: input.productCost,
    },
    {
      kind: "shipping",
      label: "Shipping",
      amount: shipping,
      sourceAmount: input.shippingCost,
    },
    {
      kind: "tariff",
      label: "Tariff estimate",
      amount: tariff,
      rate: input.tariffRate,
      note: "Estimated from product category, not an official customs ruling.",
    },
    {
      kind: "vat",
      label: "VAT estimate",
      amount: vat,
      rate: input.vatRate,
      note: "Applied to product cost, shipping, and tariff estimate.",
    },
    {
      kind: "payment_fee",
      label: "Payment fee",
      amount: paymentFee,
      rate: input.paymentFeeRate,
    },
    {
      kind: "margin",
      label: "Target margin",
      amount: margin,
      rate: input.targetMarginRate,
    },
    {
      kind: "discount",
      label: "Discount",
      amount: money(-discount.amountMinor, discount.currency),
      rate: input.discountRate,
    },
    {
      kind: "rounding",
      label: "Rounding adjustment",
      amount: adjustment,
      note: `${input.rounding.mode} to ${input.rounding.incrementMinor.toString()} minor units`,
    },
  ];

  const assumptions: PricingAssumption[] = [
    {
      code: "EXCHANGE_RATE_BASIS",
      message: `${input.exchangeRate.basis} ${input.exchangeRate.fromCurrency}/${input.exchangeRate.toCurrency} rate from ${input.exchangeRate.source}`,
    },
    {
      code: "CALCULATION_ORDER",
      message:
        "Cost and shipping are converted first; tariff and VAT are estimated before fee, margin, discount, and rounding.",
    },
    {
      code: "ROUNDING_POLICY",
      message: `Recommended price is rounded ${input.rounding.mode} to ${input.rounding.incrementMinor.toString()} ${input.rounding.currency} minor units.`,
    },
  ];

  const warnings: PricingWarning[] = [
    {
      code: "CUSTOMS_ESTIMATE_ONLY",
      severity: "warning",
      message:
        "Tariff and VAT are portfolio-demo estimates and are not official customs or tax advice.",
    },
  ];

  if (
    wholeDaysBetween(input.exchangeRate.observedAt, calculatedAt) >
    staleExchangeRateAfterDays
  ) {
    warnings.push({
      code: "STALE_EXCHANGE_RATE",
      severity: "warning",
      message: `Exchange rate observation is older than ${staleExchangeRateAfterDays} day(s).`,
    });
  }

  return {
    recommendedPrice,
    breakdown,
    assumptions,
    warnings,
    engineVersion: PRICING_ENGINE_VERSION,
    policyVersion: input.pricingPolicyVersion,
    calculatedAt,
  };
}
