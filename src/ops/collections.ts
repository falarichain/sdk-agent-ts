import type { ChainApi } from '../net/chain-api.js';
import { signCreateCollection, signAppendRecord } from '../auth/signer.js';
import { normalizeAddress } from '../auth/agent-key.js';
import type { CollectionOptions, RecordOptions, RecordFilter } from '../types/params.js';
import type { CollectionResult, RecordResult } from '../types/results.js';
import type { DataCollection, DataRecord } from '../types/wire.js';

export async function createCollection(
  chain: ChainApi,
  chainId: string,
  user: string,
  privateKey: string,
  name: string,
  opts?: CollectionOptions,
): Promise<CollectionResult> {
  const account = await chain.getAccount(user);
  const sig = signCreateCollection(
    {
      chainId,
      user,
      name,
      description: opts?.description || '',
      metadata: opts?.metadata || {},
      nonce: account.nonce,
    },
    privateKey,
  );

  const resp = await chain.createCollection({
    chain_id: chainId,
    user: normalizeAddress(user),
    name,
    description: opts?.description || '',
    metadata: opts?.metadata || {},
    nonce: account.nonce,
    public_key: sig.publicKey,
    signature: sig.signature,
  });
  return { collectionId: resp.collection.collection_id };
}

export async function appendRecord(
  chain: ChainApi,
  chainId: string,
  user: string,
  privateKey: string,
  collectionId: string,
  intentId: string,
  opts?: RecordOptions,
): Promise<RecordResult> {
  const account = await chain.getAccount(user);
  const sig = signAppendRecord(
    {
      chainId,
      collectionId,
      user,
      intentId,
      parentRecord: opts?.parentRecord || '',
      kind: opts?.kind || '',
      key: opts?.key || '',
      manifestRoot: '',
      metadata: opts?.metadata || {},
      nonce: account.nonce,
    },
    privateKey,
  );

  const resp = await chain.appendRecord({
    chain_id: chainId,
    collection_id: collectionId,
    user: normalizeAddress(user),
    intent_id: intentId,
    parent_record: opts?.parentRecord || '',
    kind: opts?.kind || '',
    key: opts?.key || '',
    manifest_root: '',
    metadata: opts?.metadata || {},
    nonce: account.nonce,
    public_key: sig.publicKey,
    signature: sig.signature,
  });
  return { recordId: resp.record.record_id };
}

export async function listCollections(
  chain: ChainApi,
  user: string,
): Promise<DataCollection[]> {
  const resp = await chain.listUserCollections(user);
  return resp.collections || [];
}

export async function listRecords(
  chain: ChainApi,
  collectionId: string,
  filter?: RecordFilter,
): Promise<DataRecord[]> {
  const params: Record<string, string> = {};
  if (filter?.kind) params.kind = filter.kind;
  if (filter?.key) params.key = filter.key;
  if (filter?.parent_record) params.parent = filter.parent_record;
  if (filter?.after_unix != null) params.after = String(filter.after_unix);
  if (filter?.before_unix != null) params.before = String(filter.before_unix);
  if (filter?.limit != null) params.limit = String(filter.limit);
  if (filter?.reverse) params.reverse = 'true';

  const resp = await chain.getCollectionRecords(collectionId, params);
  return resp.records || [];
}
