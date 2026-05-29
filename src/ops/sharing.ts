import type { ChainApi } from '../net/chain-api.js';
import {
  signCreateAddressShare,
  signCreatePasscodeShare,
  signRevokeShare,
} from '../auth/signer.js';
import { normalizeAddress } from '../auth/agent-key.js';
import { wrapDataKey } from './encryption.js';
import { deriveAddressLinkKey, derivePasscodeKey } from '../crypto/kdf.js';
import { randomBytesSync, bytesToBase64, base64ToBytes } from '../crypto/hash.js';
import { ENCRYPTION } from '../config.js';
import type { ShareAddressOptions, SharePasscodeOptions } from '../types/params.js';
import type { ShareResult } from '../types/results.js';

export async function shareWithAddress(
  chain: ChainApi,
  chainId: string,
  owner: string,
  privateKey: string,
  intentId: string,
  recipient: string,
  opts: ShareAddressOptions,
): Promise<ShareResult> {
  const dataKey = base64ToBytes(opts.dataKey);
  const salt = randomBytesSync(ENCRYPTION.saltLength);
  const iterations = ENCRYPTION.pbkdf2Iterations;
  const wrappingKey = deriveAddressLinkKey('share', recipient, salt, iterations);
  const wrapped = wrapDataKey(dataKey, wrappingKey, ENCRYPTION.addressWrapAlgorithm);

  const account = await chain.getAccount(owner);
  const sig = signCreateAddressShare(
    {
      chainId,
      intentId,
      owner,
      recipient,
      algorithm: ENCRYPTION.addressWrapAlgorithm,
      encryptedDataKey: wrapped.encryptedDataKey,
      nonce: wrapped.nonce,
      kdf: {
        name: ENCRYPTION.passcodeKDF,
        salt: bytesToBase64(salt),
        memory_kib: 0,
        iterations,
        parallelism: 1,
      },
      expiresAtUnix: opts.expiresAtUnix || 0,
      accountNonce: account.nonce,
    },
    privateKey,
  );

  const resp = await chain.createAddressShare({
    chain_id: chainId,
    intent_id: intentId,
    owner: normalizeAddress(owner),
    recipient: normalizeAddress(recipient),
    algorithm: ENCRYPTION.addressWrapAlgorithm,
    encrypted_data_key: wrapped.encryptedDataKey,
    nonce: wrapped.nonce,
    kdf: {
      name: ENCRYPTION.passcodeKDF,
      salt: bytesToBase64(salt),
      memory_kib: 0,
      iterations,
      parallelism: 1,
    },
    expires_at_unix: opts.expiresAtUnix || 0,
    account_nonce: account.nonce,
    public_key: sig.publicKey,
    signature: sig.signature,
  });
  return { shareId: resp.share.share_id };
}

export async function shareWithPasscode(
  chain: ChainApi,
  chainId: string,
  owner: string,
  privateKey: string,
  intentId: string,
  opts: SharePasscodeOptions,
): Promise<ShareResult> {
  const dataKey = base64ToBytes(opts.dataKey);
  const accessCode = opts.accessCode || bytesToBase64(randomBytesSync(16));
  const salt = randomBytesSync(ENCRYPTION.saltLength);
  const iterations = ENCRYPTION.pbkdf2Iterations;
  const wrappingKey = derivePasscodeKey(accessCode, salt, iterations);
  const wrapped = wrapDataKey(dataKey, wrappingKey, ENCRYPTION.passcodeWrapAlgorithm);

  const account = await chain.getAccount(owner);
  const sig = signCreatePasscodeShare(
    {
      chainId,
      intentId,
      owner,
      algorithm: ENCRYPTION.passcodeWrapAlgorithm,
      encryptedDataKey: wrapped.encryptedDataKey,
      nonce: wrapped.nonce,
      kdf: {
        name: ENCRYPTION.passcodeKDF,
        salt: bytesToBase64(salt),
        memory_kib: 0,
        iterations,
        parallelism: 1,
      },
      expiresAtUnix: opts.expiresAtUnix || 0,
      accountNonce: account.nonce,
    },
    privateKey,
  );

  const resp = await chain.createPasscodeShare({
    chain_id: chainId,
    intent_id: intentId,
    owner: normalizeAddress(owner),
    mode: opts.mode || 'passcode',
    algorithm: ENCRYPTION.passcodeWrapAlgorithm,
    encrypted_data_key: wrapped.encryptedDataKey,
    nonce: wrapped.nonce,
    kdf: {
      name: ENCRYPTION.passcodeKDF,
      salt: bytesToBase64(salt),
      memory_kib: 0,
      iterations,
      parallelism: 1,
    },
    expires_at_unix: opts.expiresAtUnix || 0,
    account_nonce: account.nonce,
    public_key: sig.publicKey,
    signature: sig.signature,
  });
  return { shareId: resp.share.share_id, accessCode };
}

export async function revokeShare(
  chain: ChainApi,
  chainId: string,
  owner: string,
  privateKey: string,
  shareId: string,
): Promise<void> {
  const account = await chain.getAccount(owner);
  const sig = signRevokeShare(
    {
      chainId,
      shareId,
      owner,
      accountNonce: account.nonce,
    },
    privateKey,
  );

  await chain.revokeShare({
    chain_id: chainId,
    share_id: shareId,
    owner: normalizeAddress(owner),
    account_nonce: account.nonce,
    public_key: sig.publicKey,
    signature: sig.signature,
  });
}
