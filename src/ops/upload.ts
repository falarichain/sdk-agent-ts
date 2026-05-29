import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { ChainApi } from '../net/chain-api.js';
import { GatewayApi } from '../net/gateway-api.js';
import type { UploadInput, UploadProgress, EncryptedUploadInput } from '../types/params.js';
import type { UploadResult, EncryptedUploadResult } from '../types/results.js';
import { UploadError } from '../errors.js';

/**
 * Upload a file via Gateway (single HTTP call).
 */
export async function uploadViaGateway(
  gateway: GatewayApi,
  input: UploadInput,
): Promise<UploadResult> {
  const file = await resolveFile(input);
  const result = await gateway.upload(file.data, file.name);
  return {
    intentId: result.intent_id,
    dealId: result.deal_id,
    fileName: result.file_name,
    fileSize: result.file_size,
  };
}

/**
 * Encrypted upload via Gateway: encrypt locally, then upload.
 * Note: Gateway upload doesn't support encryption metadata natively,
 * so for encrypted uploads we encrypt the data first, then upload the ciphertext.
 */
export async function uploadEncryptedViaGateway(
  _gateway: GatewayApi,
  _input: EncryptedUploadInput,
): Promise<EncryptedUploadResult> {
  throw new UploadError(
    'encrypted upload via gateway not yet supported — use direct mode or upload plaintext',
  );
}

/**
 * Resolve file input from path or Buffer.
 */
async function resolveFile(
  input: UploadInput,
): Promise<{ data: Uint8Array; name: string }> {
  if (typeof input.file === 'string') {
    const data = new Uint8Array(await readFile(input.file));
    return { data, name: input.fileName || basename(input.file) };
  }
  if (!input.fileName) {
    throw new UploadError('fileName is required when file is a Buffer');
  }
  return { data: input.file, name: input.fileName };
}
