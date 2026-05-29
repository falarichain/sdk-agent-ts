// ── @falari/sdk — Falari Agent SDK ──

export { FalariSDK } from './client.js';

// Types
export type {
  SDKConfig,
  UploadInput,
  UploadProgress,
  EncryptedUploadInput,
  DownloadOptions,
  EncryptedDownloadOptions,
  CollectionOptions,
  RecordOptions,
  RecordFilter,
  ShareAddressOptions,
  SharePasscodeOptions,
  CollectionDownloadOptions,
} from './types/params.js';

export type {
  UploadResult,
  EncryptedUploadResult,
  DownloadResult,
  RenewResult,
  TerminateResult,
  CollectionResult,
  RecordResult,
  ShareResult,
  AgentKeyInfo,
  CollectionDownloadResult,
} from './types/results.js';

export type {
  DataCollection,
  DataRecord,
  IntentView,
  StorageManifestResponse,
  ChainStatus,
  AccountInfo,
} from './types/wire.js';

// Errors
export {
  FalariError,
  AuthenticationError,
  PermissionError,
  NetworkError,
  ChainApiError,
  SigningError,
  EncryptionError,
  UploadError,
  DownloadError,
} from './errors.js';

// Utilities (for advanced usage)
export { decodeAgentKeyString, encodeAgentKeyString, normalizeAddress } from './auth/agent-key.js';
export { deriveStorageVaultKey } from './crypto/kdf.js';
