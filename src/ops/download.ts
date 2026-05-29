import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { ChainApi } from '../net/chain-api.js';
import { GatewayApi } from '../net/gateway-api.js';
import { decryptSegment } from './encryption.js';
import { base64ToBytes, sha256 } from '../crypto/hash.js';
import type { DownloadResult } from '../types/results.js';
import type { EncryptedDownloadOptions, CollectionDownloadOptions } from '../types/params.js';
import type { CollectionDownloadResult } from '../types/results.js';
import { DownloadError } from '../errors.js';

/**
 * Download a file via Gateway.
 */
export async function downloadViaGateway(
  gateway: GatewayApi,
  intentId: string,
): Promise<DownloadResult> {
  return gateway.download(intentId);
}

/**
 * Download and decrypt a file.
 * Requires manifest with encryption metadata + data key.
 */
export async function downloadEncrypted(
  chain: ChainApi,
  gateway: GatewayApi | null,
  intentId: string,
  opts: EncryptedDownloadOptions,
): Promise<DownloadResult> {
  // 1. Fetch manifest
  const manifest = await chain.getManifest(intentId);
  const plan = manifest.plan;
  const encryption = plan.encryption;
  if (!encryption) {
    throw new DownloadError('file is not encrypted');
  }

  // 2. Resolve data key
  let dataKey: Uint8Array;
  if (opts.dataKey) {
    dataKey = base64ToBytes(opts.dataKey);
  } else if (opts.masterPrivateKey) {
    dataKey = await recoverDataKeyFromVault(chain, intentId, plan.user, opts.masterPrivateKey);
  } else {
    throw new DownloadError('dataKey or masterPrivateKey is required for encrypted download');
  }

  // 3. Verify key hash
  const keyHash = sha256(dataKey);
  if (keyHash !== encryption.key_hash.replace(/^0x/, '')) {
    throw new DownloadError('data key does not match manifest key_hash');
  }

  // 4. Download raw bytes from gateway
  if (!gateway) {
    throw new DownloadError('gateway URL is required for encrypted download');
  }
  const { data: ciphertext, fileName } = await gateway.download(intentId);

  // 5. Decrypt segment by segment
  const nonceBase = base64ToBytes(encryption.nonce_base64);
  const plainSegSize = encryption.plaintext_segment_size;
  const totalSegments = Math.ceil(encryption.plaintext_size / plainSegSize);
  const result = new Uint8Array(encryption.plaintext_size);

  for (let segId = 0; segId < totalSegments; segId++) {
    const cipherOffset = segId * (plainSegSize + 16); // +16 for GCM tag
    const cipherLen = Math.min(plainSegSize + 16, ciphertext.length - cipherOffset);
    const cipherSeg = ciphertext.slice(cipherOffset, cipherOffset + cipherLen);
    const plainSeg = decryptSegment(cipherSeg, dataKey, nonceBase, keyHash, segId);
    const plainLen = Math.min(plainSeg.length, encryption.plaintext_size - segId * plainSegSize);
    result.set(plainSeg.slice(0, plainLen), segId * plainSegSize);
  }

  return { fileName, data: result };
}

/**
 * Recover data key from owner's Storage Vault Key.
 */
async function recoverDataKeyFromVault(
  chain: ChainApi,
  intentId: string,
  owner: string,
  masterPrivateKey: string,
): Promise<Uint8Array> {
  const { deriveStorageVaultKey } = await import('../crypto/kdf.js');
  const { unwrapDataKey } = await import('./encryption.js');
  const { ENCRYPTION } = await import('../config.js');

  const vaultKey = deriveStorageVaultKey(masterPrivateKey, owner);
  const resp = await chain.listKeyEnvelopes({
    intent_id: intentId,
    recipient: owner,
    recipient_type: 'owner',
  });
  const envelope = resp.envelopes.find(
    (e) => (e.recipient_type || '') === 'owner' && !e.revoked,
  );
  if (!envelope) {
    throw new DownloadError('owner key envelope not found');
  }
  return unwrapDataKey(
    envelope.encrypted_data_key,
    envelope.nonce,
    vaultKey,
    envelope.algorithm || ENCRYPTION.ownerWrapAlgorithm,
  );
}

/**
 * Download all files in a collection.
 */
export async function downloadCollection(
  gateway: GatewayApi,
  collectionId: string,
  opts: CollectionDownloadOptions,
): Promise<CollectionDownloadResult> {
  await mkdir(opts.outputDir, { recursive: true });
  const info = await gateway.collectionFiles(collectionId);
  const files: { fileName: string; path: string }[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < info.files.length; i++) {
    const file = info.files[i];
    const outPath = join(opts.outputDir, file.file_name || `file_${i}`);
    try {
      const result = await gateway.download(file.intent_id);
      await writeFile(outPath, result.data);
      files.push({ fileName: file.file_name, path: outPath });
      succeeded++;
    } catch {
      failed++;
    }
    opts.onProgress?.(file.file_name, i + 1, info.files.length);
  }

  return { collectionId, files, succeeded, failed };
}
