import { createCipheriv, createDecipheriv } from 'node:crypto';
import { EncryptionError } from '../errors.js';

export function aesGcmEncrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  aad?: Uint8Array,
): Uint8Array {
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  if (aad) cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return new Uint8Array(Buffer.concat([encrypted, tag]));
}

export function aesGcmDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  aad?: Uint8Array,
): Uint8Array {
  if (ciphertext.length < 16) {
    throw new EncryptionError('ciphertext too short for GCM tag');
  }
  const enc = ciphertext.slice(0, ciphertext.length - 16);
  const tag = ciphertext.slice(ciphertext.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  if (aad) decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  try {
    return new Uint8Array(Buffer.concat([decipher.update(enc), decipher.final()]));
  } catch (err) {
    throw new EncryptionError(`AES-GCM decryption failed: ${(err as Error).message}`);
  }
}
