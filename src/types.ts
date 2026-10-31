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

/** İYS gönderim türü. `true` → bireysel, `false` → bilgilendirme (geriye dönük uyum). */
export type IysMode = boolean | 'bilgilendirme' | 'bireysel' | 'tacir';

// ---------------------------------------------------------------------------
// Meta onaylı WhatsApp şablonu (Cloud API `template.components` biçimi)
// ---------------------------------------------------------------------------

export interface WhatsappTextParameter {
  type: 'text';
  text: string;
  /** Adlandırılmış parametreli şablonlarda parametre adı. */
  parameter_name?: string;
}

export interface WhatsappCurrencyParameter {
  type: 'currency';
  currency: { fallback_value: string; code: string; amount_1000: number };
  parameter_name?: string;
}

export interface WhatsappDateTimeParameter {
  type: 'date_time';
  date_time: { fallback_value: string };
  parameter_name?: string;
}

export interface WhatsappImageParameter {
  type: 'image';
  image: { link: string };
}

export interface WhatsappVideoParameter {
  type: 'video';
  video: { link: string };
}

export interface WhatsappDocumentParameter {
  type: 'document';
  document: { link: string; filename?: string };
}

export interface WhatsappPayloadParameter {
  type: 'payload';
  payload: string;
}

export interface WhatsappCouponParameter {
  type: 'coupon_code';
  coupon_code: string;
}

export interface WhatsappHeaderComponent {
  type: 'header';
  parameters: [
    | WhatsappTextParameter
    | WhatsappImageParameter
    | WhatsappVideoParameter
    | WhatsappDocumentParameter,
  ];
}

export interface WhatsappBodyComponent {
  type: 'body';
  parameters: (
    | WhatsappTextParameter
    | WhatsappCurrencyParameter
    | WhatsappDateTimeParameter
  )[];
}

export interface WhatsappButtonComponent {
  type: 'button';
  sub_type: 'quick_reply' | 'url' | 'copy_code';
  index: number;
  parameters: [
    WhatsappTextParameter | WhatsappPayloadParameter | WhatsappCouponParameter,
  ];
}

export type WhatsappComponent =
  | WhatsappHeaderComponent
  | WhatsappBodyComponent
  | WhatsappButtonComponent;

export interface WhatsappTemplate {
  /** Meta'daki şablon adı (a-z, 0-9, _). */
  name: string;
  /** Şablon dil kodu (ör. `tr`, `en_US`). */
  language: string;
  /** Şablon değişkenleri. Değişkensiz şablonda verilmez. */
  components?: WhatsappComponent[];
}

// ---------------------------------------------------------------------------
// Mesaj gönderimi
// ---------------------------------------------------------------------------

export interface SendMessageParams {
  /** Alıcı telefon numarası (E.164 önerilir; 05551234567, 5551234567 ve 905551234567 gibi Türkiye yerel biçimleri de kabul edilir). */
  to: string;
  /** Düz metin gövde. `template` / `whatsappTemplate` ile birlikte kullanılamaz. */
  body?: string;
  /** Template anahtarı (a-z, 0-9, _). `body` / `whatsappTemplate` ile birlikte kullanılamaz. */
  template?: string;
  /** Yalnızca `template` ile birlikte kullanılabilir. */
  variables?: TemplateVariables;
  /** Meta onaylı WhatsApp şablonu (yalnız WhatsApp sağlayıcısı). */
  whatsappTemplate?: WhatsappTemplate;
  /** SMS: gönderici başlığı. WhatsApp: gönderici numaranın Meta `phone_number_id` değeri. */
  sender?: string;
  /** Belirli bir provider seçmek için kod. */
  provider?: string;
  /** Sıralı yedek SMS sağlayıcı kodları (en fazla 3). */
  fallback?: string[];
  /**
   * İYS gönderim türü. Yalnızca SMS sağlayıcılarında işlenir.
   * `true` → bireysel, `false` veya belirtilmezse → bilgilendirme.
   */
  iys?: IysMode;
  /** Yeniden denemelerde çift gönderimi önleyen anahtar (8-191 karakter). */
  idempotencyKey?: string;
  /**
   * İleri tarihli gönderim: saat dilimli ISO 8601 (ör. `2026-11-05T09:00:00+03:00`)
   * veya `Date`. En az 30 sn, en fazla 90 gün sonrası.
   */
  scheduledAt?: string | Date;
}

