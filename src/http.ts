import {
  IletinizConnectionError,
  IletinizTimeoutError,
  buildApiError,
  type ApiErrorBody,
} from './errors.js';
import type { RequestOptions } from './types.js';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  defaultHeaders: Record<string, string>;
  fetchImpl: typeof fetch;
  maxRetries: number;
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  options?: RequestOptions;
}

export class HttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async request<T>(req: HttpRequest): Promise<T> {
    const url = this.buildUrl(req.path, req.query);
    const headers: Record<string, string> = {
      ...this.config.defaultHeaders,
      Authorization: `Bearer ${this.config.apiKey}`,
      Accept: 'application/json',
      ...(req.options?.headers ?? {}),
    };

    let body: BodyInit | undefined;
    if (req.body !== undefined && req.body !== null) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body);
    }

    const timeoutMs = req.options?.timeoutMs ?? this.config.timeoutMs;
    let attempt = 0;
    while (true) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const externalSignal = req.options?.signal;
      const onAbort = (): void => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener('abort', onAbort, { once: true });
      }

      let response: Response;
      try {
        response = await this.config.fetchImpl(url, {
          method: req.method,
          headers,
          body,
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        externalSignal?.removeEventListener('abort', onAbort);
        if (controller.signal.aborted && externalSignal?.aborted) {
          throw err;
        }
        if (controller.signal.aborted) {
          throw new IletinizTimeoutError(`İstek ${timeoutMs}ms içinde tamamlanamadı.`);
        }
        if (this.shouldRetry(undefined, attempt)) {
          attempt++;
          await sleep(backoffMs(attempt));
          continue;
        }
        throw new IletinizConnectionError(
          err instanceof Error ? err.message : 'Bağlantı hatası',
          err,
        );
      } finally {
        clearTimeout(timer);
        externalSignal?.removeEventListener('abort', onAbort);
      }

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        if (!text) return undefined as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new IletinizConnectionError('Sunucudan geçersiz JSON döndü.');
        }
      }

      if (this.shouldRetry(response.status, attempt)) {
        attempt++;
        await sleep(backoffMs(attempt, response.headers.get('retry-after')));
        continue;
      }

      const requestId = response.headers.get('x-request-id') ?? undefined;
      const errBody = await safeReadErrorBody(response);
      throw buildApiError(response.status, errBody, requestId);
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    let url = `${base}${p}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  private shouldRetry(status: number | undefined, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;
    if (status === undefined) return true;
    return status === 408 || status === 429 || (status >= 500 && status <= 599);
  }
}

async function safeReadErrorBody(
  response: Response,
): Promise<ApiErrorBody | string | undefined> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text) as ApiErrorBody;
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

function backoffMs(attempt: number, retryAfter?: string | null): number {
  if (retryAfter) {
    const sec = Number(retryAfter);
    if (Number.isFinite(sec) && sec > 0) return Math.min(sec * 1000, 30_000);
  }
  const base = Math.min(2 ** attempt * 250, 4000);
  return base + Math.floor(Math.random() * 100);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
