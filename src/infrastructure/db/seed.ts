import {
  apparelTariffEstimateFixture,
  countryFixtures,
  currencyFixtures,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  usdKrwExchangeRateFixture,
  usToKoreaShippingRuleFixture,
} from "../../domain/pricing";
import type { DatabaseClient } from "./client";
import {
  countries,
  currencies,
  exchangeRates,
  pricingPolicies,
  shippingRules,
  tariffRules,
  taxRules,
} from "./schema";

function nowIso() {
  return new Date().toISOString();
}

export async function seedDatabase(db: DatabaseClient): Promise<void> {
  const timestamp = nowIso();

  await db
    .insert(currencies)
    .values(
      currencyFixtures.map((currency) => ({
        code: currency.code,
        minorUnits: currency.minorUnits,
        symbol: currency.symbol,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(countries)
    .values(
      countryFixtures.map((country) => ({
        code: country.code,
        name: country.name,
        defaultCurrencyCode: country.defaultCurrency,
        marketRole: country.marketRole,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(exchangeRates)
    .values({
      id: usdKrwExchangeRateFixture.version ?? "fx-usd-krw-demo",
      fromCurrencyCode: usdKrwExchangeRateFixture.fromCurrency,
      toCurrencyCode: usdKrwExchangeRateFixture.toCurrency,
      rate: usdKrwExchangeRateFixture.rate,
      basis: usdKrwExchangeRateFixture.basis,
      observedAt: usdKrwExchangeRateFixture.observedAt,
      source: usdKrwExchangeRateFixture.source,
      version: usdKrwExchangeRateFixture.version,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(taxRules)
    .values({
      id: koreaVatRuleFixture.id,
      countryCode: koreaVatRuleFixture.country,
      kind: koreaVatRuleFixture.kind,
      rateBasisPoints: koreaVatRuleFixture.rate.basisPoints,
      taxableBase: koreaVatRuleFixture.taxableBase,
      effectiveFrom: koreaVatRuleFixture.effectiveFrom,
      source: koreaVatRuleFixture.source,
      sourceObservedAt: koreaVatRuleFixture.sourceObservedAt,
      version: koreaVatRuleFixture.version,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(tariffRules)
    .values({
      id: apparelTariffEstimateFixture.id,
      sourceCountryCode: apparelTariffEstimateFixture.sourceCountry,
      destinationCountryCode: apparelTariffEstimateFixture.destinationCountry,
      productCategory: apparelTariffEstimateFixture.productCategory,
      rateBasisPoints: apparelTariffEstimateFixture.rate.basisPoints,
      classificationBasis: apparelTariffEstimateFixture.classificationBasis,
      determination: apparelTariffEstimateFixture.determination,
      source: apparelTariffEstimateFixture.source,
      sourceObservedAt: apparelTariffEstimateFixture.sourceObservedAt,
      version: apparelTariffEstimateFixture.version,
      disclaimer: apparelTariffEstimateFixture.disclaimer,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(shippingRules)
    .values({
      id: usToKoreaShippingRuleFixture.id,
      sourceCountryCode: usToKoreaShippingRuleFixture.sourceCountry,
      destinationCountryCode: usToKoreaShippingRuleFixture.destinationCountry,
      method: usToKoreaShippingRuleFixture.method,
      flatCostAmountMinor:
        usToKoreaShippingRuleFixture.flatCost.amountMinor.toString(),
      flatCostCurrencyCode: usToKoreaShippingRuleFixture.flatCost.currency,
      effectiveFrom: usToKoreaShippingRuleFixture.effectiveFrom,
      source: usToKoreaShippingRuleFixture.source,
      sourceObservedAt: usToKoreaShippingRuleFixture.sourceObservedAt,
      version: usToKoreaShippingRuleFixture.version,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing();

  await db
    .insert(pricingPolicies)
    .values({
      id: koreaPricingPolicyFixture.id,
      version: koreaPricingPolicyFixture.version,
      targetMarginRateBasisPoints:
        koreaPricingPolicyFixture.targetMarginRate.basisPoints,
      paymentFeeRateBasisPoints:
        koreaPricingPolicyFixture.paymentFeeRate.basisPoints,
      roundingCurrencyCode: koreaPricingPolicyFixture.rounding.currency,
      roundingIncrementMinor:
        koreaPricingPolicyFixture.rounding.incrementMinor.toString(),
      roundingMode: koreaPricingPolicyFixture.rounding.mode,
      effectiveFrom: koreaPricingPolicyFixture.effectiveFrom,
      source: koreaPricingPolicyFixture.source,
      sourceObservedAt: koreaPricingPolicyFixture.sourceObservedAt,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoNothing();
}
