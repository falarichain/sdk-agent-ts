import { httpGetBytes, httpPostForm } from './http.js';

export class GatewayApi {
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private timeout?: number,
  ) {}

  /**
   * Upload a file via Gateway (handles full pipeline server-side).
   */
  async upload(
    file: Uint8Array,
    fileName: string,
  ): Promise<{
    intent_id: string;
    deal_id: string;
    status: string;
    file_name: string;
    file_size: number;
  }> {
    const form = new FormData();
    const blob = new Blob([file]);
    form.append('file', blob, fileName);
    return httpPostForm(
      this.baseUrl,
      '/upload',
      form,
      { 'X-Api-Key': this.apiKey },
      { timeout: this.timeout ?? 300_000 },
    );
  }

  /**
   * Download a reconstructed file from Gateway.
   */
  async download(intentId: string): Promise<{ data: Uint8Array; fileName: string }> {
    const { data, headers } = await httpGetBytes(
      this.baseUrl,
      `/download/${encodeURIComponent(intentId)}`,
      { 'X-Api-Key': this.apiKey },
      { timeout: this.timeout ?? 300_000 },
    );
    const disposition = headers.get('content-disposition') || '';
    const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
    const fileName = match ? decodeURIComponent(match[1].replace(/"/g, '')) : 'download';
    return { data, fileName };
  }

  /**
   * List files in a collection via Gateway.
   */
  async collectionFiles(
    collectionId: string,
  ): Promise<{
    collection_id: string;
    name: string;
    files: {
      intent_id: string;
      record_id: string;
      file_name: string;
      file_size: number;
      encrypted: boolean;
      kind: string;
      key: string;
    }[];
  }> {
    const { data } = await httpGetBytes(
      this.baseUrl,
      `/collection/${encodeURIComponent(collectionId)}/files`,
      { 'X-Api-Key': this.apiKey },
      { timeout: this.timeout ?? 60_000 },
    );
    return JSON.parse(new TextDecoder().decode(data));
  }
}
