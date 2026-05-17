export type MessageStatus =
  | 'sent'
  | 'queued'
  | 'failed'
  | 'delivered'
  | 'expired'
  | 'rejected'
  | 'unknown';

export type SendMessageStatus = 'sent' | 'queued' | 'failed';

export type ApiError = {
  code: string;
  message: string;
};

export type TemplateVariables = Record<string, string | number>;

export interface SendMessageParams {
  /** Alıcı telefon numarası (E.164 önerilir). */
  to: string;
  /** Düz metin gövde. `template` ile birlikte kullanılamaz. */
  body?: string;
  /** Template anahtarı (a-z, 0-9, _). `body` ile birlikte kullanılamaz. */
  template?: string;
  /** Yalnızca `template` ile birlikte kullanılabilir. */
  variables?: TemplateVariables;
  /** Gönderici adı / başlık. */
  sender?: string;
  /** Belirli bir provider seçmek için kod. */
  provider?: string;
  /**
   * İYS izni. `true` → ticari mesaj (sağlayıcının İYS filtresi devreye girer).
   * `false` veya belirtilmezse → bilgilendirme mesajı (İYS sorgusu yok).
   * Yalnızca SMS sağlayıcılarında işlenir; WhatsApp/Telegram için yok sayılır.
   */
  iys?: boolean;
}

export interface SendMessageResponse {
  job_id: string;
  status: SendMessageStatus;
  to: string;
  provider: string;
  template?: string;
  template_key?: string;
  error?: ApiError;
  created_at: string;
}

export interface MessageStatusResponse {
  job_id: string;
  status: MessageStatus;
  to: string;
  provider: string;
  error?: ApiError;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface BulkItemInput {
  to: string;
  body?: string;
  variables?: TemplateVariables;
}

export interface SendBulkParams {
  provider?: string;
  sender?: string;
  template?: string;
  /**
   * İYS izni — bkz. {@link SendMessageParams.iys}. Tüm batch için tek değer.
   * Yalnızca SMS sağlayıcılarında işlenir.
   */
  iys?: boolean;
  items: BulkItemInput[];
}

export interface SendBulkItemResult {
  to: string;
  status: 'sent' | 'failed';
  job_id?: string;
  error?: ApiError;
}

export interface SendBulkResponse {
  total: number;
  sent: number;
  failed: number;
  provider: string;
  template?: string;
  template_key?: string;
  created_at: string;
  results: SendBulkItemResult[];
}

export interface HealthResponse {
  ok: boolean;
  db: 'up' | 'down';
}

export interface RequestOptions {
  /** Bu isteği iptal etmek için AbortSignal. */
  signal?: AbortSignal;
  /** Bu isteğe özel timeout (ms). Client default'unu ezer. */
  timeoutMs?: number;
  /** İsteğe ek HTTP başlıkları. */
  headers?: Record<string, string>;
}