export interface SendAttempt {
  provider: string;
  status: 'sent' | 'failed';
  error?: ApiError;
}

export interface SendMessageResponse {
  job_id: string;
  status: SendMessageStatus;
  to: string;
  provider: string;
  template?: string;
  template_key?: string;
  /** Meta onaylı WhatsApp şablonuyla gönderildiyse şablon adı. */
  whatsapp_template?: string;
  error?: ApiError;
  attempts?: SendAttempt[];
  /** Test (iltz_test_) anahtarıyla yapılan sahte gönderim. */
  sandbox?: true;
  created_at: string;
}

/** `scheduledAt` verildiğinde send()/sendBulk() bu yanıtı döner. */
export interface ScheduleCreatedResponse {
  scheduled_id: number;
  status: 'scheduled';
  kind: 'single' | 'bulk';
  scheduled_at: string;
  sandbox?: true;
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
  sandbox?: true;
}

export interface BulkItemInput {
  to: string;
  body?: string;
  variables?: TemplateVariables;
  /** Bu alıcıya özel WhatsApp şablon bileşenleri (üst seviye `components` yerine geçer). */
  whatsappComponents?: WhatsappComponent[];
}

export interface SendBulkParams {
  provider?: string;
  /** SMS: gönderici başlığı. WhatsApp: Meta `phone_number_id`. */
  sender?: string;
  template?: string;
  /** Meta onaylı WhatsApp şablonu; `components` tüm alıcılar için varsayılandır. */
  whatsappTemplate?: WhatsappTemplate;
  fallback?: string[];
  /** İYS gönderim türü, bkz. {@link SendMessageParams.iys}. Tüm batch için tek değer. */
  iys?: IysMode;
  idempotencyKey?: string;
  /** İleri tarihli toplu gönderim, bkz. {@link SendMessageParams.scheduledAt}. */
  scheduledAt?: string | Date;
  items: BulkItemInput[];
}

export interface SendBulkItemResult {
  to: string;
  status: 'sent' | 'failed';
  job_id?: string;
  error?: ApiError;
  /** Fallback devreye girdiyse gönderimi yapan sağlayıcı kodu. */
  delivered_via?: string;
}

export interface SendBulkResponse {
  total: number;
  sent: number;
  failed: number;
  provider: string;
  template?: string;
  template_key?: string;
  whatsapp_template?: string;
  sandbox?: true;
  created_at: string;
  results: SendBulkItemResult[];
}

// ---------------------------------------------------------------------------
// Ortak liste tipleri
// ---------------------------------------------------------------------------

export interface ListParams {
  /** 1-100, varsayılan 50. */
  limit?: number;
  offset?: number;
}

