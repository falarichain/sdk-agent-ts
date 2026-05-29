import { ethers } from 'ethers';
import { keccak256Utf8 } from '../crypto/hash.js';
import { normalizeAddress } from './agent-key.js';
import { SigningError } from '../errors.js';
import type {
  SegmentPlan,
  ErasurePolicy,
  EncryptionMetadata,
  StoragePolicy,
  MinerReceipt,
  PasscodeKDFParams,
} from '../types/wire.js';

interface SignResult {
  signature: string;
  publicKey: string;
}

function signHash(hash: string, privateKey: string): SignResult {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const sig = wallet.signingKey.sign(ethers.getBytes(hash)).serialized;
    return {
      signature: sig,
      publicKey: wallet.signingKey.publicKey,
    };
  } catch (err) {
    throw new SigningError(`signing failed: ${(err as Error).message}`);
  }
}

// ── Agent Key operations (use agent_nonce, agent_key_id) ──

export function signCreateIntent(
  params: {
    chainId: string;
    user: string;
    fileName: string;
    fileSize: number;
    segmentSize: number;
    fileRoot: string;
    segmentRoots: string[];
    segments: SegmentPlan[];
    erasure: ErasurePolicy;
    encryption?: EncryptionMetadata;
    lockedFee: number;
    deadlineUnix: number;
    nonce: number;
    agentKeyId?: string;
    agentNonce?: number;
    policy: StoragePolicy;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'create_intent',
    user: normalizeAddress(params.user),
    file_name: params.fileName,
    file_size: params.fileSize,
    segment_size: params.segmentSize,
    file_root: params.fileRoot,
    segment_roots: params.segmentRoots,
    segments: params.segments,
    erasure: params.erasure,
    locked_fee: params.lockedFee,
    deadline_unix: params.deadlineUnix,
    nonce: params.nonce,
    policy: params.policy,
  };
  if (params.encryption) payload.encryption = params.encryption;
  if (params.agentKeyId) payload.agent_key_id = params.agentKeyId;
  if (params.agentNonce) payload.agent_nonce = params.agentNonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signBatchCommit(
  params: {
    chainId: string;
    intentId: string;
    user: string;
    receipts: MinerReceipt[];
    nonce: number;
    agentKeyId?: string;
    agentNonce?: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'batch_commit',
    intent_id: params.intentId,
    user: normalizeAddress(params.user),
    receipts: params.receipts,
    nonce: params.nonce,
  };
  if (params.agentKeyId) payload.agent_key_id = params.agentKeyId;
  if (params.agentNonce) payload.agent_nonce = params.agentNonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signFinalize(
  params: {
    chainId: string;
    intentId: string;
    user: string;
    manifestRoot: string;
    nonce: number;
    agentKeyId?: string;
    agentNonce?: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'finalize',
    intent_id: params.intentId,
    user: normalizeAddress(params.user),
    manifest_root: params.manifestRoot,
    nonce: params.nonce,
  };
  if (params.agentKeyId) payload.agent_key_id = params.agentKeyId;
  if (params.agentNonce) payload.agent_nonce = params.agentNonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signRenewDeal(
  params: {
    chainId: string;
    intentId: string;
    user: string;
    duration: number;
    nonce: number;
    agentKeyId?: string;
    agentNonce?: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'renew_deal',
    intent_id: params.intentId,
    user: normalizeAddress(params.user),
    duration: params.duration,
    nonce: params.nonce,
  };
  if (params.agentKeyId) payload.agent_key_id = params.agentKeyId;
  if (params.agentNonce) payload.agent_nonce = params.agentNonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signTerminateDeal(
  params: {
    chainId: string;
    intentId: string;
    user: string;
    reason: string;
    nonce: number;
    agentKeyId?: string;
    agentNonce?: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'terminate_deal',
    intent_id: params.intentId,
    user: normalizeAddress(params.user),
    nonce: params.nonce,
  };
  if (params.reason) payload.reason = params.reason;
  if (params.agentKeyId) payload.agent_key_id = params.agentKeyId;
  if (params.agentNonce) payload.agent_nonce = params.agentNonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

// ── Collection operations (user/master key, no agent_key_id) ──

export function signCreateCollection(
  params: {
    chainId: string;
    user: string;
    name: string;
    description: string;
    metadata: Record<string, string>;
    nonce: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    user: normalizeAddress(params.user),
    name: params.name,
  };
  if (params.description) payload.description = params.description;
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    payload.metadata = params.metadata;
  }
  payload.nonce = params.nonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signAppendRecord(
  params: {
    chainId: string;
    collectionId: string;
    user: string;
    intentId: string;
    parentRecord: string;
    kind: string;
    key: string;
    manifestRoot: string;
    metadata: Record<string, string>;
    nonce: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    collection_id: params.collectionId,
    user: normalizeAddress(params.user),
    intent_id: params.intentId,
  };
  if (params.parentRecord) payload.parent_record = params.parentRecord;
  if (params.kind) payload.kind = params.kind;
  if (params.key) payload.key = params.key;
  if (params.manifestRoot) payload.manifest_root = params.manifestRoot;
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    payload.metadata = params.metadata;
  }
  payload.nonce = params.nonce;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

// ── Sharing operations (user key, account_nonce) ──

export function signCreateKeyEnvelope(
  params: {
    chainId: string;
    intentId: string;
    owner: string;
    recipient: string;
    recipientType: string;
    algorithm: string;
    encryptedDataKey: string;
    nonce: string;
    kdf?: PasscodeKDFParams;
    expiresAtUnix: number;
    accountNonce: number;
  },
  privateKey: string,
): SignResult {
  const payload: Record<string, unknown> = {
    chain_id: params.chainId,
    action: 'create_key_envelope',
    intent_id: params.intentId,
    owner: normalizeAddress(params.owner),
    recipient: params.recipient,
    recipient_type: params.recipientType,
    algorithm: params.algorithm,
    encrypted_data_key: params.encryptedDataKey,
    account_nonce: params.accountNonce,
  };
  if (params.nonce) payload.nonce = params.nonce;
  if (params.kdf) payload.kdf = params.kdf;
  if (params.expiresAtUnix) payload.expires_at_unix = params.expiresAtUnix;
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}

export function signCreateAddressShare(
  params: {
    chainId: string;
    intentId: string;
    owner: string;
    recipient: string;
    algorithm: string;
    encryptedDataKey: string;
    nonce: string;
    kdf?: PasscodeKDFParams;
    expiresAtUnix: number;
    accountNonce: number;
  },
  privateKey: string,
): SignResult {
  // Address share uses same payload as key envelope with recipient_type="address"
  return signCreateKeyEnvelope(
    {
      ...params,
      recipient: normalizeAddress(params.recipient),
      recipientType: 'address',
    },
    privateKey,
  );
}

export function signCreatePasscodeShare(
  params: {
    chainId: string;
    intentId: string;
    owner: string;
    algorithm: string;
    encryptedDataKey: string;
    nonce: string;
    kdf?: PasscodeKDFParams;
    expiresAtUnix: number;
    accountNonce: number;
  },
  privateKey: string,
): SignResult {
  // Passcode share uses recipient="passcode", recipient_type="passcode"
  return signCreateKeyEnvelope(
    {
      ...params,
      recipient: 'passcode',
      recipientType: 'passcode',
    },
    privateKey,
  );
}

export function signRevokeShare(
  params: {
    chainId: string;
    shareId: string;
    owner: string;
    accountNonce: number;
  },
  privateKey: string,
): SignResult {
  const payload = {
    chain_id: params.chainId,
    action: 'revoke_share',
    share_id: params.shareId,
    owner: normalizeAddress(params.owner),
    account_nonce: params.accountNonce,
  };
  return signHash(keccak256Utf8(JSON.stringify(payload)), privateKey);
}
