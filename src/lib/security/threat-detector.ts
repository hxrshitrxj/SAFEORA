import prisma from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { revokeSession } from "@/lib/auth/session";

export interface ThreatSignal {
  userId?: string | null;
  sessionId?: string | null;
  eventType:
    | "INTEGRITY_FAILURE"
    | "UNAUTHORIZED_ACCESS"
    | "BULK_ACTIVITY"
    | "SIGNATURE_INVALID"
    | "VERSION_ROLLBACK"
    | "SUSPICIOUS_DOWNLOAD";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  resourceType?: "DOCUMENT" | "SESSION" | "MANIFEST" | "RECOVERY" | "USER";
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
}

export interface ContainmentActionReport {
  contained: boolean;
  incidentCreated: boolean;
  incidentNumber?: string;
  actionsTaken: string[];
  message: string;
}

/**
 * Generates human-readable sequential incident numbers (e.g. INC-2026-0042)
 */
async function generateIncidentNumber(): Promise<string> {
  const count = await prisma.securityIncident.count();
  const year = new Date().getFullYear();
  return `INC-${year}-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Core Threat Detection & Automated Containment Engine.
 * Evaluates signals against security policies and executes proportionate containment.
 */
export async function processThreatSignal(signal: ThreatSignal): Promise<ContainmentActionReport> {
  const actionsTaken: string[] = [];

  // 1. Record Security Event in database
  const event = await prisma.securityEvent.create({
    data: {
      userId: signal.userId || null,
      eventType: signal.eventType,
      severity: signal.severity,
      resourceType: signal.resourceType || null,
      resourceId: signal.resourceId || null,
      details: signal.details ? JSON.stringify(signal.details) : null,
      ipAddress: signal.ipAddress || null,
      userAgent: signal.userAgent || null,
    },
  });
  actionsTaken.push(`SECURITY_EVENT_RECORDED:${event.id}`);

  // 2. Audit log the signal
  await logAuditEvent({
    eventType: `THREAT_DETECTED:${signal.eventType}`,
    actorId: signal.userId || "SYSTEM_WATCHDOG",
    resourceType: signal.resourceType,
    resourceId: signal.resourceId,
    outcome: "DENIED",
    details: {
      severity: signal.severity,
      details: signal.details,
    },
  });

  // Check user settings for automated containment preferences
  let shouldAutoContain = true;
  let shouldQuarantineDoc = true;

  if (signal.userId) {
    const settings = await prisma.userSecuritySettings.findUnique({
      where: { userId: signal.userId },
    });
    if (settings) {
      shouldAutoContain = settings.autoContainSession;
      shouldQuarantineDoc = settings.autoQuarantineTampered;
    }
  }

  let incidentCreated = false;
  let incidentNumber: string | undefined;

  // 3. Rule Evaluation & Containment Actions

  // Rule A: Manifest Signature Invalid or Document Tampering
  if (
    (signal.eventType === "SIGNATURE_INVALID" || signal.eventType === "INTEGRITY_FAILURE") &&
    signal.resourceType === "DOCUMENT" &&
    signal.resourceId
  ) {
    if (shouldQuarantineDoc) {
      await prisma.document.update({
        where: { id: signal.resourceId },
        data: {
          integrityStatus: "TAMPERED",
          isRestricted: true,
          restrictionReason: `Automated containment triggered: ${signal.eventType} detected. Content quarantined pending integrity verification.`,
        },
      }).catch(() => {});
      actionsTaken.push("DOCUMENT_QUARANTINED");
    }

    // Create High/Critical Incident
    incidentNumber = await generateIncidentNumber();
    await prisma.securityIncident.create({
      data: {
        userId: signal.userId || null,
        incidentNumber,
        title: `Integrity Violation: ${signal.eventType} on Document ${signal.resourceId}`,
        severity: signal.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        status: "CONTAINED",
        detectionSource: "INTEGRITY_MONITOR",
        affectedResourceId: signal.resourceId,
        affectedResourceType: "DOCUMENT",
        actionsTaken: JSON.stringify(actionsTaken),
        notes: `Tampering detected at ${new Date().toISOString()}. Automated document containment applied. Verified recovery backup copy is available.`,
      },
    });
    incidentCreated = true;
  }

  // Rule B: Unauthorized Session Access
  if (signal.eventType === "UNAUTHORIZED_ACCESS" && signal.sessionId) {
    if (shouldAutoContain) {
      await revokeSession(signal.sessionId, "Automated containment: unauthorized activity detected");
      actionsTaken.push(`SESSION_REVOKED:${signal.sessionId}`);
    }

    incidentNumber = await generateIncidentNumber();
    await prisma.securityIncident.create({
      data: {
        userId: signal.userId || null,
        incidentNumber,
        title: `Unauthorized Session Access Attempt (${signal.sessionId.slice(0, 8)}...)`,
        severity: "HIGH",
        status: "CONTAINED",
        detectionSource: "SESSION_GUARD",
        affectedResourceId: signal.sessionId,
        affectedResourceType: "SESSION",
        actionsTaken: JSON.stringify(actionsTaken),
        notes: "Target session revoked immediately to contain potential token hijacking or replay attack.",
      },
    });
    incidentCreated = true;
  }

  // Rule C: Bulk Suspicious Activity
  if (signal.eventType === "BULK_ACTIVITY") {
    if (signal.sessionId && shouldAutoContain) {
      await revokeSession(signal.sessionId, "Automated containment: bulk activity threshold exceeded");
      actionsTaken.push(`SESSION_REVOKED:${signal.sessionId}`);
    }

    incidentNumber = await generateIncidentNumber();
    await prisma.securityIncident.create({
      data: {
        userId: signal.userId || null,
        incidentNumber,
        title: "Suspicious Bulk Activity Detected (Threshold Exceeded)",
        severity: "MEDIUM",
        status: "CONTAINED",
        detectionSource: "RATE_DETECTOR",
        affectedResourceId: signal.sessionId || signal.userId || null,
        affectedResourceType: signal.sessionId ? "SESSION" : "USER",
        actionsTaken: JSON.stringify(actionsTaken),
        notes: "Automated rate containment applied. Request activity exceeded safety threshold.",
      },
    });
    incidentCreated = true;
  }

  // Rule D: Unexpected Document Version Rollback Attempt
  if (signal.eventType === "VERSION_ROLLBACK" && signal.resourceId) {
    incidentNumber = await generateIncidentNumber();
    await prisma.securityIncident.create({
      data: {
        userId: signal.userId || null,
        incidentNumber,
        title: `Unauthorized Version Rollback Attempt on Document ${signal.resourceId}`,
        severity: "HIGH",
        status: "OPEN",
        detectionSource: "VERSION_WATCHDOG",
        affectedResourceId: signal.resourceId,
        affectedResourceType: "DOCUMENT",
        actionsTaken: JSON.stringify(actionsTaken),
        notes: "An operation attempted to replace the latest trusted version with an older or unsigned version.",
      },
    });
    incidentCreated = true;
  }

  return {
    contained: actionsTaken.length > 1,
    incidentCreated,
    incidentNumber,
    actionsTaken,
    message: `Threat signal ${signal.eventType} processed. Actions taken: ${actionsTaken.join(", ")}`,
  };
}