export interface ListResponse<T> {
  data: T[];
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Zamanlanmış gönderimler
// ---------------------------------------------------------------------------

export type ScheduledStatus =
  | 'scheduled'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'canceled';

export interface ScheduledMessage {
  id: number;
  kind: 'single' | 'bulk';
  status: ScheduledStatus;
  scheduled_at: string;
  reminder_id: number | null;
  recipients: number;
  sandbox?: true;
  result: Record<string, unknown> | null;
  error_code: string | null;
  created_at: string;
}

export interface ListScheduledParams extends ListParams {
  status?: ScheduledStatus;
}

// ---------------------------------------------------------------------------
// Hatırlatma kuralları
// ---------------------------------------------------------------------------

export type ReminderStatus = 'active' | 'paused' | 'completed' | 'canceled';
export type ReminderFrequency = 'daily' | 'weekly' | 'monthly';

/** Hatırlatmada gönderilecek tekli mesaj (send() alanlarının alt kümesi). */
export interface ReminderMessage {
  to: string;
  body?: string;
  template?: string;
  variables?: TemplateVariables;
  whatsappTemplate?: WhatsappTemplate;
  sender?: string;
  provider?: string;
  iys?: IysMode;
}

export interface CreateOneTimeReminderParams {
  type: 'one_time';
  name: string;
  message: ReminderMessage;
  /** Olay zamanı: saat dilimli ISO 8601 veya Date. */
  eventAt: string | Date;
  /** Olaydan kaç dakika önce gönderileceği (ör. [1440, 120]). 0 = olay anında. */
  offsetsMinutes: number[];
}

export interface CreateRecurringReminderParams {
  type: 'recurring';
  name: string;
  message: ReminderMessage;
  frequency: ReminderFrequency;
  /** `SS:dd` (24 saat), ör. `09:30`. */
  timeOfDay: string;
  /** weekly için zorunlu: 0=Pazar ... 6=Cumartesi. */
  dayOfWeek?: number;
  /** monthly için zorunlu: 1-31 (o ayda yoksa ayın son günü). */
  dayOfMonth?: number;
  /** Şu an yalnız `Europe/Istanbul` desteklenir. */
  timezone?: 'Europe/Istanbul';
  endsAt?: string | Date;
}

export type CreateReminderParams =
  | CreateOneTimeReminderParams
  | CreateRecurringReminderParams;

export interface UpdateReminderParams {
  name?: string;
  message?: ReminderMessage;
  status?: 'active' | 'paused';
  eventAt?: string | Date;
  offsetsMinutes?: number[];
  frequency?: ReminderFrequency;
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  /** `null` bitiş tarihini kaldırır. */
  endsAt?: string | Date | null;
}

export interface ListRemindersParams extends ListParams {
  status?: ReminderStatus;
}

export interface Reminder {
  id: number;
  name: string;
  type: 'one_time' | 'recurring';
  status: ReminderStatus;
  message: Record<string, unknown>;
  event_at: string | null;
  offsets_minutes: number[] | null;
  frequency: ReminderFrequency | null;
  time_of_day: string | null;
  day_of_week: number | null;
  day_of_month: number | null;
  timezone: string;
  ends_at: string | null;
  next_run_at: string | null;
  run_count: number;
  sandbox?: true;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Partner API
// ---------------------------------------------------------------------------

export type ChildGrantableScope =
  | 'messages:send'
  | 'messages:read'
  | 'contacts:read'
  | 'contacts:write'
  | 'groups:read'
  | 'groups:write'
  | 'connections:read'
  | 'account:read';

export interface PartnerProfile {
  workspace_id: number;
  name: string;
  pricing: { discount_pct: number | null; package: string | null };
  credit_balance: number;
  child_count: number;
}

export interface ChildAccount {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  credit_balance: number;
  created_at: string;
  suspended_at: string | null;
}

export interface CreateChildAccountParams {
  name: string;
  /** Kendi sistemindeki müşteri kimliği (harf, rakam, _ ve -; en fazla 32). */
  externalRef?: string;
}

export interface ListChildAccountsParams extends ListParams {
  status?: 'active' | 'suspended';
}

export interface CreateChildApiKeyParams {
  name: string;
  /** Varsayılan: ['messages:send', 'messages:read']. */
  scopes?: ChildGrantableScope[];
  /** true → iltz_test_ (sandbox) anahtarı. */
  test?: boolean;
  allowedIps?: string[];
}

export interface ChildApiKey {
  id: number;
  workspace_id: number;
  name: string;
  /** Düz metin anahtar; yalnız bu yanıtta döner, saklayın. */
  key: string;
  key_prefix: string;
  scopes: ChildGrantableScope[];
  sandbox: boolean;
}

/** Alt hesabın bir API anahtarı (liste/iptal yanıtı). Düz metin anahtar veya hash asla dönmez. */
export interface ChildApiKeyInfo {
  id: number;
  name: string;
  /** Anahtarın ilk 12 karakteri, örn. "iltz_live_Ab". */
  key_prefix: string;
  scopes: string[] | null;
  sandbox: boolean;
  /** Anahtarın oluşturulduğu kaynak, örn. "partner" | "dashboard". */
  source: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface QuotaTransferResponse {
  child_workspace_id: number;
  amount: number;
  partner_balance: number;
  child_balance: number;
}

export interface WhatsappSignupLink {
  child_workspace_id: number;
  /** Alt hesap sahibine iletilecek tek kullanımlık bağlantı (24 saat geçerli). */
  url: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------

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
