import { describe, expect, it } from "vitest";

import {
  addMoney,
  assertSameCurrency,
  formatMoneyBoundary,
  money,
  moneyFromMajorUnit,
  moneyToMajorUnitString,
  multiplyMoneyByRate,
} from "./money";

describe("money utilities", () => {
  it("keeps decimal precision when converting major units to minor units", () => {
    const left = moneyFromMajorUnit("0.10", "USD");
    const right = moneyFromMajorUnit("0.20", "USD");

    expect(addMoney(left, right)).toEqual(money(BigInt(30), "USD"));
    expect(moneyToMajorUnitString(addMoney(left, right))).toBe("0.30");
  });

  it("rounds multiplication by basis-point rates in minor units", () => {
    const fee = multiplyMoneyByRate(moneyFromMajorUnit("19.99", "USD"), {
      basisPoints: 250,
    });

    expect(fee).toEqual(money(BigInt(50), "USD"));
  });

  it("rejects mixed-currency addition", () => {
    expect(() =>
      assertSameCurrency(money(BigInt(100), "USD"), money(BigInt(100), "KRW")),
    ).toThrow("Currency mismatch");
  });

  it("applies currency minor-unit formatting assumptions at the boundary", () => {
    expect(formatMoneyBoundary(money(BigInt(123456), "USD"))).toBe(
      "USD 1234.56",
    );
    expect(formatMoneyBoundary(money(BigInt(123456), "KRW"))).toBe(
      "KRW 123456",
    );
    expect(formatMoneyBoundary(moneyFromMajorUnit("1234.6", "JPY"))).toBe(
      "JPY 1235",
    );
  });
});
