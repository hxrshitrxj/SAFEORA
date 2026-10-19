import prisma from "@/lib/database/prisma";
import { getStorageAdapter } from "@/lib/storage";

export class SecurityService {
  /**
   * Aggregates real security posture metrics from the database.
   * Calculates a transparent test-derived security indicator.
   * Note: This is an internal test metric, NOT a guarantee of 100% security.
   */
  static async getSecurityOverview(userId: string) {
    const [
      totalDocuments,
      encryptedDocuments,
      verifiedDocuments,
      tamperedDocuments,
      activeIncidents,
      totalRecoveryCopies,
      recentEvents,
      recentRecoveryOperations,
      latestRehearsalRun,
      activeSessions,
    ] = await Promise.all([
      prisma.document.count({ where: { userId, deletedAt: null } }),
      prisma.document.count({ where: { userId, isEncrypted: true, deletedAt: null } }),
      prisma.document.count({ where: { userId, integrityStatus: "VERIFIED", deletedAt: null } }),
      prisma.document.count({ where: { userId, integrityStatus: "TAMPERED", deletedAt: null } }),
      prisma.securityIncident.count({
        where: {
          userId,
          status: { in: ["OPEN", "INVESTIGATING", "CONTAINED", "RECOVERING"] },
        },
      }),
      prisma.documentVersion.count({
        where: {
          document: { userId, deletedAt: null },
          recoveryStatus: { in: ["ELIGIBLE", "RESTORED"] },
        },
      }),
      prisma.securityEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.recoveryRecord.findMany({
        where: { requestedByUserId: userId },
        include: { document: { select: { filename: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.rehearsalRun.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { scenarios: true },
      }),
      prisma.session.findMany({
        where: {
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { lastActivityAt: "desc" },
      }),
    ]);

    const storage = getStorageAdapter();
    const storageStatus = storage.getStatus();

    // Latest verification timestamp
    const lastVerifiedDoc = await prisma.document.findFirst({
      where: { userId, deletedAt: null, lastVerifiedAt: { not: null } },
      orderBy: { lastVerifiedAt: "desc" },
      select: { lastVerifiedAt: true },
    });

    // Formula for internal security test readiness score (0 - 100):
    // 40% Document encryption & verification ratio
    // 30% Breach Rehearsal pass rate
    // 30% Active incident health (penalized for open/uncontained incidents)
    let docHealthRatio = totalDocuments > 0 ? verifiedDocuments / totalDocuments : 1.0;
    if (tamperedDocuments > 0) docHealthRatio *= 0.5;

    let rehearsalPassRatio = 0.5; // baseline before rehearsal is run
    if (latestRehearsalRun && latestRehearsalRun.totalScenarios > 0) {
      rehearsalPassRatio = latestRehearsalRun.passedScenarios / latestRehearsalRun.totalScenarios;
    }

    const incidentPenalty = Math.min(activeIncidents * 10, 40);
    const calculatedReadinessScore = Math.max(
      0,
      Math.min(100, Math.round(docHealthRatio * 40 + rehearsalPassRatio * 35 + (25 - incidentPenalty * 0.5)))
    );

    return {
      metrics: {
        totalDocuments,
        encryptedDocuments,
        verifiedDocuments,
        tamperedDocuments,
        activeIncidents,
        totalRecoveryCopies,
        lastVerificationTime: lastVerifiedDoc?.lastVerifiedAt || null,
        activeSessionCount: activeSessions.length,
        testReadinessScore: calculatedReadinessScore,
        scoreFormulaExplanation:
          "Internal Readiness Index = (Verified Doc Ratio × 40%) + (Rehearsal Suite Pass Rate × 35%) + Incident Posture (25%). Derived from controlled local test fixtures. Not a guarantee of immunity against unmodeled attacks.",
      },
      storageStatus,
      recentEvents,
      recentRecoveryOperations,
      latestRehearsalRun,
      activeSessions,
    };
  }

  static async listSecurityEvents(userId: string, filter?: { severity?: string; eventType?: string }) {
    const where: any = { userId };
    if (filter?.severity && filter.severity !== "ALL") {
      where.severity = filter.severity;
    }
    if (filter?.eventType && filter.eventType !== "ALL") {
      where.eventType = filter.eventType;
    }

    return await prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
