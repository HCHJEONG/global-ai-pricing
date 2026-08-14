import Decimal from "decimal.js";

import type { CurrencyCode, Money, Rate } from "./types";

const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export const currencyMinorUnits: Record<CurrencyCode, number> = {
  CNY: 2,
  JPY: 0,
  KRW: 0,
  USD: 2,
};

export type MoneyRoundingMode = "half-up" | "floor" | "ceil";

const roundingModeByName: Record<MoneyRoundingMode, Decimal.Rounding> = {
  ceil: Decimal.ROUND_CEIL,
  floor: Decimal.ROUND_FLOOR,
  "half-up": Decimal.ROUND_HALF_UP,
};

export function money(amountMinor: bigint, currency: CurrencyCode): Money {
  return { amountMinor, currency };
}

export function assertSameCurrency(left: Money, right: Money): CurrencyCode {
  if (left.currency !== right.currency) {
    throw new Error(
      `Currency mismatch: expected ${left.currency}, received ${right.currency}`,
    );
  }

  return left.currency;
}

export function addMoney(...items: Money[]): Money {
  if (items.length === 0) {
    throw new Error("addMoney requires at least one money value");
  }

  const [first, ...rest] = items;
  const amountMinor = rest.reduce((total, item) => {
    assertSameCurrency(first, item);
    return total + item.amountMinor;
  }, first.amountMinor);

  return money(amountMinor, first.currency);
}

export function multiplyMoneyByRate(
  value: Money,
  rate: Rate,
  roundingMode: MoneyRoundingMode = "half-up",
): Money {
  const amountMinor = new MoneyDecimal(value.amountMinor.toString())
    .mul(rate.basisPoints.toString())
    .div(10_000)
    .toDecimalPlaces(0, roundingModeByName[roundingMode]);

  return money(BigInt(amountMinor.toFixed(0)), value.currency);
}

export function moneyFromMajorUnit(
  amount: string,
  currency: CurrencyCode,
  roundingMode: MoneyRoundingMode = "half-up",
): Money {
  const scale = currencyMinorUnits[currency];
  const amountMinor = new MoneyDecimal(amount)
    .mul(new MoneyDecimal(10).pow(scale))
    .toDecimalPlaces(0, roundingModeByName[roundingMode]);

  return money(BigInt(amountMinor.toFixed(0)), currency);
}

export function moneyToMajorUnitString(value: Money): string {
  const scale = currencyMinorUnits[value.currency];

  return new MoneyDecimal(value.amountMinor.toString())
    .div(new MoneyDecimal(10).pow(scale))
    .toFixed(scale);
}

export function formatMoneyBoundary(value: Money): string {
  return `${value.currency} ${moneyToMajorUnitString(value)}`;
}
