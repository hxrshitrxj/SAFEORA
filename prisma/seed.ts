import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { hashPassword } from "../src/lib/auth/password";
import { createIntegrityManifest } from "../src/lib/crypto/manifest";
import { LocalStorageAdapter } from "../src/lib/storage/local-storage-adapter";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Safeora Vault development environment...");

  // 1. Create or upsert Demo Users (Safeora primary, Phoenix legacy)
  const primaryEmail = "demo@safeora-vault.local";
  const primaryPasswordHash = await hashPassword("SafeoraVaultDemo2026!");

  const user = await prisma.user.upsert({
    where: { email: primaryEmail },
    update: { passwordHash: primaryPasswordHash },
    create: {
      email: primaryEmail,
      name: "Security Officer Alex",
      passwordHash: primaryPasswordHash,
      role: "USER",
    },
  });

  const legacyEmail = "demo@phoenix-vault.local";
  const legacyPasswordHash = await hashPassword("PhoenixVaultDemo2026!");
  await prisma.user.upsert({
    where: { email: legacyEmail },
    update: { passwordHash: legacyPasswordHash },
    create: {
      email: legacyEmail,
      name: "Security Officer Alex",
      passwordHash: legacyPasswordHash,
      role: "USER",
    },
  });

  console.log(`👤 Demo User initialized: ${user.email} (Password: SafeoraVaultDemo2026!)`);

  // 2. Initialize User Security Settings
  await prisma.userSecuritySettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      emailAlerts: true,
      notifyIntegrityFailure: true,
      notifySuspiciousActivity: true,
      autoContainSession: true,
      autoQuarantineTampered: true,
      rehearsalRetentionDays: 30,
      defaultVerificationFreq: "DAILY",
    },
  });

  // 3. Create Sample Protected Document
  const existingDoc = await prisma.document.findFirst({
    where: { userId: user.id, filename: "q4-board-risk-assessment.pdf" },
  });

  if (!existingDoc) {
    const storage = new LocalStorageAdapter();

    const synthEnvelope = {
      version: "1.0.0",
      algorithm: "AES-256-GCM",
      iv: Buffer.from(crypto.randomBytes(12)).toString("base64"),
      ciphertext: Buffer.from("SAFEORA_SYNTHETIC_CIPHERTEXT_ENCRYPTED_DOCUMENT_CONTENT_BLOCK").toString("base64"),
      keyFingerprint: crypto.createHash("sha256").update("demo-key-seed").digest("hex"),
      createdAt: new Date().toISOString(),
    };

    const envelopeBuffer = Buffer.from(JSON.stringify(synthEnvelope), "utf-8");

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        filename: "q4-board-risk-assessment.pdf",
        mimeType: "application/pdf",
        sizeBytes: envelopeBuffer.length,
        currentVersion: 1,
        isEncrypted: true,
        encryptionAlgo: "AES-256-GCM",
        integrityStatus: "VERIFIED",
        lastVerifiedAt: new Date(),
      },
    });

    const primaryKey = `${user.id}/${document.id}/v1.enc`;
    const recoveryKey = `${user.id}/${document.id}/v1-recovery.enc`;

    const manifestData = createIntegrityManifest(document.id, 1, envelopeBuffer);

    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        storagePath: primaryKey,
        recoveryPath: recoveryKey,
        sizeBytes: envelopeBuffer.length,
        integrityStatus: "VERIFIED",
        recoveryStatus: "ELIGIBLE",
      },
    });

    await prisma.integrityManifest.create({
      data: {
        versionId: version.id,
        documentId: document.id,
        versionNumber: 1,
        manifestSchemaVersion: "1.0.0",
        hashAlgorithm: "SHA-256",
        chunkSizeBytes: manifestData.chunkSizeBytes,
        chunkHashes: JSON.stringify(manifestData.chunkHashes),
        merkleRoot: manifestData.merkleRoot,
        canonicalPayload: manifestData.canonicalPayload,
        signature: manifestData.signature,
        signerKeyId: manifestData.signerKeyId,
        verifiedAt: new Date(),
      },
    });

    await storage.write("primary", primaryKey, envelopeBuffer);
    await storage.write("recovery", recoveryKey, envelopeBuffer);

    console.log(`📄 Initial protected document seeded: ${document.filename} (ID: ${document.id})`);
  }

  // 4. Initial Audit Log Entry
  const auditCount = await prisma.auditEvent.count();
  if (auditCount === 0) {
    const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const timestamp = new Date();
    const payload = [
      1,
      timestamp.toISOString(),
      "SYSTEM_BOOTSTRAP",
      "SYSTEM_INIT",
      "SUCCESS",
      "SYSTEM",
      "GENESIS",
      "{}",
      genesisHash,
    ].join("|");
    const entryHash = crypto.createHash("sha256").update(payload).digest("hex");

    await prisma.auditEvent.create({
      data: {
        sequenceNumber: 1,
        eventType: "SYSTEM_INIT",
        actorId: "SYSTEM_BOOTSTRAP",
        resourceType: "SYSTEM",
        resourceId: "GENESIS",
        outcome: "SUCCESS",
        details: "{}",
        previousHash: genesisHash,
        entryHash,
        timestamp,
      },
    });
    console.log("🔒 Cryptographic audit log genesis checkpoint established.");
  }

  console.log("✅ Safeora Vault seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
