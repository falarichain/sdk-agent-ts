import { aesGcmEncrypt, aesGcmDecrypt } from '../crypto/aes.js';
import { hmacSha256, sha256, bytesToBase64, base64ToBytes, randomBytesSync } from '../crypto/hash.js';
import { ENCRYPTION } from '../config.js';

/**
 * Derive per-segment nonce (12 bytes) via HMAC-SHA256.
 */
function segmentNonce(
  key: Uint8Array,
  nonceBase: Uint8Array,
  segmentId: number,
): Uint8Array {
  const id = new Uint8Array(8);
  const view = new DataView(id.buffer);
  view.setBigUint64(0, BigInt(segmentId), false); // big-endian

  const algoBytes = new TextEncoder().encode(ENCRYPTION.algorithm);
  const payload = new Uint8Array(algoBytes.length + nonceBase.length + 8);
  payload.set(algoBytes, 0);
  payload.set(nonceBase, algoBytes.length);
  payload.set(id, algoBytes.length + nonceBase.length);

  const mac = hmacSha256(key, payload);
  return mac.slice(0, ENCRYPTION.gcmIVLength);
}

/**
 * Build per-segment AAD.
 */
function segmentAAD(keyHash: string, segmentId: number): Uint8Array {
  const id = new Uint8Array(8);
  const view = new DataView(id.buffer);
  view.setBigUint64(0, BigInt(segmentId), false);

  const prefix = new TextEncoder().encode(
    `${ENCRYPTION.algorithm}:${keyHash}:`,
  );
  const aad = new Uint8Array(prefix.length + 8);
  aad.set(prefix, 0);
  aad.set(id, prefix.length);
  return aad;
}

/**
 * Encrypt a single plaintext segment with AES-256-GCM.
 */
export function encryptSegment(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonceBase: Uint8Array,
  keyHash: string,
  segmentId: number,
): Uint8Array {
  const iv = segmentNonce(key, nonceBase, segmentId);
  const aad = segmentAAD(keyHash, segmentId);
  return aesGcmEncrypt(plaintext, key, iv, aad);
}

/**
 * Decrypt a single ciphertext segment with AES-256-GCM.
 */
export function decryptSegment(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonceBase: Uint8Array,
  keyHash: string,
  segmentId: number,
): Uint8Array {
  const iv = segmentNonce(key, nonceBase, segmentId);
  const aad = segmentAAD(keyHash, segmentId);
  return aesGcmDecrypt(ciphertext, key, iv, aad);
}

/**
 * Wrap a data key with a wrapping key (AES-256-GCM).
 */
export function wrapDataKey(
  dataKey: Uint8Array,
  wrappingKey: Uint8Array,
  algorithm: string,
): { encryptedDataKey: string; nonce: string } {
  const nonce = randomBytesSync(ENCRYPTION.gcmIVLength);
  const aad = new TextEncoder().encode(algorithm);
  const encrypted = aesGcmEncrypt(dataKey, wrappingKey, nonce, aad);
  return {
    encryptedDataKey: bytesToBase64(encrypted),
    nonce: bytesToBase64(nonce),
  };
}

/**
 * Unwrap a data key from an encrypted envelope.
 */
export function unwrapDataKey(
  encryptedDataKey: string,
  nonceBase64: string,
  wrappingKey: Uint8Array,
  algorithm: string,
): Uint8Array {
  const aad = new TextEncoder().encode(algorithm);
  return aesGcmDecrypt(
    base64ToBytes(encryptedDataKey),
    wrappingKey,
    base64ToBytes(nonceBase64),
    aad,
  );
}
