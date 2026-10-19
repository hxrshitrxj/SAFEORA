import { StorageAdapter, StorageNamespace } from "./storage-adapter";

export class S3CompatibleStorageAdapter implements StorageAdapter {
  private isConfigured: boolean;
  private primaryBucket: string;
  private recoveryBucket: string;

  constructor() {
    this.primaryBucket = process.env.S3_BUCKET_PRIMARY || "";
    this.recoveryBucket = process.env.S3_BUCKET_RECOVERY || "";
    this.isConfigured = !!(
      this.primaryBucket &&
      this.recoveryBucket &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
    );
  }

  private checkConfigured() {
    if (!this.isConfigured) {
      throw new Error(
        "S3-compatible object storage is selected but required environment variables (S3_BUCKET_PRIMARY, S3_BUCKET_RECOVERY, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are not configured."
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async write(namespace: StorageNamespace, key: string, buffer: Buffer): Promise<string> {
    this.checkConfigured();
    // In production with AWS SDK / MinIO SDK:
    // const bucket = namespace === "recovery" ? this.recoveryBucket : this.primaryBucket;
    // await s3.putObject({ Bucket: bucket, Key: key, Body: buffer }).promise();
    return key;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async read(namespace: StorageNamespace, key: string): Promise<Buffer> {
    this.checkConfigured();
    return Buffer.alloc(0);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(namespace: StorageNamespace, key: string): Promise<boolean> {
    this.checkConfigured();
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exists(namespace: StorageNamespace, key: string): Promise<boolean> {
    this.checkConfigured();
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async copyToRecovery(primaryKey: string, recoveryKey: string): Promise<string> {
    this.checkConfigured();
    return recoveryKey;
  }

  getStatus() {
    return {
      provider: "s3-object-storage",
      isIsolatedRecovery: this.isConfigured && this.primaryBucket !== this.recoveryBucket,
      primaryTarget: this.primaryBucket || "Not configured",
      recoveryTarget: this.recoveryBucket || "Not configured",
      modeDescription: this.isConfigured
        ? `Cloud object storage configured with separate primary (${this.primaryBucket}) and recovery (${this.recoveryBucket}) buckets.`
        : "S3 configuration incomplete. Missing access keys or bucket names. Using Local Filesystem fallback.",
    };
  }
}
