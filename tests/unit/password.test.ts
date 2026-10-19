import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Security & Hashing", () => {
  it("successfully hashes a password and verifies it", async () => {
    const raw = "CyberGuard2026!SecureKey";
    const hashed = await hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed.startsWith("$scrypt$")).toBe(true);

    const isMatch = await verifyPassword(raw, hashed);
    expect(isMatch).toBe(true);
  });

  it("fails verification with an incorrect password", async () => {
    const raw = "CorrectPassword123!";
    const hashed = await hashPassword(raw);

    const isMatch = await verifyPassword("WrongPassword456!", hashed);
    expect(isMatch).toBe(false);
  });

  it("rejects passwords under 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrow();
  });
});
