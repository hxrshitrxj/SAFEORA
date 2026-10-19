import crypto from "crypto";

const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost factor
  r: 8,     // block size
  p: 1,     // parallelization
  maxmem: 32 * 1024 * 1024,
};
const KEY_LEN = 64;
const SALT_LEN = 16;

/**
 * Hashes a plaintext password using Scrypt with OWASP recommended cost factors.
 * Never logs or stores plaintext passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const salt = crypto.randomBytes(SALT_LEN);
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      KEY_LEN,
      SCRYPT_PARAMS,
      (err, derivedKey) => {
        if (err) return reject(err);
        const saltHex = salt.toString("hex");
        const hashHex = derivedKey.toString("hex");
        resolve(`$scrypt$N=${SCRYPT_PARAMS.N},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${saltHex}$${hashHex}`);
      }
    );
  });
}

/**
 * Verifies a plaintext password against an established hash using constant-time comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    // format: ["", "scrypt", "N=16384,r=8,p=1", saltHex, hashHex]
    if (parts.length < 5 || parts[1] !== "scrypt") {
      return false;
    }

    const saltHex = parts[3];
    const originalHashHex = parts[4];
    const salt = Buffer.from(saltHex, "hex");
    const originalHash = Buffer.from(originalHashHex, "hex");

    return new Promise((resolve) => {
      crypto.scrypt(
        password,
        salt,
        originalHash.length,
        SCRYPT_PARAMS,
        (err, derivedKey) => {
          if (err) return resolve(false);
          // Constant-time comparison to prevent timing attacks
          const match = crypto.timingSafeEqual(originalHash, derivedKey);
          resolve(match);
        }
      );
    });
  } catch {
    return false;
  }
}
