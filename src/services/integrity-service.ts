import prisma from "@/lib/database/prisma";
import { getStorageAdapter } from "@/lib/storage";
import { verifyDocumentIntegrity, VerificationResult } from "@/lib/crypto/manifest";
import { processThreatSignal } from "@/lib/security/threat-detector";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export class IntegrityService {
  /**
   * Performs an end-to-end cryptographic integrity verification for a document version:
   * 1. Validates the digital signature of the integrity manifest.
   * 2. Recalculates chunk hashes on stored ciphertext.
   * 3. Reconstructs and verifies the Merkle Tree Root.
   * 4. Enforces automated containment if tampering is detected.
   */
  static async verifyDocument(
    documentId: string,
    userId: string,
    versionNumber?: number
  ): Promise<VerificationResult & { documentId: string; versionNumber: number }> {
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: { manifest: true },
        },
      },
    });

    if (!document) {
      throw new Error("Document not found or unauthorized access.");
    }

    const version = versionNumber
      ? document.versions.find((v) => v.versionNumber === versionNumber)
      : document.versions[0];

    if (!version || !version.manifest) {
      throw new Error("Document version or integrity manifest missing.");
    }

    const storage = getStorageAdapter();
    let fileBuffer: Buffer;

    try {
      fileBuffer = await storage.read("primary", version.storagePath);
    } catch (err: any) {
      // File missing in storage is an integrity failure
      await processThreatSignal({
        userId,
        eventType: "INTEGRITY_FAILURE",
        severity: "CRITICAL",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        details: { reason: "Primary storage ciphertext object missing or unreadable", error: err.message },
      });
      throw new Error("Stored document object is unreadable or missing from primary storage.");
    }

    const result = verifyDocumentIntegrity(
      fileBuffer,
      version.manifest.canonicalPayload,
      version.manifest.signature,
      version.manifest.chunkSizeBytes
    );

    const now = new Date();

    if (result.isValid) {
      // Mark as Verified
      await prisma.$transaction([
        prisma.document.update({
          where: { id: documentId },
          data: {
            integrityStatus: "VERIFIED",
            lastVerifiedAt: now,
            isRestricted: false,
          },
        }),
        prisma.documentVersion.update({
          where: { id: version.id },
          data: { integrityStatus: "VERIFIED" },
        }),
        prisma.integrityManifest.update({
          where: { id: version.manifest.id },
          data: { verifiedAt: now },
        }),
      ]);

      await logAuditEvent({
        eventType: "INTEGRITY_VERIFICATION",
        actorId: userId,
        resourceType: "DOCUMENT",
        resourceId: documentId,
        outcome: "SUCCESS",
        details: {
          version: version.versionNumber,
          merkleRoot: result.manifestMerkleRoot,
        },
      });
    } else {
      // Tampering or signature forgery detected
      await prisma.$transaction([
        prisma.document.update({
          where: { id: documentId },
          data: {
            integrityStatus: "TAMPERED",
            lastVerifiedAt: now,
            isRestricted: true,
            restrictionReason: result.details,
          },
        }),
        prisma.documentVersion.update({
          where: { id: version.id },
          data: { integrityStatus: "TAMPERED" },
        }),
      ]);

      const eventType = !result.isSignatureValid ? "SIGNATURE_INVALID" : "INTEGRITY_FAILURE";

      await processThreatSignal({
        userId,
        eventType,
        severity: "CRITICAL",
        resourceType: "DOCUMENT",
        resourceId: documentId,
        details: {
          versionNumber: version.versionNumber,
          corruptedChunks: result.corruptedChunks,
          computedMerkleRoot: result.computedMerkleRoot,
          manifestMerkleRoot: result.manifestMerkleRoot,
          details: result.details,
        },
      });
    }

    return {
      ...result,
      documentId,
      versionNumber: version.versionNumber,
    };
  }

  /**
   * Verifies integrity across all user-owned documents.
   */
  static async verifyAllDocuments(userId: string) {
    const documents = await prisma.document.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, filename: true },
    });

    const results = [];
    let passedCount = 0;
    let failedCount = 0;

    for (const doc of documents) {
      try {
        const res = await this.verifyDocument(doc.id, userId);
        if (res.isValid) {
          passedCount++;
        } else {
          failedCount++;
        }
        results.push({ filename: doc.filename, ...res });
      } catch (err: any) {
        failedCount++;
        results.push({
          documentId: doc.id,
          filename: doc.filename,
          isValid: false,
          details: err.message || "Verification failed with error",
        });
      }
    }

    return {
      total: documents.length,
      passed: passedCount,
      failed: failedCount,
      results,
    };
  }
}
