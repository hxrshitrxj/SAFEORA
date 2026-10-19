import {
  EncryptionEnvelope,
  bufferToBase64,
  base64ToBuffer,
} from "./envelope";

/**
 * Generates a high-entropy 256-bit AES-GCM document encryption key using Web Crypto API.
 */
export async function generateDocumentKey(): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  return await subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable for client-side envelope recovery
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to raw Base64 string for safe user backup / recovery phrase.
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const raw = await subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

/**
 * Imports a CryptoKey from a Base64 string.
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const raw = base64ToBuffer(base64Key);
  return await subtle.importKey(
    "raw",
    raw as unknown as BufferSource,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Computes a SHA-256 key fingerprint so the system can verify key compatibility
 * without ever transmitting or storing the key itself.
 */
export async function computeKeyFingerprint(key: CryptoKey): Promise<string> {
  const subtle = getSubtleCrypto();
  const raw = await subtle.exportKey("raw", key);
  const hashBuffer = await subtle.digest("SHA-256", raw);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Encrypts document data client-side using AES-256-GCM with a fresh 96-bit (12-byte) nonce.
 * Nonces are never reused.
 */
export async function encryptDocument(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<EncryptionEnvelope> {
  const subtle = getSubtleCrypto();
  const cryptoObj = getCrypto();

  // Generate unique 12-byte nonce
  const iv = new Uint8Array(12);
  cryptoObj.getRandomValues(iv);

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    data
  );

  const keyFingerprint = await computeKeyFingerprint(key);

  return {
    version: "1.0.0",
    algorithm: "AES-256-GCM",
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
    keyFingerprint,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decrypts a document client-side. Throws error if key, IV, or authentication tag is invalid.
 */
export async function decryptDocument(
  envelope: EncryptionEnvelope,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const subtle = getSubtleCrypto();
  const iv = base64ToBuffer(envelope.iv);
  const ciphertext = base64ToBuffer(envelope.ciphertext);

  try {
    return await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertext as unknown as BufferSource
    );
  } catch (err) {
    throw new Error("Decryption failed: authentication tag mismatch or invalid encryption key.");
  }
}

/**
 * Helper to get subtle crypto in both browser and modern Node.js environments.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto");
  return nodeCrypto.webcrypto.subtle;
}

function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto");
  return nodeCrypto.webcrypto as unknown as Crypto;
}
