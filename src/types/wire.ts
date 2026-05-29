/**
 * Wire types — snake_case interfaces matching Go `chain/internal/wire/types.go`.
 */

// ── Storage Policy ──

export interface ErasurePolicy {
  data_shards: number;
  parity_shards: number;
  shard_size: number;
}

export interface StoragePolicy {
  class: string;
  duration: number;
  redundancy: string;
  renewable: boolean;
  auto_renew: boolean;
  deletion_policy: string;
}

export interface EncryptionMetadata {
  algorithm: string;
  key_hash: string;
  nonce_base64: string;
  plaintext_size: number;
  plaintext_segment_size: number;
}

export interface SegmentPlan {
  segment_id: number;
  segment_root: string;
  shard_hashes: string[];
  shard_cids?: string[];
}

export interface StorageAssignment {
  segment_id: number;
  shard_index: number;
  miner_address: string;
  endpoint: string;
  shard_hash: string;
  shard_cid: string;
  shard_size: number;
}

// ── Intent ──

export interface CreateIntentRequest {
  chain_id: string;
  user: string;
  file_name: string;
  file_size: number;
  segment_size: number;
  file_root: string;
  segment_roots: string[];
  segments: SegmentPlan[];
  erasure: ErasurePolicy;
  encryption?: EncryptionMetadata;
  policy: StoragePolicy;
  locked_fee: number;
  deadline_unix: number;
  nonce: number;
  signature: string;
  public_key: string;
  agent_key_id?: string;
  agent_nonce?: number;
  agent_public_key?: string;
  agent_signature?: string;
}

export interface CreateIntentResponse {
  intent_id: string;
  status: string;
  required_fee: number;
  locked_fee: number;
  burned_fee: number;
  retrieval_fee: number;
  foundation_fee: number;
  assignments: StorageAssignment[];
}

export interface IntentView {
  intent_id: string;
  user: string;
  file_name: string;
  file_size: number;
  segment_size: number;
  file_root: string;
  segment_roots: string[];
  segments: SegmentPlan[];
  assignments: StorageAssignment[];
  erasure: ErasurePolicy;
  encryption?: EncryptionMetadata;
  policy: StoragePolicy;
  locked_fee: number;
  paid_fee: number;
  uploaded_size: number;
  committed_segments: number;
  status: string;
  storage_status: string;
  deal_id: string;
  expires_at_unix: number;
  terminated_at_unix: number;
}

export interface UploadPlan {
  intent_id: string;
  user: string;
  file_name: string;
  file_size: number;
  segment_size: number;
  file_root: string;
  segment_roots: string[];
  segments: SegmentPlan[];
  assignments: StorageAssignment[];
  erasure: ErasurePolicy;
  encryption?: EncryptionMetadata;
  policy: StoragePolicy;
  locked_fee: number;
  receipts: MinerReceipt[];
  committed_segments: number[];
}

export interface StorageManifestResponse {
  intent_id: string;
  status: string;
  deal_id: string;
  complete: boolean;
  receipt_count: number;
  plan: UploadPlan;
}

// ── Miner Receipt ──

export interface MinerReceipt {
  version: number;
  miner_address: string;
  miner_public_key: string;
  user: string;
  intent_id: string;
  file_root: string;
  segment_id: number;
  segment_root: string;
  shard_index: number;
  shard_id: string;
  shard_hash: string;
  shard_cid: string;
  shard_size: number;
  sector_commitment: string;
  miner_seal: string;
  expires_at_unix: number;
  miner_endpoint: string;
  signature: string;
}

// ── Batch Commit & Finalize ──

export interface BatchCommitRequest {
  chain_id: string;
  intent_id: string;
  user: string;
  receipts: MinerReceipt[];
  nonce: number;
  signature: string;
  public_key: string;
  agent_key_id?: string;
  agent_nonce?: number;
  agent_public_key?: string;
  agent_signature?: string;
}

export interface BatchCommitResponse {
  intent_id: string;
  status: string;
  committed_segments: number;
  uploaded_size: number;
}

export interface FinalizeRequest {
  chain_id: string;
  intent_id: string;
  user: string;
  manifest_root: string;
  nonce: number;
  signature: string;
  public_key: string;
  agent_key_id?: string;
  agent_nonce?: number;
  agent_public_key?: string;
  agent_signature?: string;
}

export interface FinalizeResponse {
  intent_id: string;
  deal_id: string;
  status: string;
}

// ── Deal Management ──

export interface RenewDealRequest {
  chain_id: string;
  intent_id: string;
  user: string;
  duration: number;
  nonce: number;
  signature: string;
  public_key: string;
  agent_key_id?: string;
  agent_nonce?: number;
  agent_public_key?: string;
  agent_signature?: string;
}

export interface RenewDealResponse {
  intent_id: string;
  status: string;
  expires_at_unix: number;
  new_locked_fee: number;
  paid_amount: number;
}

