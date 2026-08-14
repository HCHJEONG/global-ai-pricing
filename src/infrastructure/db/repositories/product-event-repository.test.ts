import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ProductEventService } from "../../../application/analytics";
import { getFixturePricingQuote } from "../../../application/pricing";
import { uniqloUsProduct456009Fixture } from "../../../domain/pricing";
import { bootstrapDatabase } from "../bootstrap";
import { createDatabaseClient, createSqliteConnection } from "../client";
import { DrizzleProductEventRepository } from "./product-event-repository";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("DrizzleProductEventRepository", () => {
  it("records product analytics without affecting pricing calculation output", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "global-ai-pricing-"));
    tempDirs.push(tempDir);
    const databaseUrl = `file:${path.join(tempDir, "pricing.db")}`;
    const sqlite = createSqliteConnection(databaseUrl);
    const db = createDatabaseClient(sqlite);

    try {
      await bootstrapDatabase(db);

      const before = getFixturePricingQuote({
        fixtureId: uniqloUsProduct456009Fixture.fixtureId,
        destinationCountry: "KR",
        calculatedAt: "2026-08-14T12:00:00.000+09:00",
      });
      const repository = new DrizzleProductEventRepository(db);
      const events = new ProductEventService(repository);

      const recorded = await events.recordPriceViewed({
        productId: "456009",
        actorId: "user:pricing-admin",
        experimentVariant: "portfolio-a",
        occurredAt: "2026-08-14T03:00:00.000Z",
        metadata: {
          route: "/ko/pricing",
          apiToken: "do-not-store",
        },
      });
      const found = await repository.findByProduct({ productId: "456009" });
      const after = getFixturePricingQuote({
        fixtureId: uniqloUsProduct456009Fixture.fixtureId,
        destinationCountry: "KR",
        calculatedAt: "2026-08-14T12:00:00.000+09:00",
      });

      expect(recorded).toMatchObject({
        name: "product.price_viewed",
        productId: "456009",
        actorId: "user:pricing-admin",
        experimentVariant: "portfolio-a",
        occurredAt: "2026-08-14T03:00:00.000Z",
        metadata: {
          route: "/ko/pricing",
          apiToken: "[redacted]",
        },
      });
      expect(found).toEqual([recorded]);
      expect(after).toEqual(before);
    } finally {
      sqlite.close();
    }
  });
});
