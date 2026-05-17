import type { HttpClient } from '../http.js';
import type {
  MessageStatusResponse,
  RequestOptions,
  SendBulkParams,
  SendBulkResponse,
  SendMessageParams,
  SendMessageResponse,
} from '../types.js';
import { IletinizError } from '../errors.js';

const MAX_BULK_ITEMS = 200;

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Tek bir SMS mesajı gönderir.
   *
   * `body` veya `template` alanlarından **tam olarak biri** verilmelidir.
   * `variables` yalnızca `template` ile birlikte kullanılabilir.
   */
  async send(
    params: SendMessageParams,
    options?: RequestOptions,
  ): Promise<SendMessageResponse> {
    validateSendParams(params);
    return this.http.request<SendMessageResponse>({
      method: 'POST',
      path: '/v1/messages',
      body: stripUndefined(params),
      options,
    });
  }

  /**
   * Tek istekte birden fazla mesaj gönderir (en fazla 200 öğe).
   *
   * - Üst seviye `template` verildiyse her item'da `body` olmamalı, yalnızca `variables` opsiyoneldir.
   * - Üst seviye `template` yoksa her item'da `body` zorunludur, `variables` kullanılamaz.
   */
  async sendBulk(
    params: SendBulkParams,
    options?: RequestOptions,
  ): Promise<SendBulkResponse> {
    validateBulkParams(params);
    return this.http.request<SendBulkResponse>({
      method: 'POST',
      path: '/v1/messages/bulk',
      body: stripUndefined({
        ...params,
        items: params.items.map(stripUndefined),
      }),
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
  if (!params.to || params.to.length < 7 || params.to.length > 32) {
    throw new IletinizError("'to' alanı 7-32 karakter arasında olmalıdır.");
  }
  const hasBody = Boolean(params.body);
  const hasTemplate = Boolean(params.template);
  if (hasBody === hasTemplate) {
    throw new IletinizError(
      "'body' veya 'template' alanlarından tam olarak biri zorunludur.",
    );
  }
  if (params.variables && !hasTemplate) {
    throw new IletinizError(
      "'variables' yalnızca 'template' ile birlikte kullanılabilir.",
    );
  }
  if (params.body && (params.body.length < 1 || params.body.length > 1600)) {
    throw new IletinizError("'body' 1-1600 karakter arasında olmalıdır.");
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
  const usingTemplate = Boolean(params.template);
  for (const [i, item] of params.items.entries()) {
    if (!item.to || item.to.length < 7 || item.to.length > 32) {
      throw new IletinizError(
        `items[${i}].to 7-32 karakter arasında olmalıdır.`,
      );
    }
    if (usingTemplate) {
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

function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
