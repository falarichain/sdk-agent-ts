import { createHash, createHmac, randomBytes } from 'node:crypto';
import { ethers } from 'ethers';

export function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export function sha256Bytes(data: Uint8Array): Uint8Array {
  return new Uint8Array(createHash('sha256').update(data).digest());
}

export function keccak256(data: Uint8Array): string {
  return ethers.keccak256(data);
}

export function keccak256Utf8(json: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

export function hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
  return new Uint8Array(createHmac('sha256', key).update(data).digest());
}

export function randomBytesSync(n: number): Uint8Array {
  return new Uint8Array(randomBytes(n));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex.replace(/^0x/, ''), 'hex'));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
