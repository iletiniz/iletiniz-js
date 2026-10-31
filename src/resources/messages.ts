import type { HttpClient } from '../http.js';
import type {
  MessageStatusResponse,
  RequestOptions,
  ScheduleCreatedResponse,
  SendBulkParams,
  SendBulkResponse,
  SendMessageParams,
  SendMessageResponse,
} from '../types.js';
import { IletinizError } from '../errors.js';
import { serializeDates, stripUndefined } from './util.js';

const MAX_BULK_ITEMS = 200;

type Scheduled = { scheduledAt: string | Date };
type NotScheduled = { scheduledAt?: undefined };

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Tek bir mesaj gönderir (SMS, Telegram veya WhatsApp).
   *
   * `body`, `template` veya `whatsappTemplate` alanlarından **tam olarak biri** verilmelidir.
   * `variables` yalnızca `template` ile birlikte kullanılabilir.
   * `scheduledAt` verilirse mesaj şimdi gönderilmez; yanıt {@link ScheduleCreatedResponse} olur.
   */
  send(
    params: SendMessageParams & Scheduled,
    options?: RequestOptions,
  ): Promise<ScheduleCreatedResponse>;
  send(
    params: SendMessageParams & NotScheduled,
    options?: RequestOptions,
  ): Promise<SendMessageResponse>;
  send(
    params: SendMessageParams,
    options?: RequestOptions,
  ): Promise<SendMessageResponse | ScheduleCreatedResponse>;
  async send(
    params: SendMessageParams,
    options?: RequestOptions,
  ): Promise<SendMessageResponse | ScheduleCreatedResponse> {
    validateSendParams(params);
    return this.http.request<SendMessageResponse | ScheduleCreatedResponse>({
      method: 'POST',
      path: '/v1/messages',
      body: serializeDates(stripUndefined(params)),
      options,
    });
  }

  /**
   * Tek istekte birden fazla mesaj gönderir (en fazla 200 öğe).
   *
   * - Üst seviye `template` verildiyse her item'da `body` olmamalı, yalnızca `variables` opsiyoneldir.
   * - Üst seviye `whatsappTemplate` verildiyse item'larda `body`/`variables` olmamalı;
   *   alıcı başına değişkenler `items[].whatsappComponents` ile verilir.
   * - İkisi de yoksa her item'da `body` zorunludur, `variables` kullanılamaz.
   */
  sendBulk(
    params: SendBulkParams & Scheduled,
    options?: RequestOptions,
  ): Promise<ScheduleCreatedResponse>;
  sendBulk(
    params: SendBulkParams & NotScheduled,
    options?: RequestOptions,
  ): Promise<SendBulkResponse>;
  sendBulk(
    params: SendBulkParams,
    options?: RequestOptions,
  ): Promise<SendBulkResponse | ScheduleCreatedResponse>;
  async sendBulk(
    params: SendBulkParams,
    options?: RequestOptions,
  ): Promise<SendBulkResponse | ScheduleCreatedResponse> {
    validateBulkParams(params);
    return this.http.request<SendBulkResponse | ScheduleCreatedResponse>({
      method: 'POST',
      path: '/v1/messages/bulk',
      body: serializeDates(
        stripUndefined({
          ...params,
          items: params.items.map(stripUndefined),
        }),
      ),
      options,
    });
  }

  /**
   * Daha önce gönderilmiş bir mesajın güncel durumunu döner.
   */
  async retrieve(
    jobId: string,
    options?: RequestOptions,
  ): Promise<MessageStatusResponse> {
    if (!jobId || typeof jobId !== 'string') {
      throw new IletinizError('jobId boş olamaz.');
    }
    return this.http.request<MessageStatusResponse>({
      method: 'GET',
      path: `/v1/messages/${encodeURIComponent(jobId)}`,
      options,
    });
  }

  /** `retrieve` için alias. */
  status(
    jobId: string,
    options?: RequestOptions,
  ): Promise<MessageStatusResponse> {
    return this.retrieve(jobId, options);
  }
}

