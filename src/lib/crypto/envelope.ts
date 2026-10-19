/**
 * Document Encryption Envelope Structure
 * Adheres to standard authenticated encryption (AES-256-GCM) with unique 96-bit nonces.
 * Decryption keys are strictly client-held or recovered via documented key recovery protocol.
 */

export interface EncryptionEnvelope {
  version: "1.0.0";
  algorithm: "AES-256-GCM";
  iv: string;           // Base64 encoded 12-byte initialization vector (nonce)
  ciphertext: string;   // Base64 encoded encrypted payload (includes AES-GCM auth tag in WebCrypto export)
  keyFingerprint: string; // SHA-256 hash of the encryption key to verify key match without storing key
  createdAt: string;
}

/**
 * Validates that an envelope conforms to required cryptographic properties.
 */
export function validateEnvelope(data: unknown): data is EncryptionEnvelope {
  if (!data || typeof data !== "object") return false;
  const env = data as Partial<EncryptionEnvelope>;
  return (
    env.version === "1.0.0" &&
    env.algorithm === "AES-256-GCM" &&
    typeof env.iv === "string" &&
    typeof env.ciphertext === "string" &&
    typeof env.keyFingerprint === "string"
  );
}

/**
 * Converts ArrayBuffer to Base64
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
