import { pbkdf2Sync } from 'node:crypto';
import { sha256Bytes } from './hash.js';
import { hexToBytes } from './hash.js';

/**
 * Derive Storage Vault Key from master private key + owner address.
 * Matches extension/src/lib/private-storage.ts deriveStorageVaultKey().
 */
export function deriveStorageVaultKey(
  masterPrivateKey: string,
  ownerAddress: string,
): Uint8Array {
  const privBytes = hexToBytes(masterPrivateKey.replace(/^0x/, ''));
  const context = new TextEncoder().encode(
    `Falari Storage Vault Key v1:${ownerAddress.toLowerCase()}:`,
  );
  const material = new Uint8Array(context.length + privBytes.length);
  material.set(context, 0);
  material.set(privBytes, context.length);
  return sha256Bytes(material);
}

/**
 * Derive passcode wrapping key via PBKDF2-SHA256.
 */
export function derivePasscodeKey(
  accessCode: string,
  salt: Uint8Array,
  iterations: number,
): Uint8Array {
  return new Uint8Array(
    pbkdf2Sync(
      Buffer.from(accessCode, 'utf-8'),
      salt,
      iterations,
      32,
      'sha256',
    ),
  );
}

/**
 * Derive address-link wrapping key: PBKDF2(accessCode:recipient, salt).
 */
export function deriveAddressLinkKey(
  accessCode: string,
  recipient: string,
  salt: Uint8Array,
  iterations: number,
): Uint8Array {
  return derivePasscodeKey(
    `${accessCode}:${recipient.toLowerCase()}`,
    salt,
    iterations,
  );
}
