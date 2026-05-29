/**
 * Public-facing parameter interfaces (camelCase).
 */

export interface SDKConfig {
  chainUrl: string;
  gatewayUrl?: string;
  agentKey: string;
  timeout?: number;
  retries?: number;
}

export interface UploadInput {
  /** File path or Buffer */
  file: string | Uint8Array;
  /** File name (required when file is Buffer) */
  fileName?: string;
  /** Upload mode: 'gateway' (default) or 'direct' */
  mode?: 'gateway' | 'direct';
  /** Storage duration in seconds (default: 1 year) */
  duration?: number;
  /** Progress callback */
  onProgress?: (event: UploadProgress) => void;
}

export interface UploadProgress {
  stage: 'preparing' | 'uploading' | 'committing' | 'finalizing' | 'done';
  shardsTotal?: number;
  shardsDone?: number;
  bytesTotal?: number;
}

export interface EncryptedUploadInput extends UploadInput {
  /** Pre-existing data key (base64). Generated if not provided. */
  dataKey?: string;
}

export interface DownloadOptions {
  mode?: 'gateway' | 'direct';
}

export interface EncryptedDownloadOptions extends DownloadOptions {
  /** Direct data key (base64) */
  dataKey?: string;
  /** Master private key to recover data key from vault */
  masterPrivateKey?: string;
}

export interface CollectionOptions {
  description?: string;
  metadata?: Record<string, string>;
}

export interface RecordOptions {
  kind?: string;
  key?: string;
  parentRecord?: string;
  metadata?: Record<string, string>;
}

export interface RecordFilter {
  kind?: string;
  key?: string;
  parent_record?: string;
  after_unix?: number;
  before_unix?: number;
  limit?: number;
  reverse?: boolean;
}

export interface ShareAddressOptions {
  dataKey: string;
  expiresAtUnix?: number;
}

export interface SharePasscodeOptions {
  dataKey: string;
  mode?: 'passcode' | 'link_fragment';
  accessCode?: string;
  expiresAtUnix?: number;
}

export interface CollectionDownloadOptions {
  outputDir: string;
  onProgress?: (file: string, index: number, total: number) => void;
}
