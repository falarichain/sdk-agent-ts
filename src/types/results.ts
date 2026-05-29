/**
 * Return type interfaces.
 */

import type {
  DataCollection,
  DataRecord,
  IntentView,
  StorageManifestResponse,
  ChainStatus,
  AccountInfo,
} from './wire.js';

export interface UploadResult {
  intentId: string;
  dealId: string;
  fileName: string;
  fileSize: number;
}

export interface EncryptedUploadResult extends UploadResult {
  dataKey: string;
}

export interface DownloadResult {
  fileName: string;
  data: Uint8Array;
}

export interface RenewResult {
  intentId: string;
  status: string;
  expiresAtUnix: number;
}

export interface TerminateResult {
  intentId: string;
  status: string;
  refundedFee: number;
}

export interface CollectionResult {
  collectionId: string;
}

export interface RecordResult {
  recordId: string;
}

export interface ShareResult {
  shareId: string;
  accessCode?: string;
}

export interface AgentKeyInfo {
  keyId: string;
  master: string;
  address: string;
  publicKey: string;
}

export interface CollectionDownloadResult {
  collectionId: string;
  files: { fileName: string; path: string }[];
  succeeded: number;
  failed: number;
}

export type { DataCollection, DataRecord, IntentView, StorageManifestResponse, ChainStatus, AccountInfo };
