import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import type {
  AuditLogRecord,
  AuditLogRepository,
  CreateAuditLog,
} from "../../../application/audit";
import type { DatabaseClient } from "../client";
import { parseJson, stringifyJson } from "../json";
import { auditLogs } from "../schema";

type AuditLogRow = typeof auditLogs.$inferSelect;

function parseOptionalJson(value: string | null): unknown {
  return value === null ? undefined : parseJson(value);
}

function toRecord(row: AuditLogRow): AuditLogRecord {
  return {
    id: row.id,
    actorId: row.actorId ?? undefined,
    action: row.action as AuditLogRecord["action"],
    targetType: row.targetType as AuditLogRecord["targetType"],
    targetId: row.targetId,
    occurredAt: row.occurredAt,
    before: parseOptionalJson(row.beforeJson),
    after: parseOptionalJson(row.afterJson),
    metadata: parseOptionalJson(row.metadataJson),
  };
}

function toOptionalJson(value: unknown): string | null {
  return value === undefined ? null : stringifyJson(value);
}

export class DrizzleAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(input: CreateAuditLog): Promise<AuditLogRecord> {
    const row = {
      id: randomUUID(),
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      beforeJson: toOptionalJson(input.before),
      afterJson: toOptionalJson(input.after),
      metadataJson: toOptionalJson(input.metadata),
    };

    await this.db.insert(auditLogs).values(row);

    return toRecord(row);
  }

  async findByTarget(input: {
    targetType: AuditLogRecord["targetType"];
    targetId: string;
  }): Promise<AuditLogRecord[]> {
    const rows = await this.db.query.auditLogs.findMany({
      where: (table, { and }) =>
        and(
          eq(table.targetType, input.targetType),
          eq(table.targetId, input.targetId),
        ),
      orderBy: [asc(auditLogs.occurredAt)],
    });

    return rows.map(toRecord);
  }
}

