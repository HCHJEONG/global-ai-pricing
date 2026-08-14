export type AuditAction =
  | "calculation.created"
  | "approval.requested"
  | "approval.approved"
  | "approval.rejected"
  | "approval.executed"
  | "approval.failed";

export type AuditTargetType = "calculation" | "approval";

export type AuditLogRecord = {
  id: string;
  actorId?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  occurredAt: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

export type CreateAuditLog = {
  actorId?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  occurredAt?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

export type AuditLogRepository = {
  create(input: CreateAuditLog): Promise<AuditLogRecord>;
  findRecent(input?: { limit?: number }): Promise<AuditLogRecord[]>;
  findByTarget(input: {
    targetType: AuditTargetType;
    targetId: string;
  }): Promise<AuditLogRecord[]>;
};
