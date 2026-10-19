import { StorageAdapter } from "./storage-adapter";
import { LocalStorageAdapter } from "./local-storage-adapter";
import { S3CompatibleStorageAdapter } from "./s3-storage-adapter";

let adapterInstance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!adapterInstance) {
    const provider = process.env.STORAGE_PROVIDER || "local";
    if (provider === "s3") {
      adapterInstance = new S3CompatibleStorageAdapter();
    } else {
      adapterInstance = new LocalStorageAdapter();
    }
  }
  return adapterInstance;
}

export * from "./storage-adapter";
export * from "./local-storage-adapter";
export * from "./s3-storage-adapter";
