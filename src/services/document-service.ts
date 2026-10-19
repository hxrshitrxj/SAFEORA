import prisma from "@/lib/database/prisma";
import { getStorageAdapter } from "@/lib/storage";
import { createIntegrityManifest } from "@/lib/crypto/manifest";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { validateEnvelope, EncryptionEnvelope } from "@/lib/crypto/envelope";

export interface CreateDocumentInput {
  userId: string;
  filename: string;
  mimeType: string;
  envelope: EncryptionEnvelope;
}

export interface DocumentListOptions {
  userId: string;
  search?: string;
  integrityStatus?: string;
  sortBy?: "createdAt" | "filename" | "sizeBytes";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export class DocumentService {
  /**
   * Uploads and protects a client-encrypted document.
   * Generates a tamper-evident integrity manifest, writes to primary storage,
   * and copies a protected replica into independent recovery storage.
   */
  static async uploadDocument(input: CreateDocumentInput) {
    if (!validateEnvelope(input.envelope)) {
      throw new Error("Invalid encryption envelope. Document must be encrypted with AES-256-GCM.");
    }

    const storage = getStorageAdapter();
    const envelopeJson = JSON.stringify(input.envelope);
    const fileBuffer = Buffer.from(envelopeJson, "utf-8");
    const sizeBytes = fileBuffer.length;

    // 1. Create database records in an atomic transaction with custom timeout
    const { document, version, manifestData } = await prisma.$transaction(
      async (tx) => {
        // Create Document record
        const doc = await tx.document.create({
          data: {
            userId: input.userId,
            filename: input.filename,
            mimeType: input.mimeType || "application/octet-stream",
            sizeBytes,
            currentVersion: 1,
            isEncrypted: true,
            encryptionAlgo: input.envelope.algorithm,
            integrityStatus: "VERIFIED",
            lastVerifiedAt: new Date(),
          },
        });

        const primaryStorageKey = `${input.userId}/${doc.id}/v1.enc`;
        const recoveryStorageKey = `${input.userId}/${doc.id}/v1-recovery.enc`;

        // Generate signed Integrity Manifest for the encrypted buffer
        const manifest = createIntegrityManifest(doc.id, 1, fileBuffer);

        // Create DocumentVersion record
        const ver = await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            versionNumber: 1,
            storagePath: primaryStorageKey,
            recoveryPath: recoveryStorageKey,
            sizeBytes,
            integrityStatus: "VERIFIED",
            recoveryStatus: "ELIGIBLE",
          },
        });

        // Create IntegrityManifest record
        await tx.integrityManifest.create({
          data: {
            versionId: ver.id,
            documentId: doc.id,
            versionNumber: 1,
            manifestSchemaVersion: manifest.canonicalData.manifestSchemaVersion,
            hashAlgorithm: manifest.canonicalData.hashAlgorithm,
            chunkSizeBytes: manifest.chunkSizeBytes,
            chunkHashes: JSON.stringify(manifest.chunkHashes),
            merkleRoot: manifest.merkleRoot,
            canonicalPayload: manifest.canonicalPayload,
            signature: manifest.signature,
            signerKeyId: manifest.signerKeyId,
            verifiedAt: new Date(),
          },
        });

        return {
          document: doc,
          version: ver,
          manifestData: manifest,
        };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    const primaryStorageKey = `${input.userId}/${document.id}/v1.enc`;
    const recoveryStorageKey = `${input.userId}/${document.id}/v1-recovery.enc`;

    // 2. Persist ciphertext in primary and recovery storage outside DB transaction
    await storage.write("primary", primaryStorageKey, fileBuffer);
    await storage.write("recovery", recoveryStorageKey, fileBuffer);

    // 3. Record audit log outside DB transaction (prevents SQLite connection lock deadlock)
    await logAuditEvent({
      eventType: "DOCUMENT_UPLOAD",
      actorId: input.userId,
      resourceType: "DOCUMENT",
      resourceId: document.id,
      outcome: "SUCCESS",
      details: {
        filename: input.filename,
        sizeBytes,
        version: 1,
        merkleRoot: manifestData.merkleRoot,
      },
    });

    return {
      document,
      version,
      merkleRoot: manifestData.merkleRoot,
    };
  }

  /**
   * Retrieves paginated documents owned by the user.
   */
  static async listDocuments(options: DocumentListOptions) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: options.userId,
      deletedAt: null, // Soft-delete filter
    };

    if (options.search) {
      where.filename = { contains: options.search };
    }

    if (options.integrityStatus && options.integrityStatus !== "ALL") {
      where.integrityStatus = options.integrityStatus;
    }

    const orderBy: any = {};
    const sortField = options.sortBy || "createdAt";
    orderBy[sortField] = options.sortOrder || "desc";

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            include: { manifest: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single document with ownership verification.
   */
  static async getDocumentById(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: { manifest: true },
        },
        recoveryRecords: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!document) {
      throw new Error("Document not found or unauthorized access.");
    }

    return document;
  }

  /**
   * Retrieves encrypted envelope buffer for download/decrypt by authorized client.
   * Decryption keys are never stored on the server.
   */
  static async getDocumentCiphertext(documentId: string, userId: string, versionNumber?: number) {
    const document = await this.getDocumentById(documentId, userId);

    const targetVersion = versionNumber
      ? document.versions.find((v) => v.versionNumber === versionNumber)
      : document.versions[0];

    if (!targetVersion) {
      throw new Error(`Requested version ${versionNumber} not found.`);
    }

    const storage = getStorageAdapter();
    const fileBuffer = await storage.read("primary", targetVersion.storagePath);
    const envelope = JSON.parse(fileBuffer.toString("utf-8")) as EncryptionEnvelope;

    await logAuditEvent({
      eventType: "DOCUMENT_DOWNLOAD",
      actorId: userId,
      resourceType: "DOCUMENT",
      resourceId: document.id,
      outcome: "SUCCESS",
      details: {
        version: targetVersion.versionNumber,
        filename: document.filename,
      },
    });

    return {
      document,
      version: targetVersion,
      envelope,
    };
  }

  /**
   * Renames document metadata.
   */
  static async updateDocumentMetadata(documentId: string, userId: string, filename: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
    });
    if (!doc) throw new Error("Document not found.");

    return await prisma.document.update({
      where: { id: documentId },
      data: { filename },
    });
  }

  /**
   * Soft-deletes a document. Retains recovery copies and audit records.
   */
  static async deleteDocument(documentId: string, userId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
    });
    if (!doc) throw new Error("Document not found.");

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    await logAuditEvent({
      eventType: "DOCUMENT_DELETE",
      actorId: userId,
      resourceType: "DOCUMENT",
      resourceId: documentId,
      outcome: "SUCCESS",
      details: {
        filename: doc.filename,
        retentionPolicy: "SOFT_DELETE_PRESERVE_RECOVERY",
      },
    });

    return { success: true };
  }
}
