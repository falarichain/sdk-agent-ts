import { ChainApiError, NetworkError } from '../errors.js';

interface HttpOptions {
  timeout?: number;
  retries?: number;
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  opts: HttpOptions = {},
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const timeout = opts.timeout ?? 60_000;
  const retries = opts.retries ?? 1;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const resp = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
      const body = await resp.text();
      if (resp.status < 200 || resp.status >= 300) {
        throw new ChainApiError(body || `HTTP ${resp.status}`, resp.status, body);
      }
      if (!body) return undefined as T;
      return JSON.parse(body) as T;
    } catch (err) {
      if (err instanceof ChainApiError && err.status < 500) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new NetworkError(`request failed after ${retries + 1} attempts: ${lastError?.message}`);
}

export async function httpGet<T>(
  baseUrl: string,
  path: string,
  opts?: HttpOptions,
): Promise<T> {
  return request<T>(baseUrl, path, { method: 'GET' }, opts);
}

export async function httpPost<T>(
  baseUrl: string,
  path: string,
  body: unknown,
  opts?: HttpOptions,
): Promise<T> {
  return request<T>(
    baseUrl,
    path,
    { method: 'POST', body: JSON.stringify(body) },
    opts,
  );
}

export async function httpGetBytes(
  baseUrl: string,
  path: string,
  headers?: Record<string, string>,
  opts?: HttpOptions,
): Promise<{ data: Uint8Array; headers: Headers }> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const timeout = opts?.timeout ?? 120_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    if (!resp.ok) {
      const text = await resp.text();
      throw new ChainApiError(text || `HTTP ${resp.status}`, resp.status, text);
    }
    const buf = await resp.arrayBuffer();
    return { data: new Uint8Array(buf), headers: resp.headers };
  } finally {
    clearTimeout(timer);
  }
}

export async function httpPostForm<T>(
  baseUrl: string,
  path: string,
  form: FormData,
  headers?: Record<string, string>,
  opts?: HttpOptions,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const timeout = opts?.timeout ?? 300_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      body: form,
      headers,
      signal: controller.signal,
    });
    const body = await resp.text();
    if (!resp.ok) {
      throw new ChainApiError(body || `HTTP ${resp.status}`, resp.status, body);
    }
    return JSON.parse(body) as T;
  } finally {
    clearTimeout(timer);
  }
}