export interface TerminateDealRequest {
  chain_id: string;
  intent_id: string;
  user: string;
  reason: string;
  nonce: number;
  signature: string;
  public_key: string;
  agent_key_id?: string;
  agent_nonce?: number;
  agent_public_key?: string;
  agent_signature?: string;
}

export interface TerminateDealResponse {
  intent_id: string;
  status: string;
  storage_status: string;
  refunded_fee: number;
  terminated_at_unix: number;
}

// ── Collections ──

export interface DataCollection {
  collection_id: string;
  user: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  created_at_unix: number;
  updated_at_unix: number;
}

export interface DataRecord {
  record_id: string;
  collection_id: string;
  user: string;
  intent_id: string;
  deal_id: string;
  parent_record: string;
  kind: string;
  key: string;
  file_root: string;
  manifest_root: string;
  metadata: Record<string, string>;
  created_at_unix: number;
}

export interface CreateCollectionRequest {
  chain_id: string;
  user: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  nonce: number;
  public_key: string;
  signature: string;
}

export interface CreateCollectionResponse {
  collection: DataCollection;
}

export interface AppendRecordRequest {
  chain_id: string;
  collection_id: string;
  user: string;
  intent_id: string;
  parent_record: string;
  kind: string;
  key: string;
  manifest_root: string;
  metadata: Record<string, string>;
  nonce: number;
  public_key: string;
  signature: string;
}

export interface AppendRecordResponse {
  record: DataRecord;
}

export interface CollectionResponse {
  collection: DataCollection;
}

export interface CollectionRecordsResponse {
  collection_id: string;
  records: DataRecord[];
}

export interface UserCollectionsResponse {
  user: string;
  collections: DataCollection[];
}

// ── Key Envelope & Sharing ──

export interface PasscodeKDFParams {
  name: string;
  salt: string;
  memory_kib: number;
  iterations: number;
  parallelism: number;
}

export interface KeyEnvelope {
  envelope_id: string;
  intent_id: string;
  share_id: string;
  owner: string;
  recipient: string;
  recipient_type: string;
  algorithm: string;
  encrypted_data_key: string;
  nonce: string;
  kdf?: PasscodeKDFParams;
  created_at_unix: number;
  expires_at_unix: number;
  revoked: boolean;
}

export interface ShareRecord {
  share_id: string;
  intent_id: string;
  owner: string;
  mode: string;
  recipient: string;
  envelope_id: string;
  created_at_unix: number;
  expires_at_unix: number;
  revoked: boolean;
}

export interface CreateKeyEnvelopeRequest {
  chain_id: string;
  intent_id: string;
  owner: string;
  recipient: string;
  recipient_type: string;
  algorithm: string;
  encrypted_data_key: string;
  nonce: string;
  kdf?: PasscodeKDFParams;
  expires_at_unix: number;
  account_nonce: number;
  public_key: string;
  signature: string;
}

export interface CreateAddressShareRequest {
  chain_id: string;
  intent_id: string;
  owner: string;
  recipient: string;
  algorithm: string;
  encrypted_data_key: string;
  nonce: string;
  kdf?: PasscodeKDFParams;
  expires_at_unix: number;
  account_nonce: number;
  public_key: string;
  signature: string;
}

export interface CreatePasscodeShareRequest {
  chain_id: string;
  intent_id: string;
  owner: string;
  mode: string;
  algorithm: string;
  encrypted_data_key: string;
  nonce: string;
  kdf?: PasscodeKDFParams;
  expires_at_unix: number;
  account_nonce: number;
  public_key: string;
  signature: string;
}

export interface RevokeShareRequest {
  chain_id: string;
  share_id: string;
  owner: string;
  account_nonce: number;
  public_key: string;
  signature: string;
}

// ── Agent Key ──

export interface AgentKey {
  key_id: string;
  name: string;
  master: string;
  agent_pub: string;
  nonce: number;
  permissions: string[];
  daily_limit: number;
  total_limit: number;
  used_today: number;
  used_total: number;
  day_reset_at: number;
  created_at: number;
  expires_at: number;
  revoked: boolean;
}

export interface RegisterAgentKeyRequest {
  chain_id: string;
  master: string;
  name: string;
  agent_pub: string;
  permissions: string[];
  daily_limit: number;
  total_limit: number;
  expires_at: number;
  nonce: number;
  signature: string;
}

// ── Account & Chain ──

export interface ChainStatus {
  chain_id: string;
  height: number;
  [key: string]: unknown;
}

export interface AccountInfo {
  address: string;
  balance: number;
  nonce: number;
}

export interface StorageQuoteRequest {
  file_size: number;
  erasure: ErasurePolicy;
  policy: StoragePolicy;
}

export interface StorageQuoteResponse {
  pricing: Record<string, unknown>;
  required_fee: number;
}
