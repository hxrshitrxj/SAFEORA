export type StorageNamespace = "primary" | "recovery" | "fixtures";

export interface StorageAdapter {
  write(namespace: StorageNamespace, key: string, buffer: Buffer): Promise<string>;
  read(namespace: StorageNamespace, key: string): Promise<Buffer>;
  delete(namespace: StorageNamespace, key: string): Promise<boolean>;
  exists(namespace: StorageNamespace, key: string): Promise<boolean>;
  copyToRecovery(primaryKey: string, recoveryKey: string): Promise<string>;
  getStatus(): {
    provider: string;
    isIsolatedRecovery: boolean;
    primaryTarget: string;
    recoveryTarget: string;
    modeDescription: string;
  };
}
