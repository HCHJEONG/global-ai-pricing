import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  apparelTariffEstimateFixture,
  calculateLandedPrice,
  koreaPricingPolicyFixture,
  koreaVatRuleFixture,
  normalizeSourceProductFixture,
  uniqloUsProduct456009Fixture,
  usdKrwExchangeRateFixture,
} from "../../../domain/pricing";
import { bootstrapDatabase } from "../bootstrap";
import { createDatabaseClient, createSqliteConnection } from "../client";
import { seedDatabase } from "../seed";
import { DrizzleCalculationSnapshotRepository } from "./calculation-snapshot-repository";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("DrizzleCalculationSnapshotRepository", () => {
  it("bootstraps a missing sqlite file and reads back one calculation snapshot", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "global-ai-pricing-"));
    tempDirs.push(tempDir);
    const databaseUrl = `file:${path.join(tempDir, "pricing.db")}`;
    const sqlite = createSqliteConnection(databaseUrl);
    const db = createDatabaseClient(sqlite);

    try {
      await bootstrapDatabase(db);
      await seedDatabase(db);

      const product = normalizeSourceProductFixture(uniqloUsProduct456009Fixture);
      const pricingInput = {
        productCost: product.price,
        sourceCountry: product.sourceMarket,
        destinationCountry: "KR" as const,
        shippingCost: product.shippingCost!,
        tariffRate: apparelTariffEstimateFixture.rate,
        vatRate: koreaVatRuleFixture.rate,
        exchangeRate: usdKrwExchangeRateFixture,
        paymentFeeRate: koreaPricingPolicyFixture.paymentFeeRate,
        targetMarginRate: koreaPricingPolicyFixture.targetMarginRate,
        rounding: koreaPricingPolicyFixture.rounding,
        pricingPolicyVersion: koreaPricingPolicyFixture.version,
      };
      const calculationOutput = calculateLandedPrice(pricingInput, {
        calculatedAt: "2026-08-14T12:00:00.000+09:00",
      });
      const repository = new DrizzleCalculationSnapshotRepository(db);

      const created = await repository.create({
        productId: product.productId,
        sourceUrl: product.sourceUrl,
        sourceName: product.sourceName,
        sourceObservedAt: product.observedAt,
        calculationInput: {
          product,
          pricingInput,
        },
        calculationOutput,
        externalProductPayload: uniqloUsProduct456009Fixture.rawExtractedFields,
      });
      const found = await repository.findById(created.id);

      expect(fs.existsSync(path.join(tempDir, "pricing.db"))).toBe(true);
      expect(found).toEqual(created);
      expect(found?.calculationOutput.recommendedPrice).toEqual({
        amountMinor: BigInt(61200),
        currency: "KRW",
      });
      expect(found?.engineVersion).toBe(calculationOutput.engineVersion);
      expect(found?.policyVersion).toBe(koreaPricingPolicyFixture.version);
    } finally {
      sqlite.close();
    }
  });
});
