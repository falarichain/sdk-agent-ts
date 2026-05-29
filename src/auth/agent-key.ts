import { ethers } from 'ethers';
import { AGENT_KEY_PREFIX } from '../config.js';
import { AuthenticationError } from '../errors.js';

export interface ParsedAgentKey {
  keyId: string;
  master: string;
  address: string;
  privateKey: string;
}

/**
 * Decode a fara_ encoded agent key string.
 */
export function decodeAgentKeyString(encoded: string): ParsedAgentKey {
  if (!encoded.startsWith(AGENT_KEY_PREFIX)) {
    throw new AuthenticationError('invalid agent key: missing fara_ prefix');
  }
  const stripped = encoded.slice(AGENT_KEY_PREFIX.length);
  const padded = stripped + '=='.slice(0, (4 - (stripped.length % 4)) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const parts = decoded.split('|');
  if (parts.length !== 4) {
    throw new AuthenticationError(
      `invalid agent key: expected 4 parts, got ${parts.length}`,
    );
  }
  return {
    keyId: parts[0],
    master: parts[1],
    address: parts[2],
    privateKey: parts[3],
  };
}

/**
 * Encode agent key parts into a fara_ string.
 */
export function encodeAgentKeyString(
  keyId: string,
  master: string,
  address: string,
  privateKey: string,
): string {
  const raw = `${keyId}|${master}|${address}|${privateKey}`;
  const b64 = Buffer.from(raw, 'utf-8').toString('base64');
  const urlSafe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return AGENT_KEY_PREFIX + urlSafe;
}

/**
 * Normalize an Ethereum address (EIP-55 checksum or lowercase).
 */
export function normalizeAddress(addr: string): string {
  try {
    return ethers.getAddress(addr);
  } catch {
    return addr.toLowerCase();
  }
}

/**
 * Derive the compressed public key and address from a private key.
 */
export function deriveKeyInfo(privateKey: string): {
  address: string;
  publicKey: string;
  compressedPublicKey: string;
} {
  const wallet = new ethers.Wallet(privateKey);
  const pub = wallet.signingKey.publicKey;
  // Compressed: first byte 02/03 + 32 bytes X
  const compressed = ethers.SigningKey.computePublicKey(pub, true);
  return {
    address: wallet.address,
    publicKey: pub,
    compressedPublicKey: compressed,
  };
}
