import type { ApprovalState } from "../../domain/approvals";
import type {
  AuditLogRecord,
  AuditLogRepository,
  CreateAuditLog,
} from "./logs";

type AuditContext = {
  actorId?: string;
  occurredAt?: string;
  metadata?: unknown;
};

type ApprovalSnapshot = {
  id: string;
  calculationId?: string;
  status: ApprovalState;
  reason?: string;
};

const sensitiveKeyPattern =
  /(?:secret|token|password|credential|api[_-]?key|authorization|raw[_-]?prompt|prompt)/i;

export function sanitizeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key)
          ? "[redacted]"
          : sanitizeAuditValue(nestedValue),
      ]),
    );
  }

  return value;
}

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  recordCalculationCreated(input: {
    calculationId: string;
    actorId?: string;
    occurredAt?: string;
    metadata?: unknown;
    after?: unknown;
  }): Promise<AuditLogRecord> {
    return this.create({
      actorId: input.actorId,
      action: "calculation.created",
      targetType: "calculation",
      targetId: input.calculationId,
      occurredAt: input.occurredAt,
      after: input.after,
      metadata: input.metadata,
    });
  }

  recordApprovalRequested(
    approval: ApprovalSnapshot,
    context: AuditContext = {},
  ): Promise<AuditLogRecord> {
    return this.create({
      actorId: context.actorId,
      action: "approval.requested",
      targetType: "approval",
      targetId: approval.id,
      occurredAt: context.occurredAt,
      after: approval,
      metadata: context.metadata,
    });
  }

  recordApprovalDecision(input: {
    before: ApprovalSnapshot;
    after: ApprovalSnapshot;
    actorId?: string;
    occurredAt?: string;
    metadata?: unknown;
  }): Promise<AuditLogRecord> {
    const action =
      input.after.status === "rejected" ? "approval.rejected" : "approval.approved";

    return this.create({
      actorId: input.actorId,
      action,
      targetType: "approval",
      targetId: input.after.id,
      occurredAt: input.occurredAt,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
    });
  }

  recordApprovalExecuted(
    before: ApprovalSnapshot,
    after: ApprovalSnapshot,
    context: AuditContext = {},
  ): Promise<AuditLogRecord> {
    return this.create({
      actorId: context.actorId,
      action: "approval.executed",
      targetType: "approval",
      targetId: after.id,
      occurredAt: context.occurredAt,
      before,
      after,
      metadata: context.metadata,
    });
  }

  recordApprovalFailed(
    before: ApprovalSnapshot,
    after: ApprovalSnapshot,
    context: AuditContext = {},
  ): Promise<AuditLogRecord> {
    return this.create({
      actorId: context.actorId,
      action: "approval.failed",
      targetType: "approval",
      targetId: after.id,
      occurredAt: context.occurredAt,
      before,
      after,
      metadata: context.metadata,
    });
  }

  private create(input: CreateAuditLog): Promise<AuditLogRecord> {
    return this.repository.create({
      ...input,
      before: sanitizeAuditValue(input.before),
      after: sanitizeAuditValue(input.after),
      metadata: sanitizeAuditValue(input.metadata),
    });
  }
}

