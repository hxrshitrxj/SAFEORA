import fs from "fs/promises";
import path from "path";
import { StorageAdapter, StorageNamespace } from "./storage-adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private primaryBaseDir: string;
  private recoveryBaseDir: string;
  private fixturesBaseDir: string;

  constructor() {
    this.primaryBaseDir = path.resolve(process.env.STORAGE_LOCAL_BASE_DIR || "./storage/uploads");
    this.recoveryBaseDir = path.resolve(process.env.STORAGE_RECOVERY_BASE_DIR || "./storage/recovery");
    this.fixturesBaseDir = path.resolve(process.env.STORAGE_FIXTURES_BASE_DIR || "./storage/fixtures");
  }

  private resolveDir(namespace: StorageNamespace): string {
    switch (namespace) {
      case "primary":
        return this.primaryBaseDir;
      case "recovery":
        return this.recoveryBaseDir;
      case "fixtures":
        return this.fixturesBaseDir;
    }
  }

  /**
   * Sanitizes key to strictly prevent directory traversal vulnerabilities (e.g. ../../)
   */
  private sanitizePath(baseDir: string, key: string): string {
    const cleanKey = key.replace(/^[/\\]+/, "").replace(/(\.\.[/\\])+/g, "");
    const resolved = path.resolve(baseDir, cleanKey);
    if (!resolved.startsWith(baseDir)) {
      throw new Error(`Security violation: Path traversal detected for key '${key}'.`);
    }
    return resolved;
  }

  async write(namespace: StorageNamespace, key: string, buffer: Buffer): Promise<string> {
    const baseDir = this.resolveDir(namespace);
    const targetFile = this.sanitizePath(baseDir, key);
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await fs.writeFile(targetFile, buffer);
    return key;
  }

  async read(namespace: StorageNamespace, key: string): Promise<Buffer> {
    const baseDir = this.resolveDir(namespace);
    const targetFile = this.sanitizePath(baseDir, key);
    return await fs.readFile(targetFile);
  }

  async delete(namespace: StorageNamespace, key: string): Promise<boolean> {
    const baseDir = this.resolveDir(namespace);
    const targetFile = this.sanitizePath(baseDir, key);
    try {
      await fs.unlink(targetFile);
      return true;
    } catch {
      return false;
    }
  }

  async exists(namespace: StorageNamespace, key: string): Promise<boolean> {
    const baseDir = this.resolveDir(namespace);
    const targetFile = this.sanitizePath(baseDir, key);
    try {
      await fs.access(targetFile);
      return true;
    } catch {
      return false;
    }
  }

  async copyToRecovery(primaryKey: string, recoveryKey: string): Promise<string> {
    const primaryBuf = await this.read("primary", primaryKey);
    await this.write("recovery", recoveryKey, primaryBuf);
    return recoveryKey;
  }

  getStatus() {
    return {
      provider: "local-filesystem",
      isIsolatedRecovery: false, // Explicit: Local directories do NOT constitute physical or cloud isolation
      primaryTarget: this.primaryBaseDir,
      recoveryTarget: this.recoveryBaseDir,
      modeDescription:
        "Local filesystem development mode. Recovery copies are segregated into independent folder namespaces (simulating air-gapped recovery). For production, S3 with independent bucket policies is recommended.",
    };
  }
}
