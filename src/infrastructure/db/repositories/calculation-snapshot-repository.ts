import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type {
  CalculationSnapshotRecord,
  CalculationSnapshotRepository,
  CreateCalculationSnapshot,
} from "../../../application/pricing/snapshots";
import type { DatabaseClient } from "../client";
import { parseJson, stringifyJson } from "../json";
import { pricingCalculations, pricingSnapshots } from "../schema";

type PricingCalculationRow = typeof pricingCalculations.$inferSelect;

function toRecord(row: PricingCalculationRow): CalculationSnapshotRecord {
  return {
    id: row.id,
    productId: row.productId ?? undefined,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    sourceObservedAt: row.sourceObservedAt,
    calculationInput: parseJson(row.inputJson),
    calculationOutput: parseJson(row.outputJson),
    engineVersion: row.engineVersion,
    policyVersion: row.policyVersion,
    calculatedAt: row.calculatedAt,
    createdAt: row.createdAt,
    externalProductPayload: row.externalProductPayloadJson
      ? parseJson(row.externalProductPayloadJson)
      : undefined,
  };
}

export class DrizzleCalculationSnapshotRepository
  implements CalculationSnapshotRepository
{
  constructor(private readonly db: DatabaseClient) {}

  async create(
    input: CreateCalculationSnapshot,
  ): Promise<CalculationSnapshotRecord> {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const inputJson = stringifyJson(input.calculationInput);
    const outputJson = stringifyJson(input.calculationOutput);
    const externalProductPayloadJson =
      input.externalProductPayload === undefined
        ? null
        : stringifyJson(input.externalProductPayload);

    await this.db.insert(pricingCalculations).values({
      id,
      productId: input.productId,
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      sourceObservedAt: input.sourceObservedAt,
      engineVersion: input.calculationOutput.engineVersion,
      policyVersion: input.calculationOutput.policyVersion,
      calculatedAt: input.calculationOutput.calculatedAt,
      inputJson,
      outputJson,
      externalProductPayloadJson,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await this.db.insert(pricingSnapshots).values({
      id: randomUUID(),
      calculationId: id,
      productId: input.productId,
      engineVersion: input.calculationOutput.engineVersion,
      policyVersion: input.calculationOutput.policyVersion,
      calculatedAt: input.calculationOutput.calculatedAt,
      snapshotJson: stringifyJson({
        calculationInput: input.calculationInput,
        calculationOutput: input.calculationOutput,
        externalProductPayload: input.externalProductPayload,
      }),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const record = await this.findById(id);
    if (!record) {
      throw new Error(`Calculation snapshot ${id} was not persisted.`);
    }

    return record;
  }

  async findById(id: string): Promise<CalculationSnapshotRecord | undefined> {
    const row = await this.db.query.pricingCalculations.findFirst({
      where: eq(pricingCalculations.id, id),
    });

    return row ? toRecord(row) : undefined;
  }
}
