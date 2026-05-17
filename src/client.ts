import { HttpClient, type HttpClientConfig } from './http.js';
import { MessagesResource } from './resources/messages.js';
import { HealthResource } from './resources/health.js';
import { IletinizError } from './errors.js';

const DEFAULT_BASE_URL = 'https://api.iletiniz.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const SDK_VERSION = '0.1.0';

const API_KEY_RE = /^iltz_(?:live|test)_[A-Za-z0-9_-]+$/;

export interface IletinizClientOptions {
  /**
   * API anahtarı. `iltz_live_…` veya `iltz_test_…` formatında olmalı.
   * Verilmezse `IletinizClient` `process.env.ILETINIZ_API_KEY` değerini okur.
   */
  apiKey?: string;
  /** Varsayılan: https://api.iletiniz.com */
  baseUrl?: string;
  /** İstek timeout süresi (ms). Varsayılan: 30000. */
  timeoutMs?: number;
  /** Geçici hatalarda yeniden deneme sayısı. Varsayılan: 2. */
  maxRetries?: number;
  /** Tüm isteklere eklenecek varsayılan başlıklar. */
  defaultHeaders?: Record<string, string>;
  /** Özel fetch implementasyonu (test/SSR için). Varsayılan: globalThis.fetch. */
  fetch?: typeof fetch;
}

export class IletinizClient {
  public readonly messages: MessagesResource;
  public readonly health: HealthResource;

  private readonly http: HttpClient;

  constructor(options: IletinizClientOptions = {}) {
    const apiKey = options.apiKey ?? readEnv('ILETINIZ_API_KEY');
    if (!apiKey) {
      throw new IletinizError(
        'API anahtarı gerekli. `new IletinizClient({ apiKey })` veya ILETINIZ_API_KEY ortam değişkeni kullanın.',
      );
    }
    if (!API_KEY_RE.test(apiKey)) {
      throw new IletinizError(
        "Geçersiz API anahtar formatı. Beklenen: 'iltz_live_…' veya 'iltz_test_…'.",
      );
    }

    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new IletinizError(
        'Global `fetch` bulunamadı. Node.js 18+ kullanın veya `fetch` opsiyonunu sağlayın.',
      );
    }

    const config: HttpClientConfig = {
      baseUrl: options.baseUrl ?? readEnv('ILETINIZ_BASE_URL') ?? DEFAULT_BASE_URL,
      apiKey,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      defaultHeaders: {
        'User-Agent': `iletiniz-js/${SDK_VERSION}`,
        ...(options.defaultHeaders ?? {}),
      },
      fetchImpl: fetchImpl.bind(globalThis),
    };

    this.http = new HttpClient(config);
    this.messages = new MessagesResource(this.http);
    this.health = new HealthResource(this.http);
  }
}

function readEnv(name: string): string | undefined {
  const proc =
    typeof globalThis !== 'undefined'
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      : undefined;
  return proc?.env?.[name];
}
