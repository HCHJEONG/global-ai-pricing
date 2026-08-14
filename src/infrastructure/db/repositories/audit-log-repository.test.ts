import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { AuditLogService } from "../../../application/audit";
import { applyApprovalTransition } from "../../../domain/approvals";
import type { ApprovalState } from "../../../domain/approvals";
import { bootstrapDatabase } from "../bootstrap";
import { createDatabaseClient, createSqliteConnection } from "../client";
import { DrizzleAuditLogRepository } from "./audit-log-repository";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function approvalSnapshot(input: {
  id: string;
  calculationId: string;
  status: ApprovalState;
  reason?: string;
}) {
  return input;
}

describe("DrizzleAuditLogRepository", () => {
  it("writes an audit trail for an approval flow without storing sensitive prompt data", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "global-ai-pricing-"));
    tempDirs.push(tempDir);
    const databaseUrl = `file:${path.join(tempDir, "pricing.db")}`;
    const sqlite = createSqliteConnection(databaseUrl);
    const db = createDatabaseClient(sqlite);

    try {
      await bootstrapDatabase(db);

      const repository = new DrizzleAuditLogRepository(db);
      const auditLog = new AuditLogService(repository);
      const actorId = "user:pricing-admin";
      const calculationId = randomUUID();
      const approvalId = randomUUID();
      const requestedAt = "2026-08-14T03:00:00.000Z";
      const approvedAt = "2026-08-14T03:01:00.000Z";
      const executedAt = "2026-08-14T03:02:00.000Z";

      await auditLog.recordCalculationCreated({
        calculationId,
        actorId: "system:pricing-engine",
        occurredAt: "2026-08-14T02:59:00.000Z",
        after: {
          calculationId,
          policyVersion: "pricing-policy-v1",
          rawPrompt: "Do not persist this prompt.",
        },
        metadata: {
          apiKey: "should-not-be-stored",
          source: "fixture",
        },
      });

      const requested = approvalSnapshot({
        id: approvalId,
        calculationId,
        status: "approval_required",
        reason: "Price change exceeded approval threshold.",
      });
      await auditLog.recordApprovalRequested(requested, {
        actorId,
        occurredAt: requestedAt,
        metadata: {
          thresholdBasisPoints: 1000,
          prompt: "This approval prompt should be redacted.",
        },
      });

      const approved = approvalSnapshot({
        ...requested,
        status: applyApprovalTransition(requested.status, "approve"),
      });
      await auditLog.recordApprovalDecision({
        before: requested,
        after: approved,
        actorId,
        occurredAt: approvedAt,
      });

      const executed = approvalSnapshot({
        ...approved,
        status: applyApprovalTransition(approved.status, "mark_executed"),
      });
      await auditLog.recordApprovalExecuted(approved, executed, {
        actorId: "system:pricing-executor",
        occurredAt: executedAt,
      });

      const rejectedApprovalId = randomUUID();
      const rejectionBefore = approvalSnapshot({
        id: rejectedApprovalId,
        calculationId,
        status: "approval_required",
      });
      await auditLog.recordApprovalDecision({
        before: rejectionBefore,
        after: {
          ...rejectionBefore,
          status: applyApprovalTransition(rejectionBefore.status, "reject"),
          reason: "Manual rejection.",
        },
        actorId,
        occurredAt: "2026-08-14T03:03:00.000Z",
      });

      const failedApprovalId = randomUUID();
      const failureBefore = approvalSnapshot({
        id: failedApprovalId,
        calculationId,
        status: "approved",
      });
      await auditLog.recordApprovalFailed(
        failureBefore,
        {
          ...failureBefore,
          status: applyApprovalTransition(failureBefore.status, "mark_failed"),
          reason: "Executor returned an error.",
        },
        {
          actorId: "system:pricing-executor",
          occurredAt: "2026-08-14T03:04:00.000Z",
          metadata: { credentialToken: "should-not-be-stored" },
        },
      );

      const calculationTrail = await repository.findByTarget({
        targetType: "calculation",
        targetId: calculationId,
      });
      const approvalTrail = await repository.findByTarget({
        targetType: "approval",
        targetId: approvalId,
      });
      const rejectedTrail = await repository.findByTarget({
        targetType: "approval",
        targetId: rejectedApprovalId,
      });
      const failedTrail = await repository.findByTarget({
        targetType: "approval",
        targetId: failedApprovalId,
      });

      expect(calculationTrail).toMatchObject([
        {
          actorId: "system:pricing-engine",
          action: "calculation.created",
          targetType: "calculation",
          targetId: calculationId,
          after: {
            calculationId,
            policyVersion: "pricing-policy-v1",
            rawPrompt: "[redacted]",
          },
          metadata: {
            apiKey: "[redacted]",
            source: "fixture",
          },
        },
      ]);
      expect(approvalTrail.map((entry) => entry.action)).toEqual([
        "approval.requested",
        "approval.approved",
        "approval.executed",
      ]);
      expect(approvalTrail[1]).toMatchObject({
        actorId,
        before: { status: "approval_required" },
        after: { status: "approved" },
      });
      expect(approvalTrail[2]).toMatchObject({
        actorId: "system:pricing-executor",
        before: { status: "approved" },
        after: { status: "executed" },
      });
      expect(rejectedTrail).toMatchObject([
        {
          action: "approval.rejected",
          before: { status: "approval_required" },
          after: { status: "rejected", reason: "Manual rejection." },
        },
      ]);
      expect(failedTrail).toMatchObject([
        {
          action: "approval.failed",
          before: { status: "approved" },
          after: { status: "failed", reason: "Executor returned an error." },
          metadata: { credentialToken: "[redacted]" },
        },
      ]);
    } finally {
      sqlite.close();
    }
  });
});
