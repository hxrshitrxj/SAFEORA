import crypto from "crypto";
import prisma from "@/lib/database/prisma";

export interface LogAuditParams {
  eventType: string;
  actorId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  outcome: "SUCCESS" | "FAILURE" | "DENIED";
  details?: Record<string, unknown>;
}

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Sanitizes details to ensure sensitive information (passwords, keys, tokens) is never logged.
 */
function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) return {};
  const cleaned: Record<string, unknown> = {};
  const blockedKeys = ["password", "token", "key", "secret", "iv", "ciphertext", "cookie"];

  for (const [k, v] of Object.entries(details)) {
    const isBlocked = blockedKeys.some((b) => k.toLowerCase().includes(b));
    if (isBlocked) {
      cleaned[k] = "[REDACTED_BY_SECURITY_POLICY]";
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

/**
 * Records an immutable audit log entry linked via a cryptographic hash chain.
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    // Fetch last event to link hash chain
    const lastEvent = await prisma.auditEvent.findFirst({
      orderBy: { sequenceNumber: "desc" },
    });

    const sequenceNumber = (lastEvent?.sequenceNumber || 0) + 1;
    const previousHash = lastEvent?.entryHash || GENESIS_HASH;
    const timestamp = new Date();
    const sanitized = sanitizeDetails(params.details);
    const detailsJson = JSON.stringify(sanitized);

    // Compute entry hash
    const hashPayload = [
      sequenceNumber,
      timestamp.toISOString(),
      params.actorId || "SYSTEM",
      params.eventType,
      params.outcome,
      params.resourceType || "",
      params.resourceId || "",
      detailsJson,
      previousHash,
    ].join("|");

    const entryHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

    return await prisma.auditEvent.create({
      data: {
        sequenceNumber,
        eventType: params.eventType,
        actorId: params.actorId || null,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        outcome: params.outcome,
        details: detailsJson,
        previousHash,
        entryHash,
        timestamp,
      },
    });
  } catch (err) {
    console.error("Failed to append audit event:", err);
    return null;
  }
}

/**
 * Verifies the integrity of the audit log hash chain.
 */
export async function verifyAuditChain(): Promise<{
  isValid: boolean;
  totalEvents: number;
  brokenSequence?: number;
  details: string;
}> {
  const events = await prisma.auditEvent.findMany({
    orderBy: { sequenceNumber: "asc" },
  });

  if (events.length === 0) {
    return { isValid: true, totalEvents: 0, details: "Audit log is empty." };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    if (ev.previousHash !== expectedPreviousHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        brokenSequence: ev.sequenceNumber,
        details: `Hash chain broken at sequence #${ev.sequenceNumber}. Previous hash mismatch.`,
      };
    }

    const hashPayload = [
      ev.sequenceNumber,
      ev.timestamp.toISOString(),
      ev.actorId || "SYSTEM",
      ev.eventType,
      ev.outcome,
      ev.resourceType || "",
      ev.resourceId || "",
      ev.details || "{}",
      ev.previousHash,
    ].join("|");

    const recomputedHash = crypto.createHash("sha256").update(hashPayload).digest("hex");
    if (recomputedHash !== ev.entryHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        brokenSequence: ev.sequenceNumber,
        details: `Audit entry tampering detected at sequence #${ev.sequenceNumber}. Stored entry hash does not match recomputed hash.`,
      };
    }

    expectedPreviousHash = ev.entryHash;
  }

  return {
    isValid: true,
    totalEvents: events.length,
    details: "Audit log cryptographic hash chain fully verified.",
  };
}
