import type { HttpClient } from '../http.js';
import type {
  ListResponse,
  ListScheduledParams,
  RequestOptions,
  ScheduledMessage,
} from '../types.js';
import { assertId, listQuery } from './util.js';

/** `scheduledAt` ile oluşturulan ileri tarihli gönderimler (`/v1/scheduled`). */
export class ScheduledResource {
  constructor(private readonly http: HttpClient) {}

  /** Zamanlanmış gönderimleri listeler. */
  list(
    params?: ListScheduledParams,
    options?: RequestOptions,
  ): Promise<ListResponse<ScheduledMessage>> {
    return this.http.request<ListResponse<ScheduledMessage>>({
      method: 'GET',
      path: '/v1/scheduled',
      query: listQuery(params),
      options,
    });
  }

  /** Tek bir zamanlanmış gönderimi döner. */
  retrieve(id: number, options?: RequestOptions): Promise<ScheduledMessage> {
    assertId(id);
    return this.http.request<ScheduledMessage>({
      method: 'GET',
      path: `/v1/scheduled/${id}`,
      options,
    });
  }

  /** Bekleyen (`scheduled`) gönderimi iptal eder; aksi halde 409 `not_cancelable`. */
  cancel(id: number, options?: RequestOptions): Promise<ScheduledMessage> {
    assertId(id);
    return this.http.request<ScheduledMessage>({
      method: 'DELETE',
      path: `/v1/scheduled/${id}`,
      options,
    });
  }
}
