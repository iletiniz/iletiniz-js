import type { HttpClient } from '../http.js';
import type {
  CreateReminderParams,
  ListRemindersParams,
  ListResponse,
  Reminder,
  RequestOptions,
  UpdateReminderParams,
} from '../types.js';
import { IletinizError } from '../errors.js';
import { assertId, listQuery, serializeDates, stripUndefined } from './util.js';

/** Hatırlatma kuralları (`/v1/reminders`): tek seferlik veya tekrarlayan. */
export class RemindersResource {
  constructor(private readonly http: HttpClient) {}

  create(params: CreateReminderParams, options?: RequestOptions): Promise<Reminder> {
    if (!params || (params.type !== 'one_time' && params.type !== 'recurring')) {
      throw new IletinizError("'type' alanı 'one_time' veya 'recurring' olmalıdır.");
    }
    if (params.type === 'recurring') {
      if (params.frequency === 'weekly' && params.dayOfWeek === undefined) {
        throw new IletinizError("Haftalık tekrar için 'dayOfWeek' zorunlu.");
      }
      if (params.frequency === 'monthly' && params.dayOfMonth === undefined) {
        throw new IletinizError("Aylık tekrar için 'dayOfMonth' zorunlu.");
      }
    }
    return this.http.request<Reminder>({
      method: 'POST',
      path: '/v1/reminders',
      body: serializeDates(stripUndefined(params)),
      options,
    });
  }

  list(
    params?: ListRemindersParams,
    options?: RequestOptions,
  ): Promise<ListResponse<Reminder>> {
    return this.http.request<ListResponse<Reminder>>({
      method: 'GET',
      path: '/v1/reminders',
      query: listQuery(params),
      options,
    });
  }

  retrieve(id: number, options?: RequestOptions): Promise<Reminder> {
    assertId(id);
    return this.http.request<Reminder>({
      method: 'GET',
      path: `/v1/reminders/${id}`,
      options,
    });
  }

  /** Kuralı günceller; bekleyen gönderimler yeni ayarlarla yeniden planlanır. */
  update(
    id: number,
    params: UpdateReminderParams,
    options?: RequestOptions,
  ): Promise<Reminder> {
    assertId(id);
    const body = serializeDates(stripUndefined(params));
    if (Object.keys(body).length === 0) {
      throw new IletinizError('En az bir alan güncellenmeli.');
    }
    return this.http.request<Reminder>({
      method: 'PATCH',
      path: `/v1/reminders/${id}`,
      body,
      options,
    });
  }

  /** Kuralı iptal eder (`canceled`) ve bekleyen gönderimlerini siler. */
  delete(id: number, options?: RequestOptions): Promise<Reminder> {
    assertId(id);
    return this.http.request<Reminder>({
      method: 'DELETE',
      path: `/v1/reminders/${id}`,
      options,
    });
  }
}
