import prisma from "@/lib/database/prisma";
import { getStorageAdapter } from "@/lib/storage";
import { verifyDocumentIntegrity } from "@/lib/crypto/manifest";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { processThreatSignal } from "@/lib/security/threat-detector";

export interface RestoreVersionInput {
  documentId: string;
  targetVersionNumber: number;
  userId: string;
  reason?: string;
}

export class RecoveryService {
  /**
   * Executes verified document recovery:
   * 1. Validates ownership and recovery eligibility.
   * 2. Retrieves ciphertext from the independent recovery storage namespace.
   * 3. Rigorously verifies recovery copy integrity against signed manifest BEFORE restoration.
   * 4. Aborts immediately if recovery copy is corrupted or tampered.
   * 5. Promotes verified recovery copy to primary storage with a new version number.
   */
  static async restoreVersion(input: RestoreVersionInput) {
    const document = await prisma.document.findFirst({
      where: { id: input.documentId, userId: input.userId, deletedAt: null },
      include: {
        versions: {
          where: { versionNumber: input.targetVersionNumber },
          include: { manifest: true },
        },
      },
    });

    if (!document) {
      throw new Error("Document not found or unauthorized access.");
    }

    const version = document.versions[0];
    if (!version || !version.manifest) {
      throw new Error(`Target version ${input.targetVersionNumber} or manifest not found.`);
    }

    if (version.recoveryStatus === "RESTRICTED") {
      throw new Error("Target version is restricted from recovery by policy.");
    }

    const storage = getStorageAdapter();
    const recoveryPath = version.recoveryPath || `${input.userId}/${document.id}/v${version.versionNumber}-recovery.enc`;

    // 1. Read recovery ciphertext
    let recoveryBuffer: Buffer;
    try {
      recoveryBuffer = await storage.read("recovery", recoveryPath);
    } catch {
      await prisma.recoveryRecord.create({
        data: {
          documentId: document.id,
          versionNumber: document.currentVersion + 1,
          restoredFromVersion: version.versionNumber,
          requestedByUserId: input.userId,
          status: "FAILED",
          reason: "Recovery storage object missing or unreadable.",
          verifiedBeforeRestore: false,
        },
      });

      await processThreatSignal({
        userId: input.userId,
        eventType: "INTEGRITY_FAILURE",
        severity: "HIGH",
        resourceType: "RECOVERY",
        resourceId: document.id,
        details: { reason: "Recovery storage file unreadable", recoveryPath },
      });

      throw new Error("Recovery copy is unavailable or corrupted in isolated recovery storage.");
    }

    // 2. Cryptographic Pre-Restoration Verification
    const verification = verifyDocumentIntegrity(
      recoveryBuffer,
      version.manifest.canonicalPayload,
      version.manifest.signature,
      version.manifest.chunkSizeBytes
    );

    if (!verification.isValid) {
      await prisma.recoveryRecord.create({
        data: {
          documentId: document.id,
          versionNumber: document.currentVersion + 1,
          restoredFromVersion: version.versionNumber,
          requestedByUserId: input.userId,
          status: "FAILED",
          reason: `Pre-restoration verification failed: ${verification.details}`,
          verifiedBeforeRestore: false,
        },
      });

      await processThreatSignal({
        userId: input.userId,
        eventType: "INTEGRITY_FAILURE",
        severity: "CRITICAL",
        resourceType: "RECOVERY",
        resourceId: document.id,
        details: {
          error: "Recovery copy failed integrity verification before restoration",
          corruptedChunks: verification.corruptedChunks,
        },
      });

      throw new Error(`Restoration aborted: Recovery copy failed integrity check. ${verification.details}`);
    }

    // 3. Increment version and write verified copy to primary storage
    const newVersionNumber = document.currentVersion + 1;
    const newPrimaryStorageKey = `${input.userId}/${document.id}/v${newVersionNumber}.enc`;
    const newRecoveryStorageKey = `${input.userId}/${document.id}/v${newVersionNumber}-recovery.enc`;

    // Write restored ciphertext to primary storage
    await storage.write("primary", newPrimaryStorageKey, recoveryBuffer);
    // Ensure recovery copy exists for the new version as well
    await storage.write("recovery", newRecoveryStorageKey, recoveryBuffer);

    const { recoveryRecord } = await prisma.$transaction(
      async (tx) => {
        // Create new DocumentVersion
        const newVersion = await tx.documentVersion.create({
          data: {
            documentId: document.id,
            versionNumber: newVersionNumber,
            storagePath: newPrimaryStorageKey,
            recoveryPath: newRecoveryStorageKey,
            sizeBytes: recoveryBuffer.length,
            integrityStatus: "VERIFIED",
            recoveryStatus: "RESTORED",
            parentVersionId: version.id,
          },
        });

        // Clone original verified manifest for the new restored version
        await tx.integrityManifest.create({
          data: {
            versionId: newVersion.id,
            documentId: document.id,
            versionNumber: newVersionNumber,
            manifestSchemaVersion: version.manifest!.manifestSchemaVersion,
            hashAlgorithm: version.manifest!.hashAlgorithm,
            chunkSizeBytes: version.manifest!.chunkSizeBytes,
            chunkHashes: version.manifest!.chunkHashes,
            merkleRoot: version.manifest!.merkleRoot,
            canonicalPayload: version.manifest!.canonicalPayload,
            signature: version.manifest!.signature,
            signerKeyId: version.manifest!.signerKeyId,
            verifiedAt: new Date(),
          },
        });

        // Update document state
        await tx.document.update({
          where: { id: document.id },
          data: {
            currentVersion: newVersionNumber,
            integrityStatus: "VERIFIED",
            isRestricted: false,
            restrictionReason: null,
            lastVerifiedAt: new Date(),
          },
        });

        // Create successful recovery record
        const recRecord = await tx.recoveryRecord.create({
          data: {
            documentId: document.id,
            versionNumber: newVersionNumber,
            restoredFromVersion: version.versionNumber,
            requestedByUserId: input.userId,
            status: "SUCCESS",
            reason: input.reason || `Restored from verified version ${version.versionNumber}`,
            verifiedBeforeRestore: true,
          },
        });

        return { recoveryRecord: recRecord };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    // Audit log outside DB transaction
    await logAuditEvent({
      eventType: "DOCUMENT_RESTORE",
      actorId: input.userId,
      resourceType: "DOCUMENT",
      resourceId: document.id,
      outcome: "SUCCESS",
      details: {
        restoredFromVersion: version.versionNumber,
        newVersionNumber,
        merkleRoot: version.manifest!.merkleRoot,
      },
    });

    return {
      success: true,
      documentId: document.id,
      newVersionNumber,
      recoveryRecord,
    };
  }

  /**
   * Retrieves all recovery history and versions eligible for restoration.
   */
  static async getRecoveryHistory(userId: string) {
    const [recoveryRecords, versions] = await Promise.all([
      prisma.recoveryRecord.findMany({
        where: { requestedByUserId: userId },
        include: { document: { select: { id: true, filename: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.documentVersion.findMany({
        where: { document: { userId, deletedAt: null } },
        include: {
          document: { select: { id: true, filename: true, currentVersion: true } },
          manifest: { select: { merkleRoot: true, verifiedAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      recoveryRecords,
      versions,
    };
  }
}
