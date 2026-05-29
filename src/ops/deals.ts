import type { ChainApi } from '../net/chain-api.js';
import { signRenewDeal, signTerminateDeal } from '../auth/signer.js';
import { normalizeAddress } from '../auth/agent-key.js';
import type { RenewResult, TerminateResult } from '../types/results.js';
import type { IntentView, StorageManifestResponse } from '../types/wire.js';

export async function renewDeal(
  chain: ChainApi,
  chainId: string,
  user: string,
  privateKey: string,
  intentId: string,
  duration: number,
  agentKeyId?: string,
  agentNonce?: number,
): Promise<RenewResult> {
  const account = await chain.getAccount(user);
  const sig = signRenewDeal(
    {
      chainId,
      intentId,
      user,
      duration,
      nonce: account.nonce,
      agentKeyId,
      agentNonce,
    },
    privateKey,
  );

  const resp = await chain.renewDeal({
    chain_id: chainId,
    intent_id: intentId,
    user: normalizeAddress(user),
    duration,
    nonce: account.nonce,
    signature: sig.signature,
    public_key: sig.publicKey,
    agent_key_id: agentKeyId || '',
    agent_nonce: agentNonce || 0,
    agent_public_key: agentKeyId ? sig.publicKey : '',
    agent_signature: agentKeyId ? sig.signature : '',
  });
  return {
    intentId: resp.intent_id,
    status: resp.status,
    expiresAtUnix: resp.expires_at_unix,
  };
}

export async function terminateDeal(
  chain: ChainApi,
  chainId: string,
  user: string,
  privateKey: string,
  intentId: string,
  reason?: string,
  agentKeyId?: string,
  agentNonce?: number,
): Promise<TerminateResult> {
  const account = await chain.getAccount(user);
  const sig = signTerminateDeal(
    {
      chainId,
      intentId,
      user,
      reason: reason || '',
      nonce: account.nonce,
      agentKeyId,
      agentNonce,
    },
    privateKey,
  );

  const resp = await chain.terminateDeal({
    chain_id: chainId,
    intent_id: intentId,
    user: normalizeAddress(user),
    reason: reason || '',
    nonce: account.nonce,
    signature: sig.signature,
    public_key: sig.publicKey,
    agent_key_id: agentKeyId || '',
    agent_nonce: agentNonce || 0,
    agent_public_key: agentKeyId ? sig.publicKey : '',
    agent_signature: agentKeyId ? sig.signature : '',
  });
  return {
    intentId: resp.intent_id,
    status: resp.status,
    refundedFee: resp.refunded_fee,
  };
}

export async function getStatus(
  chain: ChainApi,
  intentId: string,
): Promise<IntentView> {
  return chain.getIntent(intentId);
}

export async function getManifest(
  chain: ChainApi,
  intentId: string,
): Promise<StorageManifestResponse> {
  return chain.getManifest(intentId);
}
