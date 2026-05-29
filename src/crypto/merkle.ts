import { sha256 } from './hash.js';

/**
 * Compute merkle root from an array of hex-encoded hashes.
 * Matches the extension/src/lib/erasure.ts merkleRoot().
 */
export function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    return sha256(new Uint8Array(0));
  }

  let layer = hashes;
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
      const combined = new TextEncoder().encode(left + right);
      next.push(sha256(combined));
    }
    layer = next;
  }
  return layer[0];
}
