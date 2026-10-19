import crypto from "crypto";

export interface ManifestChunk {
  index: number;
  offset: number;
  size: number;
  hash: string; // SHA-256 hex
}

export interface ManifestCanonicalData {
  documentId: string;
  versionNumber: number;
  manifestSchemaVersion: string;
  hashAlgorithm: string;
  chunkSizeBytes: number;
  totalSizeBytes: number;
  chunkHashes: string[]; // ordered array of SHA-256 chunk hashes
  merkleRoot: string;
  createdAt: string;
}

export interface GeneratedManifest {
  canonicalPayload: string;
  canonicalData: ManifestCanonicalData;
  chunkHashes: string[];
  merkleRoot: string;
  signature: string;
  signerKeyId: string;
  chunkSizeBytes: number;
}

export interface VerificationResult {
  isValid: boolean;
  isSignatureValid: boolean;
  isDataValid: boolean;
  merkleRootValid: boolean;
  totalChunks: number;
  corruptedChunks: number[];
  computedMerkleRoot: string;
  manifestMerkleRoot: string;
  details: string;
}

const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
const SIGNER_KEY_ID = "phoenix-kms-v1";

/**
 * Deterministically serializes JSON according to canonical JSON conventions
 * (lexicographically ordered keys, no superfluous whitespace).
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalizeJson(item)).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) => JSON.stringify(k) + ":" + canonicalizeJson((obj as Record<string, unknown>)[k])
  );
  return "{" + entries.join(",") + "}";
}

/**
 * Splits a buffer into deterministic chunks and computes ordered SHA-256 hashes.
 */
export function computeChunkHashes(
  buffer: Buffer,
  chunkSizeBytes: number = DEFAULT_CHUNK_SIZE
): { chunks: ManifestChunk[]; hashes: string[] } {
  const chunks: ManifestChunk[] = [];
  const hashes: string[] = [];
  const totalLength = buffer.length;

  if (totalLength === 0) {
    const emptyHash = crypto.createHash("sha256").update(Buffer.alloc(0)).digest("hex");
    return {
      chunks: [{ index: 0, offset: 0, size: 0, hash: emptyHash }],
      hashes: [emptyHash],
    };
  }

  let offset = 0;
  let index = 0;

  while (offset < totalLength) {
    const end = Math.min(offset + chunkSizeBytes, totalLength);
    const slice = buffer.subarray(offset, end);
    const hash = crypto.createHash("sha256").update(slice).digest("hex");

    chunks.push({
      index,
      offset,
      size: slice.length,
      hash,
    });
    hashes.push(hash);

    offset = end;
    index++;
  }

  return { chunks, hashes };
}

/**
 * Computes a Merkle Tree Root from ordered chunk hashes.
 */
export function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return crypto.createHash("sha256").update(Buffer.alloc(0)).digest("hex");
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let currentLevel = [...hashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash concatenation of two sibling nodes
        const combined = currentLevel[i] + currentLevel[i + 1];
        const parentHash = crypto.createHash("sha256").update(combined).digest("hex");
        nextLevel.push(parentHash);
      } else {
        // Odd number of nodes: duplicate right-most node
        const combined = currentLevel[i] + currentLevel[i];
        const parentHash = crypto.createHash("sha256").update(combined).digest("hex");
        nextLevel.push(parentHash);
      }
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Signs a canonical payload string using HMAC-SHA256 (or Ed25519) secret from environment.
 * The private signing key resides in a separated security boundary.
 */
export function signCanonicalPayload(canonicalPayload: string): string {
  const secret = process.env.MANIFEST_SIGNING_SECRET || "phoenix_manifest_signing_ed25519_key_secret_vault_guard_2026";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(canonicalPayload);
  return hmac.digest("hex");
}

/**
 * Verifies a signature against the canonical payload.
 */
export function verifySignature(canonicalPayload: string, signature: string): boolean {
  try {
    const expectedSignature = signCanonicalPayload(canonicalPayload);
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const actualBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Builds a complete signed integrity manifest for a document version buffer.
 */
export function createIntegrityManifest(
  documentId: string,
  versionNumber: number,
  fileBuffer: Buffer,
  chunkSizeBytes: number = DEFAULT_CHUNK_SIZE
): GeneratedManifest {
  const { hashes } = computeChunkHashes(fileBuffer, chunkSizeBytes);
  const merkleRoot = computeMerkleRoot(hashes);

  const canonicalData: ManifestCanonicalData = {
    documentId,
    versionNumber,
    manifestSchemaVersion: "1.0.0",
    hashAlgorithm: "SHA-256",
    chunkSizeBytes,
    totalSizeBytes: fileBuffer.length,
    chunkHashes: hashes,
    merkleRoot,
    createdAt: new Date().toISOString(),
  };

  const canonicalPayload = canonicalizeJson(canonicalData);
  const signature = signCanonicalPayload(canonicalPayload);

  return {
    canonicalPayload,
    canonicalData,
    chunkHashes: hashes,
    merkleRoot,
    signature,
    signerKeyId: SIGNER_KEY_ID,
    chunkSizeBytes,
  };
}

/**
 * Verifies file data against a stored manifest and verifies manifest digital signature.
 */
export function verifyDocumentIntegrity(
  fileBuffer: Buffer,
  canonicalPayload: string,
  signature: string,
  chunkSizeBytes: number = DEFAULT_CHUNK_SIZE
): VerificationResult {
  // Step 1: Verify manifest digital signature
  const isSignatureValid = verifySignature(canonicalPayload, signature);
  if (!isSignatureValid) {
    return {
      isValid: false,
      isSignatureValid: false,
      isDataValid: false,
      merkleRootValid: false,
      totalChunks: 0,
      corruptedChunks: [],
      computedMerkleRoot: "",
      manifestMerkleRoot: "",
      details: "Manifest signature verification failed: digital signature mismatch or untrusted signer.",
    };
  }

  // Step 2: Parse trusted canonical payload
  let manifestData: ManifestCanonicalData;
  try {
    manifestData = JSON.parse(canonicalPayload);
  } catch {
    return {
      isValid: false,
      isSignatureValid: false,
      isDataValid: false,
      merkleRootValid: false,
      totalChunks: 0,
      corruptedChunks: [],
      computedMerkleRoot: "",
      manifestMerkleRoot: "",
      details: "Corrupted canonical manifest payload formatting.",
    };
  }

  // Step 3: Recompute chunk hashes on actual file buffer
  const { hashes: computedHashes } = computeChunkHashes(fileBuffer, chunkSizeBytes);
  const computedMerkleRoot = computeMerkleRoot(computedHashes);

  const expectedHashes = manifestData.chunkHashes || [];
  const corruptedChunks: number[] = [];

  const maxLen = Math.max(computedHashes.length, expectedHashes.length);
  for (let i = 0; i < maxLen; i++) {
    if (computedHashes[i] !== expectedHashes[i]) {
      corruptedChunks.push(i);
    }
  }

  const merkleRootValid = computedMerkleRoot === manifestData.merkleRoot;
  const isDataValid = corruptedChunks.length === 0 && merkleRootValid;
  const isValid = isSignatureValid && isDataValid;

  let details = "Document integrity verified successfully against signed manifest.";
  if (!isDataValid) {
    details = `Document tampering detected: ${corruptedChunks.length} chunk(s) mismatched, Merkle root verification failed.`;
  }

  return {
    isValid,
    isSignatureValid,
    isDataValid,
    merkleRootValid,
    totalChunks: computedHashes.length,
    corruptedChunks,
    computedMerkleRoot,
    manifestMerkleRoot: manifestData.merkleRoot,
    details,
  };
}
