import { randomUUID } from "node:crypto";

import { asc, desc, eq } from "drizzle-orm";

import type {
  ProductEventRecord,
  ProductEventRepository,
  RecordProductEvent,
} from "../../../application/analytics";
import type { DatabaseClient } from "../client";
import { parseJson, stringifyJson } from "../json";
import { productEvents } from "../schema";

type ProductEventRow = typeof productEvents.$inferSelect;

function parseOptionalJson(value: string | null): unknown {
  return value === null ? undefined : parseJson(value);
}

function toOptionalJson(value: unknown): string | null {
  return value === undefined ? null : stringifyJson(value);
}

function toRecord(row: ProductEventRow): ProductEventRecord {
  return {
    id: row.id,
    name: row.name as ProductEventRecord["name"],
    productId: row.productId ?? undefined,
    calculationId: row.calculationId ?? undefined,
    approvalId: row.approvalId ?? undefined,
    actorId: row.actorId ?? undefined,
    experimentVariant: row.experimentVariant ?? undefined,
    occurredAt: row.occurredAt,
    metadata: parseOptionalJson(row.metadataJson),
  };
}

export class DrizzleProductEventRepository implements ProductEventRepository {
  constructor(private readonly db: DatabaseClient) {}

  async record(input: RecordProductEvent): Promise<ProductEventRecord> {
    const row = {
      id: randomUUID(),
      name: input.name,
      productId: input.productId ?? null,
      calculationId: input.calculationId ?? null,
      approvalId: input.approvalId ?? null,
      actorId: input.actorId ?? null,
      experimentVariant: input.experimentVariant ?? null,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      metadataJson: toOptionalJson(input.metadata),
    };

    await this.db.insert(productEvents).values(row);

    return toRecord(row);
  }

  async findRecent(input: { limit?: number } = {}): Promise<ProductEventRecord[]> {
    const rows = await this.db.query.productEvents.findMany({
      limit: input.limit ?? 100,
      orderBy: [desc(productEvents.occurredAt)],
    });

    return rows.map(toRecord);
  }

  async findByProduct(input: { productId: string }): Promise<ProductEventRecord[]> {
    const rows = await this.db.query.productEvents.findMany({
      where: (table) => eq(table.productId, input.productId),
      orderBy: [asc(productEvents.occurredAt)],
    });

    return rows.map(toRecord);
  }
}