function validateSendParams(params: SendMessageParams): void {
  if (!params || typeof params !== 'object') {
    throw new IletinizError('send() parametre objesi gerektirir.');
  }
  if (!params.to || params.to.length < 1 || params.to.length > 64) {
    throw new IletinizError("'to' alanı 1-64 karakter arasında olmalıdır.");
  }
  const modes = [
    Boolean(params.body),
    Boolean(params.template),
    params.whatsappTemplate !== undefined,
  ].filter(Boolean).length;
  if (modes !== 1) {
    throw new IletinizError(
      "'body', 'template' veya 'whatsappTemplate' alanlarından tam olarak biri zorunludur.",
    );
  }
  if (params.variables && !params.template) {
    throw new IletinizError(
      "'variables' yalnızca 'template' ile birlikte kullanılabilir.",
    );
  }
  if (params.body && (params.body.length < 1 || params.body.length > 1600)) {
    throw new IletinizError("'body' 1-1600 karakter arasında olmalıdır.");
  }
  if (params.whatsappTemplate) validateWhatsappTemplate(params.whatsappTemplate);
}

function validateWhatsappTemplate(t: { name?: unknown; language?: unknown }): void {
  if (typeof t.name !== 'string' || !/^[a-z0-9_]{1,512}$/.test(t.name)) {
    throw new IletinizError("'whatsappTemplate.name' yalnızca a-z, 0-9 ve _ içerebilir.");
  }
  if (typeof t.language !== 'string' || !/^[a-z]{2,3}(_[A-Z]{2,4})?$/.test(t.language)) {
    throw new IletinizError("'whatsappTemplate.language' geçersiz (ör. tr, en_US).");
  }
}

function validateBulkParams(params: SendBulkParams): void {
  if (!params || typeof params !== 'object') {
    throw new IletinizError('sendBulk() parametre objesi gerektirir.');
  }
  if (!Array.isArray(params.items) || params.items.length === 0) {
    throw new IletinizError("'items' en az bir öğe içermelidir.");
  }
  if (params.items.length > MAX_BULK_ITEMS) {
    throw new IletinizError(
      `'items' en fazla ${MAX_BULK_ITEMS} öğe içerebilir.`,
    );
  }
  if (params.template && params.whatsappTemplate) {
    throw new IletinizError(
      "'template' ve 'whatsappTemplate' birlikte kullanılamaz.",
    );
  }
  if (params.whatsappTemplate) validateWhatsappTemplate(params.whatsappTemplate);
  const usingTemplate = Boolean(params.template);
  const usingWa = params.whatsappTemplate !== undefined;
  for (const [i, item] of params.items.entries()) {
    if (!item.to || item.to.length < 1 || item.to.length > 64) {
      throw new IletinizError(
        `items[${i}].to 1-64 karakter arasında olmalıdır.`,
      );
    }
    if (item.whatsappComponents !== undefined && !usingWa) {
      throw new IletinizError(
        `items[${i}].whatsappComponents yalnızca 'whatsappTemplate' ile kullanılabilir.`,
      );
    }
    if (usingWa) {
      if (item.body !== undefined || item.variables !== undefined) {
        throw new IletinizError(
          `'whatsappTemplate' verildi: items[${i}].body ve items[${i}].variables kullanılamaz.`,
        );
      }
    } else if (usingTemplate) {
      if (item.body !== undefined) {
        throw new IletinizError(
          `Üst seviye 'template' verildi: items[${i}].body kullanılamaz.`,
        );
      }
    } else {
      if (typeof item.body !== 'string' || item.body.length < 1) {
        throw new IletinizError(
          `'template' yok: items[${i}].body zorunludur.`,
        );
      }
      if (item.variables !== undefined) {
        throw new IletinizError(
          `'template' yok: items[${i}].variables kullanılamaz.`,
        );
      }
    }
  }
}
