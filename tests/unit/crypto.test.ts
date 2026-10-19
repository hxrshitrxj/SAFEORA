import { describe, it, expect } from "vitest";
import {
  generateDocumentKey,
  encryptDocument,
  decryptDocument,
  computeKeyFingerprint,
} from "@/lib/crypto/client-crypto";
import {
  createIntegrityManifest,
  verifyDocumentIntegrity,
  canonicalizeJson,
  computeChunkHashes,
  computeMerkleRoot,
} from "@/lib/crypto/manifest";

describe("Cryptographic Envelope & WebCrypto AES-256-GCM", () => {
  it("encrypts and decrypts document data with valid key", async () => {
    const key = await generateDocumentKey();
    const plaintext = new TextEncoder().encode("CONFIDENTIAL_TOP_SECRET_PHOENIX_DATA");

    const envelope = await encryptDocument(plaintext.buffer, key);

    expect(envelope.algorithm).toBe("AES-256-GCM");
    expect(envelope.version).toBe("1.0.0");
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.ciphertext).not.toEqual("CONFIDENTIAL_TOP_SECRET_PHOENIX_DATA");

    const decryptedBuffer = await decryptDocument(envelope, key);
    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    expect(decryptedText).toBe("CONFIDENTIAL_TOP_SECRET_PHOENIX_DATA");
  });

  it("fails to decrypt with an incorrect key", async () => {
    const keyA = await generateDocumentKey();
    const keyB = await generateDocumentKey();
    const plaintext = new TextEncoder().encode("SENSITIVE_PAYLOAD");

    const envelope = await encryptDocument(plaintext.buffer, keyA);

    await expect(decryptDocument(envelope, keyB)).rejects.toThrow();
  });

  it("generates unique IVs (nonces) for identical plaintext encryptions", async () => {
    const key = await generateDocumentKey();
    const plaintext = new TextEncoder().encode("IDENTICAL_PLAINTEXT");

    const envelope1 = await encryptDocument(plaintext.buffer, key);
    const envelope2 = await encryptDocument(plaintext.buffer, key);

    expect(envelope1.iv).not.toEqual(envelope2.iv);
    expect(envelope1.ciphertext).not.toEqual(envelope2.ciphertext);
  });

  it("computes deterministic key fingerprints without revealing key", async () => {
    const key = await generateDocumentKey();
    const fp1 = await computeKeyFingerprint(key);
    const fp2 = await computeKeyFingerprint(key);

    expect(fp1).toEqual(fp2);
    expect(fp1.length).toBe(64); // SHA-256 hex
  });
});

describe("Tamper-Evident Integrity Manifest & Merkle Proofs", () => {
  it("canonicalizes JSON deterministically regardless of key order", () => {
    const obj1 = { beta: 2, alpha: 1, nested: { z: 10, a: 5 } };
    const obj2 = { alpha: 1, nested: { a: 5, z: 10 }, beta: 2 };

    const c1 = canonicalizeJson(obj1);
    const c2 = canonicalizeJson(obj2);

    expect(c1).toEqual(c2);
    expect(c1).toBe('{"alpha":1,"beta":2,"nested":{"a":5,"z":10}}');
  });

  it("computes chunk hashes and Merkle root correctly", () => {
    const buffer = Buffer.from("A".repeat(150 * 1024)); // 150KB
    const { chunks, hashes } = computeChunkHashes(buffer, 64 * 1024);

    expect(chunks.length).toBe(3); // 64K + 64K + 22K
    expect(hashes.length).toBe(3);

    const root = computeMerkleRoot(hashes);
    expect(root).toBeDefined();
    expect(root.length).toBe(64);
  });

  it("verifies uncorrupted document with valid signed manifest", () => {
    const fileBuffer = Buffer.from("GENUINE_AUTHORIZED_DOCUMENT_PAYLOAD");
    const manifest = createIntegrityManifest("doc-123", 1, fileBuffer);

    const result = verifyDocumentIntegrity(
      fileBuffer,
      manifest.canonicalPayload,
      manifest.signature,
      manifest.chunkSizeBytes
    );

    expect(result.isValid).toBe(true);
    expect(result.isSignatureValid).toBe(true);
    expect(result.isDataValid).toBe(true);
    expect(result.corruptedChunks.length).toBe(0);
  });

  it("detects document tampering and identifies corrupted chunks", () => {
    const fileBuffer = Buffer.from("GENUINE_AUTHORIZED_DOCUMENT_PAYLOAD");
    const manifest = createIntegrityManifest("doc-123", 1, fileBuffer);

    // Corrupt one byte of file data
    const tamperedBuffer = Buffer.from("TAMPERED_AUTHORIZED_DOCUMENT_PAYLOAD");

    const result = verifyDocumentIntegrity(
      tamperedBuffer,
      manifest.canonicalPayload,
      manifest.signature,
      manifest.chunkSizeBytes
    );

    expect(result.isValid).toBe(false);
    expect(result.isDataValid).toBe(false);
    expect(result.corruptedChunks.length).toBeGreaterThan(0);
  });

  it("rejects forged manifest when digital signature is invalid", () => {
    const fileBuffer = Buffer.from("GENUINE_AUTHORIZED_DOCUMENT_PAYLOAD");
    const manifest = createIntegrityManifest("doc-123", 1, fileBuffer);

    // Attacker modifies manifest canonical payload
    const forgedPayload = manifest.canonicalPayload.replace('"versionNumber":1', '"versionNumber":99');

    const result = verifyDocumentIntegrity(
      fileBuffer,
      forgedPayload,
      manifest.signature,
      manifest.chunkSizeBytes
    );

    expect(result.isValid).toBe(false);
    expect(result.isSignatureValid).toBe(false);
  });
});
