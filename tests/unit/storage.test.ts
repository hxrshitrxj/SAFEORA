import { describe, it, expect, afterAll } from "vitest";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";

describe("Storage Abstraction & Path Traversal Prevention", () => {
  const storage = new LocalStorageAdapter();
  const testKey = "test-session/sample-doc.enc";
  const testBuffer = Buffer.from("SECURE_CIPHERTEXT_BYTES");

  afterAll(async () => {
    await storage.delete("fixtures", testKey);
  });

  it("writes and reads data in separated namespaces", async () => {
    await storage.write("fixtures", testKey, testBuffer);

    const exists = await storage.exists("fixtures", testKey);
    expect(exists).toBe(true);

    const readBack = await storage.read("fixtures", testKey);
    expect(readBack.toString()).toBe("SECURE_CIPHERTEXT_BYTES");
  });

  it("prevents directory traversal attacks via path manipulation", async () => {
    // Attempt path traversal
    await expect(storage.read("fixtures", "../../../windows/win.ini")).rejects.toThrow();
  });

  it("reports accurate isolation status without misleading claims", () => {
    const status = storage.getStatus();
    expect(status.provider).toBe("local-filesystem");
    expect(status.isIsolatedRecovery).toBe(false); // Accurately disclaims physical boundary
  });
});
